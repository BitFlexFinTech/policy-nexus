/**
 * THE DRAFTING CONCERN — prompt, grounding, citation verification and provenance.
 *
 * AB-4. The drafted policy is produced either by the local deterministic generator
 * (the mock) or by a configured drafting service. Both paths use the same prompt
 * library, the same grounding, the same citation rules and the same provenance
 * record, so which implementation is active cannot change what a reader is told
 * about where the draft came from (see .clinerules/02-mock-first-policy.md).
 *
 * This module imports NOTHING from `assessment/documents.ts` — the generator imports
 * this, never the other way round — so there is no import cycle and the verification
 * can be applied to any document, including one a service returned.
 *
 * DETERMINISM: every function here is pure. No clock, no randomness, no network.
 */

import type { Department, DepartmentId, DepartmentIndicator } from "@/config/departments";
import { draftingPromptFor, type DraftingPrompt } from "@/config/draftingPrompts";
import {
  CITED_INSTRUMENTS,
  citedInstrumentLabel,
  getCitedInstrument,
  type CitedInstrumentId,
} from "@/config/instruments";
import {
  getStakeholderSegment,
  MODELLED_SHARE_LABEL,
  REFERENCE_DATE_LABEL,
  type StakeholderSegmentId,
} from "@/config/reference";
import type { AssessmentRun, GeneratedDocument, GeneratedSection } from "@/services/assessment/types";
import { CITATIONS_ANNEX } from "@/services/assessment/documentStructure";

/* ------------------------------------------------------------------------- */
/* Grounding — the real evidence a draft rests on                              */
/* ------------------------------------------------------------------------- */

export interface GroundingGroup {
  id: StakeholderSegmentId;
  label: string;
  /** A published share with its base, or the modelled word. Never a guess. */
  share: string;
  /** Where the share came from. */
  source: string;
}

export interface GroundingInstrument {
  id: CitedInstrumentId;
  /** The citation exactly as the table records it. */
  citation: string;
  source: string;
}

/**
 * Everything a draft is allowed to rest on, assembled from the department's own
 * authored configuration. The same object is handed to the local generator and to a
 * configured service, so neither can be given evidence the other is not.
 */
export interface DraftingGrounding {
  departmentId: DepartmentId;
  departmentName: string;
  departmentAbbr: string;
  reference: string;
  seed: string;
  referenceDate: string;
  policyTitle: string;
  policyText: string;
  horizonLabel: string;
  indicators: readonly DepartmentIndicator[];
  groups: readonly GroundingGroup[];
  instruments: readonly GroundingInstrument[];
  prompt: DraftingPrompt;
}

/** One group as grounding states it: a published share with its base, or the modelled word. */
export const groundGroup = (id: StakeholderSegmentId): GroundingGroup => {
  const segment = getStakeholderSegment(id);
  return {
    id,
    label: segment.label,
    share:
      segment.share === null ? MODELLED_SHARE_LABEL : `${segment.share}% of ${segment.shareBase}`,
    source: segment.shareSource,
  };
};

export const buildDraftingGrounding = (
  run: AssessmentRun,
  department: Department,
): DraftingGrounding => ({
  departmentId: department.id,
  departmentName: department.name,
  departmentAbbr: department.abbr,
  reference: run.reference,
  seed: run.seed,
  referenceDate: REFERENCE_DATE_LABEL,
  policyTitle: run.policyTitle,
  policyText: run.policyText,
  horizonLabel: run.horizonLabel,
  indicators: department.indicators,
  groups: department.segments.map(groundGroup),
  instruments: department.instruments.map((id) => {
    const instrument = getCitedInstrument(id);
    return { id, citation: citedInstrumentLabel(id), source: instrument.source };
  }),
  prompt: draftingPromptFor(department),
});

/* ------------------------------------------------------------------------- */
/* Citations — the section, and the independent check                          */
/* ------------------------------------------------------------------------- */

/**
 * The citations clause of a drafted policy. Every entry is DERIVED from the
 * department's own register and read out of the cited-instrument table, so a title
 * and its chapter can never be typed twice. The local generator emits exactly this
 * section, and a test holds it to the table.
 */
export const citationsSectionFor = (department: Department): GeneratedSection => ({
  id: "citations",
  heading: "8. Citations",
  paragraphs: [
    "This draft rests on the instruments below. Each is drawn from the department's own instrument register and is stated exactly as the platform's cited-instrument table records it; no instrument is named here that the register does not contain.",
    `A figure in this draft is either a published figure with its source stated, or the word ${MODELLED_SHARE_LABEL}. A modelled figure is never presented as a published one.`,
  ],
  bullets: department.instruments.map((id) => {
    const instrument = getCitedInstrument(id);
    return `${citedInstrumentLabel(id)} — ${instrument.source}`;
  }),
  listStyle: "clauses",
});

/** The document as one searchable string. Local to this module, so nothing here imports the generator. */
export const documentScanText = (document: GeneratedDocument): string =>
  document.sections
    .map((section) => [section.heading, ...section.paragraphs, ...(section.bullets ?? [])].join("\n"))
    .join("\n");

export interface CitationVerification {
  /** The citations the document lists, in the order it lists them. */
  citations: string[];
  /** Citations that are NOT in the department's register. Empty means none were invented. */
  unknown: string[];
  /** Instrument titles found in the text that belong to another department's register. */
  outsideRegister: string[];
  /** Chapter markers in the text that no known citation carries. */
  strayChapters: string[];
}

export const isCitationVerified = (verification: CitationVerification): boolean =>
  verification.unknown.length === 0 &&
  verification.outsideRegister.length === 0 &&
  verification.strayChapters.length === 0;

const CHAPTER_PATTERN = /\[Chapter [^\]]+\]/g;

/**
 * The independent check the platform applies to any drafted policy, whoever wrote it:
 * every listed citation must be in the department's register, no chapter may appear
 * that no known citation carries, and no instrument from the wider table may be named
 * that this department's register does not hold. Fail-closed: anything unlisted is
 * reported, never ignored.
 */
export const verifyDocumentCitations = (
  document: GeneratedDocument,
  department: Department,
): CitationVerification => {
  const allowed = department.instruments.map((id) => citedInstrumentLabel(id));
  const allowedSet = new Set(allowed);
  const text = documentScanText(document);

  const citations = (document.sections.find((section) => section.id === "citations")?.bullets ?? [])
    .map((bullet) => bullet.split(" — ")[0].trim())
    .filter((citation) => citation.length > 0);

  const unknown = citations.filter((citation) => !allowedSet.has(citation));

  const strayChapters = (text.match(CHAPTER_PATTERN) ?? []).filter(
    (marker) => !allowed.some((citation) => citation.includes(marker)),
  );

  // An instrument from the wider table counts as "outside the register" only where one of
  // this department's allowed citations does not already cover the words. Without this,
  // "Education Act" would be reported against a department that only holds "Zimbabwe
  // Council for Higher Education Act", because the shorter title sits inside the longer one.
  const residue = allowed.reduce((carry, citation) => carry.split(citation).join(" "), text);
  const outsideRegister = CITED_INSTRUMENTS.map((instrument) => citedInstrumentLabel(instrument.id))
    .filter((citation) => !allowedSet.has(citation) && residue.includes(citation));

  return { citations, unknown, outsideRegister, strayChapters };
};

/**
 * The generator's own guard: a draft whose citations cannot be verified is not
 * returned at all. This can only fire if the generator is edited to name an
 * instrument the register does not hold, which is exactly when it must fire.
 */
export const assertCitationsVerified = (
  document: GeneratedDocument,
  department: Department,
): CitationVerification => {
  const verification = verifyDocumentCitations(document, department);
  if (!isCitationVerified(verification)) {
    throw new Error(
      `Drafted policy names unverified citations: ${[
        ...verification.unknown,
        ...verification.outsideRegister,
        ...verification.strayChapters,
      ].join(", ")}`,
    );
  }
  return verification;
};

/* ------------------------------------------------------------------------- */
/* Provenance — what produced this draft, and from what                        */
/* ------------------------------------------------------------------------- */

export type DraftingProducer = "local-generator" | "configured-service";

export interface DraftingSource {
  producer: DraftingProducer;
  /** The configured model name. Only meaningful for a configured service. */
  model?: string;
}

export interface DraftingProvenance {
  producer: DraftingProducer;
  model: string | null;
  departmentName: string;
  reference: string;
  seed: string;
  referenceDate: string;
  groupsModelled: number;
  indicatorsUsed: number;
  instrumentsCited: number;
  citationsVerified: boolean;
}

export const buildDraftingProvenance = (
  run: AssessmentRun,
  department: Department,
  verification: CitationVerification,
  source: DraftingSource = { producer: "local-generator" },
): DraftingProvenance => ({
  producer: source.producer,
  model: source.producer === "configured-service" ? (source.model ?? "unnamed model") : null,
  departmentName: department.name,
  reference: run.reference,
  seed: run.seed,
  referenceDate: REFERENCE_DATE_LABEL,
  groupsModelled: department.segments.length,
  indicatorsUsed: department.indicators.length,
  instrumentsCited: verification.citations.length,
  citationsVerified: isCitationVerified(verification),
});

/**
 * The provenance in the plain sentences the drafted policy carries in its closing note.
 * Stated in the document as well as on the screen, so an exported file still says where
 * it came from.
 */
export const provenanceParagraphs = (
  run: AssessmentRun,
  department: Department,
  verification: CitationVerification,
): string[] => [
  `Provenance: this draft was produced from simulation ${run.reference} on ${REFERENCE_DATE_LABEL}, seeded "${run.seed}", grounded in the ${department.indicators.length} reference indicators of ${department.shortName} and the modelled positions of the ${department.segments.length} groups it models.`,
  `Citations: ${verification.citations.length} instrument(s) are listed in ${CITATIONS_ANNEX}. Every one was checked against the platform's cited-instrument table; ${verification.unknown.length + verification.outsideRegister.length + verification.strayChapters.length} could not be verified.`,
];
