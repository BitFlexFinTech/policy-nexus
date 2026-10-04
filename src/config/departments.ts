/**
 * SINGLE SOURCE OF TRUTH — the 16 departments and all authored department
 * content.
 *
 * This is the ONLY place department identity, priorities, indicators,
 * stakeholder segments, policy templates and document registers are defined.
 * Components read from here; they never carry their own copies.
 * (see .clinerules/03-single-source-of-truth.md)
 *
 * DETERMINISM: this file is plain authored data. No clock, no randomness.
 * The same departmentId must always resolve to byte-identical content.
 */

import {
  getNamedSource,
  MODELLED_INDICATOR_LABEL,
  type NamedSourceId,
  type StakeholderSegmentId,
  type TimeHorizonId,
} from "./reference";
import { UNIVERSAL_INSTRUMENTS, type CitedInstrumentId } from "./instruments";

/** The exact, stable department identifiers. Never renumber or rename these. */
export type DepartmentId =
  | "opc"
  | "fin"
  | "agri"
  | "health"
  | "edu"
  | "hedu"
  | "ict"
  | "mines"
  | "energy"
  | "psc"
  | "lg"
  | "mfa"
  | "env"
  | "def"
  | "zimra"
  | "zida";

/** Canonical, ordered list of department ids. Drives every listing screen. */
export const DEPARTMENT_IDS: readonly DepartmentId[] = [
  "opc",
  // The Ministry of ICT stands second, immediately after the Office of the President and
  // Cabinet, because it is the custodian of this platform. The order here is the ONLY
  // place the reading order is defined; `DEPARTMENTS` below is derived from it.
  "ict",
  "fin",
  "agri",
  "health",
  "edu",
  "hedu",
  "mines",
  "energy",
  "psc",
  "lg",
  "mfa",
  "env",
  "def",
  "zimra",
  "zida",
] as const;

export type IndicatorTone = "primary" | "gold" | "success" | "warning";

/**
 * Where a department indicator comes from. A union rather than a free-text label on
 * purpose: an indicator either names the body that publishes it, the publication it
 * is taken from and the period the figure is for, or it is plainly modelled. There
 * is no third state, so a number cannot be shown with wording that reads as
 * official without being one.
 */
export type IndicatorBasis =
  | {
      kind: "published";
      /** The body that publishes the figure — a key into `NAMED_SOURCES`. */
      sourceId: NamedSourceId;
      /** The publication the figure is taken from. */
      publication: string;
      /** The period the figure is for, written as "<Month> <Year>". */
      asOf: string;
    }
  | { kind: "modelled" };

/** A reference indicator shown on the KPI strip (and its drill-down). */
export interface DepartmentIndicator {
  id: string;
  label: string;
  /** Display value, already formatted. */
  value: string;
  unit?: string;
  /** 0–100 position of the bar; presentation only, derived from the indicator. */
  score: number;
  tone: IndicatorTone;
  /**
   * One line of plain-language meaning, shown when the card is opened. It carries no
   * provenance: for a published figure the publisher, the publication and the period
   * come from `indicatorBasisLabel(basis)`, so they are stated once on the source line
   * and cannot be repeated here in different words (Phase AD R6).
   */
  note: string;
  /** Where the indicator comes from — a named publication, or plainly modelled. */
  basis: IndicatorBasis;
}

/**
 * The line shown under an indicator when its card is opened. Written once, here, so
 * the KPI strip and any other reader cannot describe the same indicator differently.
 */
export const indicatorBasisLabel = (basis: IndicatorBasis): string => {
  if (basis.kind === "modelled") return MODELLED_INDICATOR_LABEL;
  const source = getNamedSource(basis.sourceId);
  return `Published by ${source.name} — ${basis.publication}, ${basis.asOf}`;
};

/**
 * How many of a department's indicators are published figures and how many are
 * modelled. Derived, never counted by hand, so a screen cannot state a split the
 * configuration does not hold.
 */
export const countIndicatorsByBasis = (indicators: readonly DepartmentIndicator[]) =>
  indicators.reduce(
    (totals, indicator) => {
      if (indicator.basis.kind === "published") totals.published += 1;
      else totals.modelled += 1;
      return totals;
    },
    { published: 0, modelled: 0 },
  );

/** A stated departmental priority, used by the workspace and the report. */
export interface DepartmentPriority {
  id: string;
  label: string;
  note: string;
}

/** A ready-made policy draft offered as a preset chip for this department. */
export interface PolicyTemplate {
  id: string;
  title: string;
  /** One-line description shown on the preset chip. */
  summary: string;
  /** The full draft text inserted into the policy input. */
  policyText: string;
  timeHorizon: TimeHorizonId;
  segments: StakeholderSegmentId[];
}

/** A document in the department's library rail. */
export interface DepartmentDocument {
  id: string;
  name: string;
  kind: "pdf" | "docx" | "txt";
  sizeLabel: string;
  /** ISO date, always on or before REFERENCE_DATE. */
  date: string;
  note: string;
  /**
   * The instrument this document is prepared under, as a key into `CITED_INSTRUMENTS`.
   * Optional, so a document that genuinely rests on no single instrument simply carries
   * none. The citation text is derived from that table — never stored here — so a title
   * and its chapter cannot drift apart.
   */
  instrument?: CitedInstrumentId;
}

export interface Department {
  id: DepartmentId;
  /** Full statutory name. */
  name: string;
  /** Short label, safe for the homepage grid. */
  shortName: string;
  /** Abbreviation used in the workspace header. */
  abbr: string;
  /** The statutory or constitutional basis for the department's work. */
  mandate: string;
  /** Two to three sentences of plain-language description. */
  description: string;
  priorities: DepartmentPriority[];
  indicators: DepartmentIndicator[];
  /** Stakeholder segments the simulation models for this department. */
  segments: StakeholderSegmentId[];
  policyTemplates: PolicyTemplate[];
  /**
   * The instruments this department's work rests on: the universal set every department
   * carries, plus its own. Every document's `instrument` must be one of these, so a
   * department can never cite an instrument outside its mandate.
   */
  instruments: CitedInstrumentId[];
  documents: DepartmentDocument[];
}

/**
 * The authored department records. Their reading order is NOT taken from their position
 * here — it comes from `DEPARTMENT_IDS`, and `DEPARTMENTS` below is sorted to match. That
 * way the data and the order a screen renders cannot drift apart, and moving a department
 * is a single edit in `DEPARTMENT_IDS`.
 */
const DEPARTMENT_DATA: Department[] = [
  {
    id: "opc",
    name: "Office of the President and Cabinet",
    shortName: "President and Cabinet",
    abbr: "OPC",
    mandate:
      "Coordinates national policy formulation and monitors the implementation of Government programmes across all ministries, departments and agencies.",
    description:
      "The Office of the President and Cabinet sets the whole-of-government policy agenda and holds the delivery chain to account. It resolves cross-ministry conflicts, runs the reform programme, and reports on progress against the National Development Strategy. Policy simulation here is used to test coordination-heavy reforms before they reach Cabinet.",
    priorities: [
      { id: "opc-coordination", label: "Whole-of-government coordination", note: "Align ministry work programmes to a single national delivery plan." },
      { id: "opc-delivery", label: "National plan delivery monitoring", note: "Track implementation milestones and unblock stalled programmes." },
      { id: "opc-reform", label: "Public sector reform", note: "Simplify processes, reduce duplication, and improve service turnaround." },
      { id: "opc-devolution", label: "Devolution coordination", note: "Align provincial and local delivery with national priorities." },
    ],
    indicators: [
      { id: "opc-impl", label: "Policy implementation rate", value: "68", unit: "%", score: 68, tone: "gold", note: "Share of Cabinet-approved policies with an active implementation plan this year.", basis: { kind: "modelled" } },
      { id: "opc-milestone", label: "Reform milestones met", value: "41 of 60", score: 68, tone: "primary", note: "Milestones completed against the public sector reform programme.", basis: { kind: "modelled" } },
      { id: "opc-response", label: "Cross-ministry turnaround", value: "23", unit: "days", score: 54, tone: "warning", note: "Average time to resolve a matter referred between ministries.", basis: { kind: "modelled" } },
      { id: "opc-standards", label: "Service standards published", value: "58", unit: "%", score: 58, tone: "gold", note: "High-volume services carrying a published service standard.", basis: { kind: "modelled" } },
      { id: "opc-escalation", label: "Escalations resolved in time", value: "81", unit: "%", score: 81, tone: "primary", note: "Cross-ministry matters resolved within the published period.", basis: { kind: "modelled" } },
      { id: "opc-reviews", label: "Programme reviews completed", value: "14 of 18", score: 70, tone: "gold", note: "Scheduled programme reviews completed on time.", basis: { kind: "modelled" } },
      { id: "opc-budget", label: "Budget execution", value: "88", unit: "%", score: 88, tone: "success", note: "Approved budget spent within the financial year.", basis: { kind: "modelled" } },
      { id: "opc-gazette", label: "Cabinet decisions gazetted", value: "72", unit: "%", score: 72, tone: "primary", note: "Cabinet-approved decisions gazetted within the period.", basis: { kind: "modelled" } },
      { id: "opc-provincial", label: "Provincial plans aligned", value: "9 of 10", score: 82, tone: "success", note: "Provincial development plans aligned to the national plan.", basis: { kind: "modelled" } },
      { id: "opc-coordination", label: "Coordination effectiveness", value: "74", unit: "%", score: 74, tone: "gold", note: "Agencies rating coordination support as effective.", basis: { kind: "modelled" } },
      { id: "opc-delivery", label: "National delivery dashboard coverage", value: "84", unit: "%", score: 84, tone: "success", note: "Flagship programmes tracked on the national delivery dashboard.", basis: { kind: "modelled" } },
      { id: "opc-directives", label: "Presidential directives actioned", value: "76", unit: "%", score: 76, tone: "gold", note: "Directives actioned within the period stated on them.", basis: { kind: "modelled" } },
      { id: "opc-interfaces", label: "Inter-ministerial interfaces mapped", value: "62", unit: "%", score: 62, tone: "primary", note: "Shared delivery interfaces documented between ministries.", basis: { kind: "modelled" } },
      { id: "opc-maturity", label: "Whole-of-government delivery maturity", value: "3.4 of 5", score: 68, tone: "primary", note: "Maturity score for whole-of-government delivery practice.", basis: { kind: "modelled" } },
      { id: "opc-reporting", label: "Ministries reporting on time", value: "89", unit: "%", score: 89, tone: "success", note: "Ministries submitting their delivery report on time.", basis: { kind: "modelled" } },
      { id: "opc-bills", label: "Bills cleared for gazetting", value: "21 of 28", score: 75, tone: "primary", note: "Draft Bills cleared through Cabinet for gazetting.", basis: { kind: "modelled" } },
      { id: "opc-visits", label: "Monitoring visits completed", value: "34 of 40", score: 85, tone: "success", note: "Scheduled delivery monitoring visits completed.", basis: { kind: "modelled" } },
      { id: "opc-provinces", label: "Provinces on the delivery platform", value: "8 of 10", score: 80, tone: "gold", note: "Provinces reporting through the shared delivery platform.", basis: { kind: "modelled" } },
      { id: "opc-satisfaction", label: "Public satisfaction with coordination", value: "67", unit: "%", score: 67, tone: "primary", note: "Public rating of coordination between ministries.", basis: { kind: "modelled" } },
      { id: "opc-analytics", label: "Evidence briefs to Cabinet", value: "46", score: 46, tone: "gold", note: "Evidence briefs prepared for Cabinet decisions this year.", basis: { kind: "modelled" } },
    ],
    segments: ["civil-servants", "local-authorities", "development-partners", "formal-business", "youth", "traditional-leaders", "faith-groups", "media", "urban-households", "rural-households", "women", "trade-unions", "employer-federations", "persons-with-disabilities", "researchers", "informal-workers", "parliament-legislators", "judiciary-courts", "professional-councils", "religious-leaders", "district-councils", "smes", "refugees-migrants", "informal-settlement-residents", "journalists", "community-radio", "advertising-agencies", "pr-firms", "parents-associations", "school-heads", "pension-funds", "asset-managers", "software-developers", "isps", "data-centres", "cybersecurity-firms", "warehousing", "courier-firms", "building-societies", "saccos"],
    policyTemplates: [
      {
        id: "opc-tpl-coordination",
        title: "National Policy Coordination Framework",
        summary: "A single coordination and reporting standard for all ministries.",
        policyText:
          "This framework establishes one coordination standard for all ministries, departments and agencies. Each ministry submits a costed annual work programme aligned to the national development plan, reports quarterly against agreed milestones, and escalates blocking issues to the Cabinet committee within ten working days. A shared delivery dashboard records progress at programme level so that duplication between ministries becomes visible and is resolved before budget allocation. The framework does not change any ministry's statutory mandate; it changes how progress is planned, recorded and reviewed.",
        timeHorizon: "medium",
        segments: ["civil-servants", "local-authorities", "development-partners", "formal-business"],
      },
      {
        id: "opc-tpl-reform",
        title: "Public Sector Reform Programme Phase II",
        summary: "Process simplification, licensing turnaround and service standards.",
        policyText:
          "Phase II of the public sector reform programme targets turnaround time rather than headcount. Every licensing, permitting and registration process above a defined volume is mapped, published as a service standard, and reduced to a single submission point. Departments adopt a shared case-tracking register so an applicant can follow one reference number across offices. Savings identified by process simplification are retained by the originating department for the first two years, creating a direct incentive to complete the redesign.",
        timeHorizon: "long",
        segments: ["formal-business", "informal-traders", "civil-servants", "women-led-enterprises"],
      },
      {
        id: "opc-tpl-devolution",
        title: "Devolution Implementation Review",
        summary: "Review of devolution fund use, absorption and local accountability.",
        policyText:
          "This review examines how devolution funds are allocated, absorbed and reported across provincial and local tiers. It proposes a common absorption measure, publishes it per province, and requires each local authority to publish its own project list and completion dates. Where absorption is persistently low, the review recommends targeted technical support before any reallocation. Provincial councils retain their planning authority; the review changes reporting and support, not the devolution formula itself.",
        timeHorizon: "medium",
        segments: ["local-authorities", "rural-households", "urban-households", "civil-servants"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "public-entities-corporate-governance-act", "provincial-councils-act", "administrative-justice-act"],
    documents: [
      { id: "opc-doc-1", name: "National_Development_Strategy_Progress_Review.pdf", kind: "pdf", sizeLabel: "3.1 MB", date: "2026-08-19", note: "Annual delivery review across all ministries.", instrument: "nds2" },
      { id: "opc-doc-2", name: "Public_Sector_Reform_Phase_II_Concept.docx", kind: "docx", sizeLabel: "892 KB", date: "2026-07-30", note: "Concept note for process simplification.", instrument: "administrative-justice-act" },
      { id: "opc-doc-3", name: "Devolution_Absorption_Report.txt", kind: "txt", sizeLabel: "126 KB", date: "2026-06-11", note: "Provincial absorption figures and commentary.", instrument: "provincial-councils-act" },
    ],
  },
  {
    id: "fin",
    name: "Ministry of Finance, Economic Development and Investment Promotion",
    shortName: "Finance and Economic Development",
    abbr: "MoF",
    mandate:
      "Manages the national budget, fiscal policy and the revenue and expenditure framework, and leads economic development and investment promotion planning.",
    description:
      "The Ministry of Finance prepares the national budget, manages the fiscal framework, and coordinates macroeconomic and investment policy. Its decisions on taxation, expenditure ceilings and settlement rules reach every household and business in the country. Simulation is used here to test the distributional and revenue consequences of budget measures before they are finalised.",
    priorities: [
      { id: "fin-fiscal", label: "Fiscal consolidation", note: "Hold the deficit within the framework agreed with creditors." },
      { id: "fin-stability", label: "Currency stability", note: "Sustain confidence in the local currency through credible settlement rules." },
      { id: "fin-tax", label: "Tax administration efficiency", note: "Broaden the base and reduce compliance cost for small firms." },
      { id: "fin-invest", label: "Investment promotion", note: "Improve the pipeline of bankable domestic and foreign projects." },
    ],
    indicators: [
      { id: "fin-deficit", label: "Fiscal deficit", value: "3.6", unit: "% of GDP", score: 4, tone: "warning", note: "General government net borrowing.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Net lending (+) / net borrowing (-) (% of GDP)", asOf: "2018" } },
      { id: "fin-revenue", label: "Tax revenue", value: "7.2", unit: "% of GDP", score: 7, tone: "warning", note: "Tax revenue as a share of GDP.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Tax revenue (% of GDP)", asOf: "2018" } },
      { id: "fin-taxbase", label: "Registered taxpayer growth", value: "+6.8", unit: "% YoY", score: 68, tone: "primary", note: "Growth in the active taxpayer register year on year.", basis: { kind: "modelled" } },
      { id: "fin-investment", label: "Foreign direct investment, net inflows", value: "USD 465M", score: 62, tone: "gold", note: "Net inflows of foreign direct investment.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Foreign direct investment, net inflows (BoP, current US$)", asOf: "2024" } },
      { id: "fin-debt", label: "Public debt stock", value: "USD 21.4B", score: 40, tone: "warning", note: "Central government debt stock.", basis: { kind: "modelled" } },
      { id: "fin-debt-gdp", label: "Debt to GDP", value: "68", unit: "% of GDP", score: 38, tone: "warning", note: "Central government debt as a share of GDP.", basis: { kind: "modelled" } },
      { id: "fin-reserves", label: "Reserve cover", value: "0.5", unit: "months of imports", score: 42, tone: "warning", note: "Foreign reserves held, measured in months of imports.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Total reserves in months of imports", asOf: "2024" } },
      { id: "fin-budget", label: "Budget execution", value: "88", unit: "%", score: 88, tone: "success", note: "Approved budget spent within the financial year.", basis: { kind: "modelled" } },
      { id: "fin-savings", label: "National savings", value: "10.7", unit: "% of GDP", score: 48, tone: "gold", note: "Gross national savings as a share of GDP.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Gross savings (% of GDP)", asOf: "2024" } },
      { id: "fin-money", label: "Broad money growth", value: "708.9", unit: "% YoY", score: 60, tone: "primary", note: "Annual growth in broad money.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Broad money growth (annual %)", asOf: "2023" } },
      { id: "fin-revenue-gdp", label: "Revenue to GDP", value: "15.8", unit: "% of GDP", score: 42, tone: "warning", note: "Total government revenue as a share of GDP.", basis: { kind: "modelled" } },
      { id: "fin-expenditure", label: "Expenditure execution", value: "92", unit: "%", score: 92, tone: "success", note: "Approved expenditure spent within the period.", basis: { kind: "modelled" } },
      { id: "fin-interest", label: "Interest cost of debt", value: "22", unit: "% of revenue", score: 40, tone: "warning", note: "Debt-service interest as a share of revenue.", basis: { kind: "modelled" } },
      { id: "fin-capital", label: "Capital budget execution", value: "71", unit: "%", score: 71, tone: "gold", note: "Development budget spent within the financial year.", basis: { kind: "modelled" } },
      { id: "fin-currency", label: "Local currency deposits", value: "34", unit: "%", score: 34, tone: "primary", note: "Share of banking deposits held in local currency.", basis: { kind: "modelled" } },
      { id: "fin-npl", label: "Non-performing loans", value: "6.8", unit: "%", score: 52, tone: "warning", note: "Non-performing loans as a share of total loans.", basis: { kind: "modelled" } },
      { id: "fin-inflation", label: "Inflation rate", value: "12.4", unit: "%", score: 44, tone: "warning", note: "Annual headline consumer price inflation.", basis: { kind: "modelled" } },
      { id: "fin-trade", label: "Trade balance", value: "USD 1.2B surplus", score: 70, tone: "success", note: "Goods and services trade balance for the year.", basis: { kind: "modelled" } },
      { id: "fin-remit-gdp", label: "Remittances to GDP", value: "3.6", unit: "% of GDP", score: 74, tone: "success", note: "Recorded remittances as a share of GDP.", basis: { kind: "modelled" } },
      { id: "fin-sovereign", label: "Sovereign credit rating", value: "B−", score: 48, tone: "gold", note: "Sovereign credit rating on the international scale.", basis: { kind: "modelled" } },
    ],
    segments: ["exporters", "formal-business", "financial-sector", "civil-servants", "informal-traders", "diaspora", "manufacturers", "pensioners", "urban-households", "rural-households", "informal-workers", "smallholder-farmers", "mining-operators", "trade-unions", "employer-federations", "women-led-enterprises", "smes", "fintech-mobile-money", "microfinance-institutions", "insurance-sector", "professional-councils", "parliament-legislators", "construction-sector", "village-savings-groups", "pension-funds", "insurance-brokers", "stockbrokers", "asset-managers", "bureaux-de-change", "mobile-money-agents", "building-societies", "saccos", "micro-insurers", "customs-brokers", "cement-producers", "food-beverage", "chemicals-industry", "engineering-firms", "printing-publishing", "warehousing"],
    policyTemplates: [
      {
        id: "fin-tpl-settlement",
        title: "Settlement currency for export receipts",
        summary: "Review of the mandatory local-currency share of export receipts.",
        policyText:
          "This measure reviews the proportion of export receipts that must be settled in local currency. It proposes a graded share that steps down as export earnings rise, so that a producer earning below a defined threshold settles a smaller percentage than a large mineral exporter. Settlement timing is standardised to a fixed number of days after receipt, and the conversion reference is published before each period begins. The measure is revenue-neutral in design: the local-currency requirement is retained, but its incidence across firm sizes changes.",
        timeHorizon: "medium",
        segments: ["exporters", "mining-operators", "formal-business", "financial-sector", "informal-traders"],
      },
      {
        id: "fin-tpl-sme-tax",
        title: "Simplified turnover tax for small firms",
        summary: "A single presumptive band replacing multiple small-business obligations.",
        policyText:
          "This measure introduces a single presumptive turnover band for firms below a defined annual turnover threshold. Eligible firms remit one percentage of turnover on a fixed monthly date, replacing the current combination of returns. Registration and payment are available on a mobile channel, and a firm may move to the standard regime at any point in the year without penalty. The measure is designed to raise registration and reduce the cost of compliance rather than to change the headline rate for larger firms.",
        timeHorizon: "short",
        segments: ["informal-traders", "women-led-enterprises", "formal-business"],
      },
      {
        id: "fin-tpl-wage-bill",
        title: "Public service remuneration review",
        summary: "Multi-year path for pay restoration and pension sustainability.",
        policyText:
          "This review sets out a multi-year path for public service remuneration, covering both serving officers and pensioners. It proposes annual adjustments linked to a published basket rather than to a single negotiated figure, with a floor that protects the lowest-paid grades. The cost is matched within the expenditure framework by a combination of efficiency measures and a phased timetable, so that no single year carries an adjustment that cannot be funded. Terms of service are not changed by this review.",
        timeHorizon: "long",
        segments: ["civil-servants", "formal-business", "financial-sector"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "rbz-act", "banking-act", "public-debt-management-act", "money-laundering-act", "bank-use-promotion-act", "microfinance-act", "pension-provident-funds-act", "movable-property-security-act", "income-tax-act"],
    documents: [
      { id: "fin-doc-1", name: "Budget_Framework_Statement_2026.pdf", kind: "pdf", sizeLabel: "4.6 MB", date: "2026-08-28", note: "Fiscal framework and expenditure ceilings.", instrument: "pfma" },
      { id: "fin-doc-2", name: "Small_Business_Tax_Simulation_Note.docx", kind: "docx", sizeLabel: "1.3 MB", date: "2026-07-22", note: "Distributional note on presumptive bands.", instrument: "income-tax-act" },
      { id: "fin-doc-3", name: "Export_Settlement_Review.txt", kind: "txt", sizeLabel: "214 KB", date: "2026-06-30", note: "Options paper on settlement shares.", instrument: "rbz-act" },
      { id: "fin-doc-4", name: "Debt_Sustainability_Update.pdf", kind: "pdf", sizeLabel: "2.8 MB", date: "2026-05-14", note: "Updated sustainability position.", instrument: "public-debt-management-act" },
    ],
  },
  {
    id: "agri",
    name: "Ministry of Lands, Agriculture, Fisheries, Water and Rural Development",
    shortName: "Lands, Agriculture and Water",
    abbr: "MoA",
    mandate:
      "Promotes agricultural production, food and nutrition security, irrigation and water development, and sustainable land and fisheries management.",
    description:
      "This ministry is responsible for the country's food supply and for the land, water and livestock systems that produce it. It runs the input support programmes, manages irrigation schemes, and controls animal disease outbreaks. Simulation is used to test how changes in input support, producer prices or water allocation reach smallholder, communal and commercial producers.",
    priorities: [
      { id: "agri-food", label: "National food security", note: "Secure the staple grain supply across all provinces." },
      { id: "agri-irrigation", label: "Irrigation and water development", note: "Extend reliable water to smallholder production areas." },
      { id: "agri-livestock", label: "Livestock health", note: "Contain disease outbreaks and protect the national herd." },
      { id: "agri-market", label: "Smallholder market access", note: "Link communal producers to structured buyers and contracts." },
    ],
    indicators: [
      { id: "agri-grain", label: "Food production index", value: "121.7", unit: "index (2014–2016 = 100)", score: 89, tone: "success", note: "Food production relative to the 2014–2016 average.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Food production index (2014-2016 = 100)", asOf: "2022" } },
      { id: "agri-irrigated", label: "Irrigated area", value: "203k", unit: "ha", score: 66, tone: "primary", note: "Area under functioning irrigation, all schemes.", basis: { kind: "modelled" } },
      { id: "agri-herd", label: "Livestock production index", value: "119.6", unit: "index (2014–2016 = 100)", score: 62, tone: "gold", note: "Livestock production relative to the 2014–2016 average.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Livestock production index (2014-2016 = 100)", asOf: "2022" } },
      { id: "agri-input", label: "Fertiliser consumption", value: "26.2", unit: "kg per hectare", score: 26, tone: "warning", note: "Fertiliser applied per hectare of arable land.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Fertilizer consumption (kilograms per hectare of arable land)", asOf: "2023" } },
      { id: "agri-maize", label: "Cereal yield", value: "743.9", unit: "kg per hectare", score: 55, tone: "gold", note: "Average cereal yield on arable land.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Cereal yield (kg per hectare)", asOf: "2023" } },
      { id: "agri-tobacco", label: "Tobacco output", value: "265", unit: "million kg", score: 82, tone: "success", note: "Flue-cured tobacco delivered for sale.", basis: { kind: "modelled" } },
      { id: "agri-schemes", label: "Irrigation schemes functional", value: "68", unit: "%", score: 68, tone: "primary", note: "Schemes operating at their intended capacity.", basis: { kind: "modelled" } },
      { id: "agri-extension", label: "Extension coverage", value: "1:1,650", score: 44, tone: "warning", note: "Farm households reached per extension officer.", basis: { kind: "modelled" } },
      { id: "agri-vet", label: "Veterinary coverage", value: "74", unit: "%", score: 74, tone: "gold", note: "Livestock in areas covered by veterinary services.", basis: { kind: "modelled" } },
      { id: "agri-postharvest", label: "Post-harvest losses", value: "18", unit: "%", score: 55, tone: "warning", note: "Share of produce lost after harvest.", basis: { kind: "modelled" } },
      { id: "agri-wheat", label: "Wheat output", value: "96,000", unit: "tonnes", score: 62, tone: "gold", note: "Wheat delivered to the national grain reserve.", basis: { kind: "modelled" } },
      { id: "agri-cotton", label: "Cotton output", value: "64,000", unit: "tonnes", score: 50, tone: "warning", note: "Seed cotton delivered for ginning.", basis: { kind: "modelled" } },
      { id: "agri-horticulture", label: "Horticulture exports", value: "USD 240M", score: 68, tone: "success", note: "Value of horticultural produce exported.", basis: { kind: "modelled" } },
      { id: "agri-livestock-count", label: "National cattle herd", value: "5.6M", unit: "head", score: 58, tone: "primary", note: "Estimated national cattle herd.", basis: { kind: "modelled" } },
      { id: "agri-irrigated-hectares", label: "Area under irrigation", value: "220,000", unit: "ha", score: 52, tone: "gold", note: "Hectares under a functioning irrigation system.", basis: { kind: "modelled" } },
      { id: "agri-mechanisation", label: "Mechanisation rate", value: "41", unit: "%", score: 41, tone: "warning", note: "Farm households using mechanised tillage.", basis: { kind: "modelled" } },
      { id: "agri-storage", label: "Grain storage utilisation", value: "62", unit: "%", score: 62, tone: "primary", note: "National grain storage capacity in use.", basis: { kind: "modelled" } },
      { id: "agri-contracts", label: "Contract farming participation", value: "38", unit: "%", score: 38, tone: "gold", note: "Smallholders on a contract-farming arrangement.", basis: { kind: "modelled" } },
      { id: "agri-dams", label: "Dams at half supply or better", value: "54", unit: "%", score: 54, tone: "warning", note: "Dams holding at least half their capacity.", basis: { kind: "modelled" } },
      { id: "agri-climate", label: "Climate-smart practices adopted", value: "36", unit: "%", score: 36, tone: "gold", note: "Farmers adopting a climate-smart practice.", basis: { kind: "modelled" } },
    ],
    segments: ["smallholder-farmers", "rural-households", "informal-traders", "exporters", "women-led-enterprises", "development-partners", "cooperatives", "informal-workers", "urban-households", "formal-business", "financial-sector", "local-authorities", "traditional-leaders", "transport-operators", "energy-water-utilities", "cross-border-traders", "farmer-unions", "horticulture-growers", "livestock-producers", "water-user-associations", "timber-forestry-operators", "district-councils", "fishing-communities", "smes", "grain-millers", "cotton-ginners", "sugar-producers", "dairy-producers", "poultry-producers", "aquaculture-operators", "beekeepers", "seed-suppliers", "agro-processors", "tobacco-merchants", "rural-teachers", "haulage-operators", "warehousing", "kombi-operators", "drivers-associations", "community-radio"],
    policyTemplates: [
      {
        id: "agri-tpl-inputs",
        title: "Targeted input support for the coming season",
        summary: "Reform of how seed and fertiliser support is allocated.",
        policyText:
          "This measure reforms the allocation of seed and fertiliser support. It replaces the current blanket register with a targeting rule based on land holding, previous planting record and household vulnerability, and publishes the register per ward before distribution. Distribution is tied to a verified delivery date so that inputs arrive before the optimal planting window. Support is issued in kind for the first season and evaluated before any move to a voucher or cash alternative.",
        timeHorizon: "short",
        segments: ["smallholder-farmers", "rural-households", "women-led-enterprises"],
      },
      {
        id: "agri-tpl-irrigation",
        title: "Smallholder irrigation rehabilitation programme",
        summary: "Rehabilitation and governance of communal irrigation schemes.",
        policyText:
          "This programme rehabilitates communal irrigation schemes that are currently operating below design capacity. It pairs physical works with a governance requirement: each scheme must form a water user association responsible for maintenance contributions and equitable allocation before works begin. Operating cost recovery is phased over three seasons to allow producers to adjust. The programme does not alter existing water rights; it changes the maintenance and allocation arrangements around them.",
        timeHorizon: "long",
        segments: ["smallholder-farmers", "rural-households", "local-authorities"],
      },
      {
        id: "agri-tpl-livestock",
        title: "Livestock disease containment strategy",
        summary: "Movement controls, vaccination coverage and market continuity.",
        policyText:
          "This strategy sets out how an animal disease outbreak is contained without closing livestock markets for the whole country. It establishes a defined containment zone with movement permits, a vaccination ring around it, and a compensation schedule paid within a fixed period of verified culling. Outside the zone, markets continue to operate with certification. The strategy is triggered by a published threshold so that the response does not depend on a discretionary decision at the time of the outbreak.",
        timeHorizon: "short",
        segments: ["smallholder-farmers", "rural-households", "informal-traders", "exporters"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "rural-land-act", "agricultural-land-settlement-act", "land-acquisition-act", "land-survey-act", "farm-equipment-act", "warehouse-receipt-act", "water-act"],
    documents: [
      { id: "agri-doc-1", name: "Seasonal_Crop_Assessment_2026.pdf", kind: "pdf", sizeLabel: "5.2 MB", date: "2026-07-08", note: "Provincial production estimates and commentary.", instrument: "census-statistics-act" },
      { id: "agri-doc-2", name: "Irrigation_Rehabilitation_Options.txt", kind: "txt", sizeLabel: "168 KB", date: "2026-06-19", note: "Scheme-by-scheme rehabilitation options.", instrument: "water-act" },
      { id: "agri-doc-3", name: "Livestock_Disease_Contingency.docx", kind: "docx", sizeLabel: "1.1 MB", date: "2026-04-27", note: "Contingency plan for notifiable diseases.", instrument: "rural-land-act" },
    ],
  },
  {
    id: "health",
    name: "Ministry of Health and Child Care",
    shortName: "Health and Child Care",
    abbr: "MoHCC",
    mandate:
      "Delivers preventive, curative and rehabilitative health services, and safeguards public health and child welfare nationwide.",
    description:
      "The Ministry of Health and Child Care operates the national referral system, the district health network, and the public health surveillance that stands behind it. Its staffing and medicines decisions determine whether care is available outside the main cities. Simulation is used to test how changes to staffing, user fees or supply arrangements are absorbed by health workers and by households.",
    priorities: [
      { id: "health-phc", label: "Primary health care coverage", note: "Keep a functioning clinic within reach of every ward." },
      { id: "health-workforce", label: "Health workforce retention", note: "Reduce attrition of clinical and nursing cadres." },
      { id: "health-medicines", label: "Essential medicines supply", note: "Improve availability and reduce stock-outs at facility level." },
      { id: "health-surveillance", label: "Disease surveillance", note: "Detect and respond to outbreaks within the reporting window." },
    ],
    indicators: [
      { id: "health-facilities", label: "Functional primary facilities", value: "94", unit: "%", score: 94, tone: "success", note: "Facilities open and staffed on the reporting day.", basis: { kind: "modelled" } },
      { id: "health-stockout", label: "Essential medicine availability", value: "72", unit: "%", score: 72, tone: "warning", note: "Tracer medicines available at the point of care.", basis: { kind: "modelled" } },
      { id: "health-staffing", label: "Nurses and midwives", value: "3.1", unit: "per 1,000 people", score: 31, tone: "warning", note: "Nursing and midwifery personnel per 1,000 people.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Nurses and midwives (per 1,000 people)", asOf: "2022" } },
      { id: "health-immune", label: "Child immunisation coverage", value: "90", unit: "%", score: 90, tone: "gold", note: "Children aged 12–23 months immunised against measles.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Immunisation, measles (% of children aged 12–23 months)", asOf: "2024" } },
      { id: "health-life", label: "Life expectancy", value: "63.1", unit: "years", score: 63, tone: "primary", note: "Life expectancy at birth.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Life expectancy at birth, total (years)", asOf: "2024" } },
      { id: "health-malaria", label: "Malaria incidence", value: "11.4", unit: "per 1,000 at risk", score: 55, tone: "warning", note: "Confirmed malaria cases per 1,000 population at risk.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Incidence of malaria (per 1,000 population at risk)", asOf: "2024" } },
      { id: "health-hiv", label: "HIV treatment coverage", value: "95", unit: "%", score: 89, tone: "success", note: "People living with HIV on sustained treatment.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Antiretroviral therapy coverage (% of people living with HIV)", asOf: "2024" } },
      { id: "health-anc", label: "Antenatal visits", value: "71.5", unit: "%", score: 78, tone: "gold", note: "Pregnant women attending four or more antenatal visits.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Pregnant women receiving prenatal care of at least four visits (% of pregnant women)", asOf: "2019" } },
      { id: "health-deliveries", label: "Facility deliveries", value: "82", unit: "%", score: 82, tone: "success", note: "Births taking place in a health facility.", basis: { kind: "modelled" } },
      { id: "health-outpatient", label: "Outpatient visits per capita", value: "1.9", score: 60, tone: "primary", note: "Outpatient visits recorded per person a year.", basis: { kind: "modelled" } },
      { id: "health-full-immunisation", label: "Full child immunisation", value: "82", unit: "%", score: 82, tone: "success", note: "Children completing the full routine immunisation schedule.", basis: { kind: "modelled" } },
      { id: "health-maternal", label: "Maternal mortality ratio", value: "380", unit: "per 100,000", score: 42, tone: "warning", note: "Maternal deaths per 100,000 live births.", basis: { kind: "modelled" } },
      { id: "health-tb", label: "Tuberculosis treatment success", value: "88", unit: "%", score: 88, tone: "success", note: "Tuberculosis cases completing treatment successfully.", basis: { kind: "modelled" } },
      { id: "health-blood", label: "Blood units collected", value: "72,000", unit: "units", score: 60, tone: "primary", note: "Units of blood collected for transfusion.", basis: { kind: "modelled" } },
      { id: "health-mental", label: "Mental-health contacts", value: "46", unit: "per 10,000", score: 46, tone: "gold", note: "Mental-health contacts recorded per 10,000 people.", basis: { kind: "modelled" } },
      { id: "health-referrals", label: "Referral turnaround", value: "2.4", unit: "days", score: 62, tone: "primary", note: "Average time to complete an inter-facility referral.", basis: { kind: "modelled" } },
      { id: "health-bed-occupancy", label: "Bed occupancy", value: "78", unit: "%", score: 78, tone: "gold", note: "Inpatient beds occupied on an average day.", basis: { kind: "modelled" } },
      { id: "health-chw", label: "Community health workers active", value: "16,400", score: 70, tone: "success", note: "Village health workers active in the period.", basis: { kind: "modelled" } },
      { id: "health-amr", label: "Antibiotic use monitored", value: "54", unit: "%", score: 54, tone: "warning", note: "Facilities monitoring antibiotic use against guidance.", basis: { kind: "modelled" } },
      { id: "health-ncd", label: "Non-communicable screening", value: "34", unit: "%", score: 34, tone: "warning", note: "Adults screened for a non-communicable condition.", basis: { kind: "modelled" } },
    ],
    segments: ["health-workers", "urban-households", "rural-households", "civil-servants", "development-partners", "women-led-enterprises", "persons-with-disabilities", "women", "youth", "educators", "faith-groups", "local-authorities", "pensioners", "informal-workers", "traditional-leaders", "media", "nurses-associations", "medical-aid-societies", "pharmaceutical-sector", "traditional-healers", "professional-councils", "refugees-migrants", "informal-settlement-residents", "religious-leaders", "private-clinics", "pharmacists", "laboratory-techs", "radiographers", "ambulance-services", "community-caregivers", "ecd-caregivers", "school-heads", "parents-associations", "food-beverage", "chemicals-industry", "insurance-brokers", "asset-managers", "pension-funds", "journalists", "community-radio"],
    policyTemplates: [
      {
        id: "health-tpl-workforce",
        title: "Health workforce retention package",
        summary: "Non-salary measures to retain clinical and nursing cadres.",
        policyText:
          "This package addresses retention of clinical and nursing staff through non-salary measures. It prioritises accelerated promotion for officers who complete service in rural districts, guarantees study leave places on a published annual schedule, and provides accommodation at facilities currently without it. Deployment is matched to a facility staffing norm so that a new officer is not posted into a post that already exceeds establishment. The package does not alter salary structures or collective bargaining.",
        timeHorizon: "long",
        segments: ["health-workers", "rural-households", "civil-servants"],
      },
      {
        id: "health-tpl-fees",
        title: "Review of primary care user fees",
        summary: "Revision of fee schedules and exemption coverage.",
        policyText:
          "This measure reviews user fees at the primary care level. It proposes a single published schedule per facility tier, removes per-item charges in favour of one consultation charge, and extends the exemption register to include households already verified under the social protection register. Facilities retain the revenue they collect and report it against a common template so that the effect on facility income is visible. Referral to a higher tier continues to attract a separate charge.",
        timeHorizon: "medium",
        segments: ["urban-households", "rural-households", "women-led-enterprises", "informal-traders"],
      },
      {
        id: "health-tpl-medicines",
        title: "Essential medicines supply reform",
        summary: "Central tendering plus regional buffer stocks.",
        policyText:
          "This reform changes how essential medicines reach facilities. It combines a single national tender for the tracer list with regional buffer warehouses that hold a defined number of weeks of consumption. Facilities order against an agreed reorder level rather than an annual allocation, and a stock-out above the threshold triggers an automatic review. Local purchase is permitted only where the national tender cannot deliver inside the defined lead time.",
        timeHorizon: "medium",
        segments: ["health-workers", "formal-business", "development-partners"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "public-health-act", "health-service-act", "mental-health-act", "family-planning-council-act", "social-workers-act"],
    documents: [
      { id: "health-doc-1", name: "National_Health_Profile_2026.pdf", kind: "pdf", sizeLabel: "6.4 MB", date: "2026-08-05", note: "National health indicators by province.", instrument: "public-health-act" },
      { id: "health-doc-2", name: "Workforce_Retention_Options.docx", kind: "docx", sizeLabel: "1.7 MB", date: "2026-07-14", note: "Non-salary retention options appraisal.", instrument: "health-service-act" },
      { id: "health-doc-3", name: "Essential_Medicines_Stock_Report.txt", kind: "txt", sizeLabel: "96 KB", date: "2026-06-02", note: "Tracer medicine availability report.", instrument: "public-health-act" },
    ],
  },
  {
    id: "edu",
    name: "Ministry of Primary and Secondary Education",
    shortName: "Primary and Secondary Education",
    abbr: "MoPSE",
    mandate:
      "Provides equitable, quality primary and secondary education and manages the public school system, teacher establishment and curriculum delivery.",
    description:
      "The Ministry of Primary and Secondary Education runs the largest public service in the country after the civil service itself. It manages teacher deployment, the competence-based curriculum, examinations and the school feeding programme. Simulation is used to test how changes in fees, teacher deployment or feeding coverage affect enrolment, attendance and household cost.",
    priorities: [
      { id: "edu-curriculum", label: "Curriculum implementation", note: "Support teachers to deliver the competence-based curriculum." },
      { id: "edu-teachers", label: "Equitable teacher deployment", note: "Balance the learner-teacher ratio across districts." },
      { id: "edu-feeding-programme", label: "School feeding programme", note: "Sustain daily meals for learners in the most affected wards." },
      { id: "edu-retention", label: "Learner retention", note: "Reduce dropout at the primary-to-secondary transition." },
    ],
    indicators: [
      { id: "edu-enrolment", label: "Primary enrolment", value: "94.1", unit: "% net", score: 94, tone: "success", note: "Children of primary school age enrolled in primary education.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: School enrolment, primary (% net)", asOf: "2013" } },
      { id: "edu-ratio", label: "Learner-teacher ratio", value: "36.4:1", score: 62, tone: "warning", note: "Primary pupils for every teacher.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Pupil-teacher ratio, primary", asOf: "2013" } },
      { id: "edu-transition", label: "Primary completion rate", value: "86.0", unit: "% of relevant age group", score: 86, tone: "primary", note: "Children completing the last grade of primary education.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Primary completion rate, total (% of relevant age group)", asOf: "2024" } },
      { id: "edu-feeding", label: "Feeding coverage", value: "1.6M", unit: "learners", score: 70, tone: "gold", note: "Learners receiving a daily meal under the programme.", basis: { kind: "modelled" } },
      { id: "edu-repetition", label: "Repetition rate", value: "1.9", unit: "%", score: 55, tone: "warning", note: "Primary pupils repeating a grade.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Repeaters, primary, total (% of total enrollment)", asOf: "2013" } },
      { id: "edu-textbooks", label: "Textbook availability", value: "62", unit: "%", score: 62, tone: "gold", note: "Pupils with the required core textbooks.", basis: { kind: "modelled" } },
      { id: "edu-sanitation", label: "School sanitation ratio", value: "1:48", score: 52, tone: "warning", note: "Pupils per usable toilet.", basis: { kind: "modelled" } },
      { id: "edu-ecd", label: "Early childhood enrolment", value: "74.3", unit: "% gross", score: 68, tone: "primary", note: "Children enrolled in early childhood development.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: School enrollment, preprimary (% gross)", asOf: "2021" } },
      { id: "edu-bursary", label: "Bursary coverage", value: "71", unit: "%", score: 71, tone: "success", note: "Eligible learners receiving a bursary or grant.", basis: { kind: "modelled" } },
      { id: "edu-infrastructure", label: "Classroom backlog cleared", value: "640", unit: "rooms", score: 46, tone: "gold", note: "New or rehabilitated classrooms completed.", basis: { kind: "modelled" } },
      { id: "edu-literacy", label: "Grade 3 literacy", value: "58", unit: "%", score: 58, tone: "warning", note: "Learners meeting the Grade 3 literacy benchmark.", basis: { kind: "modelled" } },
      { id: "edu-numeracy", label: "Grade 3 numeracy", value: "52", unit: "%", score: 52, tone: "warning", note: "Learners meeting the Grade 3 numeracy benchmark.", basis: { kind: "modelled" } },
      { id: "edu-lower-secondary", label: "Lower-secondary completion", value: "71", unit: "%", score: 71, tone: "gold", note: "Learners completing the lower-secondary cycle.", basis: { kind: "modelled" } },
      { id: "edu-girls", label: "Girls' secondary enrolment", value: "49", unit: "%", score: 49, tone: "gold", note: "Share of secondary enrolment who are girls.", basis: { kind: "modelled" } },
      { id: "edu-special", label: "Learners with special needs supported", value: "62", unit: "%", score: 62, tone: "primary", note: "Learners with special needs in a supported programme.", basis: { kind: "modelled" } },
      { id: "edu-connectivity", label: "Schools with internet", value: "38", unit: "%", score: 38, tone: "gold", note: "Schools with a working internet connection.", basis: { kind: "modelled" } },
      { id: "edu-absenteeism", label: "Teacher absenteeism", value: "9", unit: "%", score: 55, tone: "warning", note: "Teaching days lost to absence.", basis: { kind: "modelled" } },
      { id: "edu-water", label: "Schools with safe water", value: "64", unit: "%", score: 64, tone: "primary", note: "Schools with a safe drinking-water point.", basis: { kind: "modelled" } },
      { id: "edu-feeding-kitchen", label: "Schools with a feeding kitchen", value: "71", unit: "%", score: 71, tone: "success", note: "Schools running a school-feeding kitchen.", basis: { kind: "modelled" } },
      { id: "edu-exam-pass", label: "O-level pass rate", value: "27", unit: "%", score: 40, tone: "warning", note: "Candidates passing at least five O-level subjects.", basis: { kind: "modelled" } },
    ],
    segments: ["educators", "rural-households", "urban-households", "youth", "development-partners", "women-led-enterprises", "faith-groups", "persons-with-disabilities", "civil-servants", "local-authorities", "traditional-leaders", "health-workers", "informal-workers", "media", "researchers", "trade-unions", "teachers-unions", "private-schools", "tertiary-students", "youth-councils", "religious-leaders", "professional-councils", "informal-settlement-residents", "refugees-migrants", "rural-teachers", "urban-teachers", "school-heads", "parents-associations", "ecd-caregivers", "tvet-instructors", "polytechnic-lecturers", "apprentices", "musicians", "creative-industries", "film-makers", "journalists", "community-radio", "software-developers", "ecommerce-platforms", "digital-marketers"],
    policyTemplates: [
      {
        id: "edu-tpl-fees",
        title: "School fee and levy framework",
        summary: "Common rules for fees, levies and boarding charges.",
        policyText:
          "This framework sets common rules for school fees, levies and boarding charges. It requires each school to publish a single combined annual charge before the start of the first term, prohibits charges introduced mid-term, and requires any increase to be approved by the provincial office against a published criterion. Schools serving learners on the exemption register receive an offsetting grant calculated on verified numbers. The framework does not set a national fee level; it regulates how charges are set and disclosed.",
        timeHorizon: "short",
        segments: ["rural-households", "urban-households", "women-led-enterprises", "educators"],
      },
      {
        id: "edu-tpl-deployment",
        title: "Teacher deployment and incentive scheme",
        summary: "Placement incentives for hard-to-fill rural posts.",
        policyText:
          "This scheme addresses vacancies that persist in specific districts. Posts that remain unfilled after two deployment rounds are declared hard-to-fill and attract a published package including accelerated promotion consideration, priority for study leave and a rural service allowance. Deployment data by school is published each term so that vacancies are visible. The scheme operates within the existing establishment and does not create new post categories.",
        timeHorizon: "medium",
        segments: ["educators", "rural-households", "youth"],
      },
      {
        id: "edu-tpl-feeding",
        title: "National school feeding expansion",
        summary: "Expansion of the home-grown feeding model.",
        policyText:
          "This programme expands the school feeding model that purchases staple food from smallholder producers near the school. It sets a minimum number of feeding days per term, contracts local suppliers through the school development committee, and links payment to verified delivery at the school. Coverage is prioritised by an agreed vulnerability ranking of wards. Schools in surplus-producing areas continue to receive the same allocation, since the model is designed to stabilise attendance rather than to target food deficit areas alone.",
        timeHorizon: "long",
        segments: ["rural-households", "smallholder-farmers", "development-partners", "women-led-enterprises"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "education-act", "childrens-act", "manpower-planning-act"],
    documents: [
      { id: "edu-doc-1", name: "Annual_School_Census_2026.pdf", kind: "pdf", sizeLabel: "4.1 MB", date: "2026-08-12", note: "Enrolment, staffing and infrastructure census.", instrument: "education-act" },
      { id: "edu-doc-2", name: "Teacher_Deployment_Analysis.txt", kind: "txt", sizeLabel: "142 KB", date: "2026-07-03", note: "Vacancy and ratio analysis by district.", instrument: "manpower-planning-act" },
      { id: "edu-doc-3", name: "Curriculum_Implementation_Review.docx", kind: "docx", sizeLabel: "2.2 MB", date: "2026-05-21", note: "Review of curriculum rollout readiness.", instrument: "education-act" },
    ],
  },
  {
    id: "hedu",
    name: "Ministry of Higher and Tertiary Education, Innovation, Science and Technology Development",
    shortName: "Higher and Tertiary Education",
    abbr: "MoHTEISTD",
    mandate:
      "Oversees universities, polytechnics and vocational training, and leads national innovation, research and technology development policy.",
    description:
      "This ministry governs the tertiary sector and the national skills, technology and innovation agenda. It sets enrolment policy, supports vocational training centres, and administers research funding. Simulation is used to test how changes in funding formulae, tuition or vocational expansion affect enrolment, graduate supply and employer demand.",
    priorities: [
      { id: "hedu-skills", label: "Skills-technology-innovation framework", note: "Align graduate output with identified national skill gaps." },
      { id: "hedu-tvet", label: "Vocational training expansion", note: "Grow practical training places outside the universities." },
      { id: "hedu-commercialisation", label: "Research commercialisation", note: "Move funded research towards registered and licensed outputs." },
      { id: "hedu-industry", label: "University-industry linkage", note: "Embed workplace attachment in every programme." },
    ],
    indicators: [
      { id: "hedu-enrolment", label: "Tertiary enrolment", value: "7.7", unit: "% gross", score: 8, tone: "warning", note: "Tertiary enrolment as a share of the population of tertiary age.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: School enrolment, tertiary (% gross)", asOf: "2024" } },
      { id: "hedu-tvet-share", label: "Vocational share of enrolment", value: "34", unit: "%", score: 54, tone: "warning", note: "Share of tertiary students in vocational rather than academic programmes.", basis: { kind: "modelled" } },
      { id: "hedu-graduation", label: "Graduation rate", value: "78", unit: "%", score: 78, tone: "success", note: "Registered students completing their programme within the standard duration.", basis: { kind: "modelled" } },
      { id: "hedu-research", label: "Scientific journal articles", value: "519.9", unit: "articles", score: 52, tone: "gold", note: "Scientific and technical journal articles published in the year.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Scientific and technical journal articles", asOf: "2023" } },
      { id: "hedu-staff", label: "Academic staff with doctorates", value: "31", unit: "%", score: 31, tone: "warning", note: "University academic staff holding a doctorate.", basis: { kind: "modelled" } },
      { id: "hedu-research-spend", label: "Research spending", value: "0.3", unit: "% of GDP", score: 30, tone: "warning", note: "Gross expenditure on research and development.", basis: { kind: "modelled" } },
      { id: "hedu-attachment", label: "Students on attachment", value: "54", unit: "%", score: 54, tone: "primary", note: "Students placed with an industry partner.", basis: { kind: "modelled" } },
      { id: "hedu-digital", label: "Digital learning access", value: "66", unit: "%", score: 66, tone: "gold", note: "Students with reliable access to online learning.", basis: { kind: "modelled" } },
      { id: "hedu-fees", label: "Fee arrears", value: "27", unit: "%", score: 48, tone: "warning", note: "Students carrying fee arrears.", basis: { kind: "modelled" } },
      { id: "hedu-stem", label: "Science and technology graduates", value: "44", unit: "%", score: 44, tone: "success", note: "Graduates in science, technology and engineering.", basis: { kind: "modelled" } },
      { id: "hedu-lecturer-ratio", label: "Student-lecturer ratio", value: "1:24", score: 55, tone: "warning", note: "Students per full-time lecturer.", basis: { kind: "modelled" } },
      { id: "hedu-gender", label: "Female tertiary enrolment", value: "46", unit: "%", score: 46, tone: "gold", note: "Share of tertiary enrolment who are women.", basis: { kind: "modelled" } },
      { id: "hedu-apprentices", label: "Apprentices in training", value: "18,500", score: 62, tone: "primary", note: "Apprentices registered in the national scheme.", basis: { kind: "modelled" } },
      { id: "hedu-incubation", label: "Start-ups incubated", value: "320", score: 68, tone: "success", note: "Start-ups supported through campus incubators.", basis: { kind: "modelled" } },
      { id: "hedu-industry", label: "Industry-linked programmes", value: "41", unit: "%", score: 41, tone: "gold", note: "Programmes with a formal industry partner.", basis: { kind: "modelled" } },
      { id: "hedu-completion", label: "Qualification completion rate", value: "76", unit: "%", score: 76, tone: "success", note: "Enrolled students completing their qualification.", basis: { kind: "modelled" } },
      { id: "hedu-distance", label: "Distance learners", value: "22", unit: "%", score: 22, tone: "gold", note: "Students studying through open and distance learning.", basis: { kind: "modelled" } },
      { id: "hedu-lab", label: "Laboratory capacity met", value: "58", unit: "%", score: 58, tone: "warning", note: "Teaching laboratory demand met by capacity.", basis: { kind: "modelled" } },
      { id: "hedu-innovation-grants", label: "Innovation grants awarded", value: "96", score: 60, tone: "primary", note: "Innovation grants awarded to researchers.", basis: { kind: "modelled" } },
      { id: "hedu-graduate-employment", label: "Graduate employment", value: "63", unit: "%", score: 63, tone: "success", note: "Graduates employed within a year of completing.", basis: { kind: "modelled" } },
    ],
    segments: ["youth", "educators", "formal-business", "diaspora", "development-partners", "researchers", "employer-federations", "urban-households", "rural-households", "civil-servants", "financial-sector", "manufacturers", "ict-operators", "women-led-enterprises", "media", "trade-unions", "tertiary-students", "professional-councils", "fintech-mobile-money", "smes", "construction-sector", "teachers-unions", "youth-councils", "private-schools", "polytechnic-lecturers", "tvet-instructors", "apprentices", "software-developers", "engineering-firms", "laboratory-techs", "film-makers", "creative-industries", "musicians", "ecommerce-platforms", "isps", "data-centres", "cybersecurity-firms", "journalists", "community-radio", "rural-teachers"],
    policyTemplates: [
      {
        id: "hedu-tpl-funding",
        title: "Outcome-linked tertiary funding formula",
        summary: "Funding weighted to completion, workplace attachment and skills need.",
        policyText:
          "This formula replaces enrolment-based funding with a weighted allocation. Institutions receive a base grant for accredited programmes plus a weighted component for student completion, verified workplace attachment and enrolment in programmes listed on the national skills priority schedule. Institutions that persistently underperform on completion receive a support plan before any reduction is applied. Tuition policy is unchanged; the formula governs the state grant that sits alongside it.",
        timeHorizon: "long",
        segments: ["educators", "youth", "formal-business"],
      },
      {
        id: "hedu-tpl-tvet",
        title: "Vocational training centre expansion",
        summary: "New and upgraded practical training places in each province.",
        policyText:
          "This programme expands practical training capacity by upgrading existing vocational centres rather than building new institutions. Each province identifies centres with functioning workshops and available trainers, and receives equipment and trainer development support against a published plan. Short courses for people already in work are priced at cost recovery and run outside standard term times. Accreditation is granted by the existing quality council; the programme creates no new award categories.",
        timeHorizon: "medium",
        segments: ["youth", "informal-traders", "women-led-enterprises", "formal-business"],
      },
      {
        id: "hedu-tpl-innovation",
        title: "Research and innovation fund",
        summary: "Competitive research grants tied to commercialisation milestones.",
        policyText:
          "This fund awards competitive grants to research teams, with disbursement in two instalments. The second instalment is released only when the team reports a defined commercialisation milestone such as a working model tested with an industry partner, a registered intellectual property filing, or a licensing discussion recorded in writing. Teams that cannot reach the milestone within the period are not penalised, but the unspent second instalment returns to the fund for the next round.",
        timeHorizon: "long",
        segments: ["educators", "formal-business", "diaspora", "development-partners"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "higher-education-act", "research-act", "research-development-centre-act", "manpower-planning-act"],
    documents: [
      { id: "hedu-doc-1", name: "Tertiary_Enrolment_Report_2026.pdf", kind: "pdf", sizeLabel: "3.3 MB", date: "2026-08-21", note: "Enrolment and completion by institution.", instrument: "higher-education-act" },
      { id: "hedu-doc-2", name: "Skills_Priority_Schedule.txt", kind: "txt", sizeLabel: "88 KB", date: "2026-07-10", note: "Occupations identified as national skill gaps.", instrument: "manpower-planning-act" },
      { id: "hedu-doc-3", name: "Innovation_Fund_Design_Note.docx", kind: "docx", sizeLabel: "1.4 MB", date: "2026-05-29", note: "Design options for competitive research funding.", instrument: "research-act" },
    ],
  },
  {
    id: "ict",
    name: "Ministry of Information Communication Technology, Postal and Courier Services",
    shortName: "Information Communication Technology",
    abbr: "MoICT",
    mandate:
      "Sets national information and communication technology policy, promotes universal access, and oversees postal and courier services and the government technology estate.",
    description:
      "This ministry sets connectivity, cybersecurity and digital government policy, and is the custodian of the national technology estate on which this dashboard runs. It administers the universal service fund, the national data centre policy and the postal network. Simulation is used to test how changes in data costs, coverage obligations or service digitisation reach households and small businesses.",
    priorities: [
      { id: "ict-broadband-coverage", label: "National broadband coverage", note: "Extend reliable coverage to underserved districts." },
      { id: "ict-egov-services", label: "Digital government services", note: "Move high-volume public services to a single online channel." },
      { id: "ict-security", label: "Cybersecurity and data sovereignty", note: "Keep government data inside national custody." },
      { id: "ict-inclusion", label: "Digital financial inclusion", note: "Reduce the cost of digital transactions for low-income users." },
    ],
    indicators: [
      { id: "ict-coverage", label: "Mobile subscriptions", value: "94.2", unit: "per 100 people", score: 94, tone: "success", note: "Active mobile cellular subscriptions per 100 people.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Mobile cellular subscriptions (per 100 people)", asOf: "2024" } },
      { id: "ict-broadband", label: "Fixed broadband subscriptions", value: "1.9", unit: "per 100 people", score: 2, tone: "warning", note: "Fixed broadband subscriptions per 100 people.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Fixed broadband subscriptions (per 100 people)", asOf: "2024" } },
      { id: "ict-data-cost", label: "Data cost", value: "4.1", unit: "% of GNI", score: 58, tone: "warning", note: "Entry-level mobile data basket as a share of average income.", basis: { kind: "modelled" } },
      { id: "ict-egov", label: "Services online", value: "38 of 120", score: 32, tone: "gold", note: "High-volume public services available end to end online.", basis: { kind: "modelled" } },
      { id: "ict-internet", label: "Individuals using the Internet", value: "41.6", unit: "% of population", score: 42, tone: "gold", note: "People who used the internet in the recent period.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Individuals using the Internet (% of population)", asOf: "2024" } },
      { id: "ict-cyber", label: "Cyber incidents contained", value: "86", unit: "%", score: 86, tone: "success", note: "Reported incidents contained within the response window.", basis: { kind: "modelled" } },
      { id: "ict-uptime", label: "Government network uptime", value: "99.2", unit: "%", score: 92, tone: "success", note: "Availability of the shared government network.", basis: { kind: "modelled" } },
      { id: "ict-usf", label: "Universal service funds disbursed", value: "58", unit: "%", score: 58, tone: "primary", note: "Universal service funds committed to projects.", basis: { kind: "modelled" } },
      { id: "ict-postal", label: "Postal outlets per province", value: "34", score: 60, tone: "gold", note: "Operating postal outlets per province on average.", basis: { kind: "modelled" } },
      { id: "ict-digital-id", label: "Digital identity services", value: "2 of 8", score: 30, tone: "warning", note: "Identity services available on the digital channel.", basis: { kind: "modelled" } },
      { id: "ict-spectrum", label: "Spectrum assigned", value: "74", unit: "%", score: 74, tone: "success", note: "Assignable radio spectrum in productive use.", basis: { kind: "modelled" } },
      { id: "ict-fibre", label: "Fibre backbone reach", value: "46", unit: "%", score: 46, tone: "gold", note: "Districts reached by the national fibre backbone.", basis: { kind: "modelled" } },
      { id: "ict-mast", label: "Base stations commissioned", value: "2,140", score: 60, tone: "primary", note: "Base stations commissioned in the period.", basis: { kind: "modelled" } },
      { id: "ict-affordability", label: "Data basket cost", value: "3.2", unit: "% of income", score: 48, tone: "warning", note: "Cost of a basic data basket as a share of income.", basis: { kind: "modelled" } },
      { id: "ict-skills", label: "Digital skills trained", value: "84,000", score: 70, tone: "success", note: "People completing a digital-skills course.", basis: { kind: "modelled" } },
      { id: "ict-govcloud", label: "Government services on the cloud", value: "38", unit: "%", score: 38, tone: "gold", note: "Government services hosted on the shared cloud.", basis: { kind: "modelled" } },
      { id: "ict-rural-broadband", label: "Rural broadband coverage", value: "31", unit: "%", score: 31, tone: "warning", note: "Rural population with broadband coverage.", basis: { kind: "modelled" } },
      { id: "ict-incidents", label: "Major network incidents", value: "12", score: 55, tone: "warning", note: "Major network outages recorded in the period.", basis: { kind: "modelled" } },
      { id: "ict-ebusiness", label: "Businesses trading online", value: "24", unit: "%", score: 24, tone: "gold", note: "Registered businesses selling online.", basis: { kind: "modelled" } },
      { id: "ict-school-lab", label: "Schools with a computer lab", value: "42", unit: "%", score: 42, tone: "primary", note: "Schools with a working computer laboratory.", basis: { kind: "modelled" } },
    ],
    segments: ["urban-households", "rural-households", "financial-sector", "formal-business", "youth", "informal-traders", "ict-operators", "researchers", "civil-servants", "local-authorities", "media", "educators", "persons-with-disabilities", "women-led-enterprises", "energy-water-utilities", "development-partners", "fintech-mobile-money", "microfinance-institutions", "smes", "professional-councils", "tertiary-students", "youth-councils", "urban-ratepayers", "district-councils", "software-developers", "isps", "tower-companies", "data-centres", "cybersecurity-firms", "ecommerce-platforms", "digital-marketers", "journalists", "community-radio", "advertising-agencies", "pr-firms", "bloggers", "courier-firms", "musicians", "film-makers", "creative-industries"],
    policyTemplates: [
      {
        id: "ict-tpl-data-cost",
        title: "Affordable data and universal service review",
        summary: "Review of wholesale pricing and universal service obligations.",
        policyText:
          "This review examines the cost of entry-level data and the obligations attached to the universal service fund. It proposes a published wholesale reference rate, requires operators to report the retail offers built on it, and directs the fund towards shared infrastructure in districts that remain unserved rather than towards operator-specific projects. Any licence obligation changed by the review applies from the next licence period so that existing investments are not affected mid-term.",
        timeHorizon: "medium",
        segments: ["urban-households", "rural-households", "informal-traders", "youth"],
      },
      {
        id: "ict-tpl-egov",
        title: "Digital government services programme",
        summary: "Consolidation of high-volume services onto one channel.",
        policyText:
          "This programme moves a defined list of high-volume public services onto a single digital channel. Each service is redesigned around one submission, one reference number and a published turnaround time, and is made available from any device including a feature phone by short message. Departments remain accountable for the decision; the programme standardises the intake, tracking and notification layers behind it. Services with a statutory paper requirement are digitised for intake only.",
        timeHorizon: "long",
        segments: ["formal-business", "urban-households", "informal-traders", "civil-servants"],
      },
      {
        id: "ict-tpl-sovereignty",
        title: "Government data sovereignty standard",
        summary: "Residency, classification and audit rules for state data.",
        policyText:
          "This standard sets the rules under which government data may be held and processed. It classifies state data into three tiers, requires the two most sensitive tiers to be held and processed inside the national estate, and requires every system holding them to be listed on a published register maintained by the custodian ministry. Systems already in service are given a defined transition window. The standard does not restrict the use of commercial cloud for public-facing information that carries no personal or security classification.",
        timeHorizon: "medium",
        segments: ["civil-servants", "financial-sector", "formal-business", "development-partners"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "postal-telecommunications-act", "broadcasting-services-act", "access-to-information-act"],
    documents: [
      { id: "ict-doc-1", name: "National_Broadband_Coverage_Survey.pdf", kind: "pdf", sizeLabel: "2.9 MB", date: "2026-08-14", note: "Coverage and quality survey by district.", instrument: "postal-telecommunications-act" },
      { id: "ict-doc-2", name: "Digital_Services_Inventory.txt", kind: "txt", sizeLabel: "104 KB", date: "2026-07-17", note: "Inventory of online-ready public services.", instrument: "access-to-information-act" },
      { id: "ict-doc-3", name: "Data_Residency_Standard_Draft.docx", kind: "docx", sizeLabel: "780 KB", date: "2026-06-05", note: "Draft classification and residency standard.", instrument: "access-to-information-act" },
    ],
  },
  {
    id: "mines",
    name: "Ministry of Mines and Mining Development",
    shortName: "Mines and Mining Development",
    abbr: "MoMMD",
    mandate:
      "Administers mineral rights, regulates mining operations, and promotes the exploration, extraction and beneficiation of the country's mineral resources.",
    description:
      "This ministry administers mineral rights, inspects mining operations, and promotes beneficiation of the country's mineral endowment. Its decisions on rights, royalties and local processing shape both export earnings and employment in mining districts. Simulation is used to test how royalty or beneficiation measures affect large, medium and artisanal producers differently.",
    priorities: [
      { id: "mines-process", label: "Mineral beneficiation", note: "Move more processing of raw minerals inside the country." },
      { id: "mines-artisanal", label: "Artisanal mining formalisation", note: "Bring small-scale operations into a registered framework." },
      { id: "mines-rights", label: "Mining rights administration", note: "Reduce the time taken to register and renew claims." },
      { id: "mines-safety", label: "Mine health and safety", note: "Reduce accidents through inspection and reporting." },
    ],
    indicators: [
      { id: "mines-share", label: "Ores and metals share of exports", value: "33.8", unit: "% of merchandise exports", score: 34, tone: "gold", note: "Ores and metals as a share of merchandise export value.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Ores and metals exports (% of merchandise exports)", asOf: "2024" } },
      { id: "mines-beneficiation", label: "Domestically processed output", value: "27", unit: "%", score: 27, tone: "warning", note: "Share of extracted mineral value processed before export.", basis: { kind: "modelled" } },
      { id: "mines-licences", label: "Licence turnaround", value: "48", unit: "days", score: 42, tone: "primary", note: "Average time from complete application to decision.", basis: { kind: "modelled" } },
      { id: "mines-incidents", label: "Reportable incidents", value: "31", unit: "per year", score: 62, tone: "success", note: "Reportable accidents recorded across inspected operations.", basis: { kind: "modelled" } },
      { id: "mines-revenue", label: "Mineral export earnings", value: "USD 4.2B", score: 70, tone: "success", note: "Export earnings from mineral sales.", basis: { kind: "modelled" } },
      { id: "mines-royalties", label: "Royalties collected", value: "92", unit: "%", score: 92, tone: "primary", note: "Assessed royalties collected within the period.", basis: { kind: "modelled" } },
      { id: "mines-employment", label: "Mining employment", value: "58,000", score: 74, tone: "gold", note: "People employed in large-scale mining.", basis: { kind: "modelled" } },
      { id: "mines-rehab", label: "Land rehabilitated", value: "38", unit: "%", score: 38, tone: "warning", note: "Disturbed land returned to a stable condition.", basis: { kind: "modelled" } },
      { id: "mines-smelter", label: "Smelter utilisation", value: "44", unit: "%", score: 44, tone: "gold", note: "Capacity used at domestic processing facilities.", basis: { kind: "modelled" } },
      { id: "mines-inspections", label: "Safety inspections completed", value: "76", unit: "%", score: 76, tone: "success", note: "Scheduled inspections of registered operations completed.", basis: { kind: "modelled" } },
      { id: "mines-gold", label: "Gold deliveries", value: "34.6", unit: "tonnes", score: 68, tone: "success", note: "Gold delivered to the national refinery.", basis: { kind: "modelled" } },
      { id: "mines-platinum", label: "Platinum output", value: "480,000", unit: "oz", score: 72, tone: "success", note: "Platinum-group metals produced.", basis: { kind: "modelled" } },
      { id: "mines-lithium", label: "Lithium concentrate", value: "620,000", unit: "tonnes", score: 66, tone: "success", note: "Lithium concentrate produced for export.", basis: { kind: "modelled" } },
      { id: "mines-csr", label: "Community development spend", value: "USD 96M", score: 62, tone: "primary", note: "Mining-company spend on community development.", basis: { kind: "modelled" } },
      { id: "mines-fatalities", label: "Fatal mining accidents", value: "8", score: 40, tone: "warning", note: "Fatal accidents recorded at mining operations.", basis: { kind: "modelled" } },
      { id: "mines-artisanal", label: "Registered artisanal miners", value: "42,000", score: 60, tone: "gold", note: "Artisanal miners on the official register.", basis: { kind: "modelled" } },
      { id: "mines-rents", label: "Mineral rents to GDP", value: "6.4", unit: "%", score: 64, tone: "success", note: "Mineral rents as a share of GDP.", basis: { kind: "modelled" } },
      { id: "mines-value-local", label: "Value retained locally", value: "28", unit: "%", score: 28, tone: "gold", note: "Share of mineral value retained in the country.", basis: { kind: "modelled" } },
      { id: "mines-water", label: "Mine water permits current", value: "71", unit: "%", score: 71, tone: "primary", note: "Operations with a current water-use permit.", basis: { kind: "modelled" } },
      { id: "mines-closure", label: "Mines with a closure plan", value: "54", unit: "%", score: 54, tone: "warning", note: "Operations holding an approved closure plan.", basis: { kind: "modelled" } },
    ],
    segments: ["mining-operators", "rural-households", "exporters", "local-authorities", "formal-business", "artisanal-miners", "conservation-communities", "urban-households", "civil-servants", "financial-sector", "manufacturers", "transport-operators", "energy-water-utilities", "trade-unions", "women-led-enterprises", "development-partners", "mining-host-communities", "smes", "construction-sector", "professional-councils", "freight-logistics", "water-user-associations", "timber-forestry-operators", "district-councils", "coal-producers", "mine-suppliers", "smelters", "mineral-dealers", "diamond-sector", "fuel-retailers", "haulage-operators", "warehousing", "customs-brokers", "engineering-firms", "chemicals-industry", "cement-producers", "rail-users", "drivers-associations", "journalists", "community-radio"],
    policyTemplates: [
      {
        id: "mines-tpl-royalty",
        title: "Graded royalty schedule for mineral exports",
        summary: "Royalty rates that step by mineral and by level of processing.",
        policyText:
          "This measure replaces a flat royalty with a schedule graded by mineral and by the stage at which the product leaves the country. Concentrate exports attract the highest rate, partially processed products a middle rate, and refined or finished metal the lowest. The schedule is published in advance and applies to new shipments from a fixed date. Operators holding existing agreements continue under their agreed terms until those agreements expire, and all rates are reported in the annual mineral revenue statement.",
        timeHorizon: "medium",
        segments: ["mining-operators", "exporters", "formal-business", "local-authorities"],
      },
      {
        id: "mines-tpl-formalisation",
        title: "Artisanal and small-scale mining formalisation",
        summary: "Registration, safety training and regulated marketing channels.",
        policyText:
          "This programme brings small-scale mining operations into a registered framework. It creates a simplified registration route with a single fee, requires basic safety training before a certificate is issued, and designates licensed buying points where output can be sold at the published price. Registered operators gain access to the buying points and to group equipment hire. Operations that remain unregistered after the transition period are subject to existing enforcement, and enforcement is concentrated on the environmental and safety provisions rather than on the act of mining itself.",
        timeHorizon: "medium",
        segments: ["mining-operators", "rural-households", "informal-traders", "local-authorities"],
      },
      {
        id: "mines-tpl-beneficiation",
        title: "Local beneficiation incentive framework",
        summary: "Power, land and fiscal incentives for domestic processing.",
        policyText:
          "This framework offers defined incentives to operators who process mineral output domestically. Incentives cover guaranteed power allocation at the industrial tariff, priority access to serviced land in designated zones, and a reduction in the export royalty for the processed product. Eligibility requires a published processing plan with verified input volumes. Operators that accept the incentives commit to a minimum domestic processing volume each year, reported quarterly to the ministry.",
        timeHorizon: "long",
        segments: ["mining-operators", "formal-business", "exporters", "local-authorities"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "mines-minerals-act", "mines-minerals-bill-2025", "movable-property-security-act", "environmental-management-act"],
    documents: [
      { id: "mines-doc-1", name: "Mineral_Revenue_Statement_2026.pdf", kind: "pdf", sizeLabel: "2.2 MB", date: "2026-08-07", note: "Royalty and mineral revenue by commodity.", instrument: "mines-minerals-act" },
      { id: "mines-doc-2", name: "Artisanal_Mining_Register.txt", kind: "txt", sizeLabel: "156 KB", date: "2026-07-01", note: "Registered small-scale operations by district.", instrument: "mines-minerals-bill-2025" },
      { id: "mines-doc-3", name: "Beneficiation_Options_Paper.docx", kind: "docx", sizeLabel: "1.9 MB", date: "2026-04-30", note: "Options for domestic processing incentives.", instrument: "environmental-management-act" },
    ],
  },
  {
    id: "energy",
    name: "Ministry of Energy and Power Development",
    shortName: "Energy and Power Development",
    abbr: "MoEPD",
    mandate:
      "Develops and regulates the electricity, petroleum and renewable energy sectors, and secures the national energy supply.",
    description:
      "This ministry is responsible for keeping the lights on and fuel in the pumps. It plans generation capacity, runs rural electrification, and regulates the petroleum supply chain through the national oil company. Simulation is used to test how tariff changes, fuel subsidy measures or electrification targets are absorbed by households, businesses and miners.",
    priorities: [
      { id: "energy-generation", label: "Generation capacity expansion", note: "Close the supply gap with domestic and independent generation." },
      { id: "energy-electrification", label: "Rural electrification", note: "Extend grid and off-grid supply to unserved districts." },
      { id: "energy-fuel", label: "Fuel supply security", note: "Maintain strategic stocks and reliable import arrangements." },
      { id: "energy-ipp", label: "Independent power producer framework", note: "Make private generation projects bankable and faster to close." },
    ],
    indicators: [
      { id: "energy-access", label: "Electricity access", value: "62", unit: "% of population", score: 62, tone: "warning", note: "People with access to electricity.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Access to electricity (% of population)", asOf: "2024" } },
      { id: "energy-gen", label: "Installed capacity", value: "2.5", unit: "GW", score: 68, tone: "primary", note: "Installed generation capacity connected to the national grid.", basis: { kind: "modelled" } },
      { id: "energy-supply", label: "Unserved demand", value: "410", unit: "MW", score: 48, tone: "gold", note: "Average shortfall met through load management.", basis: { kind: "modelled" } },
      { id: "energy-losses", label: "Transmission and distribution losses", value: "23.0", unit: "%", score: 23, tone: "warning", note: "Energy lost between generation and billing.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Electric power transmission and distribution losses (% of output)", asOf: "2023" } },
      { id: "energy-water", label: "Water supply coverage", value: "68", unit: "%", score: 68, tone: "gold", note: "Households with access to an improved water supply.", basis: { kind: "modelled" } },
      { id: "energy-outages", label: "Average outage hours", value: "9.4", unit: "hrs per month", score: 45, tone: "warning", note: "Average monthly duration of supply interruptions.", basis: { kind: "modelled" } },
      { id: "energy-ipp", label: "Independent power produced", value: "180", unit: "MW", score: 40, tone: "gold", note: "Capacity supplied by independent producers.", basis: { kind: "modelled" } },
      { id: "energy-solar", label: "Solar connections", value: "64,000", score: 58, tone: "success", note: "Households and institutions on solar systems.", basis: { kind: "modelled" } },
      { id: "energy-fuel", label: "Fuel stock cover", value: "22", unit: "days", score: 66, tone: "primary", note: "National fuel stocks in days of cover.", basis: { kind: "modelled" } },
      { id: "energy-collection", label: "Billing collection rate", value: "88", unit: "%", score: 88, tone: "success", note: "Billed electricity revenue collected.", basis: { kind: "modelled" } },
      { id: "energy-peak", label: "Peak demand met", value: "82", unit: "%", score: 82, tone: "success", note: "Peak electricity demand met without load-shedding.", basis: { kind: "modelled" } },
      { id: "energy-coal", label: "Coal-fired output", value: "1,240", unit: "GWh", score: 60, tone: "primary", note: "Electricity generated from coal.", basis: { kind: "modelled" } },
      { id: "energy-hydro", label: "Hydro output", value: "3,100", unit: "GWh", score: 74, tone: "success", note: "Electricity generated from hydro.", basis: { kind: "modelled" } },
      { id: "energy-imports", label: "Imported power share", value: "24", unit: "%", score: 44, tone: "warning", note: "Electricity supplied from imports.", basis: { kind: "modelled" } },
      { id: "energy-gas", label: "Gas-to-power output", value: "420", unit: "GWh", score: 52, tone: "gold", note: "Electricity generated from gas.", basis: { kind: "modelled" } },
      { id: "energy-tariff", label: "Tariff cost recovery", value: "68", unit: "%", score: 68, tone: "primary", note: "Revenue recovered against the cost of supply.", basis: { kind: "modelled" } },
      { id: "energy-rural", label: "Rural electrification", value: "41", unit: "%", score: 41, tone: "gold", note: "Rural households connected to electricity.", basis: { kind: "modelled" } },
      { id: "energy-netmeter", label: "Net-metered connections", value: "3,600", score: 30, tone: "gold", note: "Rooftop solar connections on net metering.", basis: { kind: "modelled" } },
      { id: "energy-minigrid", label: "Mini-grids operating", value: "48", score: 40, tone: "primary", note: "Isolated mini-grids supplying communities.", basis: { kind: "modelled" } },
      { id: "energy-efficiency", label: "Demand avoided by efficiency", value: "4.6", unit: "%", score: 60, tone: "success", note: "Demand avoided through efficiency measures.", basis: { kind: "modelled" } },
    ],
    segments: ["formal-business", "urban-households", "rural-households", "mining-operators", "informal-traders", "energy-water-utilities", "transport-operators", "civil-servants", "manufacturers", "smallholder-farmers", "local-authorities", "development-partners", "financial-sector", "women-led-enterprises", "informal-workers", "trade-unions", "construction-sector", "smes", "professional-councils", "mining-host-communities", "informal-settlement-residents", "urban-ratepayers", "district-councils", "freight-logistics", "coal-producers", "fuel-retailers", "lpg-distributors", "solar-installers", "mine-suppliers", "smelters", "engineering-firms", "cement-producers", "chemicals-industry", "warehousing", "haulage-operators", "isps", "drivers-associations", "journalists", "community-radio", "courier-firms"],
    policyTemplates: [
      {
        id: "energy-tpl-tariff",
        title: "Cost-reflective tariff path",
        summary: "A multi-year tariff path with a lifeline band.",
        policyText:
          "This measure sets a published tariff path for a defined number of years rather than an annual determination. It retains a lifeline band for low-consumption households, moves industrial and mining consumers to cost-reflective levels in steps, and ties each step to a published service standard so that an increase cannot take effect if the standard was missed in the preceding period. The regulator continues to conduct its own review; the path sets the expectation consumers and investors can plan against.",
        timeHorizon: "long",
        segments: ["urban-households", "rural-households", "formal-business", "mining-operators"],
      },
      {
        id: "energy-tpl-offgrid",
        title: "Off-grid electrification programme",
        summary: "Solar mini-grids and household systems for unserved districts.",
        policyText:
          "This programme addresses districts that the grid is unlikely to reach within the planning period. It combines community solar mini-grids in trading centres with household solar systems for dispersed settlements, procured against a published technical specification. Tariffs within a mini-grid follow the national lifeline band and are collected locally, with the operating arrangement audited annually. Grid extension remains the route for settlements inside the defined grid reach.",
        timeHorizon: "medium",
        segments: ["rural-households", "women-led-enterprises", "informal-traders", "development-partners"],
      },
      {
        id: "energy-tpl-fuel",
        title: "Fuel pricing and strategic stock review",
        summary: "Pricing mechanism reform and stockholding obligations.",
        policyText:
          "This review changes both how fuel prices are set and how much stock must be held. It proposes a published pricing formula updated on a fixed cycle, replacing discretionary adjustment, and requires importers to hold a defined number of days of consumption in verified storage. Stock levels are reported fortnightly to the regulator and published in aggregate. The formula does not set a price level; it determines how the price changes when input costs change.",
        timeHorizon: "short",
        segments: ["informal-traders", "formal-business", "urban-households", "mining-operators"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "electricity-act", "energy-regulatory-act", "petroleum-act"],
    documents: [
      { id: "energy-doc-1", name: "National_Electrification_Survey.pdf", kind: "pdf", sizeLabel: "3.7 MB", date: "2026-08-18", note: "Access and connection survey by district.", instrument: "electricity-act" },
      { id: "energy-doc-2", name: "Tariff_Path_Modelling.txt", kind: "txt", sizeLabel: "132 KB", date: "2026-06-25", note: "Modelled tariff path and affordability analysis.", instrument: "energy-regulatory-act" },
      { id: "energy-doc-3", name: "Fuel_Stockholding_Review.docx", kind: "docx", sizeLabel: "940 KB", date: "2026-05-08", note: "Review of strategic stock obligations.", instrument: "petroleum-act" },
    ],
  },
  {
    id: "psc",
    name: "Public Service Commission",
    shortName: "Public Service Commission",
    abbr: "PSC",
    mandate:
      "Regulates the public service, appoints and disciplines public officers, and manages the establishment, terms of service and conditions of employment outside the security services.",
    description:
      "The Public Service Commission is the employer of the civil service. It controls the establishment, recruitment, promotion and discipline of public officers, and maintains the payroll integrity of the service. Simulation is used to test how changes to establishment, remuneration structure or performance management are likely to be received across cadres and grades.",
    priorities: [
      { id: "psc-payroll-integrity", label: "Establishment and payroll integrity", note: "Hold the establishment to funded posts and verified officers." },
      { id: "psc-remuneration", label: "Remuneration review", note: "Maintain a defensible structure across grades and cadres." },
      { id: "psc-performance", label: "Performance management", note: "Link appraisal to measurable service delivery." },
      { id: "psc-capacity", label: "Capacity development", note: "Target training at the skills the service actually lacks." },
    ],
    indicators: [
      { id: "psc-establishment", label: "Funded posts filled", value: "88", unit: "%", score: 88, tone: "success", note: "Funded establishment positions with an officer in post.", basis: { kind: "modelled" } },
      { id: "psc-age", label: "Officers aged over 55", value: "19", unit: "%", score: 19, tone: "warning", note: "Share of the establishment approaching retirement age.", basis: { kind: "modelled" } },
      { id: "psc-appraisal", label: "Appraisals completed", value: "64", unit: "%", score: 64, tone: "primary", note: "Officers with a completed and countersigned annual appraisal.", basis: { kind: "modelled" } },
      { id: "psc-training", label: "Training days per officer", value: "4.2", score: 42, tone: "gold", note: "Average recorded training days per officer in the year.", basis: { kind: "modelled" } },
      { id: "psc-vacancies", label: "Appointments made", value: "87", unit: "%", score: 87, tone: "success", note: "Officers appointed to funded posts during the year.", basis: { kind: "modelled" } },
      { id: "psc-establishment-size", label: "Establishment size", value: "198,000", score: 64, tone: "primary", note: "Officers on the public service establishment.", basis: { kind: "modelled" } },
      { id: "psc-wagebill", label: "Wage bill", value: "42", unit: "% of revenue", score: 42, tone: "warning", note: "Employment costs as a share of government revenue.", basis: { kind: "modelled" } },
      { id: "psc-charter", label: "Departments with a service charter", value: "74", unit: "%", score: 74, tone: "gold", note: "Departments publishing an approved service charter.", basis: { kind: "modelled" } },
      { id: "psc-grievances", label: "Grievances resolved", value: "81", unit: "%", score: 81, tone: "primary", note: "Staff grievances resolved within the standard period.", basis: { kind: "modelled" } },
      { id: "psc-digital-hr", label: "HR processes online", value: "46", unit: "%", score: 46, tone: "gold", note: "Human-resource processes carried on the digital channel.", basis: { kind: "modelled" } },
      { id: "psc-retirement", label: "Projected retirements (5 years)", value: "14,200", score: 55, tone: "warning", note: "Officers due to retire within five years.", basis: { kind: "modelled" } },
      { id: "psc-gender", label: "Women in senior posts", value: "38", unit: "%", score: 38, tone: "gold", note: "Women holding senior public-service posts.", basis: { kind: "modelled" } },
      { id: "psc-disability", label: "Officers with a disability", value: "4.2", unit: "%", score: 42, tone: "primary", note: "Public officers declaring a disability.", basis: { kind: "modelled" } },
      { id: "psc-recruitment", label: "Days to fill a post", value: "96", unit: "days", score: 45, tone: "warning", note: "Average days to fill an advertised post.", basis: { kind: "modelled" } },
      { id: "psc-discipline", label: "Disciplinary cases concluded", value: "78", unit: "%", score: 78, tone: "gold", note: "Disciplinary cases concluded within the period.", basis: { kind: "modelled" } },
      { id: "psc-performance", label: "Departments meeting service standards", value: "71", unit: "%", score: 71, tone: "success", note: "Departments meeting their published service standards.", basis: { kind: "modelled" } },
      { id: "psc-innovation", label: "Innovation proposals adopted", value: "124", score: 60, tone: "primary", note: "Officer innovation proposals adopted.", basis: { kind: "modelled" } },
      { id: "psc-wellness", label: "Staff wellness programmes", value: "52", unit: "%", score: 52, tone: "gold", note: "Departments running a staff wellness programme.", basis: { kind: "modelled" } },
      { id: "psc-ethics", label: "Ethics declarations filed", value: "88", unit: "%", score: 88, tone: "success", note: "Officers filing their annual ethics declaration.", basis: { kind: "modelled" } },
      { id: "psc-mobility", label: "Internal transfers processed", value: "1,860", score: 62, tone: "primary", note: "Internal transfers processed in the period.", basis: { kind: "modelled" } },
    ],
    segments: ["civil-servants", "youth", "women-led-enterprises", "local-authorities", "development-partners", "pensioners", "trade-unions", "urban-households", "rural-households", "health-workers", "educators", "persons-with-disabilities", "women", "informal-workers", "employer-federations", "researchers", "professional-councils", "teachers-unions", "nurses-associations", "parliament-legislators", "judiciary-courts", "smes", "village-savings-groups", "youth-councils", "rural-teachers", "urban-teachers", "school-heads", "parents-associations", "ecd-caregivers", "private-clinics", "pharmacists", "laboratory-techs", "radiographers", "ambulance-services", "community-caregivers", "journalists", "community-radio", "software-developers", "data-centres", "cybersecurity-firms"],
    policyTemplates: [
      {
        id: "psc-tpl-establishment",
        title: "Establishment and pay integrity programme",
        summary: "Verification of posts, officers and payroll entries.",
        policyText:
          "This programme verifies the establishment against officers actually in post. It audits the payroll against the establishment register each quarter, requires a biometric or equivalent confirmation of identity for continued payment, and closes posts that have been vacant beyond a defined period rather than carrying them forward. Savings identified are reported by ministry and remain visible to the treasury. Officers wrongly omitted or graded are corrected through a published appeals route with a fixed response time.",
        timeHorizon: "medium",
        segments: ["civil-servants", "formal-business"],
      },
      {
        id: "psc-tpl-performance",
        title: "Performance management framework",
        summary: "Appraisal linked to measurable service standards.",
        policyText:
          "This framework rebuilds the annual appraisal around measurable service standards rather than narrative ratings. Each officer's appraisal references at least one service standard their unit publishes, and supervisors record progress against it at least twice in the year. Outstanding ratings require an evidenced example. Officers rated below expectation receive a documented development plan before any adverse action, and the appeals route is unchanged.",
        timeHorizon: "medium",
        segments: ["civil-servants", "local-authorities"],
      },
      {
        id: "psc-tpl-succession",
        title: "Public service succession and skills renewal",
        summary: "Planned replacement of retiring cadres and targeted training.",
        policyText:
          "This plan addresses the age profile of the establishment. It identifies cadres where a significant proportion of officers will reach retirement age within the planning period, and schedules recruitment and structured handover for those cadres ahead of the retirement dates. Training is directed to the identified skill gaps using existing institutions first. The plan does not change pension terms; it changes when and how replacements are prepared.",
        timeHorizon: "long",
        segments: ["civil-servants", "youth", "educators"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "public-service-act", "constitution-s202-203", "allowances-pensions-act", "labour-act", "tripartite-negotiating-forum-act"],
    documents: [
      { id: "psc-doc-1", name: "Establishment_and_Payroll_Report.pdf", kind: "pdf", sizeLabel: "2.4 MB", date: "2026-08-26", note: "Establishment, vacancy and payroll reconciliation.", instrument: "public-service-act" },
      { id: "psc-doc-2", name: "Age_Profile_Analysis.txt", kind: "txt", sizeLabel: "74 KB", date: "2026-07-09", note: "Age distribution by cadre and ministry.", instrument: "allowances-pensions-act" },
      { id: "psc-doc-3", name: "Performance_Framework_Options.docx", kind: "docx", sizeLabel: "1.2 MB", date: "2026-06-16", note: "Options for appraisal reform.", instrument: "constitution-s202-203" },
    ],
  },
  {
    id: "lg",
    name: "Ministry of Local Government and Public Works",
    shortName: "Local Government and Public Works",
    abbr: "MoLGPW",
    mandate:
      "Superintends urban and rural local authorities, and provides public works including water, sanitation, roads and public buildings.",
    description:
      "This ministry supervises the country's urban councils and rural district councils and delivers the public works they depend on. It administers devolution funds, sets service standards for local authorities, and builds and maintains roads and water infrastructure. Simulation is used to test how changes to funding, service charges or standards affect residents, councils and informal traders.",
    priorities: [
      { id: "lg-water-sanitation", label: "Urban water and sanitation", note: "Restore reliable water supply and safe sanitation in towns." },
      { id: "lg-service", label: "Local authority service delivery", note: "Set and publish service standards councils must meet." },
      { id: "lg-rural-roads", label: "Rural roads and bridges", note: "Maintain the feeder road network that carries produce to market." },
      { id: "lg-devolution", label: "Devolution funds administration", note: "Improve absorption and accountability of devolution funds." },
    ],
    indicators: [
      { id: "lg-water", label: "Basic drinking water access", value: "67.2", unit: "% of population", score: 67, tone: "warning", note: "People using at least basic drinking water services.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: People using at least basic drinking water services (% of population)", asOf: "2024" } },
      { id: "lg-sanitation", label: "Basic sanitation access", value: "34.6", unit: "% of population", score: 35, tone: "warning", note: "People using at least basic sanitation services.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: People using at least basic sanitation services (% of population)", asOf: "2024" } },
      { id: "lg-roads", label: "Feeder roads in good condition", value: "48", unit: "%", score: 48, tone: "gold", note: "Assessed feeder road length in fair or better condition.", basis: { kind: "modelled" } },
      { id: "lg-absorption", label: "Devolution absorption", value: "71", unit: "%", score: 71, tone: "success", note: "Allocated devolution funds spent within the financial year.", basis: { kind: "modelled" } },
      { id: "lg-water-piped", label: "Piped water coverage", value: "72", unit: "%", score: 72, tone: "gold", note: "Households with piped water in served areas.", basis: { kind: "modelled" } },
      { id: "lg-waste", label: "Solid waste collected", value: "64", unit: "%", score: 64, tone: "warning", note: "Household waste collected on the published schedule.", basis: { kind: "modelled" } },
      { id: "lg-revenue", label: "Council revenue collected", value: "59", unit: "%", score: 59, tone: "warning", note: "Assessed council revenue collected in the year.", basis: { kind: "modelled" } },
      { id: "lg-grants", label: "Grant disbursement", value: "84", unit: "%", score: 84, tone: "success", note: "Intergovernmental grants disbursed on time.", basis: { kind: "modelled" } },
      { id: "lg-standards", label: "Councils with service standards", value: "61", unit: "%", score: 61, tone: "primary", note: "Councils publishing service standards.", basis: { kind: "modelled" } },
      { id: "lg-roads-maintained", label: "Local roads maintained", value: "46", unit: "%", score: 46, tone: "gold", note: "Local road network maintained to standard.", basis: { kind: "modelled" } },
      { id: "lg-budget", label: "Local budget execution", value: "74", unit: "%", score: 74, tone: "gold", note: "Council budgets executed within the year.", basis: { kind: "modelled" } },
      { id: "lg-capital", label: "Capital grants utilised", value: "62", unit: "%", score: 62, tone: "primary", note: "Devolution capital grants utilised.", basis: { kind: "modelled" } },
      { id: "lg-water-points", label: "Boreholes functional", value: "68", unit: "%", score: 68, tone: "success", note: "Community boreholes in working order.", basis: { kind: "modelled" } },
      { id: "lg-sanitation-hh", label: "Households with a latrine", value: "61", unit: "%", score: 61, tone: "gold", note: "Households with access to an improved latrine.", basis: { kind: "modelled" } },
      { id: "lg-refuse", label: "Households with refuse collection", value: "44", unit: "%", score: 44, tone: "warning", note: "Urban households with a refuse-collection service.", basis: { kind: "modelled" } },
      { id: "lg-plans", label: "Councils with an approved plan", value: "82", unit: "%", score: 82, tone: "success", note: "Councils with an approved development plan.", basis: { kind: "modelled" } },
      { id: "lg-audit", label: "Councils with clean audits", value: "58", unit: "%", score: 58, tone: "gold", note: "Councils receiving an unqualified audit opinion.", basis: { kind: "modelled" } },
      { id: "lg-revenue-base", label: "Own revenue to budget", value: "38", unit: "%", score: 38, tone: "warning", note: "Own revenue as a share of the council budget.", basis: { kind: "modelled" } },
      { id: "lg-roads-grading", label: "Roads graded in the period", value: "52", unit: "%", score: 52, tone: "primary", note: "Local roads graded at least once.", basis: { kind: "modelled" } },
      { id: "lg-wards", label: "Ward committees active", value: "76", unit: "%", score: 76, tone: "success", note: "Ward development committees meeting regularly.", basis: { kind: "modelled" } },
    ],
    segments: ["local-authorities", "urban-households", "rural-households", "informal-traders", "women-led-enterprises", "traditional-leaders", "energy-water-utilities", "transport-operators", "civil-servants", "smallholder-farmers", "cooperatives", "faith-groups", "youth", "informal-workers", "development-partners", "persons-with-disabilities", "urban-ratepayers", "district-councils", "informal-settlement-residents", "water-user-associations", "smes", "commuter-transport-associations", "construction-sector", "religious-leaders", "kombi-operators", "taxi-associations", "courier-firms", "warehousing", "restaurant-operators", "hoteliers", "tour-operators", "travel-agents", "creative-industries", "musicians", "community-radio", "journalists", "ecd-caregivers", "school-heads", "parents-associations", "rail-users"],
    policyTemplates: [
      {
        id: "lg-tpl-water",
        title: "Urban water and sanitation recovery programme",
        summary: "Metering, loss reduction and ring-fenced water revenue.",
        policyText:
          "This programme addresses urban water supply through loss reduction and revenue discipline. It requires each council to publish its non-revenue water figure, install metering on unmetered connections within a defined period, and ring-fence water revenue in a dedicated account reported monthly. Tariff changes remain a council decision subject to the existing approval process. Where a council cannot meet the supply standard, the programme provides technical support before any intervention in its operations.",
        timeHorizon: "long",
        segments: ["urban-households", "informal-traders", "local-authorities", "women-led-enterprises"],
      },
      {
        id: "lg-tpl-standards",
        title: "Local authority service standards charter",
        summary: "Published standards for the services residents receive.",
        policyText:
          "This charter requires every local authority to publish a short set of service standards covering water supply hours, refuse collection frequency, response time to a burst pipe and the time taken to issue a licence. Standards are reported quarterly against actual performance in a single public notice, and a council that misses a standard by more than the defined margin must publish a recovery plan. The charter does not set charges; it makes performance visible to residents and to the ministry.",
        timeHorizon: "medium",
        segments: ["urban-households", "rural-households", "local-authorities", "formal-business"],
      },
      {
        id: "lg-tpl-informal",
        title: "Trading space and vending framework",
        summary: "Designated trading areas with tenure and basic services.",
        policyText:
          "This framework moves informal trading onto a footing that councils can plan for. Each local authority designates trading areas with water, sanitation and solid waste collection, and issues written occupancy for a defined period at a published charge covering those services. Evictions may only follow the published procedure with notice and a relocation offer. Mobile traders receive a separate licence appropriate to their operation rather than being excluded from the framework.",
        timeHorizon: "medium",
        segments: ["informal-traders", "women-led-enterprises", "local-authorities", "urban-households"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "traditional-leaders-act", "urban-councils-act", "rural-district-councils-act", "provincial-councils-act", "local-government-laws-amendment-act"],
    documents: [
      { id: "lg-doc-1", name: "Local_Authority_Performance_Report.pdf", kind: "pdf", sizeLabel: "3.4 MB", date: "2026-08-23", note: "Service performance across urban and rural councils.", instrument: "local-government-laws-amendment-act" },
      { id: "lg-doc-2", name: "Water_Supply_Audit.txt", kind: "txt", sizeLabel: "148 KB", date: "2026-07-06", note: "Supply hours and non-revenue water by town.", instrument: "urban-councils-act" },
      { id: "lg-doc-3", name: "Devolution_Absorption_Brief.docx", kind: "docx", sizeLabel: "860 KB", date: "2026-05-19", note: "Absorption by province and council.", instrument: "provincial-councils-act" },
    ],
  },
  {
    id: "mfa",
    name: "Ministry of Foreign Affairs and International Trade",
    shortName: "Foreign Affairs and International Trade",
    abbr: "MoFAIT",
    mandate:
      "Conducts the country's foreign policy, manages diplomatic missions, and promotes international trade, investment and diaspora engagement.",
    description:
      "This ministry represents the country abroad and manages the network of diplomatic missions. It negotiates trade and investment agreements, supports exporters entering new markets, and provides consular services to citizens and the diaspora. Simulation is used to test how trade facilitation, visa or consular measures are received by exporters, investors and diaspora households.",
    priorities: [
      { id: "mfa-trade", label: "Regional trade agreements", note: "Improve market access terms and utilisation by exporters." },
      { id: "mfa-diplomacy", label: "Investment diplomacy", note: "Use the mission network to convert interest into projects." },
      { id: "mfa-diaspora", label: "Diaspora engagement", note: "Strengthen consular service and diaspora participation." },
      { id: "mfa-consular-modernisation", label: "Consular service modernisation", note: "Reduce document turnaround for citizens abroad." },
    ],
    indicators: [
      { id: "mfa-missions", label: "Diplomatic missions", value: "46", score: 74, tone: "primary", note: "Missions and consulates in operation.", basis: { kind: "modelled" } },
      { id: "mfa-consular", label: "Consular document turnaround", value: "21", unit: "days", score: 46, tone: "warning", note: "Average time to issue a passport or consular document abroad.", basis: { kind: "modelled" } },
      { id: "mfa-trade-util", label: "Preferential access utilisation", value: "58", unit: "%", score: 58, tone: "gold", note: "Exports eligible for preferential terms that actually claim them.", basis: { kind: "modelled" } },
      { id: "mfa-remittance", label: "Recorded remittances", value: "USD 3.51B", score: 70, tone: "success", note: "Personal remittances received.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Personal remittances received (current US$)", asOf: "2024" } },
      { id: "mfa-exports", label: "Export earnings", value: "USD 7.50B", score: 74, tone: "success", note: "Value of goods and services exported in the year.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Exports of goods and services (current US$)", asOf: "2024" } },
      { id: "mfa-new-markets", label: "New markets opened", value: "3", score: 60, tone: "gold", note: "New export markets opened during the year.", basis: { kind: "modelled" } },
      { id: "mfa-visa", label: "Visa decisions within standard", value: "79", unit: "%", score: 79, tone: "primary", note: "Visa applications decided within the published period.", basis: { kind: "modelled" } },
      { id: "mfa-diaspora-invest", label: "Diaspora investment", value: "USD 420M", score: 66, tone: "success", note: "Investment recorded through diaspora channels.", basis: { kind: "modelled" } },
      { id: "mfa-treaties", label: "Agreements ratified", value: "5 of 8", score: 62, tone: "gold", note: "Negotiated agreements ratified in the year.", basis: { kind: "modelled" } },
      { id: "mfa-representation", label: "Countries represented", value: "104", score: 72, tone: "primary", note: "Countries in which the country is represented.", basis: { kind: "modelled" } },
      { id: "mfa-trade-delegations", label: "Trade delegations hosted", value: "34", score: 62, tone: "primary", note: "Inbound trade delegations hosted.", basis: { kind: "modelled" } },
      { id: "mfa-passports", label: "Passports issued on time", value: "88", unit: "%", score: 88, tone: "success", note: "Passports issued within the published period.", basis: { kind: "modelled" } },
      { id: "mfa-diaspora-register", label: "Diaspora on the register", value: "210,000", score: 60, tone: "gold", note: "Diaspora members on the national register.", basis: { kind: "modelled" } },
      { id: "mfa-consular-cases", label: "Consular cases resolved", value: "92", unit: "%", score: 92, tone: "success", note: "Consular assistance cases resolved.", basis: { kind: "modelled" } },
      { id: "mfa-trade-desks", label: "Missions with trade desks", value: "62", unit: "%", score: 62, tone: "primary", note: "Missions operating a trade desk.", basis: { kind: "modelled" } },
      { id: "mfa-afcfta", label: "AfCFTA tariff lines mapped", value: "74", unit: "%", score: 74, tone: "success", note: "Tariff lines mapped under the AfCFTA.", basis: { kind: "modelled" } },
      { id: "mfa-bilateral", label: "Bilateral agreements signed", value: "18", score: 60, tone: "gold", note: "Bilateral agreements signed in the period.", basis: { kind: "modelled" } },
      { id: "mfa-visa-on-arrival", label: "Visa-on-arrival countries", value: "64", score: 68, tone: "success", note: "Countries whose nationals receive a visa on arrival.", basis: { kind: "modelled" } },
      { id: "mfa-remit-cost", label: "Remittance cost", value: "7.8", unit: "%", score: 48, tone: "warning", note: "Average cost of sending remittances home.", basis: { kind: "modelled" } },
      { id: "mfa-investment-forum", label: "Investment forums held", value: "12", score: 58, tone: "primary", note: "Investment forums held abroad.", basis: { kind: "modelled" } },
    ],
    segments: ["exporters", "diaspora", "development-partners", "formal-business", "financial-sector", "tourism-operators", "cross-border-traders", "media", "manufacturers", "mining-operators", "employer-federations", "trade-unions", "civil-servants", "urban-households", "informal-traders", "researchers", "parliament-legislators", "refugees-migrants", "cross-border-labour-migrants", "aviation-operators", "freight-logistics", "professional-councils", "hospitality-hoteliers", "smes", "customs-brokers", "shipping-agents", "warehousing", "courier-firms", "tour-operators", "travel-agents", "hoteliers", "restaurant-operators", "haulage-operators", "kombi-operators", "bureaux-de-change", "insurance-brokers", "journalists", "community-radio", "ecommerce-platforms", "digital-marketers"],
    policyTemplates: [
      {
        id: "mfa-tpl-trade-utilisation",
        title: "Preferential market access utilisation strategy",
        summary: "Practical support for exporters to claim existing access.",
        policyText:
          "This strategy addresses the gap between the market access the country has negotiated and the exports that actually claim it. It publishes a plain-language guide per agreement, places a trade officer in each priority mission with a helpline for exporters, and requires the certification body to publish its turnaround time monthly. The strategy does not renegotiate any agreement; it makes the terms already secured usable by firms that currently find them difficult to navigate.",
        timeHorizon: "medium",
        segments: ["exporters", "smallholder-farmers", "formal-business", "women-led-enterprises"],
      },
      {
        id: "mfa-tpl-consular",
        title: "Consular service digitisation",
        summary: "Online application, tracking and appointment booking.",
        policyText:
          "This measure moves consular document applications online. Applicants submit and pay through a single channel, track progress with a reference number, and book an appointment only where an in-person step is legally required. Missions report processing times centrally, and a file that exceeds the published standard is escalated automatically. Fees are unchanged, and applicants who cannot use the online channel retain the existing counter route.",
        timeHorizon: "short",
        segments: ["diaspora", "formal-business", "youth"],
      },
      {
        id: "mfa-tpl-diaspora",
        title: "Diaspora investment and skills framework",
        summary: "Channels for diaspora savings and professional skills transfer.",
        policyText:
          "This framework creates defined channels through which diaspora households can invest and transfer skills. It establishes a registration giving access to a published project list, a single named contact in the investment agency, and repatriation terms stated in writing at the time of entry. A parallel skills register records professionals willing to undertake short assignments, matched to requests from institutions. Participation is entirely voluntary and no diaspora obligation or levy is introduced.",
        timeHorizon: "long",
        segments: ["diaspora", "financial-sector", "development-partners", "formal-business"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "immigration-act", "citizenship-act", "trade-marks-act", "zida-act"],
    documents: [
      { id: "mfa-doc-1", name: "Trade_Agreement_Utilisation_Report.pdf", kind: "pdf", sizeLabel: "2.6 MB", date: "2026-08-09", note: "Utilisation of preferential access by agreement.", instrument: "zida-act" },
      { id: "mfa-doc-2", name: "Consular_Service_Audit.txt", kind: "txt", sizeLabel: "112 KB", date: "2026-06-27", note: "Processing times and volumes by mission.", instrument: "citizenship-act" },
      { id: "mfa-doc-3", name: "Diaspora_Framework_Consultation.docx", kind: "docx", sizeLabel: "1.5 MB", date: "2026-05-11", note: "Consultation record on diaspora channels.", instrument: "immigration-act" },
    ],
  },
  {
    id: "env",
    name: "Ministry of Environment, Climate and Wildlife",
    shortName: "Environment, Climate and Wildlife",
    abbr: "MoECW",
    mandate:
      "Protects the environment and natural heritage, coordinates climate change adaptation, and conserves and manages wildlife resources.",
    description:
      "This ministry regulates environmental impact, coordinates climate adaptation, and manages the national parks and wildlife estate. It runs the weather and hydrological monitoring services and administers environmental licences for mining, industry and agriculture. Simulation is used to test how environmental standards, catchment protection or wildlife measures affect producers and communities.",
    priorities: [
      { id: "env-adaptation", label: "Climate change adaptation", note: "Embed adaptation into national and local planning." },
      { id: "env-wetlands", label: "Wetlands and catchment protection", note: "Protect the catchments and wetlands that feed water supply." },
      { id: "env-wildlife", label: "Wildlife economy", note: "Grow the returns from conservation for host communities." },
      { id: "env-waste", label: "Waste and pollution management", note: "Improve collection and reduce illegal disposal." },
    ],
    indicators: [
      { id: "env-parks", label: "Protected area coverage", value: "28.3", unit: "% of land", score: 28, tone: "success", note: "Terrestrial land under statutory protection.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Terrestrial protected areas (% of total land area)", asOf: "2025" } },
      { id: "env-forest", label: "Forest area", value: "44.7", unit: "% of land", score: 45, tone: "success", note: "Land under forest cover.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Forest area (% of land area)", asOf: "2023" } },
      { id: "env-licences", label: "Environmental licence turnaround", value: "62", unit: "days", score: 38, tone: "gold", note: "Average time from complete application to decision.", basis: { kind: "modelled" } },
      { id: "env-climate", label: "Adaptation plans in place", value: "31 of 92", score: 34, tone: "primary", note: "Local authorities with an adopted climate adaptation plan.", basis: { kind: "modelled" } },
      { id: "env-emissions", label: "Emissions per capita", value: "0.8", unit: "t CO2e", score: 60, tone: "success", note: "Carbon dioxide emissions per person.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Carbon dioxide (CO2) emissions excluding LULUCF per capita (t CO2e/capita)", asOf: "2024" } },
      { id: "env-water", label: "Freshwater withdrawals", value: "40.0", unit: "% of resources", score: 52, tone: "warning", note: "Annual withdrawals as a share of internal resources.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Annual freshwater withdrawals, total (% of internal resources)", asOf: "2022" } },
      { id: "env-eia", label: "Environmental assessments completed", value: "128", score: 66, tone: "primary", note: "Environmental impact assessments completed in the year.", basis: { kind: "modelled" } },
      { id: "env-rehab", label: "Mine land rehabilitated", value: "34", unit: "%", score: 34, tone: "warning", note: "Disturbed land restored under rehabilitation orders.", basis: { kind: "modelled" } },
      { id: "env-poaching", label: "Poaching incidents", value: "212", score: 48, tone: "warning", note: "Reported poaching incidents in protected areas.", basis: { kind: "modelled" } },
      { id: "env-renewable", label: "Renewable electricity share", value: "88.3", unit: "%", score: 24, tone: "gold", note: "Electricity generated from renewable sources, including hydro.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Renewable electricity output (% of total electricity output)", asOf: "2021" } },
      { id: "env-air", label: "Air quality monitoring stations", value: "24", score: 48, tone: "gold", note: "Ambient air-quality stations operating.", basis: { kind: "modelled" } },
      { id: "env-wetlands", label: "Wetlands under protection", value: "42", unit: "%", score: 42, tone: "primary", note: "Wetland area under formal protection.", basis: { kind: "modelled" } },
      { id: "env-waste", label: "Waste diverted from landfill", value: "28", unit: "%", score: 28, tone: "warning", note: "Municipal waste diverted to recycling.", basis: { kind: "modelled" } },
      { id: "env-carbon", label: "Carbon projects registered", value: "16", score: 52, tone: "gold", note: "Carbon-offset projects on the national register.", basis: { kind: "modelled" } },
      { id: "env-trees", label: "Trees planted", value: "18.4M", score: 66, tone: "success", note: "Trees planted under the national programme.", basis: { kind: "modelled" } },
      { id: "env-wildlife", label: "Wildlife population trend", value: "+3.2", unit: "%", score: 62, tone: "success", note: "Change in monitored wildlife populations.", basis: { kind: "modelled" } },
      { id: "env-eia-compliance", label: "EIA conditions met", value: "78", unit: "%", score: 78, tone: "gold", note: "Projects meeting their environmental assessment conditions.", basis: { kind: "modelled" } },
      { id: "env-rivers", label: "Rivers in good health", value: "54", unit: "%", score: 54, tone: "primary", note: "Monitored rivers in good ecological health.", basis: { kind: "modelled" } },
      { id: "env-mine-sites", label: "Mine sites under rehabilitation", value: "34", unit: "%", score: 34, tone: "warning", note: "Abandoned mine sites under rehabilitation.", basis: { kind: "modelled" } },
      { id: "env-awareness", label: "Environmental awareness reach", value: "61", unit: "%", score: 61, tone: "success", note: "People reached by environmental awareness campaigns.", basis: { kind: "modelled" } },
    ],
    segments: ["rural-households", "smallholder-farmers", "mining-operators", "development-partners", "local-authorities", "conservation-communities", "tourism-operators", "energy-water-utilities", "urban-households", "artisanal-miners", "cooperatives", "traditional-leaders", "informal-workers", "women-led-enterprises", "manufacturers", "media", "wildlife-conservancies", "safari-operators", "fishing-communities", "mining-host-communities", "water-user-associations", "timber-forestry-operators", "district-councils", "horticulture-growers", "coal-producers", "fuel-retailers", "lpg-distributors", "solar-installers", "mine-suppliers", "smelters", "mineral-dealers", "diamond-sector", "aquaculture-operators", "beekeepers", "agro-processors", "journalists", "community-radio", "ecd-caregivers", "school-heads", "parents-associations"],
    policyTemplates: [
      {
        id: "env-tpl-catchment",
        title: "Catchment and wetland protection standard",
        summary: "Setback rules, buffer protection and restoration duties.",
        policyText:
          "This standard protects the catchments and wetlands that supply water to towns and irrigation schemes. It defines a minimum buffer around a listed wetland within which cultivation and construction require written authorisation, lists the wetlands to which it applies, and places a restoration duty on anyone who damages one. Local authorities incorporate the boundary into their planning maps. Existing lawful use is not extinguished, but it must be registered within a defined period.",
        timeHorizon: "long",
        segments: ["rural-households", "local-authorities", "smallholder-farmers", "development-partners"],
      },
      {
        id: "env-tpl-licensing",
        title: "Environmental impact assessment reform",
        summary: "Tiered assessment with published turnaround standards.",
        policyText:
          "This reform replaces a single assessment route with a tiered one. Projects are classified into three tiers by scale and sensitivity, with a short registration route for the lowest tier, a standard assessment for the middle tier and a full assessment with public consultation for the highest. Each tier carries a published turnaround standard, and an application that exceeds it is escalated. Appeal rights against a decision are unchanged.",
        timeHorizon: "medium",
        segments: ["mining-operators", "formal-business", "local-authorities", "development-partners"],
      },
      {
        id: "env-tpl-wildlife",
        title: "Community wildlife benefit-sharing framework",
        summary: "Direct community share in revenue from wildlife areas.",
        policyText:
          "This framework establishes a defined share of wildlife revenue that flows to communities adjacent to protected areas. It sets the share in regulation rather than negotiation, requires community trusts to publish the amounts received and the projects funded, and pays on a fixed annual cycle. Quota setting and conservation decisions remain with the authority. The framework applies prospectively and does not reopen existing concession agreements.",
        timeHorizon: "long",
        segments: ["rural-households", "local-authorities", "development-partners", "women-led-enterprises"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "environmental-management-act", "parks-wildlife-act", "forest-act", "water-act"],
    documents: [
      { id: "env-doc-1", name: "State_of_the_Environment_Report.pdf", kind: "pdf", sizeLabel: "8.1 MB", date: "2026-08-01", note: "National environmental condition report.", instrument: "environmental-management-act" },
      { id: "env-doc-2", name: "Wetland_Inventory.txt", kind: "txt", sizeLabel: "204 KB", date: "2026-07-13", note: "Listed wetlands by province and district.", instrument: "water-act" },
      { id: "env-doc-3", name: "Impact_Assessment_Reform_Options.docx", kind: "docx", sizeLabel: "1.6 MB", date: "2026-05-26", note: "Options for tiered assessment.", instrument: "environmental-management-act" },
    ],
  },
  {
    id: "def",
    name: "Ministry of Defence and War Veterans Affairs",
    shortName: "Defence and War Veterans Affairs",
    abbr: "MoDVA",
    mandate:
      "Provides for the defence of the country, supports civil authorities in disaster response, and administers the welfare of war veterans.",
    description:
      "This ministry maintains the country's defence capability and supports civil authorities during disasters and emergencies. It administers veterans' welfare, including pensions, medical support and resettlement benefits. Simulation is used to test how changes to veterans' benefits or to civil-support deployment obligations are absorbed by serving members, veterans and the communities they assist.",
    priorities: [
      { id: "def-capability", label: "National defence readiness", note: "Maintain trained personnel and serviceable equipment." },
      { id: "def-disaster", label: "Disaster response support", note: "Provide civil support within a defined response time." },
      { id: "def-veterans-welfare", label: "Veterans welfare", note: "Deliver pensions, medical support and resettlement benefits." },
      { id: "def-border", label: "Border integrity", note: "Support border control and territorial surveillance." },
    ],
    indicators: [
      { id: "def-readiness", label: "Personnel at readiness", value: "91", unit: "%", score: 91, tone: "success", note: "Establishment personnel assessed as deployable at the reporting date.", basis: { kind: "modelled" } },
      { id: "def-veterans", label: "Veteran benefits processed", value: "78", unit: "%", score: 78, tone: "primary", note: "Verified benefit applications processed within the published standard.", basis: { kind: "modelled" } },
      { id: "def-response", label: "Civil support response", value: "14", unit: "hrs", score: 66, tone: "gold", note: "Average time from a request by civil authorities to deployment.", basis: { kind: "modelled" } },
      { id: "def-equipment", label: "Equipment serviceability", value: "71", unit: "%", score: 71, tone: "warning", note: "Major equipment assessed as serviceable.", basis: { kind: "modelled" } },
      { id: "def-border", label: "Border incidents", value: "84", score: 62, tone: "warning", note: "Reported border security incidents.", basis: { kind: "modelled" } },
      { id: "def-readiness-units", label: "Units at readiness", value: "88", unit: "%", score: 88, tone: "success", note: "Units assessed ready for deployment.", basis: { kind: "modelled" } },
      { id: "def-pensions", label: "Veteran pensions paid on time", value: "94", unit: "%", score: 94, tone: "primary", note: "Veteran pension payments made on time.", basis: { kind: "modelled" } },
      { id: "def-civil-support", label: "Civil support operations", value: "37", score: 70, tone: "gold", note: "Civil support operations undertaken in the year.", basis: { kind: "modelled" } },
      { id: "def-training", label: "Training completed", value: "79", unit: "%", score: 79, tone: "success", note: "Personnel completing the annual training programme.", basis: { kind: "modelled" } },
      { id: "def-facilities", label: "Facilities maintained", value: "68", unit: "%", score: 68, tone: "gold", note: "Defence facilities maintained to standard.", basis: { kind: "modelled" } },
      { id: "def-personnel", label: "Personnel strength", value: "92", unit: "% of establishment", score: 62, tone: "gold", note: "Serving personnel against the authorised establishment.", basis: { kind: "modelled" } },
      { id: "def-air", label: "Aircraft serviceable", value: "64", unit: "%", score: 64, tone: "primary", note: "Aircraft serviceable on the reporting day.", basis: { kind: "modelled" } },
      { id: "def-vehicles", label: "Vehicles serviceable", value: "71", unit: "%", score: 71, tone: "gold", note: "Service vehicles fit for task.", basis: { kind: "modelled" } },
      { id: "def-medical", label: "Medical readiness", value: "78", unit: "%", score: 78, tone: "success", note: "Personnel medically fit for deployment.", basis: { kind: "modelled" } },
      { id: "def-logistics", label: "Logistics stock cover", value: "46", unit: "days", score: 52, tone: "primary", note: "Days of operational stock held.", basis: { kind: "modelled" } },
      { id: "def-training-days", label: "Training days per member", value: "28", score: 60, tone: "gold", note: "Training days completed per member.", basis: { kind: "modelled" } },
      { id: "def-cyber", label: "Cyber incidents repelled", value: "14", score: 55, tone: "success", note: "Cyber incidents defended against.", basis: { kind: "modelled" } },
      { id: "def-community", label: "Community projects delivered", value: "48", score: 66, tone: "success", note: "Community projects delivered by the defence forces.", basis: { kind: "modelled" } },
      { id: "def-veteran-employment", label: "Veterans employed", value: "52", unit: "%", score: 52, tone: "primary", note: "Veterans in employment after service.", basis: { kind: "modelled" } },
      { id: "def-readiness-days", label: "Days at readiness", value: "184", score: 70, tone: "gold", note: "Days the force held the required readiness state.", basis: { kind: "modelled" } },
    ],
    segments: ["civil-servants", "rural-households", "development-partners", "local-authorities", "war-veterans", "pensioners", "persons-with-disabilities", "urban-households", "traditional-leaders", "faith-groups", "youth", "health-workers", "women", "media", "trade-unions", "transport-operators", "refugees-migrants", "cross-border-labour-migrants", "parliament-legislators", "judiciary-courts", "aviation-operators", "professional-councils", "religious-leaders", "smes", "warehousing", "haulage-operators", "shipping-agents", "courier-firms", "engineering-firms", "chemicals-industry", "fuel-retailers", "ambulance-services", "community-caregivers", "journalists", "community-radio", "software-developers", "cybersecurity-firms", "data-centres", "drivers-associations", "isps"],
    policyTemplates: [
      {
        id: "def-tpl-veterans",
        title: "War veterans welfare review",
        summary: "Consolidation and modernisation of veteran benefit delivery.",
        policyText:
          "This review consolidates veterans' benefits into a single register with one application route and one verification standard. It proposes a published processing timeframe, a defined appeal route for a rejected application, and an annual public statement of the number of beneficiaries and the total paid out. Medical and resettlement support continue to be available separately from the pension. Entitlement categories are not changed by this review; only how a claim is made and decided is changed.",
        timeHorizon: "medium",
        segments: ["civil-servants", "rural-households", "development-partners"],
      },
      {
        id: "def-tpl-civil-support",
        title: "Civil authority support framework",
        summary: "Defined triggers and limits for disaster support deployment.",
        policyText:
          "This framework defines when the defence forces provide support to civil authorities during a disaster. It sets out who requests the support, the information the request must contain, the maximum period before a civil authority resumes full responsibility, and the cost-sharing arrangement between the two elements of government. The framework applies to flood, drought, fire and public health events, and requires a written after-action report within a fixed period of any deployment.",
        timeHorizon: "medium",
        segments: ["local-authorities", "rural-households", "civil-servants", "development-partners"],
      },
      {
        id: "def-tpl-readiness",
        title: "Equipment sustainment and readiness plan",
        summary: "Maintenance, spares and lifecycle planning for major equipment.",
        policyText:
          "This plan addresses the serviceability of major equipment. It sets a maintenance schedule by equipment class rather than by annual budget availability, holds a defined spares holding for each class, and reports serviceability each quarter. Where a class falls below the threshold for two consecutive quarters, the plan requires a written remedial plan rather than a further deferral. Personnel training is scheduled against the same class plan so that trained operators are available when equipment returns to service.",
        timeHorizon: "long",
        segments: ["civil-servants", "formal-business"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "defence-act", "war-veterans-act", "veterans-liberation-struggle-act", "national-security-council-act"],
    documents: [
      { id: "def-doc-1", name: "Readiness_Assessment_Report.pdf", kind: "pdf", sizeLabel: "1.8 MB", date: "2026-08-16", note: "Personnel and equipment readiness assessment.", instrument: "defence-act" },
      { id: "def-doc-2", name: "Veterans_Benefits_Register_Summary.txt", kind: "txt", sizeLabel: "66 KB", date: "2026-07-07", note: "Beneficiary counts and payment summary.", instrument: "war-veterans-act" },
      { id: "def-doc-3", name: "Civil_Support_Framework_Draft.docx", kind: "docx", sizeLabel: "1.0 MB", date: "2026-06-09", note: "Draft framework for disaster support.", instrument: "defence-act" },
    ],
  },
  {
    id: "zimra",
    name: "Zimbabwe Revenue Authority",
    shortName: "Revenue Authority",
    abbr: "ZIMRA",
    mandate:
      "Assesses and collects revenue on behalf of the State, facilitates trade, and enforces customs and excise law at the country's borders.",
    description:
      "The revenue authority collects the taxes and duties that fund the national budget. It administers customs at ports of entry, manages the taxpayer register, and conducts audits across all tax heads. Simulation is used to test how changes to assessment rules, clearance procedures or compliance measures affect registered businesses, informal traders and importers.",
    priorities: [
      { id: "zimra-collection", label: "Revenue collection efficiency", note: "Close the gap between assessed and collected revenue." },
      { id: "zimra-trade", label: "Trade facilitation", note: "Reduce border clearance time for compliant traders." },
      { id: "zimra-compliance", label: "Taxpayer compliance", note: "Widen registration and improve filing discipline." },
      { id: "zimra-digital", label: "Digital customs modernisation", note: "Move declarations and payments to a single electronic channel." },
    ],
    indicators: [
      { id: "zimra-target", label: "Tax revenue", value: "7.2", unit: "% of GDP", score: 7, tone: "warning", note: "Tax revenue as a share of GDP.", basis: { kind: "published", sourceId: "worldbank", publication: "World Development Indicators: Tax revenue (% of GDP)", asOf: "2018" } },
      { id: "zimra-clearance", label: "Border clearance time", value: "26", unit: "hrs", score: 56, tone: "warning", note: "Average time from declaration to release for compliant consignments.", basis: { kind: "modelled" } },
      { id: "zimra-filing", label: "On-time filing rate", value: "69", unit: "%", score: 69, tone: "primary", note: "Registered taxpayers filing by the due date.", basis: { kind: "modelled" } },
      { id: "zimra-audit", label: "Audit yield per case", value: "USD 18k", score: 62, tone: "gold", note: "Average additional assessment raised per completed audit.", basis: { kind: "modelled" } },
      { id: "zimra-collection", label: "Collections against target", value: "97", unit: "%", score: 97, tone: "success", note: "Revenue collected against the annual target.", basis: { kind: "modelled" } },
      { id: "zimra-vat-gap", label: "VAT compliance gap", value: "34", unit: "%", score: 34, tone: "warning", note: "Estimated VAT lost to non-compliance.", basis: { kind: "modelled" } },
      { id: "zimra-register", label: "Registered taxpayers", value: "412,000", score: 66, tone: "primary", note: "Active taxpayers on the register.", basis: { kind: "modelled" } },
      { id: "zimra-refunds", label: "Refunds paid in time", value: "83", unit: "%", score: 83, tone: "gold", note: "Verified refunds paid within the published period.", basis: { kind: "modelled" } },
      { id: "zimra-digital", label: "Declarations filed online", value: "91", unit: "%", score: 91, tone: "success", note: "Declarations submitted through the digital channel.", basis: { kind: "modelled" } },
      { id: "zimra-appeals", label: "Appeals decided in time", value: "72", unit: "%", score: 72, tone: "primary", note: "Appeals decided within the statutory period.", basis: { kind: "modelled" } },
      { id: "zimra-e-payment", label: "Payments made electronically", value: "86", unit: "%", score: 86, tone: "success", note: "Tax payments made through the electronic channel.", basis: { kind: "modelled" } },
      { id: "zimra-customs", label: "Customs cleared same day", value: "74", unit: "%", score: 74, tone: "gold", note: "Customs declarations cleared on the day of lodgement.", basis: { kind: "modelled" } },
      { id: "zimra-risk", label: "Cargo selected by risk", value: "18", unit: "%", score: 60, tone: "primary", note: "Cargo consignments selected for inspection by risk.", basis: { kind: "modelled" } },
      { id: "zimra-debt", label: "Tax debt collected", value: "62", unit: "%", score: 62, tone: "warning", note: "Outstanding tax debt collected in the period.", basis: { kind: "modelled" } },
      { id: "zimra-education", label: "Taxpayer education reach", value: "240,000", score: 68, tone: "success", note: "Taxpayers reached by education programmes.", basis: { kind: "modelled" } },
      { id: "zimra-refund-days", label: "Refund turnaround", value: "21", unit: "days", score: 55, tone: "gold", note: "Average days to process a refund.", basis: { kind: "modelled" } },
      { id: "zimra-sme", label: "Small businesses registered", value: "58,000", score: 64, tone: "success", note: "Small businesses added to the tax register.", basis: { kind: "modelled" } },
      { id: "zimra-transfer-pricing", label: "Transfer-pricing reviews", value: "42", score: 58, tone: "primary", note: "Transfer-pricing reviews completed.", basis: { kind: "modelled" } },
      { id: "zimra-integration", label: "Data integrations live", value: "9 of 12", score: 62, tone: "gold", note: "Systems integrated with the tax platform.", basis: { kind: "modelled" } },
      { id: "zimra-disputes", label: "Disputes resolved", value: "68", unit: "%", score: 68, tone: "primary", note: "Tax disputes resolved in the period.", basis: { kind: "modelled" } },
    ],
    segments: ["formal-business", "informal-traders", "exporters", "financial-sector", "mining-operators", "informal-workers", "cross-border-traders", "manufacturers", "urban-households", "rural-households", "smallholder-farmers", "transport-operators", "employer-federations", "trade-unions", "cooperatives", "artisanal-miners", "smes", "fintech-mobile-money", "freight-logistics", "professional-councils", "cross-border-labour-migrants", "construction-sector", "insurance-sector", "microfinance-institutions", "customs-brokers", "shipping-agents", "warehousing", "haulage-operators", "kombi-operators", "taxi-associations", "food-beverage", "cement-producers", "engineering-firms", "printing-publishing", "software-developers", "ecommerce-platforms", "mobile-money-agents", "bureaux-de-change", "courier-firms", "drivers-associations"],
    policyTemplates: [
      {
        id: "zimra-tpl-clearance",
        title: "Authorised economic operator programme",
        summary: "Faster clearance for verified compliant traders.",
        policyText:
          "This programme grants faster border clearance to traders who meet published compliance criteria. Admission requires a clean filing record, verified premises and a documented internal control process, and is reviewed annually. Admitted traders are cleared through a dedicated lane with a reduced physical inspection rate, while inspection effort is redirected to consignments from traders outside the programme. Admission is withdrawn through a published process where compliance lapses, and the operator may reapply after remediation.",
        timeHorizon: "medium",
        segments: ["formal-business", "exporters", "mining-operators", "financial-sector"],
      },
      {
        id: "zimra-tpl-presumptive",
        title: "Presumptive assessment for informal traders",
        summary: "Simple scheduled assessment replacing full record keeping.",
        policyText:
          "This measure introduces a scheduled presumptive assessment for small traders who cannot maintain full accounting records. The schedule sets a flat amount per trading category, payable monthly by phone, and removes the requirement to file a return. A trader may elect the standard regime at any time. The measure applies to traders below a defined turnover threshold, and traders above it continue under existing rules without change.",
        timeHorizon: "short",
        segments: ["informal-traders", "women-led-enterprises", "urban-households"],
      },
      {
        id: "zimra-tpl-disputes",
        title: "Tax dispute resolution reform",
        summary: "Time-bound objection handling and published decisions.",
        policyText:
          "This reform sets a time-bound route for a taxpayer who disagrees with an assessment. It requires the authority to acknowledge an objection within a defined number of days, decide within a published period, and give written reasons. A taxpayer may escalate to the independent tribunal where the period lapses, and the tribunal publishes anonymised decisions so that the treatment of similar cases becomes predictable. Payment arrangements during a dispute remain as they are.",
        timeHorizon: "medium",
        segments: ["formal-business", "mining-operators", "exporters", "financial-sector"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "revenue-authority-act", "customs-excise-act", "income-tax-act", "vat-act", "money-laundering-act"],
    documents: [
      { id: "zimra-doc-1", name: "Revenue_Performance_Report_2026.pdf", kind: "pdf", sizeLabel: "2.7 MB", date: "2026-08-25", note: "Collections by tax head against target.", instrument: "revenue-authority-act" },
      { id: "zimra-doc-2", name: "Border_Clearance_Study.txt", kind: "txt", sizeLabel: "118 KB", date: "2026-07-02", note: "Clearance time study at major ports.", instrument: "customs-excise-act" },
      { id: "zimra-doc-3", name: "Compliance_Strategy_Options.docx", kind: "docx", sizeLabel: "1.3 MB", date: "2026-05-15", note: "Options for compliance and dispute reform.", instrument: "income-tax-act" },
    ],
  },
  {
    id: "zida",
    name: "Zimbabwe Investment and Development Agency",
    shortName: "Investment and Development Agency",
    abbr: "ZIDA",
    mandate:
      "Promotes, facilitates and coordinates domestic and foreign investment, and administers investment licences and special economic zones.",
    description:
      "The investment agency is the single entry point for investors. It issues licences, provides aftercare to existing investors, and administers the special economic zone regime. Simulation is used to test how changes to licensing, zone incentives or investor aftercare are likely to be experienced by applicants, existing investors and host communities.",
    priorities: [
      { id: "zida-facilitation", label: "Investment facilitation reform", note: "Reduce the steps and time needed to obtain a licence." },
      { id: "zida-zones", label: "Special economic zones", note: "Make zone incentives clear, conditional and enforceable." },
      { id: "zida-aftercare", label: "Investor aftercare", note: "Resolve investor issues after the licence is issued." },
      { id: "zida-pipeline", label: "Investment pipeline development", note: "Build a visible pipeline of bankable projects." },
    ],
    indicators: [
      { id: "zida-licences", label: "Licences issued", value: "412", score: 82, tone: "primary", note: "Investment licences issued in the reporting year.", basis: { kind: "modelled" } },
      { id: "zida-turnaround", label: "Licence turnaround", value: "18", unit: "days", score: 64, tone: "gold", note: "Average time from complete application to decision.", basis: { kind: "modelled" } },
      { id: "zida-zones", label: "Zone occupancy", value: "63", unit: "%", score: 63, tone: "success", note: "Developable area in designated zones occupied by operating firms.", basis: { kind: "modelled" } },
      { id: "zida-retention", label: "Investor retention", value: "89", unit: "%", score: 89, tone: "primary", note: "Licensed investors still operating three years after licensing.", basis: { kind: "modelled" } },
      { id: "zida-pipeline-value", label: "Investment pipeline", value: "USD 3.8B", score: 68, tone: "gold", note: "Value of projects in the facilitated pipeline.", basis: { kind: "modelled" } },
      { id: "zida-aftercare", label: "Investor issues resolved", value: "78", unit: "%", score: 78, tone: "primary", note: "Aftercare issues resolved within the standard period.", basis: { kind: "modelled" } },
      { id: "zida-jobs", label: "Jobs created", value: "14,200", score: 74, tone: "success", note: "Jobs reported by licensed investors.", basis: { kind: "modelled" } },
      { id: "zida-local-content", label: "Local content", value: "41", unit: "%", score: 41, tone: "gold", note: "Inputs sourced locally by licensed projects.", basis: { kind: "modelled" } },
      { id: "zida-zone-exports", label: "Zone exports", value: "USD 900M", score: 70, tone: "success", note: "Exports recorded from special economic zones.", basis: { kind: "modelled" } },
      { id: "zida-permits", label: "Permits digitised", value: "62", unit: "%", score: 62, tone: "primary", note: "Investment permits available on the digital channel.", basis: { kind: "modelled" } },
      { id: "zida-approved", label: "Projects approved", value: "186", score: 68, tone: "success", note: "Investment projects approved in the period.", basis: { kind: "modelled" } },
      { id: "zida-value", label: "Approved investment value", value: "USD 2.4B", score: 72, tone: "success", note: "Value of investment projects approved.", basis: { kind: "modelled" } },
      { id: "zida-export-value", label: "Licensed export value", value: "USD 1.1B", score: 66, tone: "gold", note: "Export value of licensed investment operations.", basis: { kind: "modelled" } },
      { id: "zida-sez", label: "Special economic zones occupied", value: "58", unit: "%", score: 58, tone: "primary", note: "Occupancy across designated economic zones.", basis: { kind: "modelled" } },
      { id: "zida-incentives", label: "Incentives issued", value: "124", score: 60, tone: "gold", note: "Investment incentives issued.", basis: { kind: "modelled" } },
      { id: "zida-grievances", label: "Investor grievances resolved", value: "82", unit: "%", score: 82, tone: "success", note: "Investor grievances resolved in the period.", basis: { kind: "modelled" } },
      { id: "zida-sectors", label: "Priority sectors with a strategy", value: "8 of 10", score: 70, tone: "gold", note: "Priority investment sectors with a strategy.", basis: { kind: "modelled" } },
      { id: "zida-local", label: "Local procurement by investors", value: "46", unit: "%", score: 46, tone: "primary", note: "Local procurement as a share of investor spend.", basis: { kind: "modelled" } },
      { id: "zida-training", label: "Workers trained by investors", value: "14,200", score: 64, tone: "success", note: "Workers trained through investor programmes.", basis: { kind: "modelled" } },
      { id: "zida-followup", label: "Investment follow-ups closed", value: "74", unit: "%", score: 74, tone: "gold", note: "Post-licence follow-ups closed.", basis: { kind: "modelled" } },
    ],
    segments: ["formal-business", "exporters", "diaspora", "development-partners", "financial-sector", "manufacturers", "employer-federations", "tourism-operators", "mining-operators", "women-led-enterprises", "youth", "researchers", "ict-operators", "informal-traders", "transport-operators", "cooperatives", "smes", "construction-sector", "hospitality-hoteliers", "mining-host-communities", "professional-councils", "fintech-mobile-money", "aviation-operators", "insurance-sector", "cement-producers", "food-beverage", "textile-clothing", "leather-footwear", "chemicals-industry", "furniture-makers", "printing-publishing", "engineering-firms", "coal-producers", "smelters", "solar-installers", "data-centres", "software-developers", "tour-operators", "agro-processors", "quantity-surveyors"],
    policyTemplates: [
      {
        id: "zida-tpl-onestop",
        title: "Investor single entry point reform",
        summary: "One application, one decision, published turnaround.",
        policyText:
          "This reform makes the agency the single entry point for an investment licence. An applicant submits once through a portal, and the agency coordinates the statutory approvals from other authorities internally rather than sending the applicant between offices. Each licence type carries a published turnaround standard, and an application that exceeds it is escalated to a named officer. The underlying approval powers of the other authorities are unchanged; only the coordination burden moves to the agency.",
        timeHorizon: "medium",
        segments: ["formal-business", "diaspora", "development-partners", "financial-sector"],
      },
      {
        id: "zida-tpl-zones",
        title: "Special economic zone incentive framework",
        summary: "Conditional incentives tied to employment and local sourcing.",
        policyText:
          "This framework restates zone incentives as conditional rather than automatic. Firms in a zone receive the incentive only while they meet published employment and local sourcing thresholds, reported annually and verified on a sample basis. Firms that fall below the threshold have a defined remediation period before the incentive is withdrawn. Zone designation itself is unchanged by the framework, and incentives continue to run for the period stated in an existing agreement.",
        timeHorizon: "long",
        segments: ["formal-business", "exporters", "development-partners"],
      },
      {
        id: "zida-tpl-aftercare",
        title: "Investor aftercare and issue resolution",
        summary: "A tracked route for resolving investor operational issues.",
        policyText:
          "This measure creates a tracked route for issues that arise after a licence is issued, covering permits, utilities and land access. Every licensed investor is assigned a named aftercare officer, and each issue is logged with a category, a responsible authority and a resolution date. The agency reports unresolved issues older than the published standard to the coordinating office. The measure does not create new approval powers; it creates visibility and follow-up on issues the investor would otherwise pursue alone.",
        timeHorizon: "short",
        segments: ["formal-business", "development-partners", "financial-sector"],
      },
    ],
    instruments: [...UNIVERSAL_INSTRUMENTS, "zida-act", "special-economic-zones-act", "companies-act", "competition-act", "competitiveness-commission-act"],
    documents: [
      { id: "zida-doc-1", name: "Investment_Licensing_Report_2026.pdf", kind: "pdf", sizeLabel: "2.1 MB", date: "2026-08-20", note: "Licences issued by sector and origin.", instrument: "zida-act" },
      { id: "zida-doc-2", name: "Zone_Occupancy_Returns.txt", kind: "txt", sizeLabel: "82 KB", date: "2026-07-16", note: "Zone occupancy and employment figures.", instrument: "special-economic-zones-act" },
      { id: "zida-doc-3", name: "Aftercare_Case_Review.docx", kind: "docx", sizeLabel: "1.1 MB", date: "2026-06-13", note: "Review of investor aftercare cases.", instrument: "companies-act" },
    ],
  },
];

/**
 * The canonical 16 departments, in the order `DEPARTMENT_IDS` defines — the Ministry of
 * ICT second, after the Office of the President and Cabinet, because it is the custodian
 * of this platform. Derived rather than hand-ordered, so the order and the data cannot
 * disagree.
 */
export const DEPARTMENTS: Department[] = [...DEPARTMENT_DATA].sort(
  (a, b) => DEPARTMENT_IDS.indexOf(a.id) - DEPARTMENT_IDS.indexOf(b.id),
);

/* ------------------------------------------------------------------------- *
 * Look-ups. Components must use these rather than indexing into the array by
 * position, so that a future reordering of DEPARTMENTS cannot silently break a
 * route or a heading.
 * ------------------------------------------------------------------------- */

const DEPARTMENT_BY_ID = new Map<string, Department>(DEPARTMENTS.map((d) => [d.id, d]));

/** True when `value` is one of the 16 stable department ids. */
export const isDepartmentId = (value: string): value is DepartmentId => DEPARTMENT_BY_ID.has(value);

/**
 * Resolve a department by id. Throws on an unknown id — callers that receive an
 * id from a URL should use `findDepartment` instead.
 */
export const getDepartment = (id: string): Department => {
  const department = DEPARTMENT_BY_ID.get(id);
  if (!department) throw new Error(`Unknown department id: ${id}`);
  return department;
};

/** Non-throwing lookup, for route parameters and stored session values. */
export const findDepartment = (id: string | undefined | null): Department | undefined =>
  id ? DEPARTMENT_BY_ID.get(id) : undefined;

/** The department's short label, or a neutral fallback for an unknown id. */
export const departmentLabel = (id: string): string => findDepartment(id)?.shortName ?? "Unassigned";

/** Every policy template in the platform, tagged with its owning department. */
export const ALL_POLICY_TEMPLATES = DEPARTMENTS.flatMap((department) =>
  department.policyTemplates.map((template) => ({ department, template })),
);

/** Every document in the platform, tagged with its owning department. */
export const ALL_DEPARTMENT_DOCUMENTS = DEPARTMENTS.flatMap((department) =>
  department.documents.map((document) => ({ department, document })),
);

/**
 * The register's documents in the order the rails show them: the documents that cite an
 * instrument come first, and everything else keeps the register's own order.
 *
 * Both rails sort by this one rule rather than each carrying its own copy of it. Today
 * every document in the register cites an instrument, so the order is unchanged — the
 * helper is here so a future document with no instrument can never push a cited one
 * down the rail. It copies the array, so the authored register is never rearranged.
 */
export const sortDocumentsByCitation = (
  documents: readonly DepartmentDocument[],
): DepartmentDocument[] =>
  [...documents].sort((a, b) => Number(Boolean(b.instrument)) - Number(Boolean(a.instrument)));

/** The number of departments the platform must always render. */
export const DEPARTMENT_COUNT = DEPARTMENTS.length;

