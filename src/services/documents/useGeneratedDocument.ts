import { useEffect, useMemo, useState } from "react";
import type { Department } from "@/config/departments";
import { describeCapability, isPlatformLive } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { buildLongReport, buildPolicyDraft } from "@/services/assessment/documents";
import { buildImplementationPack } from "@/services/assessment/implementationPack";
import type { AssessmentRun, GeneratedDocument } from "@/services/assessment/types";
import { buildDraftingGrounding, type DraftingSource } from "./drafting";
import { getStoredDocument, saveStoredDocument } from "./generatedDocumentStore";
import { remoteDraftingClient } from "./remoteDraftingClient";

import type { DocumentKind } from "@/services/assessment/types";

/**
 * The one place a document kind is turned into a document. Adding a kind means adding a row here, so a
 * kind can never be requested without a builder behind it, and a document is a pure function of its run
 * and the department's own configuration.
 *
 * The typed-answer parameter this used to take is gone: the platform no longer asks an officer to fill
 * the working matrices on screen (the owner's instruction, 2026-10-02). Those cells print as the marked
 * blank, and the department completes them in the document it exports.
 */
const BUILDERS: Record<
  DocumentKind,
  (run: AssessmentRun, department: Department) => GeneratedDocument
> = {
  report: (run, department) => buildLongReport(run, department),
  "policy-draft": (run, department) => buildPolicyDraft(run, department),
  "implementation-pack": (run, department) => buildImplementationPack(run, department),
};

export interface GeneratedDocumentResult {
  document: GeneratedDocument | null;
  /** True only while the configured drafting service is answering. */
  pending: boolean;
  error: string | null;
  /**
   * Who produced the document. The same value the provenance record is built from, so a
   * reader is never told a document came from somewhere it did not.
   */
  source: DraftingSource;
}

/**
 * One generated document — the long-form report or the drafted policy.
 *
 * With nothing configured this is SYNCHRONOUS: the local generator produces the
 * document in the same render, byte-identical to what it has always produced, so
 * the screens look exactly as they did. When an administrator switches the
 * drafting capability on, it waits for the service instead and reports what
 * happened — and a failure is reported as a failure, never replaced by the local
 * text dressed up as the model's answer.
 *
 * Either way the department's grounding is assembled here from its own configuration
 * and handed to whichever implementation is active.
 */
export const useGeneratedDocument = (
  kind: DocumentKind,
  run: AssessmentRun | undefined,
  department: Department | undefined,
): GeneratedDocumentResult => {
  const config = usePlatformConfig();
  const live = describeCapability(config, "drafting").state === "live";

  const simulated = useMemo(
    () => (run && department ? BUILDERS[kind](run, department) : null),
    [kind, run, department],
  );

  const grounding = useMemo(
    () => (run && department ? buildDraftingGrounding(run, department) : null),
    [run, department],
  );

  // The run identifies the document: one run, one document of each kind.
  const key = run ? `${kind}:${run.id}` : "";
  const [fetched, setFetched] = useState<
    { key: string; document?: GeneratedDocument; error?: string; source?: DraftingSource } | null
  >(null);

  const serviceSource: DraftingSource = useMemo(
    () => ({ producer: "configured-service", model: config.drafting.model }),
    [config.drafting.model],
  );
  const localSource: DraftingSource = useMemo(() => ({ producer: "local-generator" }), []);

  useEffect(() => {
    // Written once per run (Batch 0): a document already saved with this run is reused, so
    // re-opening it makes NO second call and shows the identical text. The reuse is guarded to
    // live mode, so a document produced by a configured service is what is shown when it is live.
    const saved = live && run ? getStoredDocument(run.id, kind) : undefined;
    if (saved) {
      setFetched({ key, document: saved.document, source: saved.source });
      return;
    }
    const client = live ? remoteDraftingClient() : null;
    if (!client || !run || !grounding || !key) {
      setFetched(null);
      return;
    }
    let active = true;
    client
      .generate({ kind, model: "", run, grounding })
      .then((document) => {
        if (!active) return;
        // Save it with the run before showing it, so the next visit costs nothing.
        saveStoredDocument({ runId: run.id, kind, document, source: serviceSource });
        setFetched({ key, document, source: serviceSource });
      })
      .catch((error: unknown) => {
        if (active) {
          setFetched({
            key,
            error:
              error instanceof Error ? error.message : "The drafting service could not be reached.",
            source: serviceSource,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [live, key, kind, run, grounding, serviceSource]);

  if (!live) {
    // Live mode with no drafting service connected: show NOTHING rather than the local
    // generator's text dressed up as the model's answer (owner's rule).
    if (isPlatformLive(config)) {
      return {
        document: null,
        pending: false,
        error: "Live mode: no drafting service is connected.",
        source: localSource,
      };
    }
    return { document: simulated, pending: false, error: null, source: localSource };
  }
  if (fetched && fetched.key === key) {
    return {
      document: fetched.document ?? null,
      pending: false,
      error: fetched.error ?? null,
      // The source the document was actually produced by — recorded when it was saved, so a
      // reused document still states who wrote it (Batch 0).
      source: fetched.source ?? serviceSource,
    };
  }
  return { document: null, pending: true, error: null, source: serviceSource };
};
