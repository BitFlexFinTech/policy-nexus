import type { ScenarioId } from "@/data/documents";

export type Clearance = "Viewer" | "Analyst" | "Director" | "Minister";

export interface PolicyTemplate {
  title: string;
  text: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  domains: string[];
  defaultScenario: ScenarioId;
  clearance: Clearance;
  /** Department-contextual label for the policy draft panel. */
  draftLabel: string;
  templates: PolicyTemplate[];
}

const d = (x: Department) => x;

export const DEPARTMENTS: Department[] = [
  d({ id: "opc", code: "OPC", name: "Office of the President and Cabinet", domains: ["Cabinet Coordination", "Vision 2030", "Devolution"], defaultScenario: "public-opinion", clearance: "Minister", draftLabel: "Cabinet Policy Memorandum",
    templates: [
      { title: "Vision 2030 Mid-Term Acceleration Directive", text: "Cabinet directs all ministries to accelerate delivery of Vision 2030 upper-middle-income targets by prioritising devolution funds, infrastructure completion and public service reform. Simulate national public response across urban, rural and diaspora stakeholders over 24 months." },
      { title: "National Devolution Fund Reallocation", text: "Allocate a minimum of 5% of national revenue to provincial and local authorities under Section 301 of the Constitution, with performance-based disbursement. Simulate provincial and citizen response." },
    ] }),
  d({ id: "finance", code: "MoFED", name: "Ministry of Finance", domains: ["Fiscal Policy", "ZiG Monetary Framework", "Budget"], defaultScenario: "financial", clearance: "Director", draftLabel: "Fiscal Policy Proposal",
    templates: [
      { title: "ZiG Mandatory Tax Settlement for Exporters", text: "Exporters shall settle 50% of domestic tax obligations in ZiG from the next fiscal quarter, with the balance payable in foreign currency. Simulate liquidity, exchange rate and exporter response." },
      { title: "Intermediated Money Transfer Tax Review", text: "Reduce the IMTT rate from 2% to 1.5% on transactions below ZiG 5,000 to support financial inclusion. Simulate revenue impact and household response." },
    ] }),
  d({ id: "agriculture", code: "MLAFWRD", name: "Ministry of Agriculture", domains: ["Food Security", "Climate Resilience", "Land Tenure"], defaultScenario: "public-opinion", clearance: "Director", draftLabel: "Agricultural Policy Draft",
    templates: [
      { title: "El Niño Pfumvudza/Intwasa Input Expansion", text: "Expand the Pfumvudza/Intwasa climate-proofed input scheme to 3.2 million households ahead of a forecast El Niño season, with drought-tolerant seed varieties. Simulate A1/A2 farmer and rural household response." },
      { title: "A1 Permit to Title Conversion", text: "Convert A1 settlement permits to bankable land tenure documents over three years. Simulate farmer, bank and community response." },
    ] }),
  d({ id: "health", code: "MoHCC", name: "Ministry of Health", domains: ["Primary Care", "Health Financing", "Workforce"], defaultScenario: "public-opinion", clearance: "Director", draftLabel: "Health Policy Draft",
    templates: [
      { title: "National Health Insurance Scheme Pilot", text: "Pilot a contributory National Health Insurance Scheme in three provinces with a ZiG-denominated premium and subsidised cover for vulnerable households. Simulate citizen, worker and provider response." },
      { title: "Health Worker Retention Allowance", text: "Introduce a rural retention allowance for nurses and doctors payable in USD for 24 months. Simulate union and fiscal response." },
    ] }),
  d({ id: "education", code: "MoPSE", name: "Ministry of Education", domains: ["Basic Education", "Heritage-Based Curriculum", "School Financing"], defaultScenario: "narrative", clearance: "Analyst", draftLabel: "Education Policy Draft",
    templates: [
      { title: "Heritage-Based Curriculum Rollout", text: "Roll out the Heritage-Based Curriculum in all primary schools with indigenous language instruction up to Grade 3. Simulate parent, teacher and heritage institution response." },
      { title: "School Fees Ceiling Policy", text: "Cap government school fees at ZiG levels indexed to CPI with a waiver for BEAM beneficiaries. Simulate household and school authority response." },
    ] }),
  d({ id: "ict", code: "MICTPCS", name: "Ministry of ICT", domains: ["Digital Economy", "Data Protection", "AI Strategy"], defaultScenario: "enterprise", clearance: "Director", draftLabel: "Digital Policy Draft",
    templates: [
      { title: "2026 National Digital Regulatory Framework", text: "Establish a unified digital regulatory framework covering data localisation, platform licensing and AI accountability under the Cyber and Data Protection Act. Simulate telecom, bank, SME and investor response." },
      { title: "Mugove/Umqele/Isabelo National AI Fund", text: "Create a National AI Fund offering tax incentives and matched grants to local AI start-ups. Simulate enterprise and investor response." },
    ] }),
  d({ id: "mines", code: "MoMMD", name: "Ministry of Mines", domains: ["Mineral Beneficiation", "Royalties", "Artisanal Mining"], defaultScenario: "enterprise", clearance: "Director", draftLabel: "Mining Policy Draft",
    templates: [
      { title: "Lithium Beneficiation Requirement", text: "Require lithium miners to process ore to concentrate or higher domestically within 24 months, with an export ban on raw ore. Simulate miner, investor and logistics response." },
      { title: "Artisanal Miner Formalisation", text: "Formalise artisanal and small-scale miners through simplified claims registration and a gold buying network. Simulate miner and community response." },
    ] }),
  d({ id: "energy", code: "MoEPD", name: "Ministry of Energy", domains: ["Power Generation", "Fuel Pricing", "Renewables"], defaultScenario: "public-opinion", clearance: "Director", draftLabel: "Energy Policy Draft",
    templates: [
      { title: "Fuel Subsidy Reform and Kombi Fare Stabilisation", text: "Phase out the fuel price subsidy over 12 months while introducing a targeted commuter fare support for urban kombi routes. Simulate operator, commuter and trader response." },
      { title: "Independent Power Producer Solar Tariff", text: "Introduce a feed-in tariff for independent solar producers above 5MW paid in foreign currency. Simulate investor and utility response." },
    ] }),
  d({ id: "public-service", code: "MoPSLSW", name: "Ministry of Public Service", domains: ["Civil Service Pay", "Pensions", "Social Welfare"], defaultScenario: "public-opinion", clearance: "Director", draftLabel: "Public Service Policy Draft",
    templates: [
      { title: "Civil Service Wage Adjustment — ZiG Parity", text: "Adjust civil service salaries by 20% in ZiG terms with a USD cushion allowance retained for two quarters. Simulate union, fiscal and household response." },
      { title: "Pension Value Restoration", text: "Compensate pensioners for currency-conversion losses through a phased restoration scheme. Simulate pensioner and fiscal response." },
    ] }),
  d({ id: "local-government", code: "MoLGPW", name: "Ministry of Local Government", domains: ["Urban Councils", "Water & Sanitation", "Housing"], defaultScenario: "public-opinion", clearance: "Analyst", draftLabel: "Local Government Policy Draft",
    templates: [
      { title: "Harare Water Service Recovery Plan", text: "Ring-fence council water revenue for treatment chemicals and pipe replacement with a prepaid metering rollout. Simulate household, council and trader response." },
      { title: "Informal Traders Designated Markets", text: "Relocate CBD informal traders to designated markets with licensed stalls and reduced fees. Simulate trader and commuter response." },
    ] }),
  d({ id: "foreign-affairs", code: "MoFAIT", name: "Ministry of Foreign Affairs", domains: ["Trade Diplomacy", "Diaspora Engagement", "AfCFTA"], defaultScenario: "enterprise", clearance: "Director", draftLabel: "Foreign Policy Draft",
    templates: [
      { title: "AfCFTA Accelerated Tariff Offer", text: "Accelerate AfCFTA tariff liberalisation on 90% of tariff lines over five years with sensitive-product protections. Simulate exporter, manufacturer and logistics response." },
      { title: "Diaspora Investment Bond", text: "Issue a USD diaspora infrastructure bond with remittance-linked subscription channels. Simulate diaspora and financial sector response." },
    ] }),
  d({ id: "environment", code: "MoECTHI", name: "Ministry of Environment", domains: ["Climate Policy", "Wildlife", "Carbon Markets"], defaultScenario: "enterprise", clearance: "Analyst", draftLabel: "Environmental Policy Draft",
    templates: [
      { title: "Carbon Credit Revenue Sharing Framework", text: "Require carbon credit projects to share 30% of revenue with government and 20% with host communities. Simulate project developer, investor and community response." },
      { title: "Plastic Packaging Levy", text: "Introduce a levy on single-use plastic packaging with a producer take-back obligation. Simulate manufacturer, retailer and household response." },
    ] }),
  d({ id: "defence", code: "MoDWVA", name: "Ministry of Defence", domains: ["National Security", "Disaster Response", "Veterans Welfare"], defaultScenario: "public-opinion", clearance: "Minister", draftLabel: "Defence Policy Draft (Restricted)",
    templates: [
      { title: "Civil Protection Disaster Response Readiness", text: "Pre-position defence logistics and engineering units for cyclone and flood response under the Civil Protection Act. Simulate community and provincial response." },
      { title: "War Veterans Welfare Review", text: "Review war veterans pension and welfare benefits with indexation to CPI. Simulate veteran and fiscal response." },
    ] }),
  d({ id: "zimra", code: "ZIMRA", name: "ZIMRA", domains: ["Revenue Collection", "Customs", "Tax Compliance"], defaultScenario: "financial", clearance: "Analyst", draftLabel: "Revenue Measure Draft",
    templates: [
      { title: "Fiscalised Electronic Invoicing Mandate", text: "Mandate fiscalised electronic invoicing for all VAT-registered operators within 12 months with a compliance grace period for SMEs. Simulate retailer, SME and revenue response." },
      { title: "Presumptive Tax for Informal Traders", text: "Introduce a simplified presumptive tax payable via mobile money for informal traders. Simulate trader and revenue response." },
    ] }),
  d({ id: "zida", code: "ZIDA", name: "ZIDA", domains: ["Investment Promotion", "Special Economic Zones", "Investor Aftercare"], defaultScenario: "enterprise", clearance: "Analyst", draftLabel: "Investment Policy Draft",
    templates: [
      { title: "One-Stop Investment Licensing", text: "Consolidate investment licensing into a single 10-day digital process with statutory deemed-approval. Simulate investor and regulator response." },
      { title: "Special Economic Zone Incentive Lock-in", text: "Guarantee SEZ incentive terms for 10 years through investment agreements. Simulate foreign and domestic investor response." },
    ] }),
  d({ id: "higher-education", code: "MHTEISTD", name: "Ministry of Higher Education", domains: ["Education 5.0", "Innovation Hubs", "Tertiary Funding"], defaultScenario: "narrative", clearance: "Analyst", draftLabel: "Higher Education Policy Draft",
    templates: [
      { title: "Education 5.0 Innovation Hub Funding", text: "Fund university innovation hubs and industrial parks with commercialisation targets under Education 5.0. Simulate student, faculty and industry response." },
      { title: "Tertiary Student Loan Scheme", text: "Reintroduce an income-contingent tertiary student loan scheme denominated in ZiG. Simulate student, bank and fiscal response." },
    ] }),
];

export const getDepartment = (id?: string | null) => DEPARTMENTS.find((x) => x.id === id);

export const CLEARANCE_RANK: Record<Clearance, number> = { Viewer: 0, Analyst: 1, Director: 2, Minister: 3 };

export type Permission = "run" | "export" | "cabinet" | "rooms" | "audit";

const REQUIRED: Record<Permission, Clearance> = {
  run: "Analyst",
  export: "Analyst",
  cabinet: "Director",
  rooms: "Analyst",
  audit: "Director",
};

export const can = (clearance: Clearance | undefined, p: Permission) =>
  !!clearance && CLEARANCE_RANK[clearance] >= CLEARANCE_RANK[REQUIRED[p]];

export const requiredClearance = (p: Permission) => REQUIRED[p];
