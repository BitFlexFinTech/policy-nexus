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

/**
 * Canonical stakeholder segments. These are the population groups the
 * simulation models and the labels used in the stakeholder agent feed.
 * Departments may reference these ids; they may not invent their own labels.
 */
export const STAKEHOLDER_SEGMENTS = [
  { id: "civil-servants", label: "Civil servants", note: "Public service establishment and pensioners" },
  { id: "urban-households", label: "Urban households", note: "Formal and informal urban wage earners" },
  { id: "rural-households", label: "Rural households", note: "Communal, A1 and A2 land holders" },
  { id: "informal-traders", label: "Informal traders and transporters", note: "Market vendors and commuter operators" },
  { id: "formal-business", label: "Formal business", note: "Registered employers in manufacturing, retail and services" },
  { id: "mining-operators", label: "Mining operators", note: "Large-scale, medium and artisanal producers" },
  { id: "smallholder-farmers", label: "Smallholder farmers", note: "Maize, tobacco and horticulture producers" },
  { id: "diaspora", label: "Diaspora households", note: "Remittance senders and their receiving households" },
  { id: "youth", label: "Youth", note: "15–35 cohort in education, training or work-seeking" },
  { id: "women-led-enterprises", label: "Women-led enterprises", note: "SMEs and cooperatives with majority women ownership" },
  { id: "exporters", label: "Exporters", note: "Mineral, agricultural and manufactured exporters" },
  { id: "financial-sector", label: "Financial sector", note: "Banks, insurers, microfinance and mobile money" },
  { id: "local-authorities", label: "Local authorities", note: "Urban and rural district councils" },
  { id: "development-partners", label: "Development partners", note: "Multilateral and bilateral programmes" },
  { id: "health-workers", label: "Health workers", note: "Clinical, nursing and community health cadres" },
  { id: "educators", label: "Educators", note: "Primary, secondary and tertiary teaching staff" },
] as const;

export type StakeholderSegmentId = (typeof STAKEHOLDER_SEGMENTS)[number]["id"];

export const getStakeholderSegment = (id: StakeholderSegmentId) => {
  const segment = STAKEHOLDER_SEGMENTS.find((s) => s.id === id);
  if (!segment) throw new Error(`Unknown stakeholder segment: ${id}`);
  return segment;
};

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
