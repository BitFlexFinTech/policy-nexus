/**
 * SINGLE SOURCE OF TRUTH — the department drafting prompt library.
 *
 * When a drafting service is configured (see `/platform-admin`), it is handed one
 * prompt per department. Every prompt is DERIVED here from that department's own
 * authored configuration — its mandate and priorities in `departments.ts`, the groups
 * it models and the shares they carry in `reference.ts`, and the instruments it may
 * cite in `instruments.ts`. Nothing about a department is written a second time here,
 * so the prompt a model receives can never drift from the register the interface shows.
 *
 * The local deterministic generator (`services/assessment/documents.ts`) produces the
 * exact structure this library asks for, so swapping the local generator for a real
 * model is a credential change and nothing else (see PRODUCTION_READINESS.md).
 *
 * DETERMINISM: plain authored rules plus pure derivation. No clock, no randomness.
 */

import type { Department, DepartmentId } from "./departments";
import { citedInstrumentLabel } from "./instruments";
import { getStakeholderSegment, MODELLED_SHARE_LABEL, REFERENCE_DATE_LABEL } from "./reference";

/**
 * The sections every drafted policy must carry, in order. `services/assessment/documents.ts`
 * produces exactly these headings, and a test holds the two together — so this list is a
 * promise the local generator keeps and a model would be asked to keep.
 */
export const POLICY_DRAFT_STRUCTURE: readonly string[] = [
  "Preamble",
  "1. Objective",
  "2. Scope and application",
  "3. Policy measures",
  "4. Risk mitigation",
  "5. Stakeholder engagement",
  "6. Transitional provisions",
  "7. Monitoring, evaluation and review",
  "8. Citations",
  "Note on this draft",
];

/**
 * The rules every department's prompt carries. These are the same rules a reader is
 * promised on the Reference screen: a citation comes from the register or not at all,
 * and a figure is either published (with its source) or the word Modelled.
 */
export const DRAFTING_RULES: readonly string[] = [
  "Cite only the instruments named in the citation list. Never name an Act, a chapter or any other instrument that is not on that list, and never invent a chapter number.",
  `A figure is either the published figure given to you with its source, or the word ${MODELLED_SHARE_LABEL}. Never invent a figure, and never present a modelled figure as a published one.`,
  "Write in the department's own register: plain, formal, and specific about who must do what.",
  "Do not attribute a statement, a preference or a quote to a named individual.",
  "The draft is a starting text for the responsible officer to edit. It is not an adopted instrument and not legal drafting advice.",
];

export interface DraftingPrompt {
  departmentId: DepartmentId;
  /** The full instruction text handed to a drafting model. */
  instructions: string;
  /** The instrument titles the draft may cite, DERIVED from the department's register. */
  citations: readonly string[];
  /** The sections, in order, the produced document must contain. */
  structure: readonly string[];
}

/** One group, as the prompt states it: a published share with its base, or the modelled word. */
const groupForPrompt = (id: Department["segments"][number]): string => {
  const segment = getStakeholderSegment(id);
  return segment.share === null
    ? `${segment.label} (share: ${MODELLED_SHARE_LABEL})`
    : `${segment.label} (share: ${segment.share}% of ${segment.shareBase})`;
};

/** The department's prompt, assembled from its own configuration. Pure and deterministic. */
export const draftingPromptFor = (department: Department): DraftingPrompt => {
  const citations = department.instruments.map((id) => citedInstrumentLabel(id));
  const instructions = [
    `Draft a policy for ${department.name} (${department.shortName}).`,
    `Statutory mandate: ${department.mandate}`,
    `The department's stated priorities, in its own words: ${department.priorities
      .map((priority) => `${priority.label} — ${priority.note}`)
      .join("; ")}.`,
    `The stakeholder groups this policy must reach, each with the share of the country it stands for: ${department.segments
      .map(groupForPrompt)
      .join("; ")}.`,
    `The instruments this draft may cite: ${citations.join("; ")}.`,
    `Produce exactly these sections, in this order: ${POLICY_DRAFT_STRUCTURE.join(" | ")}.`,
    `The reference date for this build is ${REFERENCE_DATE_LABEL}; use it as the date of the draft.`,
    ...DRAFTING_RULES,
  ].join("\n");
  return {
    departmentId: department.id,
    instructions,
    citations,
    structure: POLICY_DRAFT_STRUCTURE,
  };
};
