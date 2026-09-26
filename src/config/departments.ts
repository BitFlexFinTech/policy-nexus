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

import type { StakeholderSegmentId, TimeHorizonId } from "./reference";

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
  "fin",
  "agri",
  "health",
  "edu",
  "hedu",
  "ict",
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

/** A published reference indicator shown on the KPI strip (and drill-down). */
export interface DepartmentIndicator {
  id: string;
  label: string;
  /** Display value, already formatted. */
  value: string;
  unit?: string;
  /** 0–100 position of the bar; presentation only, derived from the indicator. */
  score: number;
  tone: IndicatorTone;
  /** One line of plain-language meaning, shown when the card is opened. */
  note: string;
  /** Where the indicator comes from — shown on the drill-down. */
  source: string;
}

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
  documents: DepartmentDocument[];
}

export const DEPARTMENTS: Department[] = [
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
      { id: "opc-impl", label: "Policy implementation rate", value: "68", unit: "%", score: 68, tone: "gold", note: "Share of Cabinet-approved policies with an active implementation plan this year.", source: "Departmental delivery reports" },
      { id: "opc-milestone", label: "Reform milestones met", value: "41 of 60", score: 68, tone: "primary", note: "Milestones completed against the public sector reform programme.", source: "Reform programme tracker" },
      { id: "opc-response", label: "Cross-ministry turnaround", value: "23", unit: "days", score: 54, tone: "warning", note: "Average time to resolve a matter referred between ministries.", source: "Cabinet committee secretariat" },
    ],
    segments: ["civil-servants", "local-authorities", "development-partners", "formal-business", "youth"],
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
    documents: [
      { id: "opc-doc-1", name: "National_Development_Strategy_Progress_Review.pdf", kind: "pdf", sizeLabel: "3.1 MB", date: "2026-08-19", note: "Annual delivery review across all ministries." },
      { id: "opc-doc-2", name: "Public_Sector_Reform_Phase_II_Concept.docx", kind: "docx", sizeLabel: "892 KB", date: "2026-07-30", note: "Concept note for process simplification." },
      { id: "opc-doc-3", name: "Devolution_Absorption_Report.txt", kind: "txt", sizeLabel: "126 KB", date: "2026-06-11", note: "Provincial absorption figures and commentary." },
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
      { id: "fin-deficit", label: "Fiscal deficit", value: "4.2", unit: "% of GDP", score: 58, tone: "warning", note: "Projected deficit against the annual fiscal framework.", source: "Budget statement indicators" },
      { id: "fin-revenue", label: "Revenue performance", value: "94", unit: "%", score: 94, tone: "success", note: "Revenue collected against the annual target for the period to date.", source: "Treasury monthly returns" },
      { id: "fin-taxbase", label: "Registered taxpayer growth", value: "+6.8", unit: "% YoY", score: 68, tone: "primary", note: "Growth in the active taxpayer register year on year.", source: "Revenue authority register" },
      { id: "fin-investment", label: "Approved investment value", value: "USD 1.9B", score: 62, tone: "gold", note: "Value of investment licences approved in the period.", source: "Investment agency pipeline" },
    ],
    segments: ["exporters", "formal-business", "financial-sector", "civil-servants", "informal-traders", "diaspora"],
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
    documents: [
      { id: "fin-doc-1", name: "Budget_Framework_Statement_2026.pdf", kind: "pdf", sizeLabel: "4.6 MB", date: "2026-08-28", note: "Fiscal framework and expenditure ceilings." },
      { id: "fin-doc-2", name: "Small_Business_Tax_Simulation_Note.docx", kind: "docx", sizeLabel: "1.3 MB", date: "2026-07-22", note: "Distributional note on presumptive bands." },
      { id: "fin-doc-3", name: "Export_Settlement_Review.txt", kind: "txt", sizeLabel: "214 KB", date: "2026-06-30", note: "Options paper on settlement shares." },
      { id: "fin-doc-4", name: "Debt_Sustainability_Update.pdf", kind: "pdf", sizeLabel: "2.8 MB", date: "2026-05-14", note: "Updated sustainability position." },
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
      { id: "agri-grain", label: "Staple grain self-sufficiency", value: "89", unit: "%", score: 89, tone: "success", note: "Domestic staple grain availability against estimated national requirement.", source: "Seasonal crop assessment" },
      { id: "agri-irrigated", label: "Irrigated area", value: "203k", unit: "ha", score: 66, tone: "primary", note: "Area under functioning irrigation, all schemes.", source: "Irrigation scheme register" },
      { id: "agri-herd", label: "National cattle herd", value: "5.4M", score: 62, tone: "gold", note: "Estimated national herd after the annual veterinary survey.", source: "Veterinary services survey" },
      { id: "agri-input", label: "Input support delivery", value: "76", unit: "%", score: 76, tone: "warning", note: "Share of enrolled households receiving inputs before planting.", source: "Input programme monitoring" },
    ],
    segments: ["smallholder-farmers", "rural-households", "informal-traders", "exporters", "women-led-enterprises", "development-partners"],
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
    documents: [
      { id: "agri-doc-1", name: "Seasonal_Crop_Assessment_2026.pdf", kind: "pdf", sizeLabel: "5.2 MB", date: "2026-07-08", note: "Provincial production estimates and commentary." },
      { id: "agri-doc-2", name: "Irrigation_Rehabilitation_Options.txt", kind: "txt", sizeLabel: "168 KB", date: "2026-06-19", note: "Scheme-by-scheme rehabilitation options." },
      { id: "agri-doc-3", name: "Livestock_Disease_Contingency.docx", kind: "docx", sizeLabel: "1.1 MB", date: "2026-04-27", note: "Contingency plan for notifiable diseases." },
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
      { id: "health-facilities", label: "Functional primary facilities", value: "94", unit: "%", score: 94, tone: "success", note: "Facilities open and staffed on the reporting day.", source: "Facility reporting system" },
      { id: "health-stockout", label: "Essential medicine availability", value: "72", unit: "%", score: 72, tone: "warning", note: "Tracer medicines available at the point of care.", source: "Supply chain dashboard" },
      { id: "health-staffing", label: "Nurse posts filled", value: "81", unit: "%", score: 81, tone: "primary", note: "Funded nursing posts with an officer in place.", source: "Establishment returns" },
      { id: "health-immune", label: "Child immunisation coverage", value: "87", unit: "%", score: 87, tone: "gold", note: "Children completing the scheduled course before age one.", source: "Expanded programme returns" },
    ],
    segments: ["health-workers", "urban-households", "rural-households", "civil-servants", "development-partners", "women-led-enterprises"],
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
    documents: [
      { id: "health-doc-1", name: "National_Health_Profile_2026.pdf", kind: "pdf", sizeLabel: "6.4 MB", date: "2026-08-05", note: "National health indicators by province." },
      { id: "health-doc-2", name: "Workforce_Retention_Options.docx", kind: "docx", sizeLabel: "1.7 MB", date: "2026-07-14", note: "Non-salary retention options appraisal." },
      { id: "health-doc-3", name: "Essential_Medicines_Stock_Report.txt", kind: "txt", sizeLabel: "96 KB", date: "2026-06-02", note: "Tracer medicine availability report." },
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
      { id: "edu-enrolment", label: "Primary enrolment", value: "94", unit: "% net", score: 94, tone: "success", note: "Children of primary age enrolled in a registered school.", source: "Annual school census" },
      { id: "edu-ratio", label: "Learner-teacher ratio", value: "38:1", score: 62, tone: "warning", note: "National average across public primary schools.", source: "Annual school census" },
      { id: "edu-transition", label: "Secondary transition", value: "82", unit: "%", score: 82, tone: "primary", note: "Grade 7 completers progressing to form one.", source: "Examinations returns" },
      { id: "edu-feeding", label: "Feeding coverage", value: "1.6M", unit: "learners", score: 70, tone: "gold", note: "Learners receiving a daily meal under the programme.", source: "Programme monitoring returns" },
    ],
    segments: ["educators", "rural-households", "urban-households", "youth", "development-partners", "women-led-enterprises"],
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
    documents: [
      { id: "edu-doc-1", name: "Annual_School_Census_2026.pdf", kind: "pdf", sizeLabel: "4.1 MB", date: "2026-08-12", note: "Enrolment, staffing and infrastructure census." },
      { id: "edu-doc-2", name: "Teacher_Deployment_Analysis.txt", kind: "txt", sizeLabel: "142 KB", date: "2026-07-03", note: "Vacancy and ratio analysis by district." },
      { id: "edu-doc-3", name: "Curriculum_Implementation_Review.docx", kind: "docx", sizeLabel: "2.2 MB", date: "2026-05-21", note: "Review of curriculum rollout readiness." },
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
      { id: "hedu-enrolment", label: "Tertiary enrolment", value: "131k", unit: "students", score: 74, tone: "primary", note: "Students registered at universities and colleges in the academic year.", source: "Tertiary enrolment returns" },
      { id: "hedu-tvet-share", label: "Vocational share of enrolment", value: "34", unit: "%", score: 54, tone: "warning", note: "Share of tertiary students in vocational rather than academic programmes.", source: "Tertiary enrolment returns" },
      { id: "hedu-graduation", label: "Graduation rate", value: "78", unit: "%", score: 78, tone: "success", note: "Registered students completing their programme within the standard duration.", source: "Institutional returns" },
      { id: "hedu-research", label: "Research outputs registered", value: "212", score: 66, tone: "gold", note: "Publications and intellectual property registrations in the year.", source: "Research council register" },
    ],
    segments: ["youth", "educators", "formal-business", "diaspora", "development-partners"],
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
    documents: [
      { id: "hedu-doc-1", name: "Tertiary_Enrolment_Report_2026.pdf", kind: "pdf", sizeLabel: "3.3 MB", date: "2026-08-21", note: "Enrolment and completion by institution." },
      { id: "hedu-doc-2", name: "Skills_Priority_Schedule.txt", kind: "txt", sizeLabel: "88 KB", date: "2026-07-10", note: "Occupations identified as national skill gaps." },
      { id: "hedu-doc-3", name: "Innovation_Fund_Design_Note.docx", kind: "docx", sizeLabel: "1.4 MB", date: "2026-05-29", note: "Design options for competitive research funding." },
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
      { id: "ict-coverage", label: "Population mobile coverage", value: "93", unit: "%", score: 93, tone: "success", note: "Population within reach of a functioning mobile signal.", source: "Regulator coverage survey" },
      { id: "ict-broadband", label: "Broadband penetration", value: "61", unit: "%", score: 61, tone: "primary", note: "Households with a fixed or mobile broadband subscription.", source: "Regulator market report" },
      { id: "ict-data-cost", label: "Data cost", value: "4.1", unit: "% of GNI", score: 58, tone: "warning", note: "Entry-level mobile data basket as a share of average income.", source: "Regulator market report" },
      { id: "ict-egov", label: "Services online", value: "38 of 120", score: 32, tone: "gold", note: "High-volume public services available end to end online.", source: "e-Government programme office" },
    ],
    segments: ["urban-households", "rural-households", "financial-sector", "formal-business", "youth", "informal-traders"],
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
    documents: [
      { id: "ict-doc-1", name: "National_Broadband_Coverage_Survey.pdf", kind: "pdf", sizeLabel: "2.9 MB", date: "2026-08-14", note: "Coverage and quality survey by district." },
      { id: "ict-doc-2", name: "Digital_Services_Inventory.txt", kind: "txt", sizeLabel: "104 KB", date: "2026-07-17", note: "Inventory of online-ready public services." },
      { id: "ict-doc-3", name: "Data_Residency_Standard_Draft.docx", kind: "docx", sizeLabel: "780 KB", date: "2026-06-05", note: "Draft classification and residency standard." },
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
      { id: "mines-share", label: "Mining share of exports", value: "61", unit: "%", score: 61, tone: "gold", note: "Minerals as a share of total merchandise export value.", source: "Trade statistics" },
      { id: "mines-beneficiation", label: "Domestically processed output", value: "27", unit: "%", score: 27, tone: "warning", note: "Share of extracted mineral value processed before export.", source: "Mining sector returns" },
      { id: "mines-licences", label: "Licence turnaround", value: "48", unit: "days", score: 42, tone: "primary", note: "Average time from complete application to decision.", source: "Mining cadastre" },
      { id: "mines-incidents", label: "Reportable incidents", value: "31", unit: "per year", score: 62, tone: "success", note: "Reportable accidents recorded across inspected operations.", source: "Inspectorate returns" },
    ],
    segments: ["mining-operators", "rural-households", "exporters", "local-authorities", "formal-business"],
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
    documents: [
      { id: "mines-doc-1", name: "Mineral_Revenue_Statement_2026.pdf", kind: "pdf", sizeLabel: "2.2 MB", date: "2026-08-07", note: "Royalty and mineral revenue by commodity." },
      { id: "mines-doc-2", name: "Artisanal_Mining_Register.txt", kind: "txt", sizeLabel: "156 KB", date: "2026-07-01", note: "Registered small-scale operations by district." },
      { id: "mines-doc-3", name: "Beneficiation_Options_Paper.docx", kind: "docx", sizeLabel: "1.9 MB", date: "2026-04-30", note: "Options for domestic processing incentives." },
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
      { id: "energy-access", label: "Electricity access", value: "55", unit: "% of households", score: 55, tone: "warning", note: "Households connected to the grid or a verified off-grid supply.", source: "National electrification survey" },
      { id: "energy-gen", label: "Installed capacity", value: "2.5", unit: "GW", score: 68, tone: "primary", note: "Installed generation capacity connected to the national grid.", source: "System operator returns" },
      { id: "energy-supply", label: "Unserved demand", value: "410", unit: "MW", score: 48, tone: "gold", note: "Average shortfall met through load management.", source: "System operator returns" },
      { id: "energy-losses", label: "Distribution losses", value: "12.6", unit: "%", score: 60, tone: "success", note: "Energy lost between transmission and billing.", source: "Utility performance report" },
    ],
    segments: ["formal-business", "urban-households", "rural-households", "mining-operators", "informal-traders"],
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
    documents: [
      { id: "energy-doc-1", name: "National_Electrification_Survey.pdf", kind: "pdf", sizeLabel: "3.7 MB", date: "2026-08-18", note: "Access and connection survey by district." },
      { id: "energy-doc-2", name: "Tariff_Path_Modelling.txt", kind: "txt", sizeLabel: "132 KB", date: "2026-06-25", note: "Modelled tariff path and affordability analysis." },
      { id: "energy-doc-3", name: "Fuel_Stockholding_Review.docx", kind: "docx", sizeLabel: "940 KB", date: "2026-05-08", note: "Review of strategic stock obligations." },
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
      { id: "psc-establishment", label: "Funded posts filled", value: "88", unit: "%", score: 88, tone: "success", note: "Funded establishment positions with an officer in post.", source: "Establishment returns" },
      { id: "psc-age", label: "Officers aged over 55", value: "19", unit: "%", score: 19, tone: "warning", note: "Share of the establishment approaching retirement age.", source: "Payroll analysis" },
      { id: "psc-appraisal", label: "Appraisals completed", value: "64", unit: "%", score: 64, tone: "primary", note: "Officers with a completed and countersigned annual appraisal.", source: "Performance management returns" },
      { id: "psc-training", label: "Training days per officer", value: "4.2", score: 42, tone: "gold", note: "Average recorded training days per officer in the year.", source: "Training records" },
    ],
    segments: ["civil-servants", "youth", "women-led-enterprises", "local-authorities", "development-partners"],
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
    documents: [
      { id: "psc-doc-1", name: "Establishment_and_Payroll_Report.pdf", kind: "pdf", sizeLabel: "2.4 MB", date: "2026-08-26", note: "Establishment, vacancy and payroll reconciliation." },
      { id: "psc-doc-2", name: "Age_Profile_Analysis.txt", kind: "txt", sizeLabel: "74 KB", date: "2026-07-09", note: "Age distribution by cadre and ministry." },
      { id: "psc-doc-3", name: "Performance_Framework_Options.docx", kind: "docx", sizeLabel: "1.2 MB", date: "2026-06-16", note: "Options for appraisal reform." },
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
      { id: "lg-water", label: "Urban water availability", value: "17.5", unit: "hrs/day", score: 58, tone: "warning", note: "Average hours of piped water supply in serviced urban areas.", source: "Local authority returns" },
      { id: "lg-sanitation", label: "Sewerage coverage", value: "76", unit: "%", score: 76, tone: "primary", note: "Households connected to a functioning sewerage system.", source: "Local authority returns" },
      { id: "lg-roads", label: "Feeder roads in good condition", value: "48", unit: "%", score: 48, tone: "gold", note: "Assessed feeder road length in fair or better condition.", source: "Road condition survey" },
      { id: "lg-absorption", label: "Devolution absorption", value: "71", unit: "%", score: 71, tone: "success", note: "Allocated devolution funds spent within the financial year.", source: "Devolution fund returns" },
    ],
    segments: ["local-authorities", "urban-households", "rural-households", "informal-traders", "women-led-enterprises"],
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
    documents: [
      { id: "lg-doc-1", name: "Local_Authority_Performance_Report.pdf", kind: "pdf", sizeLabel: "3.4 MB", date: "2026-08-23", note: "Service performance across urban and rural councils." },
      { id: "lg-doc-2", name: "Water_Supply_Audit.txt", kind: "txt", sizeLabel: "148 KB", date: "2026-07-06", note: "Supply hours and non-revenue water by town." },
      { id: "lg-doc-3", name: "Devolution_Absorption_Brief.docx", kind: "docx", sizeLabel: "860 KB", date: "2026-05-19", note: "Absorption by province and council." },
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
      { id: "mfa-missions", label: "Diplomatic missions", value: "46", score: 74, tone: "primary", note: "Missions and consulates in operation.", source: "Ministry establishment record" },
      { id: "mfa-consular", label: "Consular document turnaround", value: "21", unit: "days", score: 46, tone: "warning", note: "Average time to issue a passport or consular document abroad.", source: "Consular service returns" },
      { id: "mfa-trade-util", label: "Preferential access utilisation", value: "58", unit: "%", score: 58, tone: "gold", note: "Exports eligible for preferential terms that actually claim them.", source: "Trade statistics" },
      { id: "mfa-remittance", label: "Recorded remittances", value: "USD 2.1B", score: 70, tone: "success", note: "Formal remittance inflows recorded in the year.", source: "Balance of payments" },
    ],
    segments: ["exporters", "diaspora", "development-partners", "formal-business", "financial-sector"],
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
    documents: [
      { id: "mfa-doc-1", name: "Trade_Agreement_Utilisation_Report.pdf", kind: "pdf", sizeLabel: "2.6 MB", date: "2026-08-09", note: "Utilisation of preferential access by agreement." },
      { id: "mfa-doc-2", name: "Consular_Service_Audit.txt", kind: "txt", sizeLabel: "112 KB", date: "2026-06-27", note: "Processing times and volumes by mission." },
      { id: "mfa-doc-3", name: "Diaspora_Framework_Consultation.docx", kind: "docx", sizeLabel: "1.5 MB", date: "2026-05-11", note: "Consultation record on diaspora channels." },
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
      { id: "env-parks", label: "Protected area coverage", value: "16.2", unit: "% of land", score: 81, tone: "success", note: "Land under statutory protection, including parks and conservancies.", source: "Protected area register" },
      { id: "env-forest", label: "Forest cover change", value: "-0.4", unit: "% per year", score: 44, tone: "warning", note: "Net annual change in national forest cover.", source: "Forestry survey" },
      { id: "env-licences", label: "Environmental licence turnaround", value: "62", unit: "days", score: 38, tone: "gold", note: "Average time from complete application to decision.", source: "Environmental agency records" },
      { id: "env-climate", label: "Adaptation plans in place", value: "31 of 92", score: 34, tone: "primary", note: "Local authorities with an adopted climate adaptation plan.", source: "Climate programme returns" },
    ],
    segments: ["rural-households", "smallholder-farmers", "mining-operators", "development-partners", "local-authorities"],
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
    documents: [
      { id: "env-doc-1", name: "State_of_the_Environment_Report.pdf", kind: "pdf", sizeLabel: "8.1 MB", date: "2026-08-01", note: "National environmental condition report." },
      { id: "env-doc-2", name: "Wetland_Inventory.txt", kind: "txt", sizeLabel: "204 KB", date: "2026-07-13", note: "Listed wetlands by province and district." },
      { id: "env-doc-3", name: "Impact_Assessment_Reform_Options.docx", kind: "docx", sizeLabel: "1.6 MB", date: "2026-05-26", note: "Options for tiered assessment." },
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
      { id: "def-readiness", label: "Personnel at readiness", value: "91", unit: "%", score: 91, tone: "success", note: "Establishment personnel assessed as deployable at the reporting date.", source: "Readiness returns" },
      { id: "def-veterans", label: "Veteran benefits processed", value: "78", unit: "%", score: 78, tone: "primary", note: "Verified benefit applications processed within the published standard.", source: "Veterans affairs returns" },
      { id: "def-response", label: "Civil support response", value: "14", unit: "hrs", score: 66, tone: "gold", note: "Average time from a request by civil authorities to deployment.", source: "Operations records" },
      { id: "def-equipment", label: "Equipment serviceability", value: "71", unit: "%", score: 71, tone: "warning", note: "Major equipment assessed as serviceable.", source: "Technical services returns" },
    ],
    segments: ["civil-servants", "rural-households", "development-partners", "local-authorities"],
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
    documents: [
      { id: "def-doc-1", name: "Readiness_Assessment_Report.pdf", kind: "pdf", sizeLabel: "1.8 MB", date: "2026-08-16", note: "Personnel and equipment readiness assessment." },
      { id: "def-doc-2", name: "Veterans_Benefits_Register_Summary.txt", kind: "txt", sizeLabel: "66 KB", date: "2026-07-07", note: "Beneficiary counts and payment summary." },
      { id: "def-doc-3", name: "Civil_Support_Framework_Draft.docx", kind: "docx", sizeLabel: "1.0 MB", date: "2026-06-09", note: "Draft framework for disaster support." },
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
      { id: "zimra-target", label: "Revenue against target", value: "94", unit: "%", score: 94, tone: "success", note: "Collections against the annual revenue target to date.", source: "Monthly collections report" },
      { id: "zimra-clearance", label: "Border clearance time", value: "26", unit: "hrs", score: 56, tone: "warning", note: "Average time from declaration to release for compliant consignments.", source: "Customs systems data" },
      { id: "zimra-filing", label: "On-time filing rate", value: "69", unit: "%", score: 69, tone: "primary", note: "Registered taxpayers filing by the due date.", source: "Taxpayer register" },
      { id: "zimra-audit", label: "Audit yield per case", value: "USD 18k", score: 62, tone: "gold", note: "Average additional assessment raised per completed audit.", source: "Audit performance report" },
    ],
    segments: ["formal-business", "informal-traders", "exporters", "financial-sector", "mining-operators"],
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
    documents: [
      { id: "zimra-doc-1", name: "Revenue_Performance_Report_2026.pdf", kind: "pdf", sizeLabel: "2.7 MB", date: "2026-08-25", note: "Collections by tax head against target." },
      { id: "zimra-doc-2", name: "Border_Clearance_Study.txt", kind: "txt", sizeLabel: "118 KB", date: "2026-07-02", note: "Clearance time study at major ports." },
      { id: "zimra-doc-3", name: "Compliance_Strategy_Options.docx", kind: "docx", sizeLabel: "1.3 MB", date: "2026-05-15", note: "Options for compliance and dispute reform." },
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
      { id: "zida-licences", label: "Licences issued", value: "412", score: 82, tone: "primary", note: "Investment licences issued in the reporting year.", source: "Licensing register" },
      { id: "zida-turnaround", label: "Licence turnaround", value: "18", unit: "days", score: 64, tone: "gold", note: "Average time from complete application to decision.", source: "Licensing register" },
      { id: "zida-zones", label: "Zone occupancy", value: "63", unit: "%", score: 63, tone: "success", note: "Developable area in designated zones occupied by operating firms.", source: "Zone administration returns" },
      { id: "zida-retention", label: "Investor retention", value: "89", unit: "%", score: 89, tone: "primary", note: "Licensed investors still operating three years after licensing.", source: "Aftercare survey" },
    ],
    segments: ["formal-business", "exporters", "diaspora", "development-partners", "financial-sector"],
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
    documents: [
      { id: "zida-doc-1", name: "Investment_Licensing_Report_2026.pdf", kind: "pdf", sizeLabel: "2.1 MB", date: "2026-08-20", note: "Licences issued by sector and origin." },
      { id: "zida-doc-2", name: "Zone_Occupancy_Returns.txt", kind: "txt", sizeLabel: "82 KB", date: "2026-07-16", note: "Zone occupancy and employment figures." },
      { id: "zida-doc-3", name: "Aftercare_Case_Review.docx", kind: "docx", sizeLabel: "1.1 MB", date: "2026-06-13", note: "Review of investor aftercare cases." },
    ],
  },
];

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

/** The number of departments the platform must always render. */
export const DEPARTMENT_COUNT = DEPARTMENTS.length;

