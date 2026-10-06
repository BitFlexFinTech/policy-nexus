/**
 * SINGLE SOURCE OF TRUTH — the documents a department has added to its own workspace.
 *
 * The owner's third item: a department should be able to add the documents it holds, so the
 * simulations rest on that department's real material rather than on the prepared draft
 * alone. This store keeps them, keyed by department, in this browser.
 *
 * WHAT IS KEPT, AND WHAT IS NOT: the document's real text is kept, because that is what the
 * examination reads. A file the browser could not read (a PDF in this build) is recorded by
 * name with an empty text, and the run counts it as *not read* — the platform never implies
 * it read something it could not.
 *
 * Determinism: the record carries the real moment it was added, read through `src/lib/clock.ts`, and a document's id is a
 * pure function of the department, its name and its text, so adding the same file twice
 * replaces its entry instead of duplicating it.
 */

import { nowIso } from "@/lib/clock";
import { isDepartmentId, type DepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";
import { hashString, toSeedHex } from "@/lib/prng";
import type { ExtractionKind } from "@/services/extraction/extractPolicyText";
import type { DepartmentDocumentInput } from "@/services/assessment/types";

export const DEPARTMENT_DOCUMENTS_KEY = "nzwisiso.department-documents.v1";

/** One document a department added. */
export interface DepartmentDocumentRecord {
  id: string;
  departmentId: DepartmentId;
  name: string;
  sizeLabel: string;
  kind: ExtractionKind;
  /** The real text read from the file. Empty when it could only be recorded by name. */
  text: string;
  /** One plain line stating exactly what happened to this file. */
  status: string;
  addedAt: string;
}

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isDepartmentDocumentStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToDepartmentDocuments = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly DepartmentDocumentRecord[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseDocuments = (raw: string | null): readonly DepartmentDocumentRecord[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const documents = value.filter((entry): entry is DepartmentDocumentRecord => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<DepartmentDocumentRecord>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.text === "string" &&
        typeof candidate.departmentId === "string" &&
        isDepartmentId(candidate.departmentId)
      );
    });
    return documents.length ? documents : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedDocuments: readonly DepartmentDocumentRecord[] = EMPTY;

/** Stable snapshot reference, required by `useSyncExternalStore`. */
export const getDepartmentDocumentsSnapshot = (): readonly DepartmentDocumentRecord[] => {
  const raw = storage.read(DEPARTMENT_DOCUMENTS_KEY);
  if (raw === cachedRaw) return cachedDocuments;
  cachedRaw = raw;
  cachedDocuments = parseDocuments(raw);
  return cachedDocuments;
};

/** Server snapshot — no documents exist before hydration. */
export const getDepartmentDocumentsServerSnapshot = (): readonly DepartmentDocumentRecord[] =>
  EMPTY;

/* ------------------------------------------------------------------------- */
/* Actions                                                                     */
/* ------------------------------------------------------------------------- */

const write = (next: readonly DepartmentDocumentRecord[]): void => {
  storage.write(DEPARTMENT_DOCUMENTS_KEY, JSON.stringify(next));
  cachedRaw = storage.read(DEPARTMENT_DOCUMENTS_KEY);
  cachedDocuments = parseDocuments(cachedRaw);
  emit();
};

/** Every document this department has added, newest first. */
export const listDepartmentDocuments = (
  departmentId: string | null | undefined,
): readonly DepartmentDocumentRecord[] =>
  departmentId
    ? getDepartmentDocumentsSnapshot().filter((document) => document.departmentId === departmentId)
    : getDepartmentDocumentsSnapshot();

/** The stable id for one document — a pure function of department, name and text. */
export const departmentDocumentId = (
  departmentId: string,
  name: string,
  text: string,
): string => `doc-${toSeedHex(hashString(`${departmentId}::${name}::${text}`))}`;

/**
 * Keep a document. Adding the same file again (same name, same text) replaces its entry, so a
 * department's list cannot fill up with copies of one document.
 */
export const addDepartmentDocument = (
  document: Omit<DepartmentDocumentRecord, "id" | "addedAt">,
): DepartmentDocumentRecord => {
  const record: DepartmentDocumentRecord = {
    ...document,
    id: departmentDocumentId(document.departmentId, document.name, document.text),
    addedAt: nowIso(),
  };
  const existing = getDepartmentDocumentsSnapshot().filter((entry) => entry.id !== record.id);
  write([record, ...existing].slice(0, 40));
  return record;
};

/** Remove one document by id. */
export const removeDepartmentDocument = (id: string): void => {
  const existing = getDepartmentDocumentsSnapshot();
  const next = existing.filter((document) => document.id !== id);
  if (next.length !== existing.length) write(next);
};

/** Remove every document this department added. */
export const clearDepartmentDocuments = (departmentId: string): void => {
  const existing = getDepartmentDocumentsSnapshot();
  const next = existing.filter((document) => document.departmentId !== departmentId);
  if (next.length !== existing.length) write(next);
};

/** Remove every department's added documents at once. Used by the administration screen's reset. */
export const clearAllDepartmentDocuments = (): void => {
  storage.remove(DEPARTMENT_DOCUMENTS_KEY);
  cachedRaw = undefined;
  cachedDocuments = EMPTY;
  emit();
};

/**
 * The documents as a run receives them: an id, a name and the text that was really read. The
 * engine receives exactly this, so nothing else about a stored document can reach a run.
 */
export const departmentDocumentInputs = (
  departmentId: string | null | undefined,
): DepartmentDocumentInput[] =>
  listDepartmentDocuments(departmentId).map((document) => ({
    id: document.id,
    name: document.name,
    text: document.text,
  }));

