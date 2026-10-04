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

import { nowIso } from "@/lib/clock";
import { isDepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";
import { runIdFor } from "./seed";
import type { AssessmentRequest } from "./types";

export const RUNS_STORAGE_KEY = "nzwisiso.runs.v1";

/** A persisted request plus its deterministic id. The moment it was recorded lives on the
 *  request itself (`recordedAt`), so a run and every document it produces read one date. */
export interface StoredRun extends AssessmentRequest {
  id: string;
}

/* ------------------------------------------------------------------------- */
/* Storage adapter — the shared browser adapter (src/lib/browserStorage.ts).   */
/* ------------------------------------------------------------------------- */

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isRunStorePersistent = () => storage.isPersistent();

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
  const record: StoredRun = { ...request, id, recordedAt: nowIso() };
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
