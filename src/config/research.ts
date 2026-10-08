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

import { NAME, PROMOTER, SERVICE_NOTICE } from "@/config/brand";

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

/**
 * THE ZEPARI STATUS BAND (owner's instruction, 2026-10-07): the ZEPARI landing page was the only
 * landing page without the status band the others wear, so it now carries one, worded for the
 * RESEARCH product rather than copied from the department side.
 *
 * It must NOT carry the department band's simulation sentence — this assistant models nothing, it
 * answers from ZEPARI's own library — so the two wordings are kept apart and a build check fails if
 * they are ever swapped. Both claims below are already recorded facts of this product: the research
 * chat is grounded in the library and never fabricates an answer, and the Economic Barometer names
 * the body that published every figure.
 *
 * There is deliberately NO fiscal-year line here: the department side's figures share one fixed
 * frame, while ZEPARI's figures each carry their own period and their own named publisher, so
 * printing a single fiscal year would imply a shared frame that does not exist.
 */
export const RESEARCH_SERVICE_NOTICE = {
  badge: SERVICE_NOTICE.badge,
  body:
    "Decision support for ZEPARI's research and policy analysis. Answers come only from the " +
    "documents in the research library, and every figure names the body that published it.",
} as const;

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
    built: true,
  },
  {
    id: "chat",
    label: "Grounded research chat",
    note: "Ask a question answered from the research library, with its sources shown.",
    built: true,
  },
  {
    id: "brief",
    label: "Policy brief",
    note: "A short brief drafted from the research.",
    built: true,
  },
  {
    id: "barometer",
    label: "Economic Barometer",
    note: "The institute's own economic indicators, tracked over time.",
    built: true,
  },
  {
    id: "findings",
    label: "Findings to departments",
    note: "Route findings to the departments they concern.",
    built: true,
  },
];

/**
 * The sections every research brief carries, in order (ZEPARI Batch F). Fixed here so the brief's
 * shape has one home, and a reader can see the structure even before a model drafts the words.
 */
export const RESEARCH_BRIEF_SECTIONS: readonly string[] = [
  "Purpose",
  "Context",
  "Key findings",
  "Recommendations",
];

/**
 * THE LANDING DIRECTION (ZEPARI build plan, §2). The words the research product's own landing page
 * leads with — the headline, the standfirst, the four moves and the trust lines — kept here so they
 * have one home and a screen never holds its own copy.
 */
export const RESEARCH_HEADLINE = "Zimbabwe's economic evidence — from question to policy.";

export const RESEARCH_STANDFIRST =
  "The ZEPARI Policy Research Assistant turns the institute's own evidence into answers, briefs and " +
  "publications — and puts them in front of the people who make policy. One dashboard, from the " +
  "first question to lasting impact.";

/** The four moves a researcher makes, in order — a real sequence, so it is shown numbered. */
export const RESEARCH_LOOP: readonly string[] = ["Ask", "Draft", "Publish", "Reach"];

/** The three trust lines, stated plainly (the confidentiality promise and the billing line reused). */
export const RESEARCH_TRUST: readonly string[] = [
  `${PROMOTER.name} cannot read any research.`,
  RESEARCH_BILLING,
  RESEARCH_BOUNDARY,
];

/**
 * THE "BUILT FOR GOVERNMENT" PAGE (ZEPARI build plan, §3). Every fact here is drawn from the Ministry
 * of ICT's own published material (verified 2026-10-07), so nothing is invented.
 */
export const GOVERNMENT_PAGE = {
  eyebrow: "Built for Government",
  hero: "From evidence to decision — one platform for Zimbabwe's policy work.",
  standfirst:
    `The ${NAME} Policy Simulation Assistant lets a department test a draft policy before it is ` +
    "implemented. The ZEPARI Research Assistant provides the evidence behind it. Together they carry " +
    "a policy from research to decision — in step with Vision 2030 and the Ministry's own vision of " +
    "a connected, knowledge-based society with secure information systems by 2030.",
  ministryVision: "A connected knowledge-based society with secure information systems by 2030.",
  ministryVisionBy: "Republic of Zimbabwe, Ministry of ICT, Postal and Courier Services",
  assistants: [
    { name: `${NAME} Policy Simulation Assistant`, role: "Test a draft policy before it is implemented." },
    { name: "ZEPARI Policy Research Assistant", role: "The evidence behind the policy." },
  ],
  together: [
    "Evidence reaches the policy desk.",
    "The policy desk can ask the evidence desk.",
    "Private by design.",
  ],
  rules: [
    "Each side keeps control of its own data.",
    "Only the minimum is shared.",
    "Shared items are for a person to read, never for the machine.",
    "Every item keeps its source.",
    "A record is kept of what was shared, to whom and when.",
  ],
  alignment: [
    "Vision 2030 — an upper-middle-income economy by 2030.",
    "The Ministry's vision — a connected knowledge-based society with secure information systems by 2030.",
    "National ICT Policy 2022–2027.",
    "Cyber and Data Protection Act (Chapter 12:07).",
    "The Zimbabwe National AI Strategy.",
    "Digitalize Zimbabwe.",
  ],
} as const;