/**
 * DETERMINISTIC DOCUMENT GENERATORS — the long-form report and the drafted policy.
 *
 * Two documents are derived from a completed run:
 *   - `buildLongReport`  — the long-form narrative report (the "long version").
 *   - `buildPolicyDraft` — the actual policy, written out in full and adjusted to
 *                          answer what the simulation found.
 *
 * Both are pure functions of the run plus the department's authored configuration.
 * Variation comes from a PRNG seeded with the run's own seed string
 * (`<seed>::long-report`, `<seed>::policy-draft`), so the same inputs always yield
 * byte-identical documents. There is no clock, no `Math.random()` and no network
 * call. This is the mock-first path for a document generator that a backend model
 * may later replace behind these same signatures (see PRODUCTION_READINESS.md).
 */

import type { Department } from "@/config/departments";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { REFERENCE_DATE_LABEL } from "@/config/reference";
import { createRng } from "@/lib/prng";
import type {
  AssessmentRun,
  GeneratedDocument,
  GeneratedSection,
  StakeholderReaction,
} from "./types";

/* ------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* ------------------------------------------------------------------------- */

/** Split submitted policy text into citable sentences. Deterministic. */
const sentencesOf = (text: string): string[] =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);

const meanOf = (values: readonly number[]): number =>
  values.length === 0
    ? 0
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

/** "a, b and c" — a stable join used in every generated sentence. */
const listOf = (labels: readonly string[]): string =>
  labels.length === 0
    ? "none of the modelled groups"
    : labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

const SENTIMENT_WORD: Record<StakeholderReaction["sentiment"], string> = {
  supportive: "supportive",
  mixed: "conditional",
  resistant: "resistant",
};

/* ------------------------------------------------------------------------- */
/* Authored sentence banks — reviewable connective prose, seeded into one       */
/* deterministic order. Nothing here is assembled from random words.           */
/* ------------------------------------------------------------------------- */

const REPORT_PURPOSE: readonly string[] = [
  "It is written so that a reader who was not present for the run can follow the same reasoning the workspace followed.",
  "It records what the simulation produced, in the order it was produced, so the figures can be checked rather than taken on trust.",
  "It sits alongside the executive summary: the summary states the position, this report shows the working behind it.",
];

const REPORT_METHOD: readonly string[] = [
  "The generator is deterministic and holds no state, so the same inputs always reproduce this exact result.",
  "Every figure below is derived from the submitted draft, the department's published reference indicators and the modelled behaviour of its stakeholder groups.",
  "The run models each group separately and then reads their combined position, which is why one draft can read as supportive to one group and resistant to another.",
];

/* ------------------------------------------------------------------------- */
/* The long-form report                                                        */
/* ------------------------------------------------------------------------- */

/**
 * The long-form narrative report for a run — the "long version" of the result.
 * Deterministic: the same run always yields this exact document.
 */
export const buildLongReport = (run: AssessmentRun, department: Department): GeneratedDocument => {
  const rng = createRng(`${run.seed}::long-report`);

  const supportive = run.reactions.filter((reaction) => reaction.sentiment === "supportive");
  const conditional = run.reactions.filter((reaction) => reaction.sentiment === "mixed");
  const resistant = run.reactions.filter((reaction) => reaction.sentiment === "resistant");
  const meanSupport = meanOf(run.reactions.map((reaction) => reaction.supportIndex));

  const purpose: GeneratedSection = {
    id: "purpose",
    heading: "Purpose and scope of this report",
    paragraphs: [
      `This is the long-form record of simulation ${run.reference}, completed by ${run.departmentName} on ${REFERENCE_DATE_LABEL} over a ${run.horizonLabel.toLowerCase()} horizon. The policy text was supplied as a ${run.source} input and is reproduced in full below.`,
      rng.pick(REPORT_PURPOSE),
      `The workspace produces three outputs from one run: the executive summary (the short version), this report (the full narrative record), and the drafted policy — the policy text itself, revised to answer what the simulation found.`,
    ],
  };

  const submitted: GeneratedSection = {
    id: "submitted",
    heading: "The draft as submitted",
    paragraphs: [
      `"${run.policyTitle}" was submitted as ${run.policyText.length} characters of policy text${
        run.fileNames.length > 0 ? `, accompanied by ${listOf(run.fileNames)}` : ""
      }.`,
      run.policyText,
    ],
  };

  const method: GeneratedSection = {
    id: "method",
    heading: "How this result was produced",
    paragraphs: [
      `The ${VOCABULARY.simulationCore} is computed locally within the Government of Zimbabwe estate. No policy text or result leaves national custody, and no external service is contacted.`,
      rng.pick(REPORT_METHOD),
      `This run modelled ${run.reactions.length} stakeholder groups, tested the draft against ${run.impacts.length} of ${department.shortName}'s stated priorities, and drew on ${department.indicators.length} published reference indicators over a ${run.horizonLabel.toLowerCase()} horizon.`,
    ],
  };

  const reactions: GeneratedSection = {
    id: "reactions",
    heading: `Modelled stakeholder response (${run.reactions.length} groups)`,
    paragraphs: [
      `Across the ${run.reactions.length} groups this department models, the composite modelled support index is ${meanSupport}/100. ${supportive.length} read as supportive, ${conditional.length} as conditional and ${resistant.length} as resistant.`,
      ...run.reactions.map(
        (reaction) =>
          `${reaction.label} — modelled ${SENTIMENT_WORD[reaction.sentiment]}, support index ${reaction.supportIndex}/100 at modelled participation ${reaction.participation}/100. ${reaction.note}`,
      ),
    ],
  };

  const impacts: GeneratedSection = {
    id: "impacts",
    heading: `Modelled effect on stated priorities (${run.impacts.length})`,
    paragraphs: [
      `Each stated priority of ${department.name} was tested against the draft. The direction and strength below are modelled movements under the stated assumptions, not measured outcomes.`,
      ...run.impacts.map(
        (impact) =>
          `${impact.label} — modelled ${impact.direction} movement at ${impact.score}/100. ${impact.note}`,
      ),
    ],
  };

  const risks: GeneratedSection = {
    id: "risks",
    heading: `Risks identified (${run.risks.length})`,
    paragraphs: [
      `The run identified ${run.risks.length} risks that would change the modelled position if they materialise, each with the severity the model assigned and the reason for it.`,
    ],
    bullets: run.risks.map(
      (risk) => `${risk.label} — modelled severity ${risk.severity}. ${risk.note}`,
    ),
    listStyle: "clauses",
  };

  const recommendations: GeneratedSection = {
    id: "recommendations",
    heading: `Recommended next steps (${run.recommendations.length})`,
    paragraphs: [
      `The steps below are the model's proposed responses to the risks above. They are carried into the drafted policy as its implementation, engagement and mitigation provisions.`,
    ],
    bullets: run.recommendations.map((item) => `${item.label} — ${item.note}`),
    listStyle: "clauses",
  };

  const reproducibility: GeneratedSection = {
    id: "reproducibility",
    heading: "Reproducibility and run inputs",
    paragraphs: [
      `Anyone holding the inputs below can reproduce this exact result, because the generator is seeded from them and holds no other state.`,
    ],
    bullets: [
      `Reference date — ${REFERENCE_DATE_LABEL}`,
      `Horizon — ${run.horizonLabel}`,
      `Source — ${run.source}`,
      `Uploaded files — ${run.fileNames.length > 0 ? run.fileNames.join(", ") : "none"}`,
      `Engine — ${VOCABULARY.simulationCore} (Mock)`,
      `Seed — ${run.seed}`,
    ],
  };

  const limitations: GeneratedSection = {
    id: "limitations",
    heading: "Limitations",
    paragraphs: [
      DISCLAIMER.long,
      `The figures above are modelled support indices and participation measures. They are not poll results, not a mandate, and not a substitute for consultation with the groups named.`,
    ],
  };

  return {
    kind: "report",
    title: `${run.policyTitle} — full report`,
    subtitle: `${run.departmentName} · ${run.reference} · long-form report · reference date ${REFERENCE_DATE_LABEL}`,
    fileStem: `${run.reference}-full-report`,
    sections: [
      purpose,
      submitted,
      method,
      reactions,
      impacts,
      risks,
      recommendations,
      reproducibility,
      limitations,
    ],
  };
};

/* ------------------------------------------------------------------------- */
/* The drafted policy                                                          */
/* ------------------------------------------------------------------------- */

const REVIEW_TRIGGERS: readonly string[] = [
  "the monitored indicators move outside the range the department stated for them",
  "the end of the current planning horizon is reached",
  "the department records compliance-cost concerns it cannot resolve within the existing procedure",
];

/**
 * The policy itself, drafted from the run: the submitted text becomes the
 * operative measures, and the simulation's findings become the engagement,
 * mitigation and monitoring provisions. Deterministic, and a text an official can
 * edit before it is circulated.
 */
export const buildPolicyDraft = (run: AssessmentRun, department: Department): GeneratedDocument => {
  const rng = createRng(`${run.seed}::policy-draft`);

  const clauses = sentencesOf(run.policyText);
  const receptive = run.reactions
    .filter((reaction) => reaction.sentiment === "supportive")
    .map((reaction) => reaction.label);
  const conditional = run.reactions
    .filter((reaction) => reaction.sentiment === "mixed")
    .map((reaction) => reaction.label);
  const reluctant = run.reactions
    .filter((reaction) => reaction.sentiment === "resistant")
    .map((reaction) => reaction.label);

  const preamble: GeneratedSection = {
    id: "preamble",
    heading: "Preamble",
    paragraphs: [
      `WHEREAS ${department.name} is constituted with the following mandate: ${department.mandate}`,
      `AND WHEREAS a simulation of the draft policy "${run.policyTitle}" (${run.reference}) was completed on ${REFERENCE_DATE_LABEL} over a ${run.horizonLabel.toLowerCase()} horizon, modelling the response of ${run.reactions.length} stakeholder groups and testing the draft against ${run.impacts.length} stated priorities;`,
      `NOW THEREFORE the following measures are proposed for adoption by ${department.shortName}. This draft answers the pressures the simulation identified; it is not yet an adopted instrument.`,
    ],
  };

  const objective: GeneratedSection = {
    id: "objective",
    heading: "1. Objective",
    paragraphs: [
      `The objective of this policy is to carry the draft "${run.policyTitle}" into effect while addressing the pressures the simulation identified, over a ${run.horizonLabel.toLowerCase()} horizon.`,
      `The policy is directed at the following stated priorities of ${department.shortName}, and its effect on each is to be reported against them:`,
    ],
    bullets: department.priorities.map((priority) => `${priority.label} — ${priority.note}`),
    listStyle: "clauses",
  };

  const scope: GeneratedSection = {
    id: "scope",
    heading: "2. Scope and application",
    paragraphs: [
      `This policy applies to ${department.name} and to the offices and agencies through which it implements policy. The groups the simulation modelled are the groups this policy is expected to reach.`,
      `${listOf(receptive)} are modelled as receptive and can begin under phase one. ${listOf(conditional)} are modelled as conditional and require the engagement measures in clause 5 before obligations bite. ${listOf(reluctant)} are modelled as resistant and require the transitional and mitigation measures in clauses 4 and 6.`,
    ],
    bullets: run.reactions.map(
      (reaction) =>
        `${reaction.label} — modelled ${SENTIMENT_WORD[reaction.sentiment]} (support index ${reaction.supportIndex}/100)`,
    ),
    listStyle: "clauses",
  };

  const measures: GeneratedSection = {
    id: "measures",
    heading: "3. Policy measures",
    paragraphs: [
      `The measures below give effect to the draft. Measures 1 to ${Math.max(clauses.length, 1)} restate the substance of the submitted policy as operative provisions, so that the text the department simulated is the text the department adopts.`,
    ],
    bullets:
      clauses.length > 0
        ? clauses
        : [
            `The department shall carry out the measures described in the uploaded document(s): ${listOf(run.fileNames)}.`,
          ],
    listStyle: "clauses",
  };

  const mitigation: GeneratedSection = {
    id: "mitigation",
    heading: "4. Risk mitigation",
    paragraphs: [
      `Each risk the simulation identified is met with a specific provision, so that the policy does not depend on the risk not materialising.`,
    ],
    bullets: run.risks.map((risk, index) => {
      const response =
        run.recommendations.length > 0
          ? run.recommendations[index % run.recommendations.length]
          : undefined;
      return response
        ? `${risk.label} (modelled severity ${risk.severity}) — ${response.label}. ${response.note}`
        : `${risk.label} (modelled severity ${risk.severity}) — the department shall record and address this risk before obligations commence.`;
    }),
    listStyle: "clauses",
  };

  const engagement: GeneratedSection = {
    id: "engagement",
    heading: "5. Stakeholder engagement",
    paragraphs: [
      `The simulation models ${conditional.length} groups as conditional and ${reluctant.length} as resistant, and treats late communication as a source of that resistance. Engagement is therefore a provision of this policy rather than an accompanying activity.`,
    ],
    bullets: [
      `The department shall publish this policy, and the implementation schedule referred to in clause 7, before any measure in clause 3 takes effect.`,
      conditional.length > 0
        ? `The department shall hold a documented engagement round with ${listOf(conditional)} to settle the implementation detail those groups are waiting on, and shall publish its response.`
        : `The department shall record, for each group, the implementation detail it is waiting on, and shall publish its response.`,
      reluctant.length > 0
        ? `The department shall meet ${listOf(reluctant)} before obligations commence and record the compliance-cost concerns raised, together with the department's response.`
        : `The department shall record compliance-cost concerns raised by any affected group and publish its response.`,
      `Every engagement round shall be minuted and the minutes retained for the review in clause 7.`,
    ],
    listStyle: "clauses",
  };

  const transitional: GeneratedSection = {
    id: "transitional",
    heading: "6. Transitional provisions",
    paragraphs: [
      `Obligations that begin before the supporting systems exist are the clearest risk the simulation identified. This policy therefore starts in phases rather than on a single date.`,
      `Phase one begins with ${
        receptive.length > 0
          ? listOf(receptive)
          : "the groups the department's own offices serve directly"
      }. Phase two extends to ${
        conditional.length > 0 ? listOf(conditional) : "the remaining affected groups"
      } once the engagement in clause 5 is complete. Phase three extends to ${
        reluctant.length > 0 ? listOf(reluctant) : "any group still carrying an unresolved cost"
      } after the transition window, which shall not be shorter than two budget cycles.`,
    ],
  };

  const monitoring: GeneratedSection = {
    id: "monitoring",
    heading: "7. Monitoring, evaluation and review",
    paragraphs: [
      `The policy is monitored against the department's own published reference indicators, so that progress is read from one set of figures rather than several.`,
      `The policy shall be reviewed when ${rng.pick(
        REVIEW_TRIGGERS,
      )}. The review shall report the actual position against the modelled position using the indicators below, and shall be published.`,
    ],
    bullets: department.indicators.map(
      (indicator) =>
        `${indicator.label} — baseline ${indicator.value}${indicator.unit ? ` ${indicator.unit}` : ""} (${indicator.source})`,
    ),
    listStyle: "clauses",
  };

  const note: GeneratedSection = {
    id: "note",
    heading: "Note on this draft",
    paragraphs: [
      `This is a drafted instrument produced from simulation ${run.reference}. It is a starting text for the responsible officer to edit; it is not an adopted policy and not legal drafting advice.`,
      DISCLAIMER.long,
    ],
  };

  return {
    kind: "policy-draft",
    title: `Draft policy — ${run.policyTitle}`,
    subtitle: `${department.name} · derived from ${run.reference} · reference date ${REFERENCE_DATE_LABEL}`,
    fileStem: `${run.reference}-policy-draft`,
    sections: [
      preamble,
      objective,
      scope,
      measures,
      mitigation,
      engagement,
      transitional,
      monitoring,
      note,
    ],
  };
};

/* ------------------------------------------------------------------------- */
/* Plain-text rendering — ONE definition, shared by export and by tests        */
/* ------------------------------------------------------------------------- */

/**
 * Render a generated document as plain text. This is the single rendering used
 * for the Word export, the clipboard/share payload, and the plain text shown when
 * a draft is edited, so what is exported is exactly what was read.
 */
export const renderDocumentText = (doc: GeneratedDocument): string =>
  [
    doc.title,
    doc.subtitle,
    "",
    ...doc.sections.flatMap((section) => [
      section.heading.toUpperCase(),
      ...section.paragraphs,
      ...(section.bullets ?? []).map((bullet, index) =>
        section.listStyle === "clauses" ? `${index + 1}. ${bullet}` : `- ${bullet}`,
      ),
      "",
    ]),
  ].join("\n");






