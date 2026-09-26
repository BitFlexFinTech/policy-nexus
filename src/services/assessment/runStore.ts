/**
 * SINGLE SOURCE OF TRUTH — the department's simulation register (client side).
 *
 * Only the run *inputs* are persisted. The result is recomputed from them by
 * the engine, so the stored record and the rendered assessment can never drift
 * apart (see .clinerules/03-single-source-of-truth.md), storage stays small, and
 * the same stored run always produces a byte-identical result.
 *
 * There is no backend in scenario mode: this is the durable store. It uses
 * local storage with an in-memory fallback when the browser refuses persistent
 * storage, and exposes a `useSyncExternalStore`-compatible snapshot so panels
 * re-render the moment a run is recorded.
 */

import { REFERENCE_DATE } from "@/config/reference";
import { isDepartmentId } from "@/config/departments";
import { runIdFor } from "./seed";
import type { AssessmentRequest } from "./types";

export const RUNS_STORAGE_KEY = "nzwisiso.runs.v1";

/** A persisted request plus the deterministic id and the date it was recorded. */
export interface StoredRun extends AssessmentRequest {
  id: string;
  savedAt: string;
}

/* ------------------------------------------------------------------------- */
/* Storage adapter — persistent, with a stated in-memory fallback.             */
/* ------------------------------------------------------------------------- */

const memoryStore = new Map<string, string>();
let usingMemoryFallback = false;

const storage = {
  read(key: string): string | null {
    if (usingMemoryFallback) return memoryStore.get(key) ?? null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      usingMemoryFallback = true;
      return memoryStore.get(key) ?? null;
    }
  },
  write(key: string, value: string) {
    memoryStore.set(key, value);
    if (usingMemoryFallback) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      usingMemoryFallback = true;
    }
  },
  remove(key: string) {
    memoryStore.delete(key);
    if (usingMemoryFallback) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      usingMemoryFallback = true;
    }
  },
};

/** False when the browser refused persistent storage and memory is in use. */
export const isRunStorePersistent = () => !usingMemoryFallback;

/* ------------------------------------------------------------------------- */
/* Snapshot + subscription                                                     */
/* ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToRuns = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly StoredRun[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a panel. */
const parseRuns = (raw: string | null): readonly StoredRun[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const runs = value.filter((entry): entry is StoredRun => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<StoredRun>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.policyText === "string" &&
        typeof candidate.departmentId === "string" &&
        isDepartmentId(candidate.departmentId)
      );
    });
    return runs.length ? runs : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedRuns: readonly StoredRun[] = EMPTY;

/** Stable snapshot reference, required by `useSyncExternalStore`. */
export const getRunsSnapshot = (): readonly StoredRun[] => {
  const raw = storage.read(RUNS_STORAGE_KEY);
  if (raw === cachedRaw) return cachedRuns;
  cachedRaw = raw;
  cachedRuns = parseRuns(raw);
  return cachedRuns;
};

/** Server snapshot — there are no runs before hydration. */
export const getRunsServerSnapshot = (): readonly StoredRun[] => EMPTY;

/* ------------------------------------------------------------------------- */
/* Actions                                                                     */
/* ------------------------------------------------------------------------- */

/** Every recorded run, newest first. */
export const listRunRequests = (): readonly StoredRun[] => getRunsSnapshot();

/** Runs recorded for one department, newest first. */
export const listRunRequestsFor = (departmentId: string): readonly StoredRun[] =>
  getRunsSnapshot().filter((run) => run.departmentId === departmentId);

export const getRunRequest = (runId: string): StoredRun | undefined =>
  getRunsSnapshot().find((run) => run.id === runId);

/**
 * Record a run. Identical inputs resolve to the same id, so re-running the same
 * draft updates its register row instead of appending a duplicate.
 */
export const saveRunRequest = (request: AssessmentRequest): string => {
  const id = runIdFor(request);
  const record: StoredRun = { ...request, id, savedAt: REFERENCE_DATE };
  const existing = getRunsSnapshot().filter((run) => run.id !== id);
  const next = [record, ...existing].slice(0, 60);
  storage.write(RUNS_STORAGE_KEY, JSON.stringify(next));
  cachedRaw = storage.read(RUNS_STORAGE_KEY);
  cachedRuns = next;
  emit();
  return id;
};

/** Remove every recorded run. Used by the register's "clear" action. */
export const clearRuns = (): void => {
  storage.remove(RUNS_STORAGE_KEY);
  cachedRaw = undefined;
  cachedRuns = EMPTY;
  emit();
};
