/**
 * THE DRAFTED POLICY — a real Government-style instrument, not a summary.
 *
 * Why this file is separate from `documents.ts`: a Zimbabwean national policy or strategy
 * runs 40–100 printed pages (the National ICT Policy 2015 is 42 pages; the National Health
 * Strategy 2021–2025 is 104; the National AI Strategy 2026–2030 is 73), and it is read in
 * a fixed order — foreword, acronyms, executive summary, contents, then numbered clauses,
 * then matrices and annexes. That structure is what this module produces, from the run and
 * the department's own configuration only.
 *
 * Two rules govern every line:
 *   1. Nothing is invented. A figure is either published with its source stated, or it is
 *      labelled `Modelled`; a name, a date, an amount or an office the platform cannot know
 *      is printed as a marked blank for the department to fill.
 *   2. It is deterministic. The seed is the run's own (`<seed>::policy-draft`), so the same
 *      inputs always produce byte-identical text. No clock, no network call, no randomness.
 */

import { indicatorBasisLabel, type Department } from "@/config/departments";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
import {
  MODELLED_SHARE_LABEL,
  REFERENCE_DATE_LABEL,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
import { createRng } from "@/lib/prng";
import { ANNEX, CLAUSE } from "./documentStructure";
import {
  assertCitationsVerified,
  citationsSectionFor,
  provenanceParagraphs,
  verifyDocumentCitations,
} from "@/services/documents/drafting";
import type {
  AssessmentRun,
  GeneratedDocument,
  GeneratedSection,
  StakeholderReaction,
} from "./types";

/** Re-exported so callers and gates read the document's numbering from one place. */
export { CLAUSE } from "./documentStructure";

/** The one marker used wherever only the department can supply the value. */
export const BLANK = "[TO BE CONFIRMED BY THE DEPARTMENT]";

/**
 * The abbreviations the platform's own content uses, with their expansions. Only entries
 * whose expansion is a matter of record are kept here; the list printed in the document is
 * BUILT from this map and the finished text, so the policy can never list an abbreviation
 * it does not use, nor expand one in a way nobody can check.
 */
export const KNOWN_ABBREVIATIONS: ReadonlyArray<readonly [string, string]> = [
  ["AI", "Artificial Intelligence"],
  ["GDP", "Gross Domestic Product"],
  ["ICT", "Information and Communication Technology"],
  ["ILO", "International Labour Organization"],
  ["M&E", "Monitoring and Evaluation"],
  ["NDS1", "National Development Strategy 1"],
  ["NDS2", "National Development Strategy 2"],
  ["RBZ", "Reserve Bank of Zimbabwe"],
  ["SADC", "Southern African Development Community"],
  ["SME", "Small and Medium-sized Enterprise"],
  ["USD", "United States Dollar"],
  ["ZIMRA", "Zimbabwe Revenue Authority"],
  ["ZIMSTAT", "Zimbabwe National Statistics Agency"],
  ["ZWG", "Zimbabwe Gold (national currency unit)"],
];

const SENTIMENT_WORD: Record<StakeholderReaction["sentiment"], string> = {
  supportive: "receptive",
  mixed: "conditional",
  resistant: "resistant",
};

/** "a, b and c"; and a phrase that stays grammatical when the list is empty. */
const listOf = (labels: readonly string[]): string =>
  labels.length === 0
    ? "no modelled group"
    : labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

/** Split submitted policy text into its own sentences. Deterministic. */
const sentencesOf = (text: string): string[] =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);

/** A share as it is printed: "38.6% of the population", or the Modelled label. */
const shareLabel = (reaction: StakeholderReaction): string => {
  const segment = STAKEHOLDER_SEGMENTS.find((entry) => entry.id === reaction.segmentId);
  if (!segment || segment.share === null) return `${MODELLED_SHARE_LABEL} — no published share`;
  return `${segment.share}% of the ${segment.shareBase}`;
};

/* ------------------------------------------------------------------------- */
/* The document                                                                */
/* ------------------------------------------------------------------------- */

export const buildPolicyDraft = (run: AssessmentRun, department: Department): GeneratedDocument => {
  // The seed string is unchanged from the first version of this document, so every
  // existing guarantee — and every recorded expectation — still holds.
  const rng = createRng(`${run.seed}::policy-draft`);

  const submittedMeasures = sentencesOf(run.policyText);
  const reactive = run.reactions.filter((reaction) => reaction.sentiment === "supportive");
  const conditional = run.reactions.filter((reaction) => reaction.sentiment === "mixed");
  const reluctant = run.reactions.filter((reaction) => reaction.sentiment === "resistant");

  const frontMatter: GeneratedSection[] = [];
  const numbered: GeneratedSection[] = [];
  const annexes: GeneratedSection[] = [];

  /* --- Cover ------------------------------------------------------------- */

  frontMatter.push({
    id: "cover",
    heading: "Republic of Zimbabwe",
    paragraphs: [
      department.name,
      `DRAFT POLICY — ${run.policyTitle}`,
      `${BRAND.initiative} · prepared on ${BRAND.productName}`,
      `Run reference ${run.reference} · reference date ${REFERENCE_DATE_LABEL} · horizon ${run.horizonLabel} (${run.horizonMonths} months)`,
      "DRAFT FOR REVIEW — this is not an adopted instrument. It is prepared for decision support: the platform informs, and a human decides.",
      `Marking: ${BRAND.classification}`,
    ],
  });

  /* --- Foreword ---------------------------------------------------------- */

  frontMatter.push({
    id: "foreword",
    heading: "Foreword",
    paragraphs: [
      `This policy concerns "${run.policyTitle}", prepared by ${department.shortName}. Its measures were examined by controlled simulation before adoption, and the findings of that examination are recorded in the clauses and annexes that follow.`,
      `The examination modelled the response of ${run.reactions.length} stakeholder groups over a ${run.horizonLabel.toLowerCase()} horizon and tested the draft against ${run.impacts.length} of the department's stated priorities. Where it showed a pressure the draft did not answer, this policy carries a provision for it.`,
      "The instrument remains a draft until it is adopted through the department's own approval process. Nothing in it decides a question that belongs to a person: it sets out what the department intends to do, and what the department will publish so that its effect can be seen.",
      `Foreword to be signed by the Honourable Minister responsible for ${department.name}: ${BLANK}, with the date of signature.`,
    ],
  });

  /* --- Acknowledgements -------------------------------------------------- */

  frontMatter.push({
    id: "acknowledgements",
    heading: "Acknowledgements",
    paragraphs: [
      "This draft was prepared from the department's own stated priorities, its reference indicators and its cited-instrument register, together with the policy text submitted for examination.",
      `The examination was carried out with the ${VOCABULARY.simulationCore}, which is deterministic: the same inputs always produce the same result, and the result can be reproduced from the inputs recorded at Annex D.`,
      `Contributions to be acknowledged, and the offices that must be consulted before submission, are recorded by the department: ${BLANK}.`,
    ],
  });

  /* --- Executive summary ------------------------------------------------- */

  frontMatter.push({
    id: "executive-summary",
    heading: "Executive summary",
    paragraphs: [
      `This policy carries the submitted draft, "${run.policyTitle}", into effect while answering the pressures the examination identified. It is directed at the stated priorities of ${department.shortName} and is to be monitored against the department's own reference indicators.`,
      `The examination modelled ${run.reactions.length} stakeholder groups. ${listOf(reactive.map((reaction) => reaction.label))} are modelled as receptive; ${conditional.length > 0 ? listOf(conditional.map((reaction) => reaction.label)) : "no group is modelled as conditional"} as conditional; and ${reluctant.length === 0 ? "no group is modelled as resistant" : `${listOf(reluctant.map((reaction) => reaction.label))} as resistant`}. The run records a confidence of ${run.confidence} out of 100, which describes the firmness of the modelled range and not the certainty of any outcome.`,
      `The examination raised ${run.risks.length} risks, each of which the policy meets with a provision in clause ${CLAUSE.risk}, and produced ${run.recommendations.length} recommended steps. Those steps appear as measures in clause ${CLAUSE.measures}, as an implementation matrix at Annex A, and as provisions in clauses ${CLAUSE.risk}, ${CLAUSE.engagement} and ${CLAUSE.transitional}.`,
      "What this policy does not claim: it is a structured and reproducible scenario analysis, not a forecast of public opinion or of administrative results. Its figures are indicative and must be read with the method and limitations note at Annex E.",
    ],
    table: {
      caption: "Table 1 — The modelled position this policy answers",
      columns: ["Headline measure", "Modelled value", "What it means"],
      rows: run.metrics.map((metric) => [metric.label, metric.value, metric.note]),
    },
  });

  /* --- 1. Introduction and background ------------------------------------ */

  numbered.push({
    id: "introduction",
    heading: `${CLAUSE.introduction}. Introduction and background`,
    paragraphs: [
      `${department.name} is constituted with the following mandate: ${department.mandate}`,
      `This policy addresses "${run.policyTitle}". The draft was developed for a ${run.horizonLabel.toLowerCase()} horizon and reached the examination as ${run.source === "upload" ? "an uploaded document" : run.source === "preset" ? "one of the department's own prepared drafts" : "policy text entered directly by the responsible officer"}.`,
      "The problem it addresses: policies are implemented without a structured way of examining the likely responses of those they affect, so the cost of a provision that is not understood is discovered after implementation rather than before it. This policy answers that problem in two ways — its measures state who does what, and its monitoring provisions state what will be published so that the position can be read from evidence rather than from opinion.",
      `The policy applies to ${department.shortName} and to the offices and agencies through which it implements policy, and it is intended to reach the stakeholder groups modelled at clause ${CLAUSE.situation}.`,
      `It was examined by controlled simulation before adoption. The examination is recorded at Annex D so that any reader can reproduce it from the recorded inputs and check that the same result follows.`,
      `A reader in a meeting can work from the clause numbers alone: clause ${CLAUSE.measures} states the measures, clause ${CLAUSE.implementation} states who carries them out, clause ${CLAUSE.monitoring} states how their effect will be read, and the annexes carry the matrices.`,
    ],
  });

  /* --- 2. Situation analysis --------------------------------------------- */

  numbered.push({
    id: "situation-analysis",
    heading: `${CLAUSE.situation}. Situation analysis`,
    paragraphs: [
      `This clause records the position the policy starts from. Every figure is either a published figure, with the body that publishes it and the period stated beside it, or is labelled ${MODELLED_SHARE_LABEL} because no publisher publishes that return. A modelled figure is never presented as a published one.`,
      `The indicators below are the department's own reference figures. They are also the measures in the monitoring and evaluation matrix at clause ${CLAUSE.monitoring}, so that progress is read from one set of figures rather than several.`,
    ],
    table: {
      caption: "Table 2 — Reference indicators, with the basis of each figure",
      columns: ["Indicator", "Baseline", "Basis"],
      rows: department.indicators.map((indicator) => [
        indicator.label,
        `${indicator.value}${indicator.unit ? ` ${indicator.unit}` : ""}`,
        indicatorBasisLabel(indicator.basis),
      ]),
    },
  });

  numbered.push({
    id: "situation-groups",
    heading: `${CLAUSE.situation}.2 Modelled stakeholder position`,
    paragraphs: [
      "The examination modelled how each group below may respond to the draft. A support index is a modelled measure on a scale of 0 to 100; it is not a vote share, a poll result, or a statement of what any group has actually said.",
      `Where a group stands on a published national share, the share is stated with the figure it stands for. Where no published share exists, the group is labelled ${MODELLED_SHARE_LABEL} and its weight was set neutrally in the examination.`,
      `The engagement provisions at clause ${CLAUSE.engagement} are directed at the groups the examination shows as conditional or resistant, because those are the groups whose implementation questions have to be settled before obligations bite.`,
    ],
    table: {
      caption: "Table 3 — Modelled position of each group the policy reaches",
      columns: ["Stakeholder group", "National share", "Modelled position", "Support index"],
      rows: run.reactions.map((reaction) => [
        reaction.label,
        shareLabel(reaction),
        SENTIMENT_WORD[reaction.sentiment],
        `${reaction.supportIndex} / 100`,
      ]),
    },
  });

  numbered.push({
    id: "situation-priorities",
    heading: `${CLAUSE.situation}.3 Stated priorities the policy is directed at`,
    paragraphs: [
      "The policy is directed at the department's own stated priorities, and the effect of its measures on each of them is to be reported against them.",
      `The modelled effect of the draft on these priorities is recorded in the examination at Annex D; where a priority is modelled as moving against the draft, the policy answers it in clause ${CLAUSE.measures} and clause ${CLAUSE.risk}.`,
    ],
    bullets: department.priorities.map((priority) => `${priority.label} — ${priority.note}`),
    listStyle: "clauses",
  });

  /* --- 3. Vision, mission, objectives and guiding principles -------------- */

  numbered.push({
    id: "vision",
    heading: `${CLAUSE.vision}. Vision, mission, objectives and guiding principles`,
    paragraphs: [
      "The department's own vision and mission statements are not held in this platform, and the platform does not invent them. They are recorded here for completion by the department.",
      `Vision: ${BLANK}.`,
      `Mission: ${BLANK}.`,
      "The objectives below are the department's own stated priorities, which this policy is directed at.",
    ],
    bullets: department.priorities.map(
      (priority) => `To advance ${priority.label.toLowerCase()} — ${priority.note}`,
    ),
    listStyle: "clauses",
  });

  numbered.push({
    id: "principles",
    heading: `${CLAUSE.vision}.2 Guiding principles applied in preparing this draft`,
    paragraphs: [
      "The principles below describe how this draft was prepared, and each can be checked against the platform's own behaviour rather than taken on trust.",
    ],
    bullets: [
      "Decision support, not decision-making: the platform informs, and a human decides.",
      `Every figure is either published with its source stated, or labelled ${MODELLED_SHARE_LABEL}.`,
      "The draft was examined before adoption, and the examination is reproducible from the inputs recorded at Annex D.",
      `No policy text and no result leaves the responsible officer's own machine. ${SOVEREIGNTY_STATEMENT}`,
    ],
    listStyle: "clauses",
  });

  /* --- 4. Legal and institutional framework ------------------------------ */

  const registerCitations = citationsSectionFor(department);

  numbered.push({
    id: "legal",
    heading: `${CLAUSE.legal}. Legal and institutional framework`,
    paragraphs: [
      `This policy is made under the mandate of ${department.name} recorded at clause ${CLAUSE.introduction}, and it is to be read with the ${(registerCitations.bullets ?? []).length} instruments listed at Annex C.`,
      "Each instrument is drawn from the department's own instrument register and is stated exactly as the platform's cited-instrument table records it. No instrument is named in this policy that the register does not contain; a citation the register cannot verify is refused rather than printed.",
      `The register holds the categories the department relies on — principal Acts, statutory instruments, and national policies or strategies. Where an instrument is amended, replaced or read differently by the responsible legal office, that office updates Annex C; this clause is not to be reinterpreted in place: ${BLANK}.`,
    ],
  });

  /* --- 5. Policy measures ------------------------------------------------ */

  numbered.push({
    id: "measures",
    heading: `${CLAUSE.measures}. Policy measures`,
    paragraphs: [
      submittedMeasures.length === 1
        ? "The single measure below gives effect to the submitted draft. It restates the substance of that draft as an operative provision, so that the text the department examined is the text the department adopts."
        : `The ${submittedMeasures.length} measures below give effect to the submitted draft. Measures 1 to ${submittedMeasures.length} restate the substance of that draft as operative provisions, so that the text the department examined is the text the department adopts.`,
    ],
    bullets: submittedMeasures,
    listStyle: "clauses",
  });

  numbered.push({
    id: "measures-arising",
    heading: `${CLAUSE.measures}.2 Measures arising from the examination`,
    paragraphs: [
      run.recommendations.length === 1
        ? `The examination produced one step the draft did not already provide for. It is a measure of this policy, not a suggestion beside it, and its responsible office and date are recorded in the implementation matrix at clause ${CLAUSE.implementation}.`
        : `The examination produced ${run.recommendations.length} steps the draft did not already provide for. They are measures of this policy, not suggestions beside it, and their responsible offices and dates are recorded in the implementation matrix at clause ${CLAUSE.implementation}.`,
      `Each step is carried into the provisions that give it effect: the risk provisions at clause ${CLAUSE.risk}, the engagement provisions at clause ${CLAUSE.engagement}, and the transitional provisions at clause ${CLAUSE.transitional}.`,
    ],
    bullets: run.recommendations.map(
      (recommendation) => `${recommendation.label} — ${recommendation.note}`,
    ),
    listStyle: "clauses",
  });

  /* --- 6. Implementation framework --------------------------------------- */

  const phaseOneDate = `Phase 1 — from ${REFERENCE_DATE_LABEL}`;
  const phaseTwoDate = `Phase ${CLAUSE.engagement} engagement complete`;

  numbered.push({
    id: "implementation",
    heading: `${CLAUSE.implementation}. Implementation framework`,
    paragraphs: [
      "This clause sets out who carries out each measure. The responsible office and the funding source are the department's to state, and the platform does not invent them, so they are marked for completion rather than left out.",
      `The phasing follows clause ${CLAUSE.transitional}: measures that restate the submitted draft begin with the groups the examination models as receptive, and the measures arising from the examination follow once the engagement at clause ${CLAUSE.engagement} is complete. The dates below are therefore the policy's own phasing; the department sets the calendar dates.`,
      "Where a single office is accountable for a measure, naming it once here is sufficient; where a measure falls to more than one office, the lead office is named first and the supporting offices after it.",
    ],
    table: {
      caption: "Table 4 — Implementation matrix: measure, office, date and funding",
      columns: ["Measure", "Responsible office", "Target date", "Funding source"],
      rows: [
        ...submittedMeasures.map((measure) => [measure, BLANK, phaseOneDate, BLANK]),
        ...run.recommendations.map((recommendation) => [
          `${recommendation.label} — ${recommendation.note}`,
          BLANK,
          phaseTwoDate,
          BLANK,
        ]),
      ],
    },
  });

  /* --- 7. Risk management ------------------------------------------------ */

  numbered.push({
    id: "risk",
    heading: `${CLAUSE.risk}. Risk management`,
    paragraphs: [
      "Every risk the examination raised is met with a specific provision, so that the policy does not depend on the risk not materialising.",
      `The provisions below also carry the steps recommended by the examination, which is why they read as obligations rather than as advice. Their monitoring is provided for at clause ${CLAUSE.monitoring}.`,
      "Two risks are the department's own to add and are not modelled by the platform: the cost of compliance to those it affects, and any legal question about the instrument relied on. Both are marked for completion where they arise.",
    ],
    bullets: [
      ...run.risks.map(
        (risk) =>
          `${risk.label} (modelled severity ${risk.severity}) — ${risk.note} Applied to ${department.shortName}.`,
      ),
      `${BLANK} — compliance-cost risk, with the department's response.`,
      `${BLANK} — legal risk, referred to the responsible legal office.`,
    ],
    listStyle: "clauses",
  });

  /* --- 8. Stakeholder engagement and communication ----------------------- */

  numbered.push({
    id: "engagement",
    heading: `${CLAUSE.engagement}. Stakeholder engagement and communication`,
    paragraphs: [
      `The examination models ${conditional.length} ${conditional.length === 1 ? "group" : "groups"} as conditional and ${reluctant.length} as ${reluctant.length === 1 ? "resistant" : "resistant"}, and treats late communication as a source of that reluctance. Engagement is therefore a provision of this policy rather than an activity beside it.`,
      conditional.length === 0 && reluctant.length === 0
        ? "No modelled group is recorded as resistant, so no group requires a pre-commencement meeting before obligations bite; the department shall still publish this policy before any measure takes effect."
        : "The groups the examination shows as waiting on implementation detail are engaged before their obligations bite, and the minutes of that engagement are retained for the review at clause " +
          `${CLAUSE.monitoring}.`,
    ],
    bullets: [
      `The department shall publish this policy, and the implementation schedule referred to in clause ${CLAUSE.implementation}, before any measure in clause ${CLAUSE.measures} takes effect.`,
      conditional.length > 0
        ? `The department shall hold a documented engagement round with ${listOf(conditional.map((reaction) => reaction.label))} to settle the implementation detail those groups are waiting on, and shall publish its response.`
        : "The department shall record, for each affected group, the implementation detail it is waiting on, and shall publish its response.",
      reluctant.length > 0
        ? `The department shall meet ${listOf(reluctant.map((reaction) => reaction.label))} before obligations commence and record the compliance-cost concerns raised, together with the department's response.`
        : "The department shall record compliance-cost concerns raised by any affected group and publish its response.",
      `The department shall brief ${reactive.length > 0 ? listOf(reactive.map((reaction) => reaction.label)) : "the groups the examination models as receptive"} on what changes for them, so that the measures in clause ${CLAUSE.measures} are known before they begin.`,
      `Every engagement round shall be minuted, and the minutes retained for the review at clause ${CLAUSE.monitoring}.`,
      `${BLANK} — the office responsible for stakeholder communication.`,
    ],
    listStyle: "clauses",
  });

  /* --- 9. Financial implications ----------------------------------------- */

  numbered.push({
    id: "finance",
    heading: `${CLAUSE.finance}. Financial implications`,
    paragraphs: [
      "This clause states the cost categories the policy creates. An amount is a decision of the department and the Ministry of Finance, and the platform does not invent one: no figure below is modelled, and none is a published figure.",
      `Each category follows from a provision of this policy, so the schedule is complete against the measures in clause ${CLAUSE.measures} and the implementation obligations in clause ${CLAUSE.implementation}.`,
      "Recurring costs are those that continue after the policy is in force; one-off costs are those that arise once, in preparing for it.",
    ],
    table: {
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
    },
  });

  /* --- 10. Monitoring, evaluation and review ----------------------------- */

  numbered.push({
    id: "monitoring",
    heading: `${CLAUSE.monitoring}. Monitoring, evaluation and review`,
    paragraphs: [
      "The policy is monitored against the department's own reference indicators, so that progress is read from one set of figures rather than several. Each indicator below carries its basis: a published figure names the body that publishes it, and a modelled figure says so.",
      `The policy shall be reviewed when ${rng.pick(REVIEW_TRIGGERS)}. The review shall compare the actual position with the position modelled in the examination, report the comparison against the indicators below, and be published.`,
      `The department shall set the target for each indicator and name the office that collects it: ${BLANK}. Where a target is set, the review reports against it; where none is set, the review reports the movement from the baseline.`,
    ],
    table: {
      caption: "Table 6 — Monitoring and evaluation matrix",
      columns: [
        "Indicator",
        "Baseline",
        "Target",
        "Data source",
        "Frequency",
        "Responsible office",
      ],
      rows: department.indicators.map((indicator) => [
        indicator.label,
        `${indicator.value}${indicator.unit ? ` ${indicator.unit}` : ""}`,
        BLANK,
        indicatorBasisLabel(indicator.basis),
        BLANK,
        BLANK,
      ]),
    },
  });

  /* --- 11. Transitional provisions --------------------------------------- */

  numbered.push({
    id: "transitional",
    heading: `${CLAUSE.transitional}. Transitional provisions`,
    paragraphs: [
      "Obligations that begin before the supporting systems exist are the clearest risk the examination identified, so this policy starts in phases rather than on a single date.",
      `Phase one begins with ${
        reactive.length > 0
          ? listOf(reactive.map((reaction) => reaction.label))
          : "the groups the department's own offices serve directly"
      }, which the examination models as receptive. Phase two extends to ${
        conditional.length > 0
          ? listOf(conditional.map((reaction) => reaction.label))
          : "the remaining affected groups"
      } once the engagement at clause ${CLAUSE.engagement} is complete. Phase three extends to ${
        reluctant.length > 0
          ? listOf(reluctant.map((reaction) => reaction.label))
          : "any group still carrying an unresolved cost"
      } after the transition window, which shall not be shorter than two budget cycles from commencement.`,
      `The phasing is the policy's own and is recorded in the implementation matrix at clause ${CLAUSE.implementation}. The commencement date, and any variation of these phases, is a decision of the department: ${BLANK}.`,
    ],
  });

  /* --- Annexes ------------------------------------------------------------ */

  annexes.push({
    id: "annex-a",
    heading: "Annex A — Implementation matrix for the steps the examination recommended",
    paragraphs: [
      `The ${run.recommendations.length} steps recommended by the examination, each with what it requires, who carries it, and when it is due. The office and the calendar date are the department's to state.`,
    ],
    table: {
      caption: "Table A1 — Recommended steps, with the requirement each carries",
      columns: ["Step", "What it requires", "Responsible office", "Target date"],
      rows: run.recommendations.map((recommendation) => [
        recommendation.label,
        recommendation.note,
        BLANK,
        phaseTwoDate,
      ]),
    },
  });

  annexes.push({
    id: "annex-b",
    heading: "Annex B — Stakeholder analysis",
    paragraphs: [
      "Each modelled group, the published share it stands on where one exists, its modelled position, and the engagement this policy provides for it.",
    ],
    table: {
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
    },
  });

  // Annex C keeps the citations section's own id, so the platform's citation check reads
  // exactly the same section it always has — only the heading moved.
  annexes.push({
    ...registerCitations,
    id: "citations",
    heading: `${ANNEX.instruments} — Instruments relied on`,
  });

  annexes.push({
    id: "annex-d",
    heading: "Annex D — Run inputs and reproducibility",
    paragraphs: [
      "This annex records the exact inputs the examination was derived from, so that any reader can reproduce it and check that the same result follows. A run is reproducible when the department, the policy text, the horizon and the assumptions are the same.",
    ],
    bullets: [
      `Department: ${department.name} (${department.abbr})`,
      `Run reference: ${run.reference} · completed ${REFERENCE_DATE_LABEL} (the platform's reference date)`,
      `Source of the policy text: ${run.source}${run.fileNames.length > 0 ? ` · files: ${listOf(run.fileNames)}` : ""}`,
      `Policy text submitted: ${run.policyText.length} characters`,
      `Horizon: ${run.horizonLabel} (${run.horizonMonths} months)`,
      `Seed: ${run.seed} — the same seed always yields the same result`,
      `Groups modelled: ${run.reactions.length} · priorities tested: ${run.impacts.length} · risks raised: ${run.risks.length} · steps recommended: ${run.recommendations.length}`,
      ...run.leverNotes.map((note) => `Assumption: ${note}`),
    ],
    listStyle: "bullets",
  });

  annexes.push({
    id: "annex-e",
    heading: "Annex E — Method and limitations",
    paragraphs: [
      DISCLAIMER.long,
      `The ${VOCABULARY.simulationCore} derived this examination from the submitted policy text, the department's reference indicators and its modelled stakeholder groups, using a seeded deterministic process. The same inputs always produce the same result.`,
      SOVEREIGNTY_STATEMENT,
      "Limitations to be read with the figures above: the support indices and participation measures are modelled, not observed; a group's modelled position is a range of behaviour under stated assumptions and is not a statement by that group; and the examination cannot price a measure or read a draft into law. Those are the department's to do, and are marked for completion where they arise.",
    ],
  });

  /* --- Assembly ----------------------------------------------------------- */

  // A printed policy puts the contents immediately after the cover and the acronyms before
  // the executive summary. The front matter above was written in reading order, so the two
  // derived sections are spliced into place rather than re-ordering the rest by hand.
  const written: GeneratedSection[] = [...frontMatter, ...numbered, ...annexes];
  const contents = buildContents(written);
  const acronyms = buildAcronyms(written);

  const sections: GeneratedSection[] = [...frontMatter];
  sections.splice(1, 0, contents);
  sections.splice(sections.length - 1, 0, acronyms);
  sections.push(...numbered, ...annexes);

  const noteBase: string[] = [
    `This is a drafted instrument produced from examination ${run.reference}. It is a starting text for the responsible officer to edit; it is not an adopted policy and not legal drafting advice.`,
    DISCLAIMER.long,
  ];

  const identity = {
    kind: "policy-draft" as const,
    title: `Draft policy — ${run.policyTitle}`,
    subtitle: `${department.name} · derived from ${run.reference} · reference date ${REFERENCE_DATE_LABEL}`,
    fileStem: `${run.reference}-policy-draft`,
  };

  // The provenance sentence states how many citations were verified, so it is written from
  // the check of the document's own citations annex. The closing note carries no citation of
  // its own, which is why the note may be written after the check below.
  const verification = verifyDocumentCitations(
    { ...identity, sections: [...sections, noteSection(noteBase)] },
    department,
  );

  const document: GeneratedDocument = {
    ...identity,
    sections: [
      ...sections,
      noteSection([...noteBase, ...provenanceParagraphs(run, department, verification)]),
    ],
  };

  // Fail-closed: a draft that names an instrument outside the department's register, or a
  // chapter no known citation carries, is not returned at all.
  assertCitationsVerified(document, department);

  return document;
};

/* ------------------------------------------------------------------------- */
/* Helpers used during assembly                                                */
/* ------------------------------------------------------------------------- */

const noteSection = (paragraphs: string[]): GeneratedSection => ({
  id: "note",
  heading: "Note on this draft",
  paragraphs,
});

/** Everything a section carries, including its table, as one string. */
const sectionText = (section: GeneratedSection): string =>
  [
    section.heading,
    ...section.paragraphs,
    ...(section.bullets ?? []),
    ...(section.table
      ? [section.table.caption, ...section.table.columns, ...section.table.rows.flat()]
      : []),
  ].join("\n");

/**
 * The contents list, built from the finished document: every numbered clause heading and
 * every annex heading, in the order they appear. Page numbers are set by whoever prints the
 * instrument, because a browser cannot know them before printing.
 */
const buildContents = (sections: readonly GeneratedSection[]): GeneratedSection => ({
  id: "contents",
  heading: "Table of contents",
  paragraphs: [
    "The numbered clauses and the annexes below are the substance of this policy. Page numbers are set by the office that prints the instrument.",
  ],
  bullets: sections
    .filter((section) => /^\d+\.\s/.test(section.heading) || /^Annex [A-Z]\b/.test(section.heading))
    .map((section) => section.heading),
  listStyle: "bullets",
});

/**
 * The acronym list, built from the document's own text plus the recorded expansions: it
 * cannot list an abbreviation the policy does not use, and it never expands one in a way
 * nobody can check.
 */
const buildAcronyms = (sections: readonly GeneratedSection[]): GeneratedSection => {
  const text = sections.map(sectionText).join("\n");
  const used = KNOWN_ABBREVIATIONS.filter(([abbreviation]) =>
    new RegExp(`\\b${abbreviation}\\b`).test(text),
  );
  return {
    id: "acronyms",
    heading: "Abbreviations and acronyms",
    paragraphs: [
      "Every abbreviation used in this policy is listed below with its expansion. An abbreviation the platform cannot expand is not listed, and no expansion here is invented.",
    ],
    bullets: used.map(([abbreviation, expansion]) => `${abbreviation} — ${expansion}`),
    listStyle: "bullets",
  };
};

/**
 * The review triggers. Three, so the review clause states a real condition rather than a
 * date the platform cannot know; the run's own seed selects one, deterministically.
 */
const REVIEW_TRIGGERS: readonly string[] = [
  "the monitored indicators move outside the range the department stated for them",
  "the end of the current planning horizon is reached",
  "the department records compliance-cost concerns it cannot resolve within the existing procedure",
];
