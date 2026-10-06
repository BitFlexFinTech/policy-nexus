/**
 * SINGLE SOURCE OF TRUTH — the working matrices a policy is carried out with.
 *
 * The drafted policy and the Implementation pack both print the SAME four matrices. Before this module
 * they were built inside the drafted policy, so a pack would have had to copy them — and two copies of
 * a matrix are two things that can disagree about the same policy. They are built here once and both
 * documents use them.
 *
 * What a matrix may contain: every figure that is real (a measure, a recommendation, a group, a
 * published indicator baseline and its source) and a marked blank for everything only the department can
 * state — an office, a calendar date, a funding source, a target. Nothing is invented, and the blank
 * marker is the same one the drafted policy has always used.
 */

import { indicatorBasisLabel, type Department } from "@/config/departments";
import { MODELLED_SHARE_LABEL, REFERENCE_FISCAL_YEAR, STAKEHOLDER_SEGMENTS } from "@/config/reference";
import { CLAUSE } from "./documentStructure";
import type { AssessmentRun, GeneratedSection, StakeholderReaction } from "./types";

/** The one marker used wherever only the department can supply the value. */
export const BLANK = "[TO BE CONFIRMED BY THE DEPARTMENT]";

/** A table as a generated document renders it — taken from the section type, never re-declared. */
export type DocumentTable = NonNullable<GeneratedSection["table"]>;

/** The policy's own phasing, as the drafted policy has always printed it. */
export const PHASE_ONE_DATE = `Phase 1 — from the start of fiscal year ${REFERENCE_FISCAL_YEAR}`;
export const PHASE_TWO_DATE = `Phase ${CLAUSE.engagement} engagement complete`;

/** A modelled sentiment as a reader's word. */
export const SENTIMENT_WORD: Record<StakeholderReaction["sentiment"], string> = {
  supportive: "receptive",
  mixed: "conditional",
  resistant: "resistant",
};

/** A share as it is printed: "38.6% of the population", or the Modelled label. */
export const shareLabel = (reaction: StakeholderReaction): string => {
  const segment = STAKEHOLDER_SEGMENTS.find((entry) => entry.id === reaction.segmentId);
  if (!segment || segment.share === null) return `${MODELLED_SHARE_LABEL} — no published share`;
  return `${segment.share}% of the ${segment.shareBase}`;
};

/**
 * Split submitted policy text into its own sentences — the measures the draft already carries.
 * Deterministic, and shared, so the implementation matrix in the drafted policy and the one in the
 * Implementation pack list exactly the same measures.
 */
export const sentencesOf = (text: string): string[] =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);

/* ------------------------------------------------------------------------- */
/* The blanks are the department's to complete — in its own document, not here  */
/* ------------------------------------------------------------------------- */

/*
 * 2026-10-02 — the owner's instruction: the platform must not ask an officer to hand-fill
 * the matrices. The form that collected these values (`ImplementationForm`), the store that
 * kept them (`implementationStore` / `useImplementationFills`), the row keys, the field list
 * and the `filled()` helper are all removed. A cell only the department can decide now always
 * prints the one marked blank `BLANK`, and the department completes it in the document it
 * exports. Nothing is guessed, and no second copy of an answer can exist to disagree.
 */

/* ------------------------------------------------------------------------- */
/* The four matrices, each built once                                          */
/* ------------------------------------------------------------------------- */

/**
 * Table 4 — the implementation matrix: every measure the draft already carried, then every step the
 * examination recommended. The office, the funding source and the calendar dates are the department's.
 */
export const implementationMatrixTable = (run: AssessmentRun): DocumentTable => ({
  caption: "Table 4 — Implementation matrix: measure, office, date and funding",
  columns: ["Measure", "Responsible office", "Target date", "Funding source"],
  rows: [
    // The office and the funding source are the department's own to state; the date is the
    // policy's own phasing until the department sets its own in the exported document.
    ...sentencesOf(run.policyText).map((measure) => [measure, BLANK, PHASE_ONE_DATE, BLANK]),
    ...run.recommendations.map((recommendation) => [
      `${recommendation.label} — ${recommendation.note}`,
      BLANK,
      PHASE_TWO_DATE,
      BLANK,
    ]),
  ],
});

/** Table A1 — the recommended steps, with the requirement each carries. */
export const recommendedStepsTable = (run: AssessmentRun): DocumentTable => ({
  caption: "Table A1 — Recommended steps, with the requirement each carries",
  columns: ["Step", "What it requires", "Responsible office", "Target date"],
  rows: run.recommendations.map((recommendation) => [
    recommendation.label,
    recommendation.note,
    BLANK,
    PHASE_TWO_DATE,
  ]),
});

/** Table 5 — the cost categories this policy creates, for the department to cost. */
export const costCategoriesTable = (): DocumentTable => ({
  caption: "Table 5 — Cost categories created by this policy, for costing by the department",
  columns: ["Cost item", "Type", "Basis in this policy", "Amount"],
  rows: [
    [
      "Implementation of the measures",
      "One-off",
      `The measures in clause ${CLAUSE.measures} and the offices named in clause ${CLAUSE.implementation}`,
      BLANK,
    ],
    [
      "Engagement rounds and their publication",
      "One-off",
      `The engagement obligations in clause ${CLAUSE.engagement}`,
      BLANK,
    ],
    [
      "Capacity and training for the offices carrying the measures",
      "One-off",
      `The implementation obligations in clause ${CLAUSE.implementation}`,
      BLANK,
    ],
    [
      "Monitoring, reporting and the review",
      "Recurring",
      `The monitoring and evaluation matrix in clause ${CLAUSE.monitoring}`,
      BLANK,
    ],
    [
      "Compliance with the policy by those it affects",
      "Recurring",
      `The obligations in clause ${CLAUSE.measures}; the cost to those affected is not modelled and is marked at clause ${CLAUSE.risk}`,
      BLANK,
    ],
  ],
});

/**
 * Table 6 — the monitoring and evaluation matrix. Each indicator's baseline and its data source are the
 * department's own real figures; the target, the frequency and the collecting office are its decisions.
 */
export const monitoringMatrixTable = (department: Department): DocumentTable => ({
  caption: "Table 6 — Monitoring and evaluation matrix",
  columns: ["Indicator", "Baseline", "Target", "Data source", "Frequency", "Responsible office"],
  rows: department.indicators.map((indicator) => [
    indicator.label,
    `${indicator.value}${indicator.unit ? ` ${indicator.unit}` : ""}`,
    BLANK,
    indicatorBasisLabel(indicator.basis),
    BLANK,
    BLANK,
  ]),
});

/** Table B1 — each modelled group, its share, its modelled position and the engagement provided. */
export const stakeholderAnalysisTable = (run: AssessmentRun): DocumentTable => ({
  caption: "Table B1 — Group, share, modelled position and engagement",
  columns: ["Stakeholder group", "Published share", "Modelled position", "Engagement provided"],
  rows: run.reactions.map((reaction) => [
    reaction.label,
    shareLabel(reaction),
    SENTIMENT_WORD[reaction.sentiment],
    reaction.sentiment === "supportive"
      ? `Briefed under clause ${CLAUSE.engagement} before commencement`
      : reaction.sentiment === "mixed"
        ? `Engagement round under clause ${CLAUSE.engagement} before obligations bite`
        : `Met before obligations commence under clause ${CLAUSE.engagement}`,
  ]),
});

