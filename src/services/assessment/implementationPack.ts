/**
 * THE IMPLEMENTATION PACK — the working companion to the drafted policy.
 *
 * The owner's request: *"can't we do all A,B and C, so the user has the Implementation pack anyway for
 * their own records?"*
 *
 * The research behind it: the platform already drafts the matrices a policy is carried out with, but
 * they sit inside a long instrument. An office that has to act on a policy needs those matrices on their
 * own — to cost it, to schedule it, to brief the groups it reaches, and to keep a record of what has
 * been settled. This pack is that working document, and nothing else.
 *
 * THREE RULES, the same as the drafted policy's:
 *   1. Nothing is invented. Every table comes from the SAME builder the drafted policy uses, so the two
 *      documents can never disagree about the same policy, and every value only the department can state
 *      is printed as the same marked blank — which the department completes in the document it exports.
 *      The platform does not ask for those values on screen (the owner's instruction, 2026-10-02).
 *   2. It is deterministic — the same run always produces the same pack, byte for byte.
 *   3. It carries no figure of its own. Where a reader needs the authority for a figure, it is in the
 *      policy and in the run the pack derives from.
 */

import type { Department } from "@/config/departments";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { REFERENCE_DATE_LABEL } from "@/config/reference";
import {
  BLANK,
  costCategoriesTable,
  implementationMatrixTable,
  monitoringMatrixTable,
  recommendedStepsTable,
  stakeholderAnalysisTable,
} from "./matrices";
import type { AssessmentRun, GeneratedDocument, GeneratedSection } from "./types";

export const buildImplementationPack = (
  run: AssessmentRun,
  department: Department,
): GeneratedDocument => {
  const purpose: GeneratedSection = {
    id: "pack-purpose",
    heading: "What this pack is for",
    paragraphs: [
      `This is the working pack for "${run.policyTitle}", prepared by ${department.name} from examination ${run.reference} on ${REFERENCE_DATE_LABEL}. It gathers the parts of the policy that offices act on — the implementation matrix, the cost categories to be costed, the monitoring and evaluation matrix, the recommended steps and the stakeholder analysis — so they can be worked on and circulated without the rest of the instrument.`,
      `Every table here is the same table that appears in the drafted policy for this examination, from the same source. The pack adds no figure, no date and no office of its own: where a value is the department's to set, it is printed as ${BLANK} so that what still has to be completed is obvious.`,
      "Nothing in this pack is an adopted decision. It is the working record of what the examination modelled and what the department has yet to settle.",
    ],
  };

  const implementation: GeneratedSection = {
    id: "pack-implementation",
    heading: "1. Implementation matrix",
    paragraphs: [
      "Each measure the draft already carried, followed by each step the examination recommended. The responsible office, the calendar date and the funding source are the department's to state, and the pack does not invent them.",
    ],
    table: implementationMatrixTable(run),
  };

  const costs: GeneratedSection = {
    id: "pack-costs",
    heading: "2. Cost categories to be costed",
    paragraphs: [
      "The categories this policy creates, for the department's costing office. No amount is modelled: the categories follow from the policy's own provisions, and the amount is a decision of the department and the Ministry of Finance.",
    ],
    table: costCategoriesTable(),
  };

  const monitoring: GeneratedSection = {
    id: "pack-monitoring",
    heading: "3. Monitoring and evaluation matrix",
    paragraphs: [
      "Each indicator with the baseline and the data source the department already holds, so progress is read from one set of figures rather than several. The target, the review frequency and the office that collects the figure are the department's to set.",
    ],
    table: monitoringMatrixTable(department),
  };

  const steps: GeneratedSection = {
    id: "pack-steps",
    heading: "4. The recommended steps, and what each requires",
    paragraphs: [
      `The ${run.recommendations.length} ${run.recommendations.length === 1 ? "step" : "steps"} the examination recommended, each with the requirement it carries. Each is already worked into the drafted policy; this is the version an office works from.`,
    ],
    table: recommendedStepsTable(run),
  };

  const stakeholders: GeneratedSection = {
    id: "pack-stakeholders",
    heading: "5. Stakeholder analysis",
    paragraphs: [
      `The ${run.reactions.length} groups the examination modelled, each with the published share it stands on where one exists, its modelled position, and the engagement the policy provides for it. Use it to see which groups the policy leaves to be briefed rather than addresses.`,
    ],
    table: stakeholderAnalysisTable(run),
  };

  const method: GeneratedSection = {
    id: "pack-method",
    heading: "6. Where this pack comes from, and its limits",
    paragraphs: [
      DISCLAIMER.long,
      `The groups above are modelled by the ${VOCABULARY.simulationCore}, not surveyed, and every position is a modelled support index. The figures are indicative and must be read with the disclaimer above.`,
      "The pack carries no signature block and no approval. A completed pack is a working record of a department's plans; it is not an adopted policy, and it does not replace the instrument itself.",
    ],
  };

  return {
    kind: "implementation-pack",
    title: `Implementation pack — ${run.policyTitle}`,
    subtitle: `${department.name} · derived from ${run.reference} · reference date ${REFERENCE_DATE_LABEL}`,
    fileStem: `${run.reference}-implementation-pack`,
    sections: [purpose, implementation, costs, monitoring, steps, stakeholders, method],
  };
};
