/**
 * The drafting stage — the facts and the address parameter behind it.
 *
 * Owner's item 6, second half: *"is there not supposed to be some sort of animation that
 * shows that the AI is drafting the policy based on the assessment? it seem like the policy
 * was already drafted when the simulation was run?"*
 *
 * The drafted policy is composed the instant the run completes, so the officer never saw it
 * being drafted. This module holds the pieces of the short stage that shows it happening:
 * the steps (derived from the run itself, so they state what was actually used), the pacing,
 * and the parameter that asks for the stage in the first place.
 *
 * Kept out of `DraftingStage.tsx` on purpose — that file exports a component, and a file that
 * exports both a component and constants cannot be hot-reloaded cleanly (the same reason
 * `documentViews.ts` stands beside `DocumentNav.tsx`).
 *
 * HONESTY: the local generator is instantaneous; the stage is PRESENTATION, not compute. It
 * says so on screen, and every step names a real figure from the run. Nothing is invented.
 *
 * DETERMINISM: the steps are a pure function of the run, and only the reveal timing varies —
 * exactly like the simulation's own round reveal. No clock, no randomness.
 */

import type { AssessmentRun } from "@/services/assessment/types";

/** The address parameter that asks the drafted-policy screen to show the stage. */
export const DRAFTING_QUERY_PARAM = "drafting";

/** Where "Draft the policy" sends the officer: the drafted policy, with the stage shown. */
export const draftingPathFor = (runId: string): string =>
  `/app/assessments/${encodeURIComponent(runId)}/policy-draft?${DRAFTING_QUERY_PARAM}=1`;

/**
 * Pacing only — the content is fixed by the run.
 *
 * Exported because the tests drive the reveal, and because the pacing is a deliberate,
 * first-time-only stage: it is skippable, and it never runs at all when the reader has asked
 * the system for reduced motion.
 */
export const DRAFTING_STEP_MS = 600;

/**
 * What the drafting is based on, read off the run itself. Each line names a real figure, so
 * the stage is a true account of the run rather than decoration.
 */
export const draftingStepsFor = (run: AssessmentRun): string[] => [
  `Reading the assessment — ${run.reactions.length} modelled stakeholder reactions across ${run.impacts.length} impact areas.`,
  `Weighing what could go wrong — ${run.risks.length} ${run.risks.length === 1 ? "risk" : "risks"} recorded.`,
  `Turning the recommended steps into provisions — ${run.recommendations.length} of them.`,
  "Composing the instrument — every provision drawn from this run, nothing added.",
];

/**
 * True when the reader has asked their system for less movement. The stage is then skipped
 * entirely: it is a deliberate wait, and a reduced-motion reader should not be made to wait
 * through an animation they did not want. The document is simply shown.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
