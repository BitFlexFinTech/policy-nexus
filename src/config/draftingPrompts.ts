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
 * The sections every drafted policy must carry, in order. `services/assessment/policyDraft.ts`
 * produces exactly these headings, and a test holds the two together — so this list is a
 * promise the local generator keeps and a configured drafting service would be asked to keep.
 *
 * The order is the Zimbabwean one, taken from the published instruments themselves: front
 * matter (cover, contents, foreword, acknowledgements, acronyms, executive summary), then
 * numbered clauses (introduction, situation analysis, vision and objectives, legal framework,
 * measures, implementation, risk, engagement, finance, monitoring, transitional), then the
 * annexes and the closing note. The National ICT Policy 2015, the National Health Strategy
 * 2021–2025 and the National AI Strategy 2026–2030 all follow this shape.
 */
export const POLICY_DRAFT_STRUCTURE: readonly string[] = [
  "Republic of Zimbabwe",
  "Table of contents",
  "Foreword",
  "Acknowledgements",
  "Abbreviations and acronyms",
  "Executive summary",
  "1. Introduction and background",
  "2. Situation analysis",
  "2.2 Modelled stakeholder position",
  "2.3 Stated priorities the policy is directed at",
  "2.4 Departmental material the examination read",
  "3. Vision, mission, objectives and guiding principles",
  "3.2 Guiding principles applied in preparing this draft",
  "4. Legal and institutional framework",
  "5. Policy measures",
  "5.2 Measures arising from the examination",
  "6. Implementation framework",
  "7. Risk management",
  "8. Stakeholder engagement and communication",
  "9. Financial implications",
  "10. Monitoring, evaluation and review",
  "11. Transitional provisions",
  "Annex A — Implementation matrix for the steps the examination recommended",
  "Annex B — Stakeholder analysis",
  "Annex C — Instruments relied on",
  "Annex D — Documents and data relied upon",
  "Annex E — Run inputs and reproducibility",
  "Annex F — Method and limitations",
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

/** The department's prompt, assembled from its own configuration. Pure and deterministic.
 *
 *  `referenceDate` is the moment the run was recorded, so a draft produced from this prompt is
 *  dated like the rest of the run; it defaults to the platform's reference frame so a caller
 *  with no run (a preview, a test) still gets a complete, stable prompt. */
export const draftingPromptFor = (
  department: Department,
  referenceDate: string = REFERENCE_DATE_LABEL,
): DraftingPrompt => {
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
    `The reference date for this build is ${referenceDate}; use it as the date of the draft.`,
    ...DRAFTING_RULES,
  ].join("\n");
  return {
    departmentId: department.id,
    instructions,
    citations,
    structure: POLICY_DRAFT_STRUCTURE,
  };
};
