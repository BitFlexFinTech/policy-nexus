import { useEffect, useMemo, useState } from "react";
import type { Department } from "@/config/departments";
import { describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { buildLongReport, buildPolicyDraft } from "@/services/assessment/documents";
import { buildImplementationPack } from "@/services/assessment/implementationPack";
import type { DocumentFills } from "@/services/assessment/matrices";
import type { AssessmentRun, GeneratedDocument } from "@/services/assessment/types";
import { buildDraftingGrounding, type DraftingSource } from "./drafting";
import { remoteDraftingClient } from "./remoteDraftingClient";

import type { DocumentKind } from "@/services/assessment/types";

/**
 * The answers when a caller supplies none.
 *
 * ONE frozen object, shared, and never a fresh `{}`: this value is a dependency of the effects below, and
 * a new object on every render would make them re-run forever. That is also why it is written down here
 * rather than left as a literal in the signature.
 */
const NO_FILLS: DocumentFills = Object.freeze({});

/**
 * A short, stable fingerprint of the answers, so a document is re-asked for when an officer changes one.
 * Both levels are sorted, so the same answers always produce the same fingerprint whatever order they
 * were typed in.
 */
const fillsKey = (fills: DocumentFills): string =>
  Object.keys(fills)
    .sort()
    .map((rowKey) => {
      const row = fills[rowKey] ?? {};
      const fields = Object.keys(row)
        .sort()
        .map((field) => `${field}=${String(row[field as keyof typeof row] ?? "")}`)
        .join(",");
      return `${rowKey}(${fields})`;
    })
    .join(";");

/**
 * The one place a document kind is turned into a document. Adding a kind means adding a row here, so a
 * kind can never be requested without a builder behind it. The answers the department has entered are
 * passed in explicitly, so a document is still a pure function of its inputs.
 */
const BUILDERS: Record<
  DocumentKind,
  (run: AssessmentRun, department: Department, fills: DocumentFills) => GeneratedDocument
> = {
  report: (run, department) => buildLongReport(run, department),
  "policy-draft": (run, department, fills) => buildPolicyDraft(run, department, fills),
  "implementation-pack": (run, department, fills) => buildImplementationPack(run, department, fills),
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
  /** The answers the department has entered for this run's working matrices. */
  fills: DocumentFills = NO_FILLS,
): GeneratedDocumentResult => {
  const config = usePlatformConfig();
  const live = describeCapability(config, "drafting").state === "live";

  const simulated = useMemo(
    () => (run && department ? BUILDERS[kind](run, department, fills) : null),
    [kind, run, department, fills],
  );

  const grounding = useMemo(
    () => (run && department ? buildDraftingGrounding(run, department) : null),
    [run, department],
  );

  // The answers are part of what identifies the document: two different sets of answers are two
  // different documents, so the cached one must not be reused for the other.
  const key = run ? `${kind}:${run.id}:${fillsKey(fills)}` : "";
  const [fetched, setFetched] = useState<
    { key: string; document?: GeneratedDocument; error?: string } | null
  >(null);

  const serviceSource: DraftingSource = useMemo(
    () => ({ producer: "configured-service", model: config.drafting.model }),
    [config.drafting.model],
  );
  const localSource: DraftingSource = useMemo(() => ({ producer: "local-generator" }), []);

  useEffect(() => {
    const client = live ? remoteDraftingClient() : null;
    if (!client || !run || !grounding || !key) {
      setFetched(null);
      return;
    }
    let active = true;
    client
      .generate({ kind, model: "", run, grounding, fills })
      .then((document) => {
        if (active) setFetched({ key, document });
      })
      .catch((error: unknown) => {
        if (active) {
          setFetched({
            key,
            error:
              error instanceof Error ? error.message : "The drafting service could not be reached.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [live, key, kind, run, grounding, fills]);

  if (!live) return { document: simulated, pending: false, error: null, source: localSource };
  if (fetched && fetched.key === key) {
    return {
      document: fetched.document ?? null,
      pending: false,
      error: fetched.error ?? null,
      source: serviceSource,
    };
  }
  return { document: null, pending: true, error: null, source: serviceSource };
};
