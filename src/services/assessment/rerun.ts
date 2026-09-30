/**
 * SINGLE SOURCE OF TRUTH — taking a recorded run back to the policy input.
 *
 * The owner's item 6: from a finished run, the register, or any of the four document
 * screens, "Re-run simulation" returns the officer to the policy input with that run's
 * own inputs already in place — its submitted text, its preset, its uploaded file
 * names and its four assumptions — so they edit and press Run instead of retyping.
 *
 * The inputs are read straight out of the run register (`getRunRequest`), which is the
 * only place a run's inputs are stored. Nothing is copied into a second shape and
 * nothing is invented: what the officer gets back is exactly what the run was made
 * from, so re-running unchanged inputs reproduces the same run, and editing them
 * reproduces the agreement that a changed draft is a different run.
 *
 * Determinism: a pure read. No clock, no randomness.
 */

import type { TimeHorizonId } from "@/config/reference";
import { resolveLevers, type ScenarioLevers } from "./levers";
import { getRunRequest } from "./runStore";
import type { AssessmentSource } from "./types";

/** The address parameter the policy input reads. It is removed again once read. */
export const RERUN_QUERY_PARAM = "rerun";

/** The one label every surface uses, so the same action is never named two things. */
export const RERUN_LABEL = "Re-run simulation";

/** Where "Re-run simulation" sends the officer: the policy input, primed with a run. */
export const rerunPathFor = (runId: string): string =>
  `/app?${RERUN_QUERY_PARAM}=${encodeURIComponent(runId)}`;

/** Everything the policy input needs to stand in for a run's own inputs again. */
export interface RerunInputs {
  runId: string;
  departmentId: string;
  /** How the text originally reached the engine, so an upload run is not re-labelled a paste. */
  source: AssessmentSource;
  /** The submitted policy text. Empty for an upload run, whose text was its file names. */
  policyText: string;
  templateId?: string;
  timeHorizon?: TimeHorizonId;
  levers: ScenarioLevers;
  fileNames: string[];
  /** The run this one descended from, when it was a re-run. Carried so the lineage survives. */
  revisionOf?: string;
}

/**
 * The inputs of a recorded run, ready to load into the policy input, or `undefined`
 * when that run is no longer in this browser's register — the screen says so rather
 * than showing empty boxes that look like a reset.
 */
export const rerunInputsFrom = (runId: string): RerunInputs | undefined => {
  const stored = getRunRequest(runId);
  if (!stored) return undefined;
  return {
    runId: stored.id,
    departmentId: stored.departmentId,
    source: stored.source,
    policyText: stored.policyText,
    templateId: stored.templateId,
    timeHorizon: stored.timeHorizon,
    levers: resolveLevers(stored.levers),
    fileNames: stored.fileNames ?? [],
    revisionOf: stored.revisionOf,
  };
};
