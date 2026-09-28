/**
 * SINGLE SOURCE OF TRUTH — reference date, reference rates, and stakeholder
 * segments.
 *
 * DETERMINISM: every date shown anywhere in the app derives from REFERENCE_DATE.
 * No component may call `new Date()`, `Date.now()`, or `Math.random()`.
 * (see .clinerules/04-determinism-and-validation.md)
 */

/** The fixed reference date for the entire build. All dates derive from this. */
export const REFERENCE_DATE = "2026-09-24";

/** Human-readable form of REFERENCE_DATE, e.g. "24 September 2026". */
export const REFERENCE_DATE_LABEL = "24 September 2026";

/** The fiscal year the department indicators are stated for. */
export const REFERENCE_FISCAL_YEAR = "2026";

/**
 * Reference rates. These are labelled reference inputs, not live market data.
 * The live-feed swap point is documented in PRODUCTION_READINESS.md §5.
 */
export const REFERENCE_RATES = [
  {
    id: "zig-usd",
    label: "ZiG exchange rate",
    value: 13.56,
    unit: "ZiG per USD",
    note: "Reference input used for all currency conversion in this workspace.",
  },
  {
    id: "policy-rate",
    label: "Policy rate",
    value: 19.5,
    unit: "% per annum",
    note: "Reference input for financing-cost assumptions.",
  },
  {
    id: "inflation",
    label: "Annual inflation",
    value: 8.4,
    unit: "% year on year",
    note: "Reference input for purchasing-power assumptions.",
  },
] as const;

export type ReferenceRateId = (typeof REFERENCE_RATES)[number]["id"];

/** Look-up helper so callers never index into the array by position. */
export const getReferenceRate = (id: ReferenceRateId) => {
  const rate = REFERENCE_RATES.find((r) => r.id === id);
  if (!rate) throw new Error(`Unknown reference rate: ${id}`);
  return rate;
};

/** The two bases the published shares are percentages of, each named once. */
const SHARE_BASE_EMPLOYED = "employed persons counted in the 2022 census (2,501,887)";
const SHARE_BASE_POPULATION = "people counted in Zimbabwe in the 2022 census (15,178,957)";
/** A third base: the disability figure is published for people aged 5 and over, not for everyone. */
const SHARE_BASE_POPULATION_5PLUS = "people aged 5 and over counted in the 2022 census (13,102,643)";
/** A fourth base: the labour-force survey counts employed people on its own definition, so its total differs. */
const SHARE_BASE_QLFS_EMPLOYED = "employed persons counted in the QLFS Q2 2025 (3,186,598)";

/** The one word used wherever a share is modelled rather than published. */
export const MODELLED_SHARE_LABEL = "Modelled";

/**
 * Canonical stakeholder segments. These are the population groups the
 * simulation models and the labels used in the stakeholder agent feed.
 * Departments may reference these ids; they may not invent their own labels.
 *
 * WEIGHTS (AB-2). Each segment carries the REAL share of the country it stands
 * for, so the modelled agents are split the way the country actually is instead
 * of evenly. Two rules keep this honest:
 *   - `share` is a published figure, and `shareBase`/`shareSource` say what it is
 *     a percentage of and where it came from. The figures are ZIMSTAT's own, from
 *     the 2022 census main report (`2022_PHC_Report_27012023_Final.pdf`): Table 6.6
 *     (employed persons by industry, total 2,501,887) and Table 2.7 (population by
 *     age and urban/rural, total 15,178,957).
 *   - where no official figure exists, `share` is **null** and `shareSource` reads
 *     "Modelled". A modelled share is never presented as official, and `null` is
 *     never quietly filled with a guess.
 */
export const STAKEHOLDER_SEGMENTS = [
  {
    id: "civil-servants",
    label: "Civil servants",
    note: "Public service establishment and pensioners",
    share: 3.3,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — public administration and defence (82,040)",
  },
  {
    id: "urban-households",
    label: "Urban households",
    note: "Formal and informal urban wage earners",
    share: 38.6,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census — urban population (5,855,099)",
  },
  {
    id: "rural-households",
    label: "Rural households",
    note: "Communal, A1 and A2 land holders",
    share: 61.4,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census — rural population (9,323,858)",
  },
  {
    id: "informal-traders",
    label: "Informal traders and transporters",
    note: "Market vendors and commuter operators",
    share: 17.7,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — wholesale and retail trade (443,742)",
  },
  {
    id: "formal-business",
    label: "Formal business",
    note: "Registered employers in manufacturing, retail and services",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "mining-operators",
    label: "Mining operators",
    note: "Large-scale, medium and artisanal producers",
    share: 9.1,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — mining and quarrying (227,079)",
  },
  {
    id: "smallholder-farmers",
    label: "Smallholder farmers",
    note: "Maize, tobacco and horticulture producers",
    share: 23.3,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — agriculture, forestry and fishing (582,138)",
  },
  {
    id: "diaspora",
    label: "Diaspora households",
    note: "Remittance senders and their receiving households",
    share: 6,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census — emigrants counted (908,914)",
  },
  {
    id: "youth",
    label: "Youth",
    note: "15–35 cohort in education, training or work-seeking",
    share: 31.9,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census — population aged 15–34 (4,836,291)",
  },
  {
    id: "women-led-enterprises",
    label: "Women-led enterprises",
    note: "SMEs and cooperatives with majority women ownership",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "exporters",
    label: "Exporters",
    note: "Mineral, agricultural and manufactured exporters",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "financial-sector",
    label: "Financial sector",
    note: "Banks, insurers, microfinance and mobile money",
    share: 1.3,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — financial and insurance activities (32,050)",
  },
  {
    id: "local-authorities",
    label: "Local authorities",
    note: "Urban and rural district councils",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "development-partners",
    label: "Development partners",
    note: "Multilateral and bilateral programmes",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "health-workers",
    label: "Health workers",
    note: "Clinical, nursing and community health cadres",
    share: 2.5,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — human health and social work (61,358)",
  },
  {
    id: "educators",
    label: "Educators",
    note: "Primary, secondary and tertiary teaching staff",
    share: 5.9,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census — education (148,470)",
  },
  // ——— Phase AC (E-1): the groups the platform did not model before. ———
  // A published figure is used as published; where none exists the source reads "Modelled".
  {
    id: "persons-with-disabilities",
    label: "Persons with disabilities",
    note: "People living with a disability — 206,447, or 1.6% of people aged 5 and over",
    share: 1.6,
    shareBase: SHARE_BASE_POPULATION_5PLUS,
    shareSource: "ZIMSTAT 2022 PHC Disability Thematic Report — persons with disabilities (206,447)",
  },
  {
    id: "faith-groups",
    label: "Faith-based organisations",
    note: "Churches and their social wings — 12,937,804 people, or 85.2% of the population, are Christian",
    share: 85.2,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census, Table 2.14(c) — Christians (12,937,804)",
  },
  {
    id: "tourism-operators",
    label: "Tourism operators",
    note: "Accommodation, food service and tour operators — 40,921 employed",
    share: 1.6,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census, Table 6.6 — accommodation and food service (40,921)",
  },
  {
    id: "manufacturers",
    label: "Manufacturers",
    note: "Registered manufacturing employers and their workforces — 257,740 employed",
    share: 10.3,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census, Table 6.6 — manufacturing (257,740)",
  },
  {
    id: "transport-operators",
    label: "Transport operators",
    note: "Road, rail and freight operators — 87,730 employed",
    share: 3.5,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census, Table 6.6 — transportation and storage (87,730)",
  },
  {
    id: "researchers",
    label: "Researchers and technical professionals",
    note: "Research institutes, laboratories and technical services — 51,478 employed",
    share: 2.1,
    shareBase: SHARE_BASE_EMPLOYED,
    shareSource: "ZIMSTAT 2022 census, Table 6.6 — professional, scientific and technical activities (51,478)",
  },
  {
    id: "pensioners",
    label: "Pensioners",
    note: "Pensioners administered by the Public Service Commission — 209,360 (145,872 contributory, 63,488 non-contributory)",
    share: 1.4,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "Public Service Commission, The Public Service Sentinel, Q1 2026 — pensioners administered (209,360)",
  },
  {
    id: "informal-workers",
    label: "Informal-sector workers",
    note: "People working informally — 2,069,901, or 65% of the 3,186,598 employed",
    share: 65,
    shareBase: SHARE_BASE_QLFS_EMPLOYED,
    shareSource: "ZIMSTAT QLFS Q2 2025 — informally employed persons (2,069,901)",
  },
  {
    id: "women",
    label: "Women",
    note: "Half the country — 7,891,035, or 52% of the population",
    share: 52,
    shareBase: SHARE_BASE_POPULATION,
    shareSource: "ZIMSTAT 2022 census, Table 2.7 — female population (7,891,035)",
  },
  // No published share exists for these → share is null and the source reads "Modelled".
  {
    id: "traditional-leaders",
    label: "Traditional leaders",
    note: "Chiefs and village heads — about 272 chiefs and more than 24,000 village heads; no population share is published",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "energy-water-utilities",
    label: "Energy and water utilities",
    note: "Power, fuel and water utilities — institutions, not a measured population",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "ict-operators",
    label: "ICT and network operators",
    note: "Licensed telecommunications, internet and broadcasting network operators",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "conservation-communities",
    label: "Communities by protected areas",
    note: "Communities living beside national parks and conservancies",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "media",
    label: "Media and broadcasting",
    note: "Registered newspapers, broadcasters and online publishers",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cooperatives",
    label: "Cooperatives",
    note: "Registered agricultural, savings and marketing cooperatives",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "trade-unions",
    label: "Trade unions",
    note: "Registered unions and their federations — no membership figure is published",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "employer-federations",
    label: "Employer federations",
    note: "Chambers of commerce and employer bodies — no membership figure is published",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "artisanal-miners",
    label: "Artisanal and small-scale miners",
    note: "Small-scale and artisanal miners, counted within mining but not published separately",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cross-border-traders",
    label: "Cross-border traders",
    note: "Traders moving goods across Zimbabwe's borders — no published count",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "war-veterans",
    label: "War veterans and their dependants",
    note: "Veterans of the liberation struggle and their dependants, governed by the War Veterans Act [Chapter 11:15] and the Veterans of the Liberation Struggle Act [Chapter 17:12]",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
] as const;


export type StakeholderSegmentId = (typeof STAKEHOLDER_SEGMENTS)[number]["id"];

export const getStakeholderSegment = (id: StakeholderSegmentId) => {
  const segment = STAKEHOLDER_SEGMENTS.find((s) => s.id === id);
  if (!segment) throw new Error(`Unknown stakeholder segment: ${id}`);
  return segment;
};

/**
 * The weight one segment carries when the modelled agents are split between the
 * groups a department models. A published share is used exactly as published; a
 * modelled segment (no official figure) carries the neutral weight below, so it is
 * neither favoured nor suppressed. Callers normalise the weights, because a
 * department models only a subset of the segments.
 */
export const MODELLED_SEGMENT_WEIGHT = 1;

export const segmentWeight = (id: StakeholderSegmentId): number =>
  getStakeholderSegment(id).share ?? MODELLED_SEGMENT_WEIGHT;

/**
 * Canonical time horizon options offered when a policy is prepared for
 * simulation. Labels only — the engine derives the round count from the seed.
 */
export const TIME_HORIZONS = [
  { id: "short", label: "Short term", months: 6, note: "One budget cycle" },
  { id: "medium", label: "Medium term", months: 18, note: "Two to three budget cycles" },
  { id: "long", label: "Long term", months: 60, note: "Full national plan horizon" },
] as const;

export type TimeHorizonId = (typeof TIME_HORIZONS)[number]["id"];

/** Look-up helper so callers never index into the array by position. */
export const getTimeHorizon = (id: TimeHorizonId) => {
  const horizon = TIME_HORIZONS.find((h) => h.id === id);
  if (!horizon) throw new Error(`Unknown time horizon: ${id}`);
  return horizon;
};

/** Formats an ISO date string for display without touching the system clock. */
export const formatReferenceDate = (iso: string) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}`;
};
