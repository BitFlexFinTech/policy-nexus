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

import { type Department } from "@/config/departments";
import { DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
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
  "Every figure below is derived from the submitted draft, the department's reference indicators and the modelled behaviour of its stakeholder groups.",
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
      // The sovereignty fact is READ from the one statement, never restated here, so a
      // generated document and the footer can never disagree about where the work happens.
      `${SOVEREIGNTY_STATEMENT} No external service is contacted, and no document text is uploaded.`,
      rng.pick(REPORT_METHOD),
      `This run modelled ${run.reactions.length} stakeholder groups, tested the draft against ${run.impacts.length} of ${department.shortName}'s stated priorities, and drew on ${department.indicators.length} reference indicators over a ${run.horizonLabel.toLowerCase()} horizon of ${run.horizonMonths} months.`,
      `The draft's own words were read before anything was modelled; the run screen and the assessment state what that reading found.`,
    ],
    // BATCH E — every assumption the run was modelled under, in the report's own words.
    bullets: run.leverNotes.length > 0 ? run.leverNotes : undefined,
    listStyle: "bullets",
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
      // The engine's starting code is deliberately NOT printed: it is built from the whole
      // submitted policy text, so printing it reprinted that text as one long machine string.
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

/**
 * The policy itself, drafted from the run. Its generator lives in its own module
 * (`./policyDraft.ts`) because a Zimbabwean policy is a structured instrument — front
 * matter, numbered clauses and annexes, and the matrices a policy is read by — and mixing
 * it with the report generator made both harder to read. It is re-exported here so every
 * existing caller and test keeps importing `buildPolicyDraft` from this module.
 */
export { buildPolicyDraft } from "./policyDraft";

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
      // A table is rendered as pipe-separated rows, so the plain-text export, the
      // Word export and the clipboard all carry the same matrix the screen shows.
      ...(section.table
        ? [
            section.table.caption,
            `| ${section.table.columns.join(" | ")} |`,
            ...section.table.rows.map((row) => `| ${row.join(" | ")} |`),
          ]
        : []),
      "",
    ]),
  ].join("\n");






