/**
 * Reading a stored run back into a request the engine can build (Batch 0).
 *
 * The register keeps only a reference and a fingerprint per document, never the text, so the
 * browser's storage cannot be filled up by documents (see `runStore.ts`). The text is read back
 * here, from the department's own library, and ONLY when the document is still the very same one
 * the run was recorded from — its fingerprint still matches. Two consequences, both deliberate:
 *
 *  - A document that was EDITED since cannot silently change a run that was already made; the run
 *    keeps the fingerprint it was recorded with, so its identity and its result do not move.
 *  - A document that was REMOVED is not quietly dropped: the request marks it, and the run says so
 *    (see `RunDocumentRecord.unavailable`), rather than losing it.
 *
 * Pure apart from reading the library: no clock, no randomness, no network.
 */

import { listDepartmentDocuments } from "@/services/documents/departmentDocuments";
import { documentFingerprint } from "./seed";
import type { StoredRun } from "./runStore";
import type { AssessmentRequest, DepartmentDocumentInput } from "./types";

export const rehydrateStoredRun = (stored: StoredRun): AssessmentRequest => {
  const { documents: storedDocuments, ...rest } = stored;
  if (!storedDocuments || storedDocuments.length === 0) return rest;

  const library = new Map(
    listDepartmentDocuments(stored.departmentId).map((document) => [document.id, document]),
  );

  const documents: DepartmentDocumentInput[] = storedDocuments.map((reference) => {
    const live = library.get(reference.id);
    // The text is handed on only when the library still holds exactly the document this run was
    // recorded from. Otherwise the run keeps its fingerprint and no text — nothing is substituted.
    const stillTheSame = Boolean(
      live && reference.fingerprint && documentFingerprint(live) === reference.fingerprint,
    );
    return {
      id: reference.id,
      name: reference.name,
      text: stillTheSame && live ? live.text : "",
      fingerprint: reference.fingerprint,
    };
  });

  return { ...rest, documents };
};