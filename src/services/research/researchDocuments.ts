/**
 * SINGLE SOURCE OF TRUTH — the documents ZEPARI has added to the research assistant.
 *
 * The research assistant's own material, kept in this browser for now (see the seam in
 * `researchDocumentStore.ts`). Unlike a department's library this is not department-scoped — it is
 * the institute's own material, so one list serves the whole research assistant.
 *
 * WHAT IS KEPT, AND WHAT IS NOT: a document's real text is kept when the browser could read it. A
 * file that could not be read (a PDF in this build) is recorded by name with an empty text, and the
 * surface says so — the platform never implies it read something it could not.
 *
 * Determinism: a document's id is a pure function of its name and text, so adding the same file
 * twice replaces its entry instead of duplicating it; the added moment is read through `src/lib/clock.ts`.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import { hashString, toSeedHex } from "@/lib/prng";
import type { ExtractionKind } from "@/services/extraction/extractPolicyText";

export const RESEARCH_DOCUMENTS_KEY = "nzwisiso.research-documents.v1";

/** One research document ZEPARI added. */
export interface ResearchDocumentRecord {
  id: string;
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
export const isResearchDocumentStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToResearchDocuments = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly ResearchDocumentRecord[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseDocuments = (raw: string | null): readonly ResearchDocumentRecord[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const documents = value.filter((entry): entry is ResearchDocumentRecord => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<ResearchDocumentRecord>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.text === "string"
      );
    });
    return documents.length ? documents : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedDocuments: readonly ResearchDocumentRecord[] = EMPTY;

/** Stable snapshot reference, required by `useSyncExternalStore`. */
export const getResearchDocumentsSnapshot = (): readonly ResearchDocumentRecord[] => {
  const raw = storage.read(RESEARCH_DOCUMENTS_KEY);
  if (raw === cachedRaw) return cachedDocuments;
  cachedRaw = raw;
  cachedDocuments = parseDocuments(raw);
  return cachedDocuments;
};

/** Server snapshot — no documents exist before hydration. */
export const getResearchDocumentsServerSnapshot = (): readonly ResearchDocumentRecord[] => EMPTY;

const write = (next: readonly ResearchDocumentRecord[]): void => {
  storage.write(RESEARCH_DOCUMENTS_KEY, JSON.stringify(next));
  cachedRaw = storage.read(RESEARCH_DOCUMENTS_KEY);
  cachedDocuments = parseDocuments(cachedRaw);
  emit();
};

/** Every research document, newest first. */
export const listResearchDocuments = (): readonly ResearchDocumentRecord[] =>
  getResearchDocumentsSnapshot();

/** The stable id for one document — a pure function of name and text. */
export const researchDocumentId = (name: string, text: string): string =>
  `rdoc-${toSeedHex(hashString(`${name}::${text}`))}`;

/**
 * Keep a document. Adding the same file again (same name, same text) replaces its entry, so the
 * list cannot fill up with copies of one document.
 */
export const addResearchDocument = (
  document: Omit<ResearchDocumentRecord, "id" | "addedAt">,
): ResearchDocumentRecord => {
  const record: ResearchDocumentRecord = {
    ...document,
    id: researchDocumentId(document.name, document.text),
    addedAt: nowIso(),
  };
  const existing = getResearchDocumentsSnapshot().filter((entry) => entry.id !== record.id);
  write([record, ...existing].slice(0, 80));
  return record;
};

/** Remove one document by id. */
export const removeResearchDocument = (id: string): void => {
  const existing = getResearchDocumentsSnapshot();
  const next = existing.filter((document) => document.id !== id);
  if (next.length !== existing.length) write(next);
};

/** Remove every research document. Used by the panel's "Remove all" and the admin reset. */
export const clearAllResearchDocuments = (): void => {
  storage.remove(RESEARCH_DOCUMENTS_KEY);
  cachedRaw = undefined;
  cachedDocuments = EMPTY;
  emit();
};