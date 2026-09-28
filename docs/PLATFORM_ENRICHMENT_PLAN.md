# PLATFORM ENRICHMENT PLAN — what to add, from evidence, without breaking anything

**Written 2026-09-28.** This is the deep-research pass the project owner asked for: *"we need to add
anything that makes the platform more powerful … there should also be documents that are cited like the
Constitution … the Banking Act … research what we can add to make this platform a powerhouse without
breaking anything and optimising it for each department."*

**Every figure below is from a named, public source. Nothing is invented.** Where no published figure
exists, the item is explicitly marked **MODELLED** and must carry that label in the interface. The
sources are listed in full at the end, and the raw figures are recorded in `PROJECT_STATUS.md` so no
later session re-researches them.

---

## PART 1 — Stakeholder groups: from 16 to 36

The 16 groups the platform models today are not wrong; they are incomplete. Several departments
currently have **no group that matches their own mandate** — the clearest being Defence, whose own
description says it "administers the welfare of war veterans", with no veterans group to model.

**The tally, so the size of the change is clear:** **20 new groups → 36 in total.** **9 of the 20 carry a
real, published share** of the population or of employment (1.1 below, excluding traditional leaders);
**the other 11 have their weight MODELLED** (every one of them named in 1.2, plus traditional leaders).
Nothing is added that is neither published nor explicitly labelled modelled.

**Read 1.1 with this caveat:** a group can have a real published **count** without that count being a
**share**. Traditional leaders are the case in point — 272 chiefs and 24,000+ village heads are real,
published figures, but they are counts of office-holders, not a share of people. Their count is carried
in the group's plain-language note and their **weight is MODELLED**, so a handful of office-holders is
never mis-scaled against a population share.

### 1.1 Groups with a REAL, published figure

| # | Group (id) | Figure | What the figure is | Source |
|---|---|---|---|---|
| 1 | Persons with disabilities (`persons-with-disabilities`) | **206,447** (1.6%) | of 13,102,643 people aged 5+ | ZIMSTAT *2022 PHC Disability Thematic Report* |
| 2 | Faith-based organisations (`faith-groups`) | **12,937,804** (85.3%) Christian — Apostolic **6,112,503** (40.3%), Pentecost **2,582,565** (17.0%), Protestant **2,089,735** (13.8%), Catholic **975,488** (6.4%), other Christian **1,177,513** (7.8%); African traditional **762,660** (5.0%); no religion **1,255,578** (8.3%) | persons by religion | ZIMSTAT 2022 census, Table 2.14(c) |
| 3 | Traditional leaders (`traditional-leaders`) | **~272 chiefs**, **24,000+ village heads** | appointed chiefs and village heads | Traditional Leaders Act [Chapter 29:17]; Civic Forum on Housing and Habitat reflection paper; Zimbabwe Institute (via ResearchGate) |
| 4 | Tourism operators (`tourism-operators`) | **40,921** | employed in accommodation and food service | ZIMSTAT 2022 census, Table 6.6 |
| 5 | Manufacturers (`manufacturers`) | **257,740** | employed in manufacturing | ZIMSTAT 2022 census, Table 6.6 |
| 6 | Transport operators (`transport-operators`) | **87,730** | employed in transportation and storage | ZIMSTAT 2022 census, Table 6.6 |
| 7 | Researchers and technical professionals (`researchers`) | **51,478** | employed in professional, scientific and technical activities | ZIMSTAT 2022 census, Table 6.6 |
| 8 | Pensioners (`pensioners`) | **209,360** (145,872 contributory + 63,488 non-contributory) | pensioners administered by the Public Service Commission, year-end 2025 | Public Service Commission, *The Public Service Sentinel*, Q1 2026 |
| 9 | Informal-sector workers (`informal-workers`) | **2,069,901** (64.9% of the 3,186,598 employed) | informally employed persons (job-based measure) | ZIMSTAT *QLFS Q2 2025* |
| 10 | Women (`women`) | **7,891,035** (52.0%) | female population | ZIMSTAT 2022 census, Table 2.7 |

### 1.2 Groups that must be labelled MODELLED (no published population count exists)

| # | Group (id) | Why it has no official figure |
|---|---|---|
| 11 | Energy and water utilities (`energy-water-utilities`) | utilities are institutions, not people; no published headcount |
| 12 | ICT and network operators (`ict-operators`) | licensed operators; no published headcount |
| 13 | Communities by protected areas (`conservation-communities`) | no published count of communities adjacent to protected areas |
| 14 | Media and broadcasting (`media`) | registered media houses; no published count of practitioners among the sources read |
| 15 | Cooperatives (`cooperatives`) | registered cooperatives; no published membership figure among the sources read |
| 16 | Trade unions (`trade-unions`) | federations (ZCTU and others); no published membership figure among the sources read |
| 17 | Employer federations (`employer-federations`) | ZNCC, CZI, EMCOZ; no published membership figure among the sources read |
| 18 | Artisanal and small-scale miners (`artisanal-miners`) | part of the 227,079 in mining; not separately published |
| 9 | Cross-border traders (`cross-border-traders`) | no published count |
| 10 | War veterans and their dependants (`war-veterans`) | no published register count found; governed by the War Veterans Act [Chapter 11:15] and the Veterans of the Liberation Struggle Act [Chapter 17:12] |

### 1.3 The rule that governs all of it

- A group is added **only** if it is either (a) a real figure with a named source, or (b) explicitly
  **MODELLED** — `share: null` with `shareSource: "Modelled"`, never a number dressed up as official.
- The gate in `src/test/stakeholder-weights.test.ts` already enforces exactly this for the existing 16,
  and will be extended to cover every new group: **a new group cannot be added without declaring a share
  or the Modelled label.**

---

## PART 2 — Real reference documents (the citable instruments)

Today every department's document rail carries **invented filenames** (for example
`Veterans_Benefits_Register_Summary.txt`). They are plausible but they cite nothing. The owner is right:
the platform becomes credible when it cites the **actual instruments** that govern each department. The
instruments below are **real Acts of Zimbabwe**, taken from the official consolidated index (veritaszim
A–Z List of Acts). Chapter numbers are given **only where that index confirms them**.

### 2.1 The instruments every department should carry

| Instrument | Use |
|---|---|
| **Constitution of Zimbabwe (Amendment No. 20) Act, 2013** | the supreme law; every department's mandate has a constitutional basis |
| **National Development Strategy 2 (2026–2030)** | the current national plan: ten national priorities (approved by Cabinet 11 March 2025) |
| **Zimbabwe 2022 Population and Housing Census** (ZIMSTAT) | the population evidence every run's groups are weighted from |
| **Census and Statistics Act [Chapter 10:29]** | governs the statistics the platform presents |
| **Public Finance Management Act [Chapter 22:19]** | governs what any policy costing must obey |
| **Public Procurement and Disposal of Public Assets Act** | governs implementation by contract |

### 2.2 Per-department instruments (real Acts, exact titles)

| Dept | Instruments to cite |
|---|---|
| **opc** | Public Entities Corporate Governance Act · Public Finance Management Act [Chapter 22:19] · Provincial Councils and Administration Act · Public Procurement and Disposal of Public Assets Act · Administrative Justice Act [Chapter 10:28] |
| **fin** | Reserve Bank of Zimbabwe Act [Chapter 22:15] · **Banking Act [Chapter 24:20]** · Public Finance Management Act [Chapter 22:19] · Public Debt Management Act [Chapter 22.21] · Money Laundering and Proceeds of Crime Act · Bank Use Promotion and Suppression of Money Laundering Act [Chapter 24:24] · Microfinance Act · Pension and Provident Funds Act · Movable Property Security Interests Act |
| **agri** | Rural Land Act [Chapter 20:18] · Agricultural Land Settlement Act [Chapter 20:01] · Land Acquisition Act [Chapter 20:10] · Land Survey Act [Chapter 20:12] · Acquisition of Farm Equipment or Material Act [Chapter 18:23] · Warehouse Receipt Act [Chapter 18:25] · Water Act |
| **health** | Public Health Act [Chapter 15:17] · Health Service Act [Chapter 15:16] · Mental Health Act [Chapter 15:12] · Zimbabwe National Family Planning Council Act · Social Workers Act [Chapter 27:21] |
| **edu** | Education Act [Chapter 25:04] · Children's Act [Chapter 5:06] · Manpower Planning and Development Act |
| **hedu** | Zimbabwe Council for Higher Education Act [Chapter 25:27] · Research Act · Research and Development Centre Act · Manpower Planning and Development Act |
| **ict** | Postal and Telecommunications Act [Chapter 12:05] · Broadcasting Services Act [Chapter 12:06] · Access to Information and Protection of Privacy Act [Chapter 10:27] · Census and Statistics Act [Chapter 10:29] |
| **mines** | Mines and Minerals Act [Chapter 21:05] · Mines and Minerals Bill, 2025 (H.B. 1, 2025) · Movable Property Security Interests Act · Environmental Management Act |
| **energy** | Electricity Act [Chapter 13:19] · Energy Regulatory Act · Petroleum Act |
| **psc** | Public Service Act · Constitution ss. 202–203 · Allowances and Pensions Act [Chapter 7:08] · Labour Act [Chapter 28:01] · Tripartite Negotiating Forum Act, 2019 (Act No. 3 of 2019) |
| **lg** | Traditional Leaders Act [Chapter 29:17] · Urban Councils Act [Chapter 29:15] · Rural District Councils Act [Chapter 29:13] · Provincial Councils and Administration Act · Local Government Laws Amendment Act |
| **mfa** | Immigration Act · Citizenship of Zimbabwe Act · Trade Marks Act · Zimbabwe Investment and Development Agency Act |
| **env** | Environmental Management Act · Parks and Wildlife Act · Forest Act · Water Act |
| **def** | Defence Act · War Veterans Act [Chapter 11:15] · Veterans of the Liberation Struggle Act [Chapter 17:12] · Zimbabwe National Security Council Act |
| **zimra** | Revenue Authority Act [Chapter 23:11] · Customs and Excise Act [Chapter 23:02] · Income Tax Act [Chapter 23:06] · Value Added Tax Act [Chapter 23:12] · Money Laundering and Proceeds of Crime Act |
| **zida** | Zimbabwe Investment and Development Agency Act · Special Economic Zones Act [Chapter 14:34] · Companies and Other Business Entities Act · Competition Act · National Competitiveness Commission Act [Chapter 14:36] |

**Honest limit:** chapter numbers are shown only where the consolidated index confirms them. Where an
instrument is named without a chapter (Environmental Management Act, Parks and Wildlife Act, Forest Act,
Water Act, Immigration Act, Citizenship of Zimbabwe Act, Defence Act, Petroleum Act, Energy Regulatory
Act), the **title** is verified from the index but the chapter number was not, so it is omitted rather
than guessed.

---

## PART 3 — Doing it without breaking anything

The platform currently has **no** concept of a cited instrument: `DepartmentDocument` is
`{ id, name, kind, sizeLabel, date, note }`. Two additive changes make citation real, and **neither
alters the visual design**:

1. **`DepartmentDocument` gains optional fields** — `citation` (the exact instrument, with its chapter
   where known) and `instrument` (a stable key into a new `CITED_INSTRUMENTS` table held beside the
   department config). Every existing document keeps rendering exactly as it does now, because the
   fields are optional and the component renders the citation only when it is present.
2. **The rail shows the citation** as a small caption under the document name, and sorts cited
   instruments first. The rail's existing height, spacing, typography and palette are untouched.

**Files that change:** `src/config/reference.ts` (new segments and their shares) · `src/config/departments.ts`
(documents and modelled groups per department) · the document-rail component (render the caption) ·
`src/test/stakeholder-weights.test.ts` (extend the modelled-set gate) · `src/test/departments.test.ts`
(every citation must resolve to `CITED_INSTRUMENTS`, so a fabricated citation cannot be added).

**Files that must NOT change:** the emerald/gold palette, typography, `src/components/ui/**`, the route
map, the determinism rules, and `package.json` dependencies.

**Regression cover already in place:** `npm test` (301 tests), `npm run validate`, and
`npx playwright test` (10 real-browser tests). The document rail's behaviour is covered by
`src/test/registers.test.tsx` and the long-form journey test.

---

## PART 4 — Implementation batches (each independently verifiable)

| Batch | Work | Gate |
|---|---|---|
| **E-1** | Add the new stakeholder groups to `reference.ts`, each with a real share or the `Modelled` label | extend `stakeholder-weights.test.ts`: the modelled set and the published set are both exact; every new share matches its cited count |
| **E-2** | Give each of the 16 departments the groups that belong to its mandate (6–8 each, up from 4–6) | `departments.test.ts`: every department's segments resolve; every group is used by at least one department; no department models an irrelevant group |
| **E-3** | Add the `CITED_INSTRUMENTS` table and the `citation`/`instrument` fields; wire each department's documents to real instruments | new gate: every citation resolves to the table; no document name claims an instrument that is not in the table |
| **E-4** | Render the citation in the document rail, and each group's share and source on the Reference screen | render tests plus one Playwright assertion; palette and layout unchanged |
| **E-5** | Record everything in `PROJECT_STATUS.md`, run the full suite, refresh the review zip | the whole ladder green: validate · typecheck · lint · test · build · Playwright |

**Nothing in E-1…E-5 changes a colour, a font, a layout, a route or a dependency** — which is what
"without breaking anything" means here.

---

## PART 5 — Sources

ZIMSTAT *2022 Population and Housing Census* main report (Tables 2.7, 2.14(c), 6.6, 3.6–3.14) ·
ZIMSTAT *2022 PHC Disability Thematic Report* · ZIMSTAT *2025 Q2 Quarterly Labour Force Survey* ·
ZIMSTAT *Census 2022 Preliminary Results* (via UNFPA Zimbabwe) · Public Service Commission, *The Public
Service Sentinel*, Q1 2026 · veritaszim **A–Z List of Acts** (`veritaszim.net/a-z-list-of-acts`) ·
Traditional Leaders Act [Chapter 29:17] · Civic Forum on Housing and Habitat, *Traditional Leaders'
Reflection Paper* · Zimbabwe Institute via ResearchGate · World Bank / ILO modelled employment by sector ·
Government of Zimbabwe, *National Development Strategy 2, 2026–2030* · Zimbabwe Government Portal
National Development Plans.

