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
  /**
   * Where a policy draft goes — nowhere.
   *
   * The "leverages the platform's API layer" clause is the owner's own wording, given
   * directly on 2026-09-29, and it is true: the deterministic engine sits behind an
   * API-shaped seam (`AssessmentService`, and the `drafting` capability's endpoint), which is
   * exactly what makes the local engine and a Ministry-hosted service interchangeable without
   * touching a screen. It is the ONE place in officer-facing copy where the word "API" is
   * permitted; `npm run validate` fails if it appears anywhere else.
   */
  dataPath:
    "No policy text is sent to any external AI service — no Claude, no ChatGPT, no cloud model of any kind. " +
    "The assessment is produced by a deterministic engine running in the browser and " +
    "leverages the platform's API layer, and nothing is uploaded.",
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
   *
   * 2026-10-02: the owner corrected this line — the commissioning ministry is the
   * **Ministry of ICT** (short form), not "Ministry of IT". The full statutory name is
   * `entityCustodian` above; this line carries the short form the owner asked for.
   */
  attribution: "A Project by the Ministry of ICT",
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
  /**
   * The copyright line, rendered centred in every footer (owner's item 2, 2026-10-07). Written in
   * ONE place so the year and the entity can never drift apart. It matches Government house style —
   * the Ministry of ICT's own footer reads "© 2025 Ministry of ICT, Postal & Courier Services. All
   * rights reserved."
   */
  copyright: `© 2026 ${PROMOTER_NAME}. All rights reserved.`,
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
 * THE NATIONAL AI STRATEGY — the Government's own plan, named once and cited once.
 *
 * The owner's direction (2026-10-07): the new platform homepage tells the national story, and every
 * national claim must carry its body, publication and period on screen. Nothing here is invented —
 * the strategy name, its priority sectors and the "Nzwisiso.ai" campaign are what the strategy
 * itself states (campaign named p.43; see `SUPPORTED_INITIATIVE` above for the citation).
 */
export const AI_STRATEGY = {
  name: "Zimbabwe National Artificial Intelligence Strategy 2026–2030",
  publisher: "Ministry of Information Communication Technology, Postal and Courier Services",
  /** The sectors the strategy names as priorities, in the order it lists them. */
  prioritySectors: ["Healthcare", "Agriculture", "Education", "Financial inclusion"] as const,
  /** The strategy's own flagship public campaign, in its own words. */
  campaign: "Nzwisiso.ai",
  campaignNote:
    "The strategy names a flagship public campaign, Nzwisiso.ai, to make AI understandable, " +
    "relevant and trusted through practical demonstrations.",
} as const;

/**
 * THE PLATFORM HOMEPAGE COPY (owner's item 1, 2026-10-07). The national framing, kept here so it has
 * one home and the page holds no copy of its own. Every national line reads a sourced fact; the two
 * tools and their shared rules are reused from `GOVERNMENT_PAGE` in `src/config/research.ts`, so the
 * homepage and the "Built for Government" page can never disagree.
 */
export const PLATFORM_HOME = {
  eyebrow: "Government of Zimbabwe · Policy intelligence",
  heading: "Policy intelligence for Zimbabwe's 2030 goals",
  standfirst:
    `${NAME} brings two AI assistants to Government's policy work. One tests a draft policy ` +
    "against the groups it reaches, before it is implemented. The other carries the evidence " +
    "behind it. Together they move a policy from research to decision.",
  /** The two national commitments the platform is built to serve, each with its source. */
  commitments: [
    {
      label: "Full digitalisation by 2030",
      body: "Government's commitment to bring public services fully online by 2030, alongside Vision 2030 — an upper-middle-income economy by 2030.",
      source: "Zimbabwe National Artificial Intelligence Strategy 2026–2030; Government of Zimbabwe.",
    },
    {
      label: "A connected knowledge-based society",
      body: "The Ministry's own vision for 2030, in its own words: a connected knowledge-based society with secure information systems.",
      source: "Ministry of ICT, Postal and Courier Services (ictministry.gov.zw).",
    },
  ],
  /** The Ministry's published documents the platform aligns with. */
  documents: [
    "Zimbabwe National Policy for ICT 2022–2027",
    "Cyber and Data Protection Act (Chapter 12:07)",
    "National Broadband Plan 2023–2030",
  ],
  /** The doors and how they label themselves. */
  tools: {
    heading: "Choose a service",
    simulation: {
      name: `${NAME} Policy Simulation Assistant`,
      role: "Test a draft policy against the groups it reaches, before it is implemented.",
      door: "Open the policy simulation",
      to: "/simulation",
    },
    research: {
      name: "ZEPARI Policy Research Assistant",
      role: "The evidence behind a policy, from ZEPARI's own research.",
      door: "Enter the research assistant",
      to: "/research",
    },
  },
  togetherHeading: "How they work together",
} as const;

/**
 * THE STATUS BAND the public pages wear: what this service is. Composed ONCE here (the department
 * side's wording) because `PublicPageShell` renders it on the platform home page and on the policy
 * tool's page. The ZEPARI research pages carry their OWN band with their OWN wording
 * (`RESEARCH_SERVICE_NOTICE` in `src/config/research.ts`): the simulation sentence below would be
 * FALSE on the research side — that assistant answers from ZEPARI's own library and models nothing —
 * which is why the two are separate, and why `npm run validate` (check 45) fails if they are swapped.
 */
export const SERVICE_NOTICE = {
  badge: "Internal service",
  body:
    `Decision support for ${BRAND.entity} ministries, departments and agencies. Simulation results ` +
    "are modelled, and are labelled as simulated wherever they appear.",
} as const;

/**
 * THE CONFIDENTIALITY STATEMENT for the POLICY side (owner's instruction, 2026-10-07).
 *
 * The owner dictated both sentences word for word, so they are kept here in ONE place and drawn by
 * both pages — they cannot drift apart, and they cannot be swapped: the policy SIMULATOR's says
 * "policy draft"; the HOME page's says "documents" generally, because that page is the door to both
 * assistants. `npm run validate` (check 47) fails the build if either page loses its card or if the
 * two wordings are exchanged.
 *
 * Both are built from the two single sources of truth — `PROMOTER.name` for the company, `NAME` for
 * the product (which already carries the ™ the owner asked to keep) — so the names can never be
 * written a second way.
 */
const CONFIDENTIALITY_TAIL =
  "As administrators we manage only live support, the servers and the connections between services — " +
  `never the documents. ${NAME}'s data is stored on the servers managed by ${PROMOTER.name}.`;

export const CONFIDENTIALITY = {
  heading: "Confidentiality",
  /** On the policy-simulation landing page (`/simulation`) — about a policy draft. */
  simulator: `${PROMOTER.name} cannot read any policy draft. ${CONFIDENTIALITY_TAIL}`,
  /** On the platform home page (`/`) — the door to both assistants, so about documents generally. */
  home: `${PROMOTER.name} cannot read any documents. ${CONFIDENTIALITY_TAIL}`,
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
 * THE MINISTER-FACING LINE — the owner's locked item 6.
 *
 * ONE honest sentence, shown on the public landing page where a Minister or senior leader first
 * meets the platform: the assessment is only as good as the real information a department provides,
 * and the department provides it through its Document Library (the place it keeps its own reports,
 * spreadsheets and statistics for the engine to read). The owner approved this EXACT wording on
 * 2026-10-06; changing the sentence needs the owner's approval again, like every public statement
 * in this file.
 */
export const MINISTER_STATEMENT =
  "These findings are only as reliable as the real information a department provides: its own " +
  "reports, spreadsheets and statistics, kept in its Document Library, are what make its policy " +
  "examination grounded.";

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
