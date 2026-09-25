/**
 * SINGLE SOURCE OF TRUTH — product identity.
 *
 * No component may hardcode the product name, entity, tagline, disclaimer, or
 * user-visible engine vocabulary. Everything user-facing reads from here.
 * (see .clinerules/03-single-source-of-truth.md)
 */

export const BRAND = {
  /** Short product name used in the header bar and document headers. */
  name: "Nzwisiso AI",
  /** Full product name used on the homepage, the browser title, and reports. */
  productName: "Nzwisiso AI Policy Dashboard",
  /** Accountable entity shown in the footer of every generated document. */
  entity: "Government of Zimbabwe",
  /** Issuing ministry for the sovereign compute statement. */
  entityCustodian: "Ministry of Information Communication Technology, Postal and Courier Services",
  tagline: "Understanding before action.",
  /** Short description used for the homepage sub-heading and meta description. */
  summary:
    "A national policy simulation workspace for Zimbabwe's ministries, departments and agencies.",
  /** Section label for the workspace, shown on the homepage. */
  workspaceLabel: "National policy simulation workspace",
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
