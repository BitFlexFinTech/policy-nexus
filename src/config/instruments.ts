/**
 * SINGLE SOURCE OF TRUTH — the instruments the platform cites.
 *
 * Every entry is a real Zimbabwean instrument whose title was checked against a named
 * public source. A chapter number is given ONLY where the official consolidated index
 * confirms it; where it does not, the chapter is `null` and the title stands alone. A
 * guessed chapter would be worse than no chapter, so none is ever written here.
 *
 * This module holds no department content and no presentation: departments point at it
 * by `id`, and the citation text shown anywhere in the app is DERIVED from the entry
 * here (`citedInstrumentLabel`), so a title and its chapter can never drift apart.
 *
 * DETERMINISM: plain authored data. No clock, no randomness.
 *
 * Sources: veritaszim A–Z List of Acts (the official consolidated index) ·
 * ZIMSTAT, Zimbabwe 2022 Population and Housing Census · Government of Zimbabwe,
 * National Development Strategy 2 (2026–2030), approved by Cabinet 11 March 2025.
 */

/** The kind of instrument, so the interface can group them without guessing. */
export type CitedInstrumentKind = "constitution" | "act" | "bill" | "strategy" | "census";

export interface CitedInstrument {
  /** Stable key. Documents point here; they never carry their own copy of the title. */
  id: string;
  /** The exact published title. */
  title: string;
  /** The chapter number, or null where the consolidated index does not confirm one. */
  chapter: string | null;
  kind: CitedInstrumentKind;
  /** Where the title (and the chapter, where one is given) was verified. */
  source: string;
}

/** Named once so every row says where it came from in the same words. */
const VERITAS = "veritaszim A–Z List of Acts (official consolidated index)";
const ZIMSTAT_SOURCE = "ZIMSTAT, Zimbabwe 2022 Population and Housing Census";
const NDS_SOURCE =
  "Government of Zimbabwe, National Development Strategy 2 (2026–2030), approved by Cabinet 11 March 2025";

export const CITED_INSTRUMENTS = [
  // ——— Carried by every department (plan PART 2.1) ———
  {
    id: "constitution-2013",
    title: "Constitution of Zimbabwe (Amendment No. 20) Act, 2013",
    chapter: null,
    kind: "constitution",
    source: VERITAS,
  },
  {
    id: "nds2",
    title: "National Development Strategy 2 (2026–2030)",
    chapter: null,
    kind: "strategy",
    source: NDS_SOURCE,
  },
  {
    id: "census-2022",
    title: "Zimbabwe 2022 Population and Housing Census",
    chapter: null,
    kind: "census",
    source: ZIMSTAT_SOURCE,
  },
  {
    id: "census-statistics-act",
    title: "Census and Statistics Act",
    chapter: "Chapter 10:29",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "pfma",
    title: "Public Finance Management Act",
    chapter: "Chapter 22:19",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "procurement-act",
    title: "Public Procurement and Disposal of Public Assets Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— opc ———
  {
    id: "public-entities-corporate-governance-act",
    title: "Public Entities Corporate Governance Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "provincial-councils-act",
    title: "Provincial Councils and Administration Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "administrative-justice-act",
    title: "Administrative Justice Act",
    chapter: "Chapter 10:28",
    kind: "act",
    source: VERITAS,
  },
  // ——— fin ———
  {
    id: "rbz-act",
    title: "Reserve Bank of Zimbabwe Act",
    chapter: "Chapter 22:15",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "banking-act",
    title: "Banking Act",
    chapter: "Chapter 24:20",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "public-debt-management-act",
    title: "Public Debt Management Act",
    chapter: "Chapter 22:21",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "money-laundering-act",
    title: "Money Laundering and Proceeds of Crime Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "bank-use-promotion-act",
    title: "Bank Use Promotion and Suppression of Money Laundering Act",
    chapter: "Chapter 24:24",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "microfinance-act",
    title: "Microfinance Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "pension-provident-funds-act",
    title: "Pension and Provident Funds Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "movable-property-security-act",
    title: "Movable Property Security Interests Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "income-tax-act",
    title: "Income Tax Act",
    chapter: "Chapter 23:06",
    kind: "act",
    source: VERITAS,
  },
  // ——— agri ———
  {
    id: "rural-land-act",
    title: "Rural Land Act",
    chapter: "Chapter 20:18",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "agricultural-land-settlement-act",
    title: "Agricultural Land Settlement Act",
    chapter: "Chapter 20:01",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "land-acquisition-act",
    title: "Land Acquisition Act",
    chapter: "Chapter 20:10",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "land-survey-act",
    title: "Land Survey Act",
    chapter: "Chapter 20:12",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "farm-equipment-act",
    title: "Acquisition of Farm Equipment or Material Act",
    chapter: "Chapter 18:23",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "warehouse-receipt-act",
    title: "Warehouse Receipt Act",
    chapter: "Chapter 18:25",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "water-act",
    title: "Water Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— health ———
  {
    id: "public-health-act",
    title: "Public Health Act",
    chapter: "Chapter 15:17",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "health-service-act",
    title: "Health Service Act",
    chapter: "Chapter 15:16",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "mental-health-act",
    title: "Mental Health Act",
    chapter: "Chapter 15:12",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "family-planning-council-act",
    title: "Zimbabwe National Family Planning Council Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "social-workers-act",
    title: "Social Workers Act",
    chapter: "Chapter 27:21",
    kind: "act",
    source: VERITAS,
  },
  // ——— edu ———
  {
    id: "education-act",
    title: "Education Act",
    chapter: "Chapter 25:04",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "childrens-act",
    title: "Children's Act",
    chapter: "Chapter 5:06",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "manpower-planning-act",
    title: "Manpower Planning and Development Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— hedu ———
  {
    id: "higher-education-act",
    title: "Zimbabwe Council for Higher Education Act",
    chapter: "Chapter 25:27",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "research-act",
    title: "Research Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "research-development-centre-act",
    title: "Research and Development Centre Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— ict ———
  {
    id: "postal-telecommunications-act",
    title: "Postal and Telecommunications Act",
    chapter: "Chapter 12:05",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "broadcasting-services-act",
    title: "Broadcasting Services Act",
    chapter: "Chapter 12:06",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "access-to-information-act",
    title: "Access to Information and Protection of Privacy Act",
    chapter: "Chapter 10:27",
    kind: "act",
    source: VERITAS,
  },
  // ——— mines ———
  {
    id: "mines-minerals-act",
    title: "Mines and Minerals Act",
    chapter: "Chapter 21:05",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "mines-minerals-bill-2025",
    title: "Mines and Minerals Bill, 2025 (H.B. 1, 2025)",
    chapter: null,
    kind: "bill",
    source: VERITAS,
  },
  {
    id: "environmental-management-act",
    title: "Environmental Management Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— energy ———
  {
    id: "electricity-act",
    title: "Electricity Act",
    chapter: "Chapter 13:19",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "energy-regulatory-act",
    title: "Energy Regulatory Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "petroleum-act",
    title: "Petroleum Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— psc ———
  {
    id: "public-service-act",
    title: "Public Service Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "constitution-s202-203",
    title: "Constitution of Zimbabwe (Amendment No. 20) Act, 2013, ss. 202–203",
    chapter: null,
    kind: "constitution",
    source: VERITAS,
  },
  {
    id: "allowances-pensions-act",
    title: "Allowances and Pensions Act",
    chapter: "Chapter 7:08",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "labour-act",
    title: "Labour Act",
    chapter: "Chapter 28:01",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "tripartite-negotiating-forum-act",
    title: "Tripartite Negotiating Forum Act, 2019 (Act No. 3 of 2019)",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— lg ———
  {
    id: "traditional-leaders-act",
    title: "Traditional Leaders Act",
    chapter: "Chapter 29:17",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "urban-councils-act",
    title: "Urban Councils Act",
    chapter: "Chapter 29:15",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "rural-district-councils-act",
    title: "Rural District Councils Act",
    chapter: "Chapter 29:13",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "local-government-laws-amendment-act",
    title: "Local Government Laws Amendment Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— mfa ———
  {
    id: "immigration-act",
    title: "Immigration Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "citizenship-act",
    title: "Citizenship of Zimbabwe Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "trade-marks-act",
    title: "Trade Marks Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "zida-act",
    title: "Zimbabwe Investment and Development Agency Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— env ———
  {
    id: "parks-wildlife-act",
    title: "Parks and Wildlife Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "forest-act",
    title: "Forest Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— def ———
  {
    id: "defence-act",
    title: "Defence Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "war-veterans-act",
    title: "War Veterans Act",
    chapter: "Chapter 11:15",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "veterans-liberation-struggle-act",
    title: "Veterans of the Liberation Struggle Act",
    chapter: "Chapter 17:12",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "national-security-council-act",
    title: "Zimbabwe National Security Council Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  // ——— zimra ———
  {
    id: "revenue-authority-act",
    title: "Revenue Authority Act",
    chapter: "Chapter 23:11",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "customs-excise-act",
    title: "Customs and Excise Act",
    chapter: "Chapter 23:02",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "vat-act",
    title: "Value Added Tax Act",
    chapter: "Chapter 23:12",
    kind: "act",
    source: VERITAS,
  },
  // ——— zida ———
  {
    id: "special-economic-zones-act",
    title: "Special Economic Zones Act",
    chapter: "Chapter 14:34",
    kind: "act",
    source: VERITAS,
  },
  {
    id: "companies-act",
    title: "Companies and Other Business Entities Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "competition-act",
    title: "Competition Act",
    chapter: null,
    kind: "act",
    source: VERITAS,
  },
  {
    id: "competitiveness-commission-act",
    title: "National Competitiveness Commission Act",
    chapter: "Chapter 14:36",
    kind: "act",
    source: VERITAS,
  },
] as const;

export type CitedInstrumentId = (typeof CITED_INSTRUMENTS)[number]["id"];

/**
 * The instruments every department's work rests on (plan PART 2.1): the supreme law, the
 * current national plan, the population evidence, the statistics law, and the two laws
 * that govern how any policy is funded and contracted. Departments spread these first and
 * then add their own, so this list is written once.
 */
export const UNIVERSAL_INSTRUMENTS: readonly CitedInstrumentId[] = [
  "constitution-2013",
  "nds2",
  "census-2022",
  "census-statistics-act",
  "pfma",
  "procurement-act",
];

/** Look-up helper so callers never index into the array by position. */
export const getCitedInstrument = (id: CitedInstrumentId) => {
  const instrument = CITED_INSTRUMENTS.find((i) => i.id === id);
  if (!instrument) throw new Error(`Unknown cited instrument: ${id}`);
  return instrument;
};

/** True when an arbitrary string is one of the cited instrument ids. */
export const isCitedInstrumentId = (id: string): id is CitedInstrumentId =>
  CITED_INSTRUMENTS.some((i) => i.id === id);

/**
 * The citation exactly as it is shown: the title, with the chapter in brackets where the
 * index confirms one. DERIVED from the table, so a title and its chapter are written
 * once and can never drift apart.
 */
export const citedInstrumentLabel = (id: CitedInstrumentId): string => {
  const instrument = getCitedInstrument(id);
  return instrument.chapter ? `${instrument.title} [${instrument.chapter}]` : instrument.title;
};
