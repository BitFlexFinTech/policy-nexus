/**
 * SINGLE SOURCE OF TRUTH — the ZEPARI research assistant's identity and its two named researchers.
 *
 * The owner's decision (2026-10-06): the platform carries TWO products in one place — the
 * Nzwisiso policy-simulation assistant (departments) and the ZEPARI policy-research assistant.
 * This file is the ONE home for the research product's name, the confidentiality statement, the
 * AI-usage statement, the boundary between the two products, and the two researchers who enter it
 * in this demonstration.
 *
 * NO product mark is carried: the owner's instruction is that this demonstration uses the ZEPARI
 * name plainly, so ZEPARI can see it, and the registered mark is not asserted. See PROJECT_STATUS.md.
 *
 * DETERMINISM: plain authored data. No clock, no randomness.
 */

import { PROMOTER } from "@/config/brand";

/** The research product's name — plain, no registered mark (owner's decision). */
export const RESEARCH_NAME = "ZEPARI Policy Research Assistant";

/** The institute whose work the assistant supports. */
export const RESEARCH_INSTITUTION =
  "Zimbabwe Economic Policy Analysis and Research Institute (ZEPARI)";

/** What the research assistant is for, in one line. */
export const RESEARCH_PURPOSE =
  "Research and policy analysis for ZEPARI's own evidence-based policy work.";

/**
 * THE CONFIDENTIALITY STATEMENT (owner's decision 3), stated plainly on the page: the platform's
 * administrators cannot read any research.
 */
export const RESEARCH_CONFIDENTIALITY = {
  heading: "Confidentiality",
  body:
    `${PROMOTER.name} cannot read any research. As administrators we manage only live support, the ` +
    "servers and the connections between services — never the documents. ZEPARI's research data is " +
    "stored on the servers ZEPARI holds.",
} as const;

/** Who pays for the AI usage (owner's decision 4). */
export const RESEARCH_BILLING =
  `${PROMOTER.name}'s monthly fee covers the AI usage — ZEPARI is not billed per token.`;

/**
 * THE STRICT RULE (owner's decision 5): the research side never feeds a figure into the
 * deterministic simulation engine. Stated so a reader can hold the two products apart.
 */
export const RESEARCH_BOUNDARY =
  "The research assistant and the policy-simulation engine are kept apart: no figure from the " +
  "research side is ever fed into the simulation engine.";

export interface Researcher {
  id: string;
  name: string;
  role: string;
}

/**
 * The two researchers who enter the research assistant in this demonstration, in this order. Their
 * names and roles are given as the owner stated them (2026-10-06).
 */
export const RESEARCHERS: readonly Researcher[] = [
  {
    id: "chigumira",
    name: "Dr. Gibson Chigumira",
    role: "Executive Director, ZEPARI",
  },
  {
    id: "chipika",
    name: "Dr. Jesimen Chipika",
    role: "Deputy Governor, Reserve Bank of Zimbabwe; Chairperson, ZEPARI Board of Trustees",
  },
];

/** Look-up helper so callers never index the list by position. */
export const getResearcher = (id: string): Researcher | undefined =>
  RESEARCHERS.find((researcher) => researcher.id === id);

/** True when a string names one of the two researchers. */
export const isResearcherId = (id: string): boolean => getResearcher(id) !== undefined;

/**
 * The parts the research assistant will hold, in the order the owner listed them (2026-10-06). Each
 * is shown on the workspace home with its honest status, so nothing is implied to be built before it
 * is. `built` flips to true as each part lands in a later batch.
 */
export interface ResearchPart {
  id: string;
  label: string;
  note: string;
  built: boolean;
}

export const RESEARCH_PARTS: readonly ResearchPart[] = [
  {
    id: "library",
    label: "Research library",
    note: "ZEPARI's own research documents, kept on the servers ZEPARI holds.",
    built: true,
  },
  {
    id: "connectors",
    label: "Institution data connectors",
    note: "Read figures from the institute's own data sources.",
    built: false,
  },
  {
    id: "chat",
    label: "Grounded research chat",
    note: "Ask a question answered from the research library, with its sources shown.",
    built: false,
  },
  {
    id: "brief",
    label: "Policy brief",
    note: "A short brief drafted from the research.",
    built: false,
  },
  {
    id: "barometer",
    label: "Economic Barometer",
    note: "The institute's own economic indicators, tracked over time.",
    built: false,
  },
  {
    id: "findings",
    label: "Findings to departments",
    note: "Route findings to the departments they concern.",
    built: false,
  },
];