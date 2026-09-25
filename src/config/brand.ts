/**
 * SINGLE SOURCE OF TRUTH — product identity.
 *
 * No component may hardcode the product name, entity, tagline, disclaimer, or
 * user-visible engine vocabulary. Everything user-facing reads from here.
 * (see .clinerules/03-single-source-of-truth.md)
 */

/**
 * The service's guiding principle. Stated ONCE here and rendered in two forms:
 * `eyebrow` (the label above the homepage heading — a label, so no full stop)
 * and `tagline` (the same words as a sentence, for document footers). One is
 * derived from the other, so the two cannot drift apart.
 */
const PRINCIPLE = "Understanding before action";

/**
 * The national initiative this dashboard delivers. The initiative is the
 * government capability; Nzwisiso AI is the technology platform that delivers
 * it. `initiativeShort` is the same name without the trailing "Initiative",
 * derived rather than retyped so the two can never disagree.
 */
const INITIATIVE = "Zimbabwe AI Policy Intelligence Initiative";

export const BRAND = {
  /** Short product name used in the header bar and document headers. */
  name: "Nzwisiso AI",
  /** Full product name used on the homepage, the browser title, and reports. */
  productName: "Nzwisiso AI Policy Dashboard",
  /** What kind of platform Nzwisiso AI is — the subtitle under the product name. */
  platformLabel: "Policy Intelligence Platform",
  /** The national initiative. The prominent heading on the public landing page. */
  initiative: INITIATIVE,
  /** Short form of the initiative name, for the masthead. */
  initiativeShort: INITIATIVE.replace(/ Initiative$/, ""),
  /** Accountable entity shown in the footer of every generated document. */
  entity: "Government of Zimbabwe",
  /** Issuing ministry for the sovereign compute statement. */
  entityCustodian: "Ministry of Information Communication Technology, Postal and Courier Services",
  /** The principle as a label above the homepage heading. */
  eyebrow: PRINCIPLE,
  /** The same principle as a sentence. */
  tagline: `${PRINCIPLE}.`,
  /** Short description used for the homepage sub-heading and meta description. */
  summary:
    "A Government of Zimbabwe initiative for AI-assisted policy intelligence. It examines how a " +
    "proposed measure would land before it is implemented, and sets out the assessment behind that " +
    "reading.",
  /**
   * Official attribution line, required on the homepage footer. The wording is
   * fixed by the commissioning ministry and must not be softened or reworded.
   */
  attribution: "A Project by the Ministry of IT",
  /**
   * Classification marking. Rendered smaller than `attribution` — the two are a
   * pair: the attribution names the owner, the classification states who may see it.
   */
  classification: "For Internal Use Only",
} as const;

/**
 * User-visible engine vocabulary. Vendor and implementation names must never
 * reach the interface — these are the only words the interface may use.
 */
export const VOCABULARY = {
  simulationCore: "Nzwisiso simulation core",
  knowledgeMap: "Nzwisiso knowledge map",
  agentMemory: "Nzwisiso agent memory",
  agentFeed: "Stakeholder agent feed",
  scenarioEngine: "Scenario engine",
} as const;

/**
 * The decision-support disclaimer. It is rendered on the executive summary, the
 * full assessment, and every exported/printed document, and is checked by
 * `npm run validate` (check 8) — the wording must not be softened.
 */
export const DISCLAIMER = {
  short: "Prepared for decision support. Not a definitive forecast.",
  long:
    "This assessment was produced by the Nzwisiso AI Policy Dashboard from the policy text " +
    "supplied and the department's published reference indicators. It describes a simulated " +
    "range of stakeholder responses under stated assumptions. It is prepared for decision " +
    "support and is not a definitive forecast of public opinion, market outcomes, or " +
    "administrative results. Figures are indicative and must be read together with the " +
    "methodology and limitations note in the reference section.",
} as const;

/** Footer statement on the sovereignty of the compute and data path. */
export const SOVEREIGNTY_STATEMENT =
  "Sovereign data architecture — every simulation is computed locally within the " +
  "Government of Zimbabwe estate. No policy text or result leaves national custody.";

export type Brand = typeof BRAND;
export type Vocabulary = typeof VOCABULARY;
