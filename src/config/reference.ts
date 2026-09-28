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
