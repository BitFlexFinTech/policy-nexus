import { useEffect, useMemo, useState } from "react";
import type { Department } from "@/config/departments";
import { describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { buildLongReport, buildPolicyDraft } from "@/services/assessment/documents";
import type { AssessmentRun, GeneratedDocument } from "@/services/assessment/types";
import { remoteDraftingClient } from "./remoteDraftingClient";

export type DocumentKind = "report" | "policy-draft";

export interface GeneratedDocumentResult {
  document: GeneratedDocument | null;
  /** True only while the configured drafting service is answering. */
  pending: boolean;
  error: string | null;
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
 */
export const useGeneratedDocument = (
  kind: DocumentKind,
  run: AssessmentRun | undefined,
  department: Department | undefined,
): GeneratedDocumentResult => {
  const config = usePlatformConfig();
  const live = describeCapability(config, "drafting").state === "live";

  const simulated = useMemo(
    () =>
      run && department
        ? kind === "report"
          ? buildLongReport(run, department)
          : buildPolicyDraft(run, department)
        : null,
    [kind, run, department],
  );

  const key = run ? `${kind}:${run.id}` : "";
  const [fetched, setFetched] = useState<
    { key: string; document?: GeneratedDocument; error?: string } | null
  >(null);

  useEffect(() => {
    const client = live ? remoteDraftingClient() : null;
    if (!client || !run || !key) {
      setFetched(null);
      return;
    }
    let active = true;
    client
      .generate({ kind, model: "", run })
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
  }, [live, key, kind, run]);

  if (!live) return { document: simulated, pending: false, error: null };
  if (fetched && fetched.key === key) {
    return { document: fetched.document ?? null, pending: false, error: fetched.error ?? null };
  }
  return { document: null, pending: true, error: null };
};
