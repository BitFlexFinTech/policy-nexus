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

import { documentsInReadingOrder, indicatorBasisLabel, type Department } from "@/config/departments";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
import { officerDisplayName } from "@/config/officer";
import {
  MODELLED_SHARE_LABEL,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
import { formatInstant } from "@/lib/clock";
import { createRng } from "@/lib/prng";
import { ANNEX, CLAUSE } from "./documentStructure";
import {
  BLANK,
  SENTIMENT_WORD,
  costCategoriesTable,
  implementationMatrixTable,
  monitoringMatrixTable,
  recommendedStepsTable,
  sentencesOf,
  shareLabel,
  stakeholderAnalysisTable,
} from "./matrices";
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

/**
 * Who the drafted policy names as its preparer: the officer recorded on the run, with their
 * post, or the department when none was recorded. Composed here so the foreword, the
 * "Prepared by" section and every export name the same preparer the same way (item 1).
 */
const preparerLine = (run: AssessmentRun, department: Department): string => {
  const officer = run.preparedBy;
  if (!officer) return department.shortName;
  const name = officerDisplayName(officer) || department.shortName;
  return [name, officer.position, department.shortName].map((part) => part.trim()).filter(Boolean).join(", ");
};

/**
 * The paper-trail line the instrument itself carries: who prepared it, and how honestly that
 * name was established. Kept to one line because a Government document's title block is fixed
 * by the mandated structure; the full sentence about self-declaration appears on the screen
 * and on the run's own record.
 */
const preparerDisclosure = (run: AssessmentRun, department: Department): string => {
  const officer = run.preparedBy;
  if (!officer) return `${department.shortName} (no individual preparer recorded)`;
  const name = officerDisplayName(officer) || "unnamed officer";
  const post = officer.position.trim() ? `, ${officer.position.trim()}` : "";
  const how = officer.source === "sign-in" ? "from Government sign-in" : "self-declared at entry";
  return `${name}${post}, ${department.shortName} (${how})`;
};

/** Re-exported so callers and gates read the document's numbering from one place. */
export { CLAUSE } from "./documentStructure";

/** Re-exported from the matrix module, which is where it is written. */
export { BLANK } from "./matrices";

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

/** "a, b and c"; and a phrase that stays grammatical when the list is empty. */
const listOf = (labels: readonly string[]): string =>
  labels.length === 0
    ? "no modelled group"
    : labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

/** The first letter lower-cased, so a priority's own note can be carried into a sentence. */
const lowerFirst = (text: string): string =>
  text.length ? text.charAt(0).toLowerCase() + text.slice(1) : text;

/* ------------------------------------------------------------------------- */
/* The department's own material (Batch 5)                                     */
/* ------------------------------------------------------------------------- */

/**
 * One departmental document as the drafted policy reads it. `text` is the real text that was
 * read in the browser; it is empty when the file could only be recorded by name, and such a
 * document contributes nothing — no count, no quote, no claim.
 */
interface MaterialDocument {
  name: string;
  characters: number;
  text: string;
  /**
   * True when the run was recorded with this document's material, but the document is no longer in
   * the department's library (removed, or changed since), so its material cannot be read back now.
   * Stated plainly, never shown as "not read" as though it had never been given (Batch 0).
   */
  unavailable: boolean;
}

/** One of the department's stated priorities, and the sentence of the material that carries it. */
interface MaterialEvidence {
  priorityLabel: string;
  documentName: string;
  quote: string;
}

interface MaterialReading {
  /** Every document the run was given, in a stable order. */
  documents: MaterialDocument[];
  /** Only those whose real text was read. */
  read: MaterialDocument[];
  /** Documents the run was recorded with that are no longer in the department's library. */
  unavailable: MaterialDocument[];
  /** Characters of real text read across all of them. */
  characters: number;
  /** The priorities the material's own wording carries, with the sentence that carries it. */
  carried: MaterialEvidence[];
}

/**
 * The words in a priority's label that are distinctive enough to search the department's own
 * material for. Words that appear in almost any Government paper are dropped, so a match means
 * the material really speaks to that priority rather than merely being about policy in general.
 * Kept as one list so the match can be read and reviewed rather than guessed at.
 */
const GENERIC_PRIORITY_WORDS = new Set([
  "policy",
  "national",
  "public",
  "sector",
  "system",
  "systems",
  "service",
  "services",
  "development",
  "government",
  "support",
  "framework",
  "programme",
  "program",
  "management",
  "access",
  "quality",
  "delivery",
  "planning",
]);

const priorityTerms = (label: string): string[] =>
  label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 5 && !GENERIC_PRIORITY_WORDS.has(word));

/** Exported so a gate can check that every priority the draft claims is really in the material. */
export { priorityTerms };

/** How much of a document's own sentence is quoted, so an annex cannot reprint a whole report. */
const MAX_QUOTE = 240;

/**
 * The sentence of a document that carries one of a priority's words, trimmed to a readable
 * length at a word boundary. `null` when no sentence carries it, so a claim is never made
 * without the sentence that proves it.
 */
const quoteAround = (text: string, term: string): string | null => {
  const sentence = sentencesOf(text).find((entry) => entry.toLowerCase().includes(term));
  if (!sentence) return null;
  const clean = sentence.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_QUOTE) return clean;
  const cut = clean.slice(0, MAX_QUOTE);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

/**
 * Read the run's own documents: the counts, and which of the department's stated priorities
 * the material's wording carries. Sorted by name so the result is stable whatever order the
 * documents were added in, and pure — no clock, no randomness — so the draft stays
 * byte-identical for the same run.
 */
const readMaterial = (run: AssessmentRun, department: Department): MaterialReading => {
  const documents: MaterialDocument[] = [...(run.documents ?? [])]
    .map((document) => ({
      name: document.name,
      characters: document.characters,
      text: (document.text ?? "").trim(),
      unavailable: document.unavailable === true,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const read = documents.filter((document) => document.text.length > 0);
  const unavailable = documents.filter((document) => document.unavailable);
  const characters = read.reduce((total, document) => total + document.text.length, 0);

  const carried: MaterialEvidence[] = [];
  for (const priority of department.priorities) {
    const terms = priorityTerms(priority.label);
    if (terms.length === 0) continue;
    for (const document of read) {
      const haystack = document.text.toLowerCase();
      const term = terms.find((candidate) => haystack.includes(candidate));
      if (!term) continue;
      const quote = quoteAround(document.text, term);
      if (!quote) continue;
      carried.push({ priorityLabel: priority.label, documentName: document.name, quote });
      break; // one document is enough to show the wording
    }
  }

  return { documents, read, unavailable, characters, carried };
};

/* ------------------------------------------------------------------------- */
/* The document                                                                */
/* ------------------------------------------------------------------------- */

export const buildPolicyDraft = (
  run: AssessmentRun,
  department: Department,
): GeneratedDocument => {
  // The seed string is unchanged from the first version of this document, so every
  // existing guarantee — and every recorded expectation — still holds.
  const rng = createRng(`${run.seed}::policy-draft`);

  const submittedMeasures = sentencesOf(run.policyText);
  const reactive = run.reactions.filter((reaction) => reaction.sentiment === "supportive");
  const conditional = run.reactions.filter((reaction) => reaction.sentiment === "mixed");
  const reluctant = run.reactions.filter((reaction) => reaction.sentiment === "resistant");
  // Batch 5 — the department's own material, read from the run's own documents.
  const material = readMaterial(run, department);
  // Batch B4 — the department's REAL, PUBLISHED documents, read from its own register. These are
  // the sources the instrument is checked against: its governing law, its sector policy, the
  // parliamentary committees' reports on it and the audits of it. They are named in Annex D with
  // the body that published each one, its date and the address of the published file, so any
  // reader can find and check it.
  const published = documentsInReadingOrder(department.documents);
  const publishedRead = published.filter((document) => document.read);
  const publishedCharacters = publishedRead.reduce(
    (total, document) => total + document.characters,
    0,
  );
  const publishedUnread = published.length - publishedRead.length;

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
      BRAND.initiative,
      `Reference ${run.reference} · recorded ${formatInstant(run.createdAt)} · horizon ${run.horizonLabel} (${run.horizonMonths} months)`,
      // Item 1 — the paper trail, on the instrument itself. One line, inside the block that
      // already identifies the run, so the document's mandated structure is unchanged.
      `Prepared by: ${preparerDisclosure(run, department)}`,
      "DRAFT FOR REVIEW — this is not an adopted instrument. It is issued for the responsible officer's consideration, and it is the officer who decides.",
      `Marking: ${BRAND.classification}`,
    ],
  });

  /* --- Foreword ---------------------------------------------------------- */

  frontMatter.push({
    id: "foreword",
    heading: "Foreword",
    paragraphs: [
      `This policy concerns "${run.policyTitle}", prepared by ${preparerLine(run, department)}. It sets out what ${department.shortName} shall do, the groups it reaches, and what it will publish, over a ${run.horizonLabel.toLowerCase()} horizon.`,
      `The policy is directed at the department's own ${run.impacts.length} stated priorities and provides for the concerns of the ${run.reactions.length} groups it reaches. Where a concern is not yet settled, this policy carries a provision for it rather than leaving it to be discovered after implementation.`,
      "The instrument remains a draft until it is adopted through the department's own approval process. Nothing in it decides a question that belongs to a person: it sets out what the department intends to do, and what the department will publish so that its effect can be seen.",
      `Foreword to be signed by the Honourable Minister responsible for ${department.name}: ${BLANK}, with the date of signature.`,
    ],
  });

  /* --- Acknowledgements -------------------------------------------------- */

  frontMatter.push({
    id: "acknowledgements",
    heading: "Acknowledgements",
    paragraphs: [
      "This draft was prepared from the department's own stated priorities, its own reference indicators and its cited-instrument register, together with the policy text the department submitted.",
      `The figures and provisions in this policy were derived by a deterministic process: the same inputs always produce the same result, and the result can be reproduced from the inputs recorded at ${ANNEX.runInputs}.`,
      `Contributions to be acknowledged, and the offices that must be consulted before submission, are recorded by the department: ${BLANK}.`,
    ],
  });

  /* --- Executive summary ------------------------------------------------- */

  frontMatter.push({
    id: "executive-summary",
    heading: "Executive summary",
    paragraphs: [
      `This policy carries the department's submitted draft, "${run.policyTitle}", into effect while answering the concerns raised in preparing it. It is directed at the stated priorities of ${department.shortName} and is to be monitored against the department's own reference indicators.`,
      `The policy reaches ${run.reactions.length} groups. ${listOf(reactive.map((reaction) => reaction.label))} are expected to support it; ${conditional.length > 0 ? listOf(conditional.map((reaction) => reaction.label)) : "no group is expected to hold conditional concerns"} may hold conditional concerns; and ${reluctant.length === 0 ? "no group is expected to resist" : `${listOf(reluctant.map((reaction) => reaction.label))} may resist`}. The position is stated as a range of behaviour under stated assumptions, with a reading of ${run.confidence} out of 100; it is not a forecast of any outcome.`,
      `The policy meets ${run.risks.length} risks, each with a provision in clause ${CLAUSE.risk}, and carries ${run.recommendations.length} further measures. Those measures appear in clause ${CLAUSE.measures}, as an implementation matrix at ${ANNEX.implementationMatrix}, and as provisions in clauses ${CLAUSE.risk}, ${CLAUSE.engagement} and ${CLAUSE.transitional}.`,
      `What this policy does not claim: the position it reads from is a reproducible scenario, not a forecast of public opinion or of administrative results. Its figures are indicative and must be read with the note at ${ANNEX.method}.`,
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
      `This policy addresses "${run.policyTitle}". It applies for a ${run.horizonLabel.toLowerCase()} horizon, and it was prepared from ${run.source === "upload" ? "a document the department uploaded" : run.source === "preset" ? "one of the department's own prepared drafts" : "policy text entered directly by the responsible officer"}.`,
      "The problem it addresses: policies are implemented without a settled way of reading the likely responses of those they affect, so the cost of a provision that is not understood is discovered after implementation rather than before it. This policy answers that problem in two ways — its measures state who does what, and its monitoring provisions state what will be published so that the position can be read from evidence rather than from opinion.",
      `The policy applies to ${department.shortName} and to the offices and agencies through which it implements policy, and it is intended to reach the groups it describes at clause ${CLAUSE.situation}.`,
      `Its provisions were settled in advance and are recorded at ${ANNEX.runInputs}, so that any reader can follow how each was reached and repeat the reading.`,
      `A reader in a meeting can work from the clause numbers alone: clause ${CLAUSE.measures} states the measures, clause ${CLAUSE.implementation} states who carries them out, clause ${CLAUSE.monitoring} states how their effect will be read, and the annexes carry the matrices.`,
    ],
  });

  /* --- 2. Situation analysis --------------------------------------------- */

  numbered.push({
    id: "situation-analysis",
    heading: `${CLAUSE.situation}. Situation analysis`,
    paragraphs: [
      `This clause records the position the policy starts from. Every figure is either a published figure, with the body that publishes it and the period stated beside it, or is labelled ${MODELLED_SHARE_LABEL} because no publisher publishes that return. A modelled figure is never presented as a published one.`,
      `The baseline below is the department's own reference set for the sector. It is also the set the monitoring and evaluation matrix at clause ${CLAUSE.monitoring} reports against, so that progress is read from one set of figures rather than several.`,
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
    heading: `${CLAUSE.situation}.2 The groups this policy reaches`,
    paragraphs: [
      "This clause records the groups the policy reaches and the position each is expected to take. A support index is a measure on a scale of 0 to 100; it is not a vote share, a poll result, or a statement of what any group has actually said.",
      `Where a group stands on a published national share, the share is stated with the figure it stands for. Where no published share exists, the group is labelled ${MODELLED_SHARE_LABEL} and its weight is set neutrally.`,
      `The engagement provisions at clause ${CLAUSE.engagement} are directed at the groups whose concerns are conditional or resistant, because those are the groups whose implementation questions have to be settled before obligations bite.`,
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
      `Where a priority is expected to move against the policy, the policy answers it in clause ${CLAUSE.measures} and clause ${CLAUSE.risk}. How each provision was reached is recorded at ${ANNEX.runInputs}.`,
    ],
    bullets: department.priorities.map((priority) => `${priority.label} — ${priority.note}`),
    listStyle: "clauses",
  });

  /* --- 2.4 The department's own material (Batch 5) ------------------------ */

  // The bullets quote the department's OWN wording where it carries one of its stated
  // priorities. A priority is claimed only when a distinctive word of its label really appears
  // in the material and the sentence that carries it can be quoted — so no claim is ever made
  // without the sentence that proves it.
  const materialBullets =
    material.read.length === 0
      ? undefined
      : material.carried.length > 0
        ? material.carried.map(
            (entry) => `${entry.priorityLabel} — "${entry.quote}" (${entry.documentName})`,
          )
        : [
            "No sentence of the supplied material repeats the wording of any of the department's stated priorities, so none is claimed here.",
          ];

  numbered.push({
    id: "situation-documents",
    heading: `${CLAUSE.situation}.4 The department's own material`,
    paragraphs:
      material.documents.length > 0
        ? [
            `The department supplied ${material.documents.length} of its own ${material.documents.length === 1 ? "document" : "documents"} through its Document Library, and ${material.read.length} of them were read for this policy — ${material.characters} characters of the department's own material. Each is listed at ${ANNEX.documents}, with what was and was not read.`,
            ...(material.unavailable.length > 0
              ? [
                  `${material.unavailable.length === 1 ? "One document was" : `${material.unavailable.length} documents were`} recorded with an earlier run of this policy and ${material.unavailable.length === 1 ? "is" : "are"} no longer in the department's library, so ${material.unavailable.length === 1 ? "its" : "their"} material could not be read back now — ${material.unavailable.length === 1 ? "it is" : "they are"} shown at ${ANNEX.documents} as no longer held, not as never read.`,
                ]
              : []),
            "That material is the department's own record. Where it repeats one of the department's stated priorities, the sentence carrying that wording is quoted below, so a reader sees the department's own words rather than a summary of them.",
          ]
        : [
            "The department supplied no document of its own for this policy, so the position recorded in this clause rests on the submitted draft and the department's own reference figures alone.",
            `A department can add its reports, spreadsheets and statistics through its Document Library, and the policy it prepares afterwards draws on them and records them at ${ANNEX.documents}. Nothing is inferred from a document that was not read.`,
          ],
    bullets: materialBullets,
    listStyle: "bullets",
  });

  /* --- 3. Vision, mission, objectives and guiding principles -------------- */

  numbered.push({
    id: "vision",
    heading: `${CLAUSE.vision}. Policy goal and objectives`,
    paragraphs: [
      `Goal: to give effect to the mandate of ${department.name} by carrying its stated priorities into binding measures, so that each priority is advanced and the groups this policy reaches are brought into the implementation.`,
      `The objectives below are the operative objectives of this policy. Each is carried into at least one measure at clause ${CLAUSE.measures}, and each is monitored against the department's own indicators at clause ${CLAUSE.monitoring}.`,
    ],
    bullets: department.priorities.map(
      (priority, index) =>
        `Objective ${index + 1}: to advance ${priority.label.toLowerCase()} — ${priority.note}.`,
    ),
    listStyle: "clauses",
  });

  numbered.push({
    id: "principles",
    heading: `${CLAUSE.vision}.2 Guiding principles`,
    paragraphs: [
      "The principles below guide how this policy is carried out, and each is written so that it can be checked against what the department publishes.",
    ],
    bullets: [
      "Decision support, not decision-making: the analysis informs, and a person decides.",
      "Proportionality: every measure is directed at a stated priority, and its effect is reported against the department's own baseline.",
      `Transparency: every figure is either published with its source stated, or labelled ${MODELLED_SHARE_LABEL}.`,
      `Inclusiveness: the groups this policy reaches are engaged before their obligations bite, as clause ${CLAUSE.engagement} provides.`,
    ],
    listStyle: "clauses",
  });

  /* --- 4. Legal and institutional framework ------------------------------ */

  const registerCitations = citationsSectionFor(department);

  numbered.push({
    id: "legal",
    heading: `${CLAUSE.legal}. Legal and institutional framework`,
    paragraphs: [
      `This policy is made under the mandate of ${department.name} recorded at clause ${CLAUSE.introduction}, and it is to be read with the ${(registerCitations.bullets ?? []).length} instruments listed at ${ANNEX.instruments}.`,
      `Each instrument is stated exactly as the department's own instrument register records it. No instrument is named in this policy that the register does not contain; an instrument the register cannot verify is left out rather than printed.`,
      `The register holds the categories the department relies on — principal Acts, statutory instruments, and national policies or strategies. Where an instrument is amended, replaced or read differently by the responsible legal office, that office updates ${ANNEX.instruments}; this clause is not to be reinterpreted in place: ${BLANK}.`,
    ],
  });

  /* --- 5. Policy measures ------------------------------------------------ */

  numbered.push({
    id: "measures",
    heading: `${CLAUSE.measures}. Policy measures`,
    paragraphs: [
      `This clause states the measures that give effect to the objectives at clause ${CLAUSE.vision}. Each is an obligation on the Department, so that the policy does not rest on intention alone.`,
      `The measures rest on the policy's own objectives and on the groups whose concerns are conditional or resistant; the department's submitted draft is then carried into effect as a further set of provisions.`,
    ],
    bullets: [
      ...department.priorities.map(
        (priority) =>
          `The Department shall, in order to advance ${priority.label.toLowerCase()}, ${lowerFirst(priority.note)}`,
      ),
      ...[...conditional, ...reluctant].map(
        (reaction) =>
          `The Department shall, before the obligations of this policy take effect, settle the implementation questions raised by ${reaction.label} through the engagement provided at clause ${CLAUSE.engagement}.`,
      ),
      ...submittedMeasures,
    ],
    listStyle: "clauses",
  });

  numbered.push({
    id: "measures-arising",
    heading: `${CLAUSE.measures}.2 Further measures`,
    paragraphs: [
      run.recommendations.length === 1
        ? `One further measure gives effect to a provision the submitted draft did not already contain. It is a measure of this policy, not a suggestion beside it, and its responsible office and date are recorded in the implementation matrix at clause ${CLAUSE.implementation}.`
        : `${run.recommendations.length} further measures give effect to provisions the submitted draft did not already contain. They are measures of this policy, not suggestions beside them, and their responsible offices and dates are recorded in the implementation matrix at clause ${CLAUSE.implementation}.`,
      `Each measure is carried into the provisions that give it effect: the risk provisions at clause ${CLAUSE.risk}, the engagement provisions at clause ${CLAUSE.engagement}, and the transitional provisions at clause ${CLAUSE.transitional}.`,
    ],
    bullets: run.recommendations.map(
      (recommendation) => `${recommendation.label} — ${recommendation.note}`,
    ),
    listStyle: "clauses",
  });

  /* --- 6. Implementation framework --------------------------------------- */

  numbered.push({
    id: "implementation",
    heading: `${CLAUSE.implementation}. Implementation framework`,
    paragraphs: [
      "This clause sets out who carries out each measure. The responsible office and the funding source are the department's to state, so they are marked for completion rather than left out.",
      `The phasing follows clause ${CLAUSE.transitional}: the measures that restate the submitted draft begin with the groups expected to support it, and the further measures follow once the engagement at clause ${CLAUSE.engagement} is complete. The dates below are therefore the policy's own phasing; the department sets the calendar dates.`,
      "Where a single office is accountable for a measure, naming it once here is sufficient; where a measure falls to more than one office, the lead office is named first and the supporting offices after it.",
    ],
    table: implementationMatrixTable(run),
  });

  /* --- 7. Risk management ------------------------------------------------ */

  numbered.push({
    id: "risk",
    heading: `${CLAUSE.risk}. Risk management`,
    paragraphs: [
      "Every risk identified in preparing this policy is met with a specific provision, so that the policy does not depend on the risk not materialising.",
      `The provisions below also carry the further measures, which is why they read as obligations rather than as advice. Their monitoring is provided for at clause ${CLAUSE.monitoring}.`,
      "Two risks are the department's own to add and are not set out here: the cost of compliance to those it affects, and any legal question about the instrument relied on. Both are marked for completion where they arise.",
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
      `This policy reaches ${conditional.length} ${conditional.length === 1 ? "group" : "groups"} whose concerns are conditional and ${reluctant.length} whose concerns are resistant, and it treats late communication as a source of that resistance. Engagement is therefore a provision of this policy rather than an activity beside it.`,
      conditional.length === 0 && reluctant.length === 0
        ? "No group is recorded as resistant, so no group requires a pre-commencement meeting before obligations bite; the department shall still publish this policy before any measure takes effect."
        : "The groups waiting on implementation detail are engaged before their obligations bite, and the minutes of that engagement are retained for the review at clause " +
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
      `The department shall brief ${reactive.length > 0 ? listOf(reactive.map((reaction) => reaction.label)) : "the groups expected to support it"} on what changes for them, so that the measures in clause ${CLAUSE.measures} are known before they begin.`,
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
      "This clause states the cost categories the policy creates. An amount is a decision of the department and the Ministry of Finance, and none is stated here: no figure below is modelled, and none is a published figure.",
      `Each category follows from a provision of this policy, so the schedule is complete against the measures in clause ${CLAUSE.measures} and the implementation obligations in clause ${CLAUSE.implementation}.`,
      "Recurring costs are those that continue after the policy is in force; one-off costs are those that arise once, in preparing for it.",
    ],
    table: costCategoriesTable(),
  });

  /* --- 10. Monitoring, evaluation and review ----------------------------- */

  numbered.push({
    id: "monitoring",
    heading: `${CLAUSE.monitoring}. Monitoring, evaluation and review`,
    paragraphs: [
      "The policy is monitored against the department's own reference indicators, so that progress is read from one set of figures rather than several. Each indicator below carries its basis: a published figure names the body that publishes it, and a modelled figure says so.",
      `The policy shall be reviewed when ${rng.pick(REVIEW_TRIGGERS)}. The review shall compare the actual position with the baseline recorded at clause ${CLAUSE.situation}, report the comparison against the indicators below, and be published.`,
      `The department shall set the target for each indicator and name the office that collects it: ${BLANK}. Where a target is set, the review reports against it; where none is set, the review reports the movement from the baseline.`,
    ],
    table: monitoringMatrixTable(department),
  });

  /* --- 11. Transitional provisions --------------------------------------- */

  numbered.push({
    id: "transitional",
    heading: `${CLAUSE.transitional}. Transitional provisions`,
    paragraphs: [
      "Obligations that begin before the supporting systems exist are the clearest risk to implementation, so this policy starts in phases rather than on a single date.",
      `Phase one begins with ${
        reactive.length > 0
          ? listOf(reactive.map((reaction) => reaction.label))
          : "the groups the department's own offices serve directly"
      }, which are expected to support it. Phase two extends to ${
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
    heading: `${ANNEX.implementationMatrix} — Implementation matrix`,
    paragraphs: [
      `The ${run.recommendations.length} further measures, each with what it requires, who carries it, and when it is due. The office and the calendar date are the department's to state.`,
    ],
    table: recommendedStepsTable(run),
  });

  annexes.push({
    id: "annex-b",
    heading: `${ANNEX.stakeholderAnalysis} — Stakeholder analysis`,
    paragraphs: [
      "Each modelled group, the published share it stands on where one exists, its modelled position, and the engagement this policy provides for it.",
    ],
    table: stakeholderAnalysisTable(run),
  });

  // Annex C keeps the citations section's own id, so the platform's citation check reads
  // exactly the same section it always has — only the heading moved.
  annexes.push({
    ...registerCitations,
    id: "citations",
    heading: `${ANNEX.instruments} — Instruments relied on`,
  });

  // Batch B4 — the department's PUBLISHED documents first (the sources the instrument is checked
  // against), then the material the department supplied for this run. Both live in Annex D, because
  // a reader asking "what does this policy rest on?" wants both answers together, and the mandated
  // annex list is unchanged.
  const publishedLines = published.map(
    (document) =>
      `${document.title} — ${document.publisher}, ${document.date} · ${document.pages} pages · ${
        document.read
          ? `text read (${document.characters} characters)`
          : "text not read — picture-only scan"
      } · ${document.url}`,
  );

  annexes.push({
    id: "annex-documents",
    heading: `${ANNEX.documents} — Documents and data relied upon`,
    paragraphs: [
      `${department.name} holds ${published.length} published ${published.length === 1 ? "document" : "documents"} in its Document Library — its governing law, its sector policy, the parliamentary committees' reports on it and the audits of it. ${publishedRead.length} of them carry text that could be read, ${publishedCharacters} characters in all; ${
        publishedUnread === 0
          ? "none is a picture-only scan"
          : publishedUnread === 1
            ? "one is a picture-only scan, recorded by name and page count only"
            : `${publishedUnread} are picture-only scans, recorded by name and page count only`
      }. Every one is listed below with the body that published it, the date it states and the address of the published file, so a reader can check it.`,
      "These are the published sources this instrument is checked against. Nothing in this list is inferred from a filename, and nothing is presented as a published figure unless it is one.",
      ...(material.documents.length > 0
        ? [
            `The department also supplied ${material.documents.length} ${material.documents.length === 1 ? "document" : "documents"} of its own through its Document Library. ${material.read.length} of them were read — ${material.characters} characters — and a document that could not be read is listed below as recorded by name and contributes nothing, to this policy or to its preparation.`,
            ...(material.unavailable.length > 0
              ? [
                  `A document the department no longer holds in its library is listed below as "no longer held": it was supplied when the run was recorded, and it is named here so the record is not lost, but its material could not be read back for this draft.`,
                ]
              : []),
            "Only text that was really read is counted or quoted, and only a sentence that carries one of the department's stated priorities is shown beside it. Quoted wording is the department's own, recorded as it was supplied: it is not presented as a published figure, and nothing in this policy is inferred from a filename.",
          ]
        : [
            "The department supplied no document of its own for this policy, so nothing in this policy rests on departmental material beyond the submitted draft, and nothing is inferred from a document that was not read.",
            "A department adds its own reports, spreadsheets and statistics through its Document Library, and every run it makes afterwards reads them and records them here.",
          ]),
    ],
    bullets: publishedLines,
    table:
      material.documents.length > 0
        ? {
            caption: "Table 7 — The department's own documents this draft relied upon",
            columns: ["Document", "Read", "Characters", "Priority wording it carries"],
            rows: material.documents.map((document) => [
              document.name,
              document.unavailable
                ? "No longer held — recorded with the run"
                : document.text.length > 0
                  ? "Read"
                  : "Not read — recorded by name",
              String(document.characters),
              material.carried
                .filter((entry) => entry.documentName === document.name)
                .map((entry) => entry.priorityLabel)
                .join("; ") || "—",
            ]),
          }
        : undefined,
  });

  annexes.push({
    id: "annex-run-inputs",
    heading: `${ANNEX.runInputs} — Run inputs and reproducibility`,
    paragraphs: [
      "This annex records the exact inputs this policy was derived from, so that any reader can follow how it was reached. The reading is reproducible when the department, the policy text, the horizon and the assumptions are the same.",
    ],
    bullets: [
      `Department: ${department.name} (${department.abbr})`,
      `Run reference: ${run.reference} · completed ${formatInstant(run.createdAt)}`,
      `Source of the policy text: ${run.source}${run.fileNames.length > 0 ? ` · files: ${listOf(run.fileNames)}` : ""}`,
      `Policy text submitted: ${run.policyText.length} characters`,
      `Horizon: ${run.horizonLabel} (${run.horizonMonths} months)`,
      // The engine's starting code is deliberately NOT printed here. It is built from the
      // whole submitted policy text, so printing it reprinted the officer's own draft as a
      // single long machine string in the middle of the annexes. The run reference and the
      // inputs listed around it already identify the run, and the guarantee that identical
      // inputs yield an identical result is enforced by the test suite, not by prose.
      `Groups modelled: ${run.reactions.length} · priorities tested: ${run.impacts.length} · risks raised: ${run.risks.length} · steps recommended: ${run.recommendations.length}`,
      ...run.leverNotes.map((note) => `Assumption: ${note}`),
    ],
    listStyle: "bullets",
  });

  annexes.push({
    id: "annex-method",
    heading: `${ANNEX.method} — Method and limitations`,
    paragraphs: [
      DISCLAIMER.long,
      `The ${VOCABULARY.simulationCore} derived this examination from the submitted policy text, the department's real published documents, its reference indicators and its modelled stakeholder groups, using a seeded deterministic process. The same inputs always produce the same result.`,
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
    subtitle: `${department.name} · derived from ${run.reference} · recorded ${formatInstant(run.createdAt)}`,
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
      "Every abbreviation used in this policy is listed below with its expansion, and no expansion here is invented.",
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
