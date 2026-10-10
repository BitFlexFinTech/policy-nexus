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
import { SCENARIO_ANCHOR_DATE } from "@/config/reference";
import { isDepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";
import { clearStoredDocuments } from "@/services/documents/generatedDocumentStore";
import { documentFingerprint, runIdFor } from "./seed";
import type { AssessmentRequest, DepartmentDocumentInput } from "./types";

export const RUNS_STORAGE_KEY = "nzwisiso.runs.v1";

/**
 * A department's document as the REGISTER keeps it: a name, and the fingerprint taken when the run
 * was recorded — never the text (Batch 0). Keeping the text here is what could fill the browser's
 * storage and make runs vanish with no error; the text is read back from the department's library
 * only when a screen genuinely needs it (see `runHydration.ts`).
 */
export interface StoredDocumentReference {
  id: string;
  name: string;
  /** The fingerprint of the text that was read, or "" for a file recorded by name. */
  fingerprint: string;
}

/** A persisted request plus its deterministic id. The moment it was recorded lives on the
 *  request itself (`recordedAt`), so a run and every document it produces read one date. */
export interface StoredRun extends Omit<AssessmentRequest, "documents"> {
  id: string;
  /**
   * A reference and a fingerprint per document — never the document's text. Absent when the run
   * was given no departmental documents, so runs made before this existed are unchanged.
   */
  documents?: StoredDocumentReference[];
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

/**
 * Turn whatever a stored document looks like into a reference, so the register NEVER keeps a
 * document's text. A run recorded before Batch 0 stored the text; its fingerprint is derived here
 * once and the text is dropped, so the shrink happens the first time the register is read. The
 * fingerprint is what makes the run reproducible, so dropping the text changes nothing about it.
 */
const toStoredDocuments = (
  documents: readonly unknown[] | undefined,
): StoredDocumentReference[] | undefined => {
  if (!documents || documents.length === 0) return undefined;
  const references = documents
    .filter(
      (entry): entry is { id: string; name?: string; fingerprint?: string; text?: string } =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as { id?: unknown }).id === "string",
    )
    .map((entry) => {
      const text = typeof entry.text === "string" ? entry.text : "";
      const fingerprint =
        typeof entry.fingerprint === "string" && entry.fingerprint
          ? entry.fingerprint
          : text.trim().length > 0
            ? documentFingerprint({ id: entry.id, text })
            : "";
      return {
        id: entry.id,
        name: typeof entry.name === "string" ? entry.name : entry.id,
        fingerprint,
      };
    });
  return references.length ? references : undefined;
};

/** Defensive parse — a malformed entry is dropped rather than crashing a panel. */
const parseRuns = (raw: string | null): readonly StoredRun[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const runs = value
      .filter((entry): entry is StoredRun => {
        if (!entry || typeof entry !== "object") return false;
        const candidate = entry as Partial<StoredRun>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.policyText === "string" &&
          typeof candidate.departmentId === "string" &&
          isDepartmentId(candidate.departmentId)
        );
      })
      // A run stored before the platform kept a real date carries none. It is given the scenario
      // anchor date HERE, in one place, so every screen that shows a run's date is safe — the
      // defect this guards against was an administration page that blanked on an older run.
      // The documents are rebuilt as references in the same pass, so no stored run keeps text.
      .map((entry) => {
        const { documents: storedDocuments, ...rest } = entry;
        const documents = toStoredDocuments(storedDocuments as readonly unknown[] | undefined);
        return {
          ...rest,
          recordedAt:
            typeof entry.recordedAt === "string" && entry.recordedAt
              ? entry.recordedAt
              : SCENARIO_ANCHOR_DATE,
          ...(documents ? { documents } : {}),
        };
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
  // The register keeps a reference and a fingerprint per document, never the text (Batch 0).
  const { documents, ...rest } = request;
  const storedDocuments = toStoredDocuments(documents);
  const record: StoredRun = {
    ...rest,
    id,
    recordedAt: nowIso(),
    ...(storedDocuments ? { documents: storedDocuments } : {}),
  };
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
  // A generated document belongs to its run, so clearing the register clears them together —
  // otherwise a later run could reuse a document from a run that no longer exists (Batch 0).
  clearStoredDocuments();
  emit();
};
