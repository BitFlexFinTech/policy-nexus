export type ScenarioId = "public-opinion" | "financial" | "narrative" | "enterprise";

export interface ScenarioMeta {
  id: ScenarioId;
  code: string;
  label: string;
  short: string;
  description: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "public-opinion",
    code: "3.1",
    label: "Public Opinion & Crisis Simulation",
    short: "Public Opinion",
    description:
      "Models citizen sentiment, protest risk and crisis escalation across Zimbabwe's stakeholder groups.",
  },
  {
    id: "financial",
    code: "3.2",
    label: "Financial & Market Scenario Modelling",
    short: "Financial",
    description:
      "Projects ZiG stability, inflation pass-through, fiscal balance and market liquidity responses.",
  },
  {
    id: "narrative",
    code: "3.3",
    label: "Narrative & Creative Prediction",
    short: "Narrative",
    description:
      "Forecasts media framing, national narrative drift and cultural/creative sector uptake.",
  },
  {
    id: "enterprise",
    code: "3.4",
    label: "Enterprise Decision Support",
    short: "Enterprise",
    description:
      "Evaluates industry compliance cost, investor confidence and operational readiness for firms.",
  },
];

export interface PolicyDocument {
  id: string;
  scenario: ScenarioId;
  title: string;
  publisher: string;
  year: string;
  pages: number;
  size: string;
  type: "pdf" | "docx" | "txt";
  summary: string;
  /** Verbatim-style excerpt used to seed the simulation draft. */
  excerpt: string;
}

export const DOCUMENTS: PolicyDocument[] = [
  // ---------- 3.1 Public Opinion and Crisis Simulation ----------
  {
    id: "vision-2030",
    scenario: "public-opinion",
    title: "Zimbabwe Vision 2030",
    publisher: "Office of the President and Cabinet",
    year: "2018",
    pages: 28,
    size: "1.9 MB",
    type: "pdf",
    summary:
      "\"Towards a Prosperous & Empowered Upper Middle Income Society by 2030\" — the national long-term development vision and its five pillars.",
    excerpt:
      "Vision 2030 commits Zimbabwe to becoming an empowered upper middle income society by 2030, anchored on governance reform, macro-economic stability and fiscal discipline, inclusive growth, infrastructure and utilities, and social protection. Simulate national public opinion and crisis escalation risk under accelerated implementation of the Vision 2030 pillars, including the devolution agenda and public sector performance contracts.",
  },
  {
    id: "nds1",
    scenario: "public-opinion",
    title: "National Development Strategy 1 (NDS1) 2021–2025",
    publisher: "Government of Zimbabwe",
    year: "2020",
    pages: 328,
    size: "8.4 MB",
    type: "pdf",
    summary:
      "First five-year medium-term plan implementing Vision 2030, covering 14 national priorities from economic growth to social protection.",
    excerpt:
      "NDS1 sets out 14 national priorities including economic growth and stability, food security, moving the economy up the value chain, housing delivery, health and wellbeing, and image building and engagement. Simulate public sentiment and crisis risk for the transition from NDS1 targets into the successor strategy, with emphasis on service delivery expectations and youth unemployment.",
  },
  {
    id: "constitution-drr",
    scenario: "public-opinion",
    title: "Constitution of Zimbabwe Amendment (No. 20) Act — Declaration of Rights",
    publisher: "Parliament of Zimbabwe",
    year: "2013",
    pages: 142,
    size: "2.7 MB",
    type: "pdf",
    summary:
      "Chapter 4 fundamental rights: assembly, expression, labour rights and socio-economic entitlements that bound any crisis response.",
    excerpt:
      "Chapter 4 of the Constitution guarantees freedom of assembly and association (s.58), freedom of expression and media (s.61), labour rights (s.65) and the right to health care, education, food and water. Simulate the legitimacy and public opinion consequences of emergency crisis measures that constrain assembly or movement.",
  },
  {
    id: "civil-protection-act",
    scenario: "public-opinion",
    title: "Civil Protection Act (Chapter 10:06)",
    publisher: "Department of Civil Protection",
    year: "1989 (rev.)",
    pages: 34,
    size: "620 KB",
    type: "pdf",
    summary:
      "Statutory basis for declaring a state of disaster and coordinating national emergency response.",
    excerpt:
      "The Civil Protection Act empowers the declaration of a state of disaster and establishes national, provincial and district civil protection committees with a National Civil Protection Fund. Simulate a compound crisis — drought plus cholera outbreak plus urban water shortage — and forecast public confidence in the coordinated response.",
  },

  // ---------- 3.2 Financial and Market Scenario Modelling ----------
  {
    id: "mps-zig",
    scenario: "financial",
    title: "Monetary Policy Statement — ZiG Structured Currency Framework",
    publisher: "Reserve Bank of Zimbabwe",
    year: "2025",
    pages: 96,
    size: "4.1 MB",
    type: "pdf",
    summary:
      "Sets the ZiG operating framework: reserve money targeting, gold and FX reserve cover, and the willing-buyer willing-seller interbank market.",
    excerpt:
      "The Monetary Policy Statement anchors Zimbabwe Gold (ZiG) on composite gold and foreign currency reserves, with strict reserve money targeting, a tight bank policy rate and an interbank willing-buyer willing-seller exchange rate. Simulate ZiG stability, parallel-market premium and inflation pass-through under a tightening of reserve money growth and mandatory tax settlement in ZiG for exporters.",
  },
  {
    id: "budget-statement",
    scenario: "financial",
    title: "National Budget Statement and Estimates of Expenditure",
    publisher: "Ministry of Finance, Economic Development and Investment Promotion",
    year: "2025",
    pages: 412,
    size: "9.6 MB",
    type: "pdf",
    summary:
      "Annual fiscal framework: revenue measures, expenditure ceilings, debt strategy and the presumptive tax regime for the informal sector.",
    excerpt:
      "The Budget Statement presents revenue measures, expenditure ceilings, the public debt and arrears clearance strategy, and taxation of the informal economy. Simulate the market and fiscal effect of raising domestic revenue through presumptive taxes and a fast-foods/sugar levy while holding the deficit under 1.5 percent of GDP.",
  },
  {
    id: "si-zig",
    scenario: "financial",
    title: "Statutory Instrument — Presidential Powers (Zimbabwe Gold Currency) Regulations",
    publisher: "Government Gazette",
    year: "2024",
    pages: 18,
    size: "410 KB",
    type: "pdf",
    summary:
      "Legal instrument introducing ZiG as legal tender, conversion of balances, and multi-currency transition arrangements.",
    excerpt:
      "The regulations introduce Zimbabwe Gold (ZiG) as legal tender, convert existing local-currency balances at the prescribed rate, and preserve the multi-currency regime for a transitional period. Simulate market behaviour, dollarisation share and pricing responses if the multi-currency transition end-date is brought forward.",
  },
  {
    id: "zimstat-cpi",
    scenario: "financial",
    title: "Consumer Price Index and Inflation Bulletin",
    publisher: "Zimbabwe National Statistics Agency (ZIMSTAT)",
    year: "2026",
    pages: 22,
    size: "780 KB",
    type: "pdf",
    summary:
      "Monthly blended and ZiG CPI series, weighted basket composition and month-on-month inflation by category.",
    excerpt:
      "The bulletin publishes blended and ZiG-denominated CPI, the weighted consumption basket and month-on-month inflation for food, housing, transport and utilities. Simulate the inflation trajectory and household purchasing power under a fuel price adjustment combined with a civil service wage award.",
  },

  // ---------- 3.3 Narrative and Creative Prediction ----------
  {
    id: "cultural-policy",
    scenario: "narrative",
    title: "National Cultural Policy of Zimbabwe",
    publisher: "Ministry of Sport, Recreation, Arts and Culture",
    year: "2007",
    pages: 46,
    size: "1.2 MB",
    type: "pdf",
    summary:
      "Framework for cultural identity, indigenous languages, heritage protection and support to the creative sector.",
    excerpt:
      "The National Cultural Policy promotes cultural identity and diversity, the development of indigenous languages, protection of heritage and support to creative practitioners. Simulate the national narrative and creative-sector response to a ring-fenced fund for indigenous-language film, music and publishing.",
  },
  {
    id: "broadcasting-act",
    scenario: "narrative",
    title: "Broadcasting Services Act (Chapter 12:06) — Local Content Provisions",
    publisher: "Parliament of Zimbabwe",
    year: "2001 (rev.)",
    pages: 88,
    size: "1.6 MB",
    type: "pdf",
    summary:
      "Licensing regime and local content quotas for television and radio broadcasters.",
    excerpt:
      "The Act governs broadcasting licences and prescribes minimum local content quotas across television and radio programming. Simulate audience reception, media framing and creative supply capacity if the local content quota is raised to 75 percent with an indigenous-language sub-quota.",
  },
  {
    id: "narts-act",
    scenario: "narrative",
    title: "National Arts Council of Zimbabwe Act (Chapter 25:07)",
    publisher: "National Arts Council of Zimbabwe",
    year: "1985 (rev.)",
    pages: 26,
    size: "520 KB",
    type: "pdf",
    summary:
      "Registration, funding and regulation of arts associations and practitioners nationwide.",
    excerpt:
      "The Act establishes the National Arts Council with powers to register arts associations, disburse funding and set professional standards. Simulate narrative sentiment among artists and audiences under mandatory registration linked to access to public creative funding.",
  },
  {
    id: "heritage-strategy",
    scenario: "narrative",
    title: "Culture and Heritage Sector Strategy — Creative Industries",
    publisher: "Ministry of Sport, Recreation, Arts and Culture",
    year: "2024",
    pages: 64,
    size: "2.2 MB",
    type: "pdf",
    summary:
      "Roadmap to commercialise the creative and cultural industries, including intellectual property and export of Zimbabwean content.",
    excerpt:
      "The strategy targets growth of creative industry contribution to GDP through intellectual property reform, digital distribution and export of Zimbabwean content. Simulate the narrative arc and diaspora audience uptake of a national content export programme over 36 months.",
  },

  // ---------- 3.4 Enterprise Decision Support ----------
  {
    id: "industrial-policy",
    scenario: "enterprise",
    title: "Zimbabwe National Industrial Development Policy",
    publisher: "Ministry of Industry and Commerce",
    year: "2019–2023",
    pages: 118,
    size: "3.4 MB",
    type: "pdf",
    summary:
      "Value-chain led industrialisation plan with priority sectors, local content and import management measures.",
    excerpt:
      "The policy pursues value-chain led industrialisation across agro-processing, fertilisers, pharmaceuticals, leather, bus and motor assembly, with local content requirements and selective import management. Simulate firm-level investment, input cost and capacity utilisation decisions under a local content requirement of 60 percent for public procurement.",
  },
  {
    id: "zida-act",
    scenario: "enterprise",
    title: "Zimbabwe Investment and Development Agency (ZIDA) Act",
    publisher: "Parliament of Zimbabwe",
    year: "2019",
    pages: 72,
    size: "1.5 MB",
    type: "pdf",
    summary:
      "One-stop investment licensing, investor protections, special economic zones and dispute settlement.",
    excerpt:
      "The ZIDA Act creates a one-stop investment services centre, statutory investor protections, special economic zone incentives and dispute settlement procedures. Simulate investor confidence and enterprise entry decisions if special economic zone tax holidays are shortened from five years to three.",
  },
  {
    id: "cyber-data-act",
    scenario: "enterprise",
    title: "Cyber and Data Protection Act (Chapter 11:12)",
    publisher: "Parliament of Zimbabwe",
    year: "2021",
    pages: 58,
    size: "1.1 MB",
    type: "pdf",
    summary:
      "Data controller licensing, data subject rights, cross-border transfer rules and cyber-security offences.",
    excerpt:
      "The Act requires data controller registration with POTRAZ as Data Protection Authority, lawful processing and consent, restrictions on cross-border data transfers and penalties for cyber offences. Simulate enterprise compliance cost, data localisation impact and operational readiness for banks, insurers and telecoms.",
  },
  {
    id: "trade-policy",
    scenario: "enterprise",
    title: "Zimbabwe National Trade Policy & AfCFTA Implementation Strategy",
    publisher: "Ministry of Industry and Commerce",
    year: "2019–2023",
    pages: 96,
    size: "2.8 MB",
    type: "pdf",
    summary:
      "Export development, tariff strategy and Zimbabwe's schedule of commitments under the African Continental Free Trade Area.",
    excerpt:
      "The policy targets export-led growth, tariff rationalisation, trade facilitation at borders and phased tariff liberalisation under AfCFTA. Simulate enterprise sourcing, pricing and export decisions as AfCFTA tariff offers move into their accelerated liberalisation phase.",
  },
];

export const documentsByScenario = (scenario: ScenarioId) =>
  DOCUMENTS.filter((d) => d.scenario === scenario);

export const getDocument = (id: string) => DOCUMENTS.find((d) => d.id === id);

export const getScenario = (id: ScenarioId) =>
  SCENARIOS.find((s) => s.id === id) as ScenarioMeta;
