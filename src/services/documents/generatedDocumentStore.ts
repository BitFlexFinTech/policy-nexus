/**
 * SINGLE SOURCE OF TRUTH — the generated documents written once per run (Batch 0).
 *
 * A generated document — the long-form report, the drafted policy or the implementation pack — can
 * be produced by a configured drafting service, and that call costs money. This store keeps the
 * document THAT WAS PRODUCED with the run it belongs to, so opening it again shows the identical
 * text and makes NO second call. A re-run is a different run, so each run keeps its own copy and
 * nothing is overwritten.
 *
 * The store is keyed by run and document kind. It holds only the document's finished text and the
 * record of who produced it, so a reader is never told a document came from somewhere it did not.
 * Only a document a service really returned is kept: a failure is reported, never stored as though
 * it were a result.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import type { DraftingSource } from "./drafting";
import type { DocumentKind, GeneratedDocument } from "@/services/assessment/types";

export const GENERATED_DOCUMENTS_KEY = "nzwisiso.generated-documents.v1";

/**
 * How many generated documents are kept. A drafted policy runs to tens of thousands of characters,
 * so the store is capped: the newest are kept and an older one is simply produced again when it is
 * next opened. That keeps this store from becoming the very thing the register's own fix (Batch 0)
 * exists to prevent — a browser store that fills up.
 */
export const GENERATED_DOCUMENTS_LIMIT = 30;

/** One generated document saved with the run it was produced from. */
export interface StoredGeneratedDocument {
  runId: string;
  kind: DocumentKind;
  document: GeneratedDocument;
  /** Who produced it (the local generator, or the configured service and its model). */
  source: DraftingSource;
  /** The moment it was written, read through `src/lib/clock.ts`. */
  savedAt: string;
}

const storage = createKeyValueStore();

const EMPTY: readonly StoredGeneratedDocument[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseDocuments = (raw: string | null): readonly StoredGeneratedDocument[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const documents = value.filter((entry): entry is StoredGeneratedDocument => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<StoredGeneratedDocument>;
      return (
        typeof candidate.runId === "string" &&
        typeof candidate.kind === "string" &&
        Boolean(candidate.document) &&
        typeof candidate.document === "object"
      );
    });
    return documents.length ? documents : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedDocuments: readonly StoredGeneratedDocument[] = EMPTY;

const snapshot = (): readonly StoredGeneratedDocument[] => {
  const raw = storage.read(GENERATED_DOCUMENTS_KEY);
  if (raw === cachedRaw) return cachedDocuments;
  cachedRaw = raw;
  cachedDocuments = parseDocuments(raw);
  return cachedDocuments;
};

/** The document written for this run and kind, or `undefined` when none has been. */
export const getStoredDocument = (
  runId: string,
  kind: DocumentKind,
): StoredGeneratedDocument | undefined =>
  snapshot().find((entry) => entry.runId === runId && entry.kind === kind);

/** Write a document once, replacing any earlier copy for the same run and kind. */
export const saveStoredDocument = (entry: Omit<StoredGeneratedDocument, "savedAt">): void => {
  const existing = snapshot().filter(
    (candidate) => !(candidate.runId === entry.runId && candidate.kind === entry.kind),
  );
  const next = [{ ...entry, savedAt: nowIso() }, ...existing].slice(0, GENERATED_DOCUMENTS_LIMIT);
  storage.write(GENERATED_DOCUMENTS_KEY, JSON.stringify(next));
  cachedRaw = storage.read(GENERATED_DOCUMENTS_KEY);
  cachedDocuments = next;
};

/** Remove every generated document. Used when the register itself is cleared. */
export const clearStoredDocuments = (): void => {
  storage.remove(GENERATED_DOCUMENTS_KEY);
  cachedRaw = undefined;
  cachedDocuments = EMPTY;
};