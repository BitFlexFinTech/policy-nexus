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

/** The one word used wherever a figure is modelled rather than published. */
export const MODELLED_SHARE_LABEL = "Modelled";

/**
 * The sentence shown where a department indicator is the platform's own modelled
 * figure rather than a published one. It is composed from the same single word the
 * shares use, so the platform has one word for "modelled" and not two, and a
 * modelled indicator can never be read as an official published figure.
 */
export const MODELLED_INDICATOR_LABEL = `${MODELLED_SHARE_LABEL} — no published figure, so this is the platform's own modelled figure`;

/**
 * NAMED SOURCES (AB-5). One entry per body the platform's own figures come from,
 * so a figure can never appear without saying who publishes it. The reference
 * rates point here by `id` and the reference screen prints this list, so a source
 * cannot be named on one screen and missing from the other.
 *
 * `figures` says what the body publishes; `publication` names the publication.
 */
export const NAMED_SOURCES = [
  {
    id: "zimstat",
    name: "Zimbabwe National Statistics Agency (ZIMSTAT)",
    figures: "Population, household, labour, poverty and inflation figures",
    publication:
      "2022 Population and Housing Census; Quarterly Labour Force Survey; monthly price statistics",
  },
  {
    id: "rbz",
    name: "Reserve Bank of Zimbabwe",
    figures:
      "The official ZiG exchange rate, the bank policy rate, and the banking sector's own balance sheet — deposits, loans and the non-performing-loan ratio",
    publication:
      "Published exchange-rate and interest-rate statistics, and the Bank Supervision Annual Report",
  },
  {
    id: "zimra",
    name: "Zimbabwe Revenue Authority (ZIMRA)",
    figures:
      "Revenue collected against the annual target, the number of active registered taxpayers, and audit coverage",
    publication: "ZIMRA Annual Report",
  },
  {
    id: "worldbank",
    name: "World Bank Open Data",
    figures:
      "Country figures compiled from national statistical agencies and international bodies — electricity access and transmission and distribution losses, protected areas, forest area, internet and mobile use, school enrolment, immunisation, water and sanitation, commodity exports, remittances, government finances, investment inflows, food and livestock production and fertiliser use",
    publication:
      "World Development Indicators — each series compiled from national sources and, where the series requires it, from WHO/UNICEF, ITU, UNESCO or UN Comtrade, as the series metadata states",
  },
  {
    id: "imf",
    name: "International Monetary Fund",
    figures: "Zimbabwe's general government gross debt as a share of GDP",
    publication: "World Economic Outlook — General government gross debt (% of GDP)",
  },
  {
    id: "acts-index",
    name: "veritaszim A–Z List of Acts (official consolidated index)",
    figures: "The title and chapter of every Act the platform cites",
    publication: "The official consolidated index of Zimbabwean Acts",
  },
] as const;

export type NamedSourceId = (typeof NAMED_SOURCES)[number]["id"];

/** Look-up helper so callers never index into the array by position. */
export const getNamedSource = (id: NamedSourceId) => {
  const source = NAMED_SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown named source: ${id}`);
  return source;
};

/**
 * The bodies whose published figures the stakeholder shares stand on.
 *
 * Named once, in one list, so the sentence below cannot claim a publisher the share data does
 * not use, or leave one out that it does. The defect this exists for (found 2026-10-02): the
 * sentence said every share was a ZIMSTAT 2022 census figure, while one of the twenty published
 * shares is the Public Service Commission's — so the screen contradicted the data printed a few
 * lines under it. `src/test/reference-sources.test.tsx` checks the list both ways: every
 * published share must name one of these bodies, every body here must be used by at least one
 * share, and the sentence must name every body here.
 */
export const SHARE_PUBLISHERS = ["ZIMSTAT", "Public Service Commission"] as const;

/**
 * The named-source statement (AB-5). Each sentence is a rule the platform
 * actually follows, so it stays true whatever the data does — and the share
 * sentence names every publisher in `SHARE_PUBLISHERS`, checked by a test. It is
 * rendered on the reference screen by the "Named sources" section.
 */
export const NAMED_SOURCE_STATEMENT =
  "Stakeholder shares are published national figures, each naming the figure and the base it is " +
  "a share of — the ZIMSTAT 2022 census, and the Public Service Commission's Public Service " +
  "Sentinel; where no official figure exists the share is labelled " +
  `${MODELLED_SHARE_LABEL} rather than estimated. The reference inputs name the body that publishes ` +
  "them and the period the figure is for. Each department indicator either names the body that " +
  "publishes it, the publication it is taken from and the period it is for, or it is shown as " +
  `${MODELLED_INDICATOR_LABEL}. Every instrument cited in a department's documents is a ` +
  "real Zimbabwean Act, named from the consolidated Acts index.";

/**
 * Reference rates — the published figures the workspace states as its assumptions.
 *
 * AB-5: each one names the body that publishes it (`sourceId` → NAMED_SOURCES) and
 * the period the figure is for (`asOf`), so no rate can be shown as an unattributed
 * number. The values are the published figures themselves, not the platform's own
 * guesses: the earlier 13.56 ZiG, 19.5% policy rate and 8.4% inflation were stale
 * placeholders that matched no published figure and contradicted the inflation
 * release — they were reconciled to the sources in AB-5.
 *
 * The live-feed swap point is documented in PRODUCTION_READINESS.md §5.
 */
export const REFERENCE_RATES = [
  {
    id: "zig-usd",
    label: "ZiG exchange rate",
    value: 26.85,
    unit: "ZiG per USD",
    asOf: "September 2026",
    sourceId: "rbz",
    sourceDetail: "Official weighted-average exchange rate",
    note: "Used for currency conversion in this workspace.",
  },
  {
    id: "policy-rate",
    label: "Bank policy rate",
    value: 30,
    unit: "% per annum",
    asOf: "September 2026",
    sourceId: "rbz",
    sourceDetail:
      "Benchmark lending rate, set at the Monetary Policy Committee meeting of 15 June 2026 and in force since",
    note: "Reference input for financing-cost assumptions.",
  },
  {
    id: "inflation",
    label: "Inflation rate",
    value: 0.25,
    unit: "%",
    asOf: "August 2026",
    sourceId: "zimstat",
    sourceDetail: "National consumer price inflation",
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
  // Groups added 2026-10-02 for national policy drafting. Every one is carrying the
  // "Modelled" label because no published figure is wired in yet — the owner's decision:
  // this is a demo set, and real, sourced figures replace them after project approval.
  // None of them touches the published shares above; nothing here is dressed as official.
  {
    id: "parliament-legislators",
    label: "Parliament and legislators",
    note: "The National Assembly and Senate, and the portfolio committees that scrutinise policy.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "judiciary-courts",
    label: "Judiciary and the courts",
    note: "The courts and the Judicial Service Commission that interpret and enforce the law.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "smes",
    label: "Small and medium enterprises",
    note: "Registered smaller firms below the large-employer threshold, across sectors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "farmer-unions",
    label: "Farmer unions and commodity associations",
    note: "Producer unions and commodity associations such as tobacco, cotton and maize bodies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "mining-host-communities",
    label: "Mining host communities",
    note: "Communities living beside mining operations and affected by their land and water use.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "fishing-communities",
    label: "Fishing communities",
    note: "Fishing households along Lake Kariba, the Zambezi and other inland waters.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "refugees-migrants",
    label: "Refugees, migrants and returnees",
    note: "People of concern to the immigration and refugee authorities, and returning nationals.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "professional-councils",
    label: "Professional regulatory councils",
    note: "Statutory councils for medicine, law, engineering, accountancy and teaching.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "tertiary-students",
    label: "Tertiary students",
    note: "Students at universities, polytechnics and colleges, and their representative bodies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "water-user-associations",
    label: "Water user associations",
    note: "Irrigation and catchment bodies that manage water use at the local level.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "village-savings-groups",
    label: "Village savings and loan groups",
    note: "Community savings and lending groups that give households small-scale finance.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "commuter-transport-associations",
    label: "Commuter transport associations",
    note: "Commuter omnibus, kombi and taxi operator associations in urban and rural areas.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "traditional-healers",
    label: "Traditional healers",
    note: "Registered traditional and faith healers and their associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "youth-councils",
    label: "Youth councils and organisations",
    note: "Statutory youth councils and the organised youth bodies that represent young people.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cross-border-labour-migrants",
    label: "Cross-border labour migrants",
    note: "Zimbabweans working abroad and returning on a seasonal or longer-term basis.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "informal-settlement-residents",
    label: "Informal settlement residents",
    note: "Households in unplanned or under-serviced urban settlements.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "urban-ratepayers",
    label: "Urban ratepayers",
    note: "Ratepayers and residents' associations in cities, towns and growth points.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "district-councils",
    label: "Rural district councils",
    note: "The rural district councils that deliver services outside urban areas.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "religious-leaders",
    label: "Religious leaders",
    note: "Leaders of the mainstream and Apostolic churches, and inter-faith bodies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "teachers-unions",
    label: "Teachers' unions",
    note: "Registered teacher unions and their federations in the education sector.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "nurses-associations",
    label: "Nurses and health worker associations",
    note: "Nursing and other health worker associations and their bargaining bodies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "horticulture-growers",
    label: "Horticulture growers",
    note: "Fruit, vegetable and flower growers producing for domestic and export markets.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "livestock-producers",
    label: "Livestock producers",
    note: "Cattle, goat, pig and poultry producers and their marketing bodies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "timber-forestry-operators",
    label: "Timber and forestry operators",
    note: "Commercial timber growers and sawmillers working the plantation estates.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "wildlife-conservancies",
    label: "Wildlife conservancies",
    note: "Conservancies and community wildlife areas with a stake in land-use policy.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "safari-operators",
    label: "Safari and hunting operators",
    note: "Licensed safari and hunting operators and their professional associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "hospitality-hoteliers",
    label: "Hospitality and hoteliers",
    note: "Hotels, lodges, restaurants and conference operators in the tourism sector.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "aviation-operators",
    label: "Aviation operators",
    note: "Airlines, charter operators and airport service providers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "freight-logistics",
    label: "Freight and logistics operators",
    note: "Haulage, clearing and forwarding firms that move goods across the region.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "fintech-mobile-money",
    label: "Fintech and mobile money providers",
    note: "Mobile-money platforms and financial-technology firms serving payments and credit.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "microfinance-institutions",
    label: "Microfinance institutions",
    note: "Registered microfinance and lending institutions serving small borrowers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "insurance-sector",
    label: "Insurance sector",
    note: "Short-term and life insurers, brokers and pension-fund administrators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "construction-sector",
    label: "Construction contractors",
    note: "Building and civil-works contractors and their registered councils.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "pharmaceutical-sector",
    label: "Pharmaceutical manufacturers and distributors",
    note: "Local medicine manufacturers, importers and wholesale distributors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "medical-aid-societies",
    label: "Medical aid societies",
    note: "Registered medical aid societies and health insurers that fund care.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "private-schools",
    label: "Private and independent schools",
    note: "Independent and trust schools, and their representative associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
{
    id: "grain-millers",
    label: "Grain millers and processors",
    note: "Milling companies and small grain processors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cotton-ginners",
    label: "Cotton ginners",
    note: "Ginneries that process seed cotton.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "sugar-producers",
    label: "Sugar producers",
    note: "Cane growers and sugar millers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "dairy-producers",
    label: "Dairy producers",
    note: "Milk producers and processors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "poultry-producers",
    label: "Poultry producers",
    note: "Commercial and smallholder poultry operations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "aquaculture-operators",
    label: "Aquaculture and fish farmers",
    note: "Fish farmers and aquaculture operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "beekeepers",
    label: "Beekeepers and honey producers",
    note: "Beekeepers and honey processors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "seed-suppliers",
    label: "Seed and input suppliers",
    note: "Seed houses and agricultural input dealers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "agro-processors",
    label: "Agro-processors",
    note: "Firms processing agricultural produce.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "tobacco-merchants",
    label: "Tobacco merchants and contractors",
    note: "Tobacco buyers and contract-scheme operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cement-producers",
    label: "Cement and building-material producers",
    note: "Cement, brick and building-material makers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "food-beverage",
    label: "Food and beverage manufacturers",
    note: "Food, drink and tobacco manufacturers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "textile-clothing",
    label: "Textile and clothing producers",
    note: "Spinning, weaving and garment makers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "leather-footwear",
    label: "Leather and footwear producers",
    note: "Tanneries and footwear manufacturers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "chemicals-industry",
    label: "Chemical and plastics producers",
    note: "Chemical, pharmaceutical-ingredient and plastics firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "furniture-makers",
    label: "Furniture and woodwork producers",
    note: "Furniture makers and joinery firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "printing-publishing",
    label: "Printing and publishing firms",
    note: "Commercial printers and publishers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "engineering-firms",
    label: "Engineering and metal-fabrication firms",
    note: "Engineering workshops and metal fabricators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "coal-producers",
    label: "Coal producers",
    note: "Coal mines and coal-processing operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "fuel-retailers",
    label: "Fuel retailers and depots",
    note: "Fuel service stations and depot operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "lpg-distributors",
    label: "LPG distributors",
    note: "Liquefied-petroleum-gas distributors and retailers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "solar-installers",
    label: "Solar installers and technicians",
    note: "Solar equipment suppliers and installers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "mine-suppliers",
    label: "Mine equipment suppliers",
    note: "Suppliers of mine equipment and consumables.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "smelters",
    label: "Smelters and refineries",
    note: "Smelting and refining operations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "mineral-dealers",
    label: "Mineral dealers and buyers",
    note: "Licensed mineral dealers and buyers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "diamond-sector",
    label: "Diamond sector operators",
    note: "Diamond mining and trading operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "pension-funds",
    label: "Pension fund administrators",
    note: "Occupational pension funds and administrators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "insurance-brokers",
    label: "Insurance brokers",
    note: "Registered insurance brokers and agents.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "stockbrokers",
    label: "Stockbrokers and securities dealers",
    note: "Stockbrokers and licensed securities dealers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "asset-managers",
    label: "Asset managers",
    note: "Fund and asset-management firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "bureaux-de-change",
    label: "Bureaux de change operators",
    note: "Licensed currency-exchange operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "mobile-money-agents",
    label: "Mobile money agents",
    note: "Agents offering mobile-money services.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "building-societies",
    label: "Building societies",
    note: "Building societies and mortgage lenders.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "saccos",
    label: "Savings and credit cooperatives",
    note: "Savings and credit cooperative societies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "micro-insurers",
    label: "Micro-insurers",
    note: "Micro-insurance providers serving low-income clients.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "customs-brokers",
    label: "Customs clearing and forwarding agents",
    note: "Clearing and forwarding agents.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "kombi-operators",
    label: "Commuter omnibus operators",
    note: "Commuter omnibus owners and operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "haulage-operators",
    label: "Haulage and long-distance operators",
    note: "Cross-border and long-distance haulage firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "taxi-associations",
    label: "Taxi associations",
    note: "Metered-taxi owners and their associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "shipping-agents",
    label: "Shipping and port agents",
    note: "Shipping lines' agents and port service firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "warehousing",
    label: "Warehousing and storage operators",
    note: "Bonded and general warehousing operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "courier-firms",
    label: "Courier and express firms",
    note: "Courier, express and parcel firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "drivers-associations",
    label: "Drivers' associations",
    note: "Professional drivers and their associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "rail-users",
    label: "Rail freight users",
    note: "Firms moving freight by rail.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "tour-operators",
    label: "Tour operators",
    note: "Inbound and outbound tour operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "travel-agents",
    label: "Travel agents",
    note: "Travel agencies and ticket agents.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "hoteliers",
    label: "Hoteliers and lodges",
    note: "Hotels, lodges and conference venues.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "restaurant-operators",
    label: "Restaurants and caterers",
    note: "Restaurants, caterers and food-service firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "creative-industries",
    label: "Creative and cultural industries",
    note: "Designers, crafters and cultural enterprises.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "musicians",
    label: "Musicians and performers",
    note: "Musicians, dancers and performers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "film-makers",
    label: "Film and television producers",
    note: "Film, television and video producers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "software-developers",
    label: "Software developers",
    note: "Software houses and independent developers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "isps",
    label: "Internet service providers",
    note: "Licensed internet service providers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "tower-companies",
    label: "Telecom tower companies",
    note: "Tower and passive-infrastructure companies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "data-centres",
    label: "Data-centre operators",
    note: "Commercial data-centre and hosting operators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "cybersecurity-firms",
    label: "Cybersecurity firms",
    note: "Cybersecurity service providers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "ecommerce-platforms",
    label: "E-commerce platforms",
    note: "Online marketplaces and digital platforms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "digital-marketers",
    label: "Digital marketing firms",
    note: "Digital marketing and advertising agencies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "journalists",
    label: "Journalists and editors",
    note: "Reporters, editors and newsroom staff.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "community-radio",
    label: "Community radio stations",
    note: "Community and campus radio stations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "advertising-agencies",
    label: "Advertising agencies",
    note: "Advertising and media-buying agencies.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "pr-firms",
    label: "Public-relations firms",
    note: "Public-relations and communications firms.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "bloggers",
    label: "Online content creators",
    note: "Bloggers, vloggers and online creators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "private-clinics",
    label: "Private clinics and surgeries",
    note: "Private clinics, surgeries and day hospitals.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "pharmacists",
    label: "Pharmacists and dispensers",
    note: "Community and hospital pharmacists.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "laboratory-techs",
    label: "Medical laboratory technologists",
    note: "Laboratory scientists and technologists.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "radiographers",
    label: "Radiographers and imaging staff",
    note: "Radiographers and diagnostic-imaging staff.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "ambulance-services",
    label: "Ambulance and emergency services",
    note: "Ambulance and emergency medical services.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "community-caregivers",
    label: "Community caregivers",
    note: "Home-based carers and community caregivers.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "rural-teachers",
    label: "Rural teachers",
    note: "Teachers serving rural schools.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "urban-teachers",
    label: "Urban teachers",
    note: "Teachers serving urban schools.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "school-heads",
    label: "School heads and administrators",
    note: "Heads and school administrators.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "parents-associations",
    label: "Parents' and school associations",
    note: "Parents' and school development associations.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "ecd-caregivers",
    label: "Early-childhood caregivers",
    note: "ECD caregivers and pre-school staff.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "tvet-instructors",
    label: "TVET instructors",
    note: "Technical and vocational training instructors.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "polytechnic-lecturers",
    label: "Polytechnic lecturers",
    note: "Lecturers at polytechnics and colleges.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "apprentices",
    label: "Apprentices and trainees",
    note: "Apprentices and workplace trainees.",
    share: null,
    shareBase: null,
    shareSource: MODELLED_SHARE_LABEL,
  },
  {
    id: "quantity-surveyors",
    label: "Quantity surveyors",
    note: "Quantity surveyors and cost consultants.",
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
