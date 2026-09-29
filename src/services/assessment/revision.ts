/**
 * SINGLE SOURCE OF TRUTH — versions of a department's policy, and the request that
 * makes the next one.
 *
 * The officer can take the drafted policy back through the simulation. That run is
 * stored with the run it came from (`revisionOf`), and its version number is DERIVED by
 * walking that chain rather than being stored a second time — so a run and the version
 * it is shown as can never drift apart (see .clinerules/03-single-source-of-truth.md).
 *
 * A first run is version 1; every re-run is one more than the run it came from. The walk
 * is bounded and cycle-safe, so a corrupted store cannot hang a screen.
 */

import { peekRun } from "./AssessmentService";
import { getRunRequest } from "./runStore";
import type { AssessmentRequest } from "./types";

/** The chain is walked at most this far. A real chain is a handful of drafts long. */
export const MAX_REVISION_DEPTH = 20;

/** The run this one was re-run from, or undefined when it is a first run. */
export const revisionParent = (runId: string): string | undefined =>
  getRunRequest(runId)?.revisionOf;

/** 1 for a first run, 2 for a run re-run from it, and so on. */
export const revisionNumber = (runId: string): number => {
  let depth = 1;
  let current = revisionParent(runId);
  const seen = new Set<string>([runId]);
  while (current && !seen.has(current) && depth < MAX_REVISION_DEPTH) {
    seen.add(current);
    depth += 1;
    current = revisionParent(current);
  }
  return depth;
};

/**
 * The run this one came from, and the reference a reader sees for it, when that run is
 * still in this browser's register. `undefined` reference means the earlier run is not
 * recorded here any more — the screen says so rather than inventing one.
 */
export const revisionParentReference = (runId: string): string | undefined => {
  const parent = revisionParent(runId);
  return parent ? peekRun(parent)?.reference : undefined;
};

/**
 * The request that takes the drafted policy back through the simulation: the next
 * version of this run.
 *
 * Pure — it records nothing; `assessmentService.run` does that. The wording passed in IS
 * the policy now (the officer's own text when they have written one, otherwise the
 * generated instrument), the horizon and assumptions carry over, and uploaded file names
 * do not: this run's input is the drafted policy, and the lineage names where it came
 * from.
 */
export const revisionRequestFromRun = (
  parentRunId: string,
  draftedPolicyText: string,
): AssessmentRequest | undefined => {
  const parent = getRunRequest(parentRunId);
  if (!parent) return undefined;
  return {
    departmentId: parent.departmentId,
    policyText: draftedPolicyText,
    source: "draft",
    timeHorizon: parent.timeHorizon,
    levers: parent.levers,
    revisionOf: parentRunId,
  };
};
