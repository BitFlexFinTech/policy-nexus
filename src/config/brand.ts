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

/**
 * THE PRODUCT MARK — one setting for the whole platform.
 *
 * `TRADEMARK` is the only place the symbol is written. It is "™" today: the mark is NOT yet
 * registered, and "®" would assert a registration that does not exist — a false legal
 * statement. When a certificate issues, changing this one character changes every page, every
 * footer, every generated document and the browser title; nothing else is edited, and the
 * guard in `scripts/validate.mjs` (which asks only that the name is followed by the
 * CONFIGURED mark) keeps working without being touched.
 *
 * The name is COMPOSED here and nowhere else. "Nzwisiso" alone must never reach a reader: the
 * Government's own National AI Strategy names a flagship campaign "Nzwisiso.ai", and a bare
 * mention would read as though this platform were that campaign (see PROJECT_STATUS.md).
 */
export const TRADEMARK = "™";
const NAME_BASE = "Nzwisiso";
const NAME_SUFFIX = "AI";
/** The product name, with its mark. */
export const NAME = `${NAME_BASE} ${NAME_SUFFIX}${TRADEMARK}`;
/** The wordmark split for the two-colour mastheads, so they cannot disagree with the name. */
export const WORDMARK = { base: NAME_BASE, suffix: `${NAME_SUFFIX}${TRADEMARK}` } as const;
/** The process label, used on the landing page and as the pipeline's screen-reader label. */
export const PROCESS_LABEL = `The ${NAME} process`;

/**
 * THE GOVERNMENT INITIATIVE THIS PLATFORM SUPPORTS — named once, cited once.
 *
 * "Nzwisiso.ai" is the Ministry's own campaign: the National AI Strategy 2026–2030 names it as
 * one of five flagship initiatives, a public campaign "to make AI understandable, relevant and
 * trusted through practical demonstrations" (p.43). This platform is NOT that campaign and
 * holds no endorsement from it — it is the internal counterpart, the workspace where officials
 * put the same technology to work on their own department's policies. Every screen that states
 * the relationship reads the sentences below, so the claim and its boundary cannot drift apart.
 */
export const SUPPORTED_INITIATIVE = {
  /** The campaign, spelled as the Government spells it. */
  campaign: "Nzwisiso.ai",
  /** The campaign's own stated purpose, in its own words. */
  campaignPurpose:
    "to make AI understandable, relevant and trusted through practical demonstrations",
  /** The published strategy the campaign belongs to. */
  strategy: "Zimbabwe National Artificial Intelligence Strategy 2026–2030",
  /** Who publishes it. */
  strategyPublisher:
    "Ministry of Information Communication Technology, Postal and Courier Services",
  /** Where a reader can check the campaign's own wording. */
  citation:
    "Zimbabwe National Artificial Intelligence Strategy 2026–2030, p.43 (flagship initiatives)",
  /** The relationship, stated as a proposal rather than as a fact about the Ministry. */
  relationship:
    `An internal service supporting ${"Nzwisiso.ai"}. The campaign builds public understanding; ` +
    `this workspace is where officials put the same technology to work on their own department's policies.`,
  /** The boundary, printed wherever the relationship is printed. */
  boundary: "Not part of Nzwisiso.ai, and no endorsement from it is held.",
} as const;

/**
 * WHO THE SERVICE IS FOR, AND WHERE THE DATA GOES — the two facts an official needs first, in
 * one place. The address is printed WITHOUT a scheme and is never a link: it does not resolve
 * yet (checked), and a dead link in front of an official is worse than plain text. The platform
 * makes no external AI call of any kind, which is what makes the data path statement true.
 */
export const SERVICE_POSITION = {
  /** Who may use it. */
  audience: "For use by Government of Zimbabwe officials.",
  /** The address proposed to the Ministry, spelled as proposed. */
  proposedAddress: "policy.nwisiso.gov",
  /** Its status, which must be printed beside it wherever it appears. */
  addressStatus: "proposed — not yet live; subject to assignment by the Ministry (GISP)",
  /** Where a policy draft goes — nowhere. */
  dataPath:
    "No policy text is sent to any external AI service — no Claude, no ChatGPT, no cloud model of any kind. " +
    "The assessment is produced by a deterministic engine running in the browser, and nothing is uploaded.",
  /** What the proposal asks for instead. */
  hosting:
    "The proposal is that the service be hosted on the Ministry's own infrastructure, so that no data " +
    "leaves national custody at any point.",
} as const;

export const BRAND = {
  /** Short product name used in the header bar and document headers. */
  name: NAME,
  /** Full product name used on the homepage, the browser title, and reports. */
  productName: `${NAME} Policy Dashboard`,
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
  /** The primary supporting statement on the public landing page — the subheading. */
  summary: "Explore potential policy responses before implementation.",
  /** The longer description: what the platform provides, in the hero and the meta description. */
  description:
    `${NAME} provides government institutions with a controlled AI-assisted environment to ` +
    "explore potential stakeholder responses, identify areas of risk and examine policy scenarios " +
    "before implementation.",
  /** How the initiative is labelled while it is still a proposal. */
  proposalLabel: "A proposed national digital innovation initiative",
  /** What the proposed capability is, in one sentence. */
  initiativeDescription:
    "A proposed government capability for applying artificial intelligence and controlled simulation " +
    "to policy assessment and decision support.",
  /** The minister championing the initiative. */
  ministerialChampion: "Hon. Tatenda A. Mavetera, MP",
  /** The platform credit line. Rendered twice: in the authority line that opens
   *  the page, and under the hero heading. */
  poweredBy: `Powered by ${NAME}`,
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
 * The project promoter — the company bringing this initiative forward. It is rendered
 * as ONE small line in both footers (the public shell and the workspace), derived from
 * the parts below, so the credit is never retyped in a page and the parts cannot drift.
 *
 * Wording rule: Oreida Pvt Ltd is the PROMOTER. It is not a government body, it does
 * not own the platform, and it holds no appointment to supply or operate it — the words
 * "supplier", "operator" or "appointed by Government" must never be used for it here.
 * Whether a private company supplies or manages Government infrastructure is a
 * procurement matter (Public Procurement and Disposal of Public Assets Act
 * [Chapter 22:23]), which is recorded in PROJECT_STATUS.md and is not this line's job.
 */
const PROMOTER_NAME = "Oreida Pvt Ltd";
const PROMOTER_BUSINESS_LEAD = "Edmore Zviitwah";
const PROMOTER_TECHNICAL_LEAD = "Tadii Tendayi";

export const PROMOTER = {
  name: PROMOTER_NAME,
  role: "Project promoter",
  businessLead: PROMOTER_BUSINESS_LEAD,
  technicalLead: PROMOTER_TECHNICAL_LEAD,
  /** The one line both footers render. */
  line:
    `Project promoter: ${PROMOTER_NAME} · ${PROMOTER_BUSINESS_LEAD} (Business Lead) · ` +
    `${PROMOTER_TECHNICAL_LEAD} (Technical Lead)`,
} as const;

/**
 * User-visible engine vocabulary. Vendor and implementation names must never
 * reach the interface — these are the only words the interface may use.
 */
export const VOCABULARY = {
  simulationCore: `${NAME} simulation core`,
  knowledgeMap: `${NAME} knowledge map`,
  agentMemory: `${NAME} agent memory`,
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
    `This assessment was produced by the ${BRAND.productName} from the policy text ` +
    "supplied and the department's reference indicators. It describes a simulated " +
    "range of stakeholder responses under stated assumptions. It is prepared for decision " +
    "support and is not a definitive forecast of public opinion, market outcomes, or " +
    "administrative results. Figures are indicative and must be read together with the " +
    "methodology and limitations note in the reference section.",
} as const;

/**
 * The sovereignty statement — the public footer, the workspace footer and every
 * generated document all read this one string. It states the COMPUTE PATH, which
 * is true today: the simulation runs inside the reader's own browser, contacts no
 * external service and uploads nothing. It deliberately makes no claim about which
 * infrastructure serves the page, because that is a deployment fact the platform
 * cannot know from where it runs. (It made a hosting claim until 2026-09-29 — that
 * the simulation ran inside national Government infrastructure — which was not
 * true of the address the demonstration is served from.)
 */
export const SOVEREIGNTY_STATEMENT =
  "Sovereign data architecture — every simulation is computed locally in your browser. " +
  "No policy text or result leaves it.";

/**
 * The governance position. The wording is fixed by the initiative's brief and must
 * not be softened: the platform supports human judgement and does not make
 * decisions. `humanJudgement` is asserted verbatim by the landing test, and no page
 * may claim otherwise.
 */
export const GOVERNANCE = {
  /** What the platform is for. */
  lens:
    `${NAME} is designed to help government institutions examine proposed policies through ` +
    "controlled AI-assisted simulation before implementation — the internal counterpart to the " +
    "Nzwisiso.ai campaign's practical demonstrations.",
  /** Who decides. This sentence is the point. */
  humanJudgement:
    "The platform does not replace policymakers or determine policy outcomes. It provides an " +
    "additional analytical lens to support informed human judgement.",
} as const;

/**
 * The engine explanation — what Nzwisiso does with a policy draft, in the words the
 * initiative's brief fixes. It exists because "upload a policy, receive an answer"
 * is the wrong mental model: the point of the section is that one draft opens a
 * knowledge map, a simulated population of thousands of interacting agents, and only
 * then a structured assessment. `body` and `transition` are the brief's sentences
 * verbatim and are asserted word for word by the landing tests.
 *
 * The register is deliberately plain — no implementation vocabulary, and no claim
 * that the simulation predicts outcomes.
 */
export const ENGINE_EXPLANATION = {
  /** The section heading on the public landing page. */
  heading: "What happens behind the assessment",
  /** The supporting statement under it. */
  statement: "One policy draft can generate a much larger analytical environment.",
  /** What the system does with the draft, step by step, in plain language. */
  body:
    `When a policy is submitted, ${NAME} moves beyond a single AI response. The system ` +
    "constructs a structured representation of the policy, identifies relevant entities and " +
    "relationships, creates a simulated population of thousands of interacting agents, and " +
    "examines how different stakeholder perspectives may respond within the scenario.",
  /** The hand-over to the officer's side of the process — "How it works". */
  transition:
    "From the officer's perspective, the process remains simple: provide the policy, run the " +
    "assessment and review the findings.",
} as const;

export type Brand = typeof BRAND;
export type Vocabulary = typeof VOCABULARY;
