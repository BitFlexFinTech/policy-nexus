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
| 2 | Faith-based organisations (`faith-groups`) | **12,937,804** (85.2%) Christian — Apostolic **6,112,503** (40.3%), Pentecost **2,582,565** (17.0%), Protestant **2,089,735** (13.8%), Catholic **975,488** (6.4%), other Christian **1,177,513** (7.8%); African traditional **762,660** (5.0%); no religion **1,255,578** (8.3%) | persons by religion | ZIMSTAT 2022 census, Table 2.14(c) |
| 3 | Traditional leaders (`traditional-leaders`) | **~272 chiefs**, **24,000+ village heads** | appointed chiefs and village heads | Traditional Leaders Act [Chapter 29:17]; Civic Forum on Housing and Habitat reflection paper; Zimbabwe Institute (via ResearchGate) |
| 4 | Tourism operators (`tourism-operators`) | **40,921** | employed in accommodation and food service | ZIMSTAT 2022 census, Table 6.6 |
| 5 | Manufacturers (`manufacturers`) | **257,740** | employed in manufacturing | ZIMSTAT 2022 census, Table 6.6 |
| 6 | Transport operators (`transport-operators`) | **87,730** | employed in transportation and storage | ZIMSTAT 2022 census, Table 6.6 |
| 7 | Researchers and technical professionals (`researchers`) | **51,478** | employed in professional, scientific and technical activities | ZIMSTAT 2022 census, Table 6.6 |
| 8 | Pensioners (`pensioners`) | **209,360** (145,872 contributory + 63,488 non-contributory) | pensioners administered by the Public Service Commission, year-end 2025 | Public Service Commission, *The Public Service Sentinel*, Q1 2026 |
| 9 | Informal-sector workers (`informal-workers`) | **2,069,901** (65.0% of the 3,186,598 employed) | informally employed persons (job-based measure) | ZIMSTAT *QLFS Q2 2025* |
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
| 19 | Cross-border traders (`cross-border-traders`) | no published count |
| 20 | War veterans and their dependants (`war-veterans`) | no published register count found; governed by the War Veterans Act [Chapter 11:15] and the Veterans of the Liberation Struggle Act [Chapter 17:12] |

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
| **fin** | Reserve Bank of Zimbabwe Act [Chapter 22:15] · **Banking Act [Chapter 24:20]** · Public Finance Management Act [Chapter 22:19] · Public Debt Management Act [Chapter 22:21] · Money Laundering and Proceeds of Crime Act · Bank Use Promotion and Suppression of Money Laundering Act [Chapter 24:24] · Microfinance Act · Pension and Provident Funds Act · Movable Property Security Interests Act · **Income Tax Act [Chapter 23:06]** (added in E-3: the Finance documents on presumptive bands and compliance are prepared under it) |
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

---

## PART 6 — The reference rates, reconciled to their sources (AB-5)

**Written 2026-09-28.** Recorded here so no later session re-researches it. The three reference rates
were labelled "reference inputs" and named no source, and the inflation figure the workspace showed
(8.4%) matched no published figure — ZIMSTAT's own site publishes **0.25% for August 2026**. AB-5
replaces all three with published figures and names the body that publishes each one, in the code
(`REFERENCE_RATES` with `sourceId` + `asOf`) and on the reference screen.

| Rate (id) | Figure now shown | Published by | Period | Where it was read |
|---|---|---|---|---|
| ZiG exchange rate (`zig-usd`) | **26.85 ZiG per USD** | Reserve Bank of Zimbabwe | September 2026 | The RBZ official weighted-average rate for **28 September 2026** is **26.8470** (previous 26.63), read from the RBZ-sourced series at Trading Economics; shown rounded to two decimals |
| Bank policy rate (`policy-rate`) | **30.00% per annum** | Reserve Bank of Zimbabwe | September 2026 | RBZ benchmark lending rate, cut by 500 basis points to **30%** at the Monetary Policy Committee meeting of **15 June 2026** — the first change since the ZiG was introduced in April 2024 |
| Inflation rate (`inflation`) | **0.25%** | ZIMSTAT | August 2026 | ZIMSTAT's own homepage figure — *"Inflation Rate 0.25% — Inflation, in August 2026"* — read directly from `zimstat.co.zw` |

**Two honest notes, so no later session has to re-discover them:**

1. **The exact day of the exchange rate is not pinned to the reference date.** The workspace's reference
   date is **24 September 2026**; the RBZ figure that could actually be verified was published for
   **28 September 2026**. The rate is therefore stated against the **month** ("September 2026") — the
   month the reference date falls in — and never against a specific day the source does not support.
2. **A second source disagrees on inflation, and the higher authority wins.** Trading Economics quotes
   ZIMSTAT for **2.9% (August 2026)** and **3.7% (September 2026)**, while ZIMSTAT's own site publishes
   **0.25% (August 2026)**. The agency's own publication is the higher authority, so **0.25%** is the
   figure the platform states, and the disagreement is recorded here rather than hidden.

**Sources for PART 6:** Reserve Bank of Zimbabwe — exchange-rate and interest-rate statistics
(`rbz.co.zw`) and the Monetary Policy Committee statement of 15 June 2026 · ZIMSTAT (`zimstat.co.zw`) ·
the RBZ/ZIMSTAT series as compiled by Trading Economics, used only as the retrieval path and the
cross-check above.
---

## PART 7 — The department indicators, researched one by one (Phase AD R2–R5)

**R2 written 2026-09-28; R3 written 2026-09-29.** Recorded here so no later session re-fetches a figure
or re-discovers which ones have no published equivalent. The rule is the platform's own sourcing rule: an
indicator either names the body that publishes it, the publication it is taken from and the period, or it
is shown as `Modelled`. **Nothing is invented** — a figure that cannot be confirmed from a named
publication stays `Modelled`, exactly as AB-2 left 16 stakeholder shares modelled.

**Where every figure below was read:** the World Bank's own Open Data API —
`https://api.worldbank.org/v2/country/ZW/indicator/<SERIES>` — so any row can be re-checked with one
request. The dataset's own `lastupdated` stamp at the time of reading was **2026-07-13**.

### 7.1 The figures confirmed as published — 24 of the 63 indicators

| Department / indicator (id) | Figure now shown | World Development Indicators series (code) | Period |
|---|---|---|---|
| fin / Fiscal deficit (`fin-deficit`) | **3.6** % of GDP (net borrowing) | Net lending (+) / net borrowing (−) (% of GDP) — `GC.NLD.TOTL.GD.ZS` | 2018 |
| fin / Tax revenue (`fin-revenue`) | **7.2** % of GDP | Tax revenue (% of GDP) — `GC.TAX.TOTL.GD.ZS` | 2018 |
| fin / Foreign direct investment, net inflows (`fin-investment`) | **USD 465M** | Foreign direct investment, net inflows (BoP, current US$) — `BX.KLT.DINV.CD.WD` | 2024 |
| agri / Food production index (`agri-grain`) | **121.7** (2014–2016 = 100) | Food production index (2014-2016 = 100) — `AG.PRD.FOOD.XD` | 2022 |
| agri / Livestock production index (`agri-herd`) | **119.6** (2014–2016 = 100) | Livestock production index (2014-2016 = 100) — `AG.PRD.LVSK.XD` | 2022 |
| agri / Fertiliser consumption (`agri-input`) | **26.2** kg per hectare | Fertilizer consumption (kilograms per hectare of arable land) — `AG.CON.FERT.ZS` | 2023 |
| health / Child immunisation coverage (`health-immune`) | **90** % | Immunisation, measles (% of children aged 12–23 months) — `SH.IMM.MEAS` | 2024 |
| edu / Primary enrolment (`edu-enrolment`) | **94.1** % net | School enrolment, primary (% net) — `SE.PRM.NENR` | 2013 |
| edu / Learner-teacher ratio (`edu-ratio`) | **36.4:1** | Pupil-teacher ratio, primary — `SE.PRM.ENRL.TC.ZS` | 2013 |
| hedu / Tertiary enrolment (`hedu-enrolment`) | **7.7** % gross | School enrolment, tertiary (% gross) — `SE.TER.ENRR` | 2024 |
| ict / Mobile subscriptions (`ict-coverage`) | **94.2** per 100 people | Mobile cellular subscriptions (per 100 people) — `IT.CEL.SETS.P2` | 2024 |
| ict / Fixed broadband subscriptions (`ict-broadband`) | **1.9** per 100 people | Fixed broadband subscriptions (per 100 people) — `IT.NET.BBND.P2` | 2024 |
| mines / Ores and metals share of exports (`mines-share`) | **33.8** % of merchandise exports | Ores and metals exports (% of merchandise exports) — `TX.VAL.MMTL.ZS.UN` | 2024 |
| energy / Electricity access (`energy-access`) | **62** % of population | Access to electricity (% of population) — `EG.ELC.ACCS.ZS` | 2024 |
| energy / Transmission and distribution losses (`energy-losses`) | **23.0** % of output | Electric power transmission and distribution losses (% of output) — `EG.ELC.LOSS.ZS` | 2023 |
| lg / Basic drinking water access (`lg-water`) | **67.2** % of population | People using at least basic drinking water services (% of population) — `SH.H2O.BASW.ZS` | 2024 |
| lg / Basic sanitation access (`lg-sanitation`) | **34.6** % of population | People using at least basic sanitation services (% of population) — `SH.STA.BASS.ZS` | 2024 |
| mfa / Recorded remittances (`mfa-remittance`) | **USD 3.51B** | Personal remittances, received (current US$) — `BX.TRF.PWKR.CD.DT` | 2024 |
| env / Protected area coverage (`env-parks`) | **28.3** % of land | Terrestrial protected areas (% of total land area) — `ER.LND.PTLD.ZS` | 2025 |
| env / Forest area (`env-forest`) | **44.7** % of land | Forest area (% of land area) — `AG.LND.FRST.ZS` | 2023 |
| zimra / Tax revenue (`zimra-target`) | **7.2** % of GDP | Tax revenue (% of GDP) — `GC.TAX.TOTL.GD.ZS` | 2018 |
| health / Nurses and midwives (`health-staffing`) | **3.1** per 1,000 people | Nurses and midwives (per 1,000 people) — `SH.MED.NUMW.P3` | 2022 |
| edu / Primary completion rate (`edu-transition`) | **86.0** % of relevant age group | Primary completion rate, total (% of relevant age group) — `SE.PRM.CMPT.ZS` | 2024 |
| hedu / Scientific journal articles (`hedu-research`) | **519.9** articles | Scientific and technical journal articles — `IP.JRN.ARTC.SC` | 2023 |
### 7.2 R2 — the thirteen written in 2026-09-28

Electricity access · protected areas · forest area · mobile subscriptions · fixed broadband ·
primary net enrolment · pupil–teacher ratio · measles immunisation · basic drinking water ·
basic sanitation · ores and metals exports · personal remittances · tertiary enrolment.

**Six of the thirteen were re-framed to the published measure** rather than quietly re-valued, because
the published series measures something different from the earlier wording: "Population mobile coverage"
→ **Mobile subscriptions**, "Broadband penetration" → **Fixed broadband subscriptions**, "Urban water
availability" → **Basic drinking water access**, "Sewerage coverage" → **Basic sanitation access**,
"Forest cover change" (no published figure for the *change*) → **Forest area**, "Mining share of exports"
→ **Ores and metals share of exports**. **Two figures are old and the app says so:** primary enrolment
and the pupil–teacher ratio are the **2013** values, because no later Zimbabwean figure exists in that
series.

### 7.3 R3 — the eight written in 2026-09-29 (this cluster: fin, zimra, zida, agri, energy, mines)

Eight indicators became published figures, all read from the World Bank's own API during the session:
`fin-deficit`, `fin-revenue`, `fin-investment`, `agri-grain`, `agri-herd`, `agri-input`,
`energy-losses` and `zimra-target` (rows in 7.1). **Three ideas were re-framed to the published
measure** rather than quietly re-valued, because the published series measures something different from
the earlier wording: "Revenue performance" and "Revenue against target" → **Tax revenue**; "Approved
investment value" → **Foreign direct investment, net inflows**; "National cattle herd" → **Livestock
production index**; "Input support delivery" → **Fertiliser consumption**; "Distribution losses" →
**Transmission and distribution losses**.

### 7.4 No published equivalent — these stay labelled `Modelled` (not guessed)

Researched and confirmed to have **no** matching series in the World Bank's own API for Zimbabwe, so they
remain `Modelled`. Re-checking them is a new research task, not a re-fetch:

| Department / indicator | Why there is no published figure |
|---|---|
| fin / Registered taxpayer growth (`fin-taxbase`) | A national taxpayer-register count is published in no series the platform can name |
| zimra / Border clearance time (`zimra-clearance`) | An operational customs measure; no publisher publishes it |
| zimra / On-time filing rate (`zimra-filing`) | An operational revenue-authority measure; no publisher publishes it |
| zimra / Audit yield per case (`zimra-audit`) | An operational revenue-authority measure; no publisher publishes it |
| zida / Licences issued (`zida-licences`) | ZIDA's own operational count; no publisher publishes it |
| zida / Licence turnaround (`zida-turnaround`) | ZIDA's own operational measure; no publisher publishes it |
| zida / Zone occupancy (`zida-zones`) | An SEZ operational return; no publisher publishes it |
| zida / Investor retention (`zida-retention`) | ZIDA's own operational measure; no publisher publishes it |
| mines / Domestically processed output (`mines-beneficiation`) | No beneficiation series exists; *mineral rents (% of GDP, 2021)* measures something else |
| mines / Licence turnaround (`mines-licences`) | A mining-cadastre operational measure; no publisher publishes it |
| mines / Reportable incidents (`mines-incidents`) | A mine-safety operational count; no publisher publishes it |
| energy / Installed capacity (`energy-gen`) | The one candidate series, *Electricity production (kWh)*, is **archived** in the World Bank's API and returns no rows for Zimbabwe |
| energy / Unserved demand (`energy-supply`) | A load-management operational measure; no publisher publishes it |
| agri / Irrigated area (`agri-irrigated`) | *Agricultural irrigated land* exists as a series but holds **no Zimbabwe rows** |
| opc / Policy implementation rate (`opc-impl`) | A whole-of-government delivery measure; no publisher publishes it |
| opc / Reform milestones met (`opc-milestone`) | The reform programme's own milestone count; no publisher publishes it |
| opc / Cross-ministry turnaround (`opc-response`) | An administrative service measure; no publisher publishes it |
| health / Functional primary facilities (`health-facilities`) | *Hospital beds (per 1,000)* (2014) measures hospital capacity, not whether a primary facility is open and staffed |
| health / Essential medicine availability (`health-stockout`) | A facility stock-out return; *Current health expenditure per capita* measures financing, not availability |
| edu / Feeding coverage (`edu-feeding`) | A programme-delivery count; no publisher publishes it |
| hedu / Vocational share of enrolment (`hedu-tvet-share`) | The vocational series is secondary-level, not tertiary, and last reported for 1997 |
| hedu / Graduation rate (`hedu-graduation`) | No graduation-rate series exists; *Pupil-teacher ratio, tertiary* measures class size |
| ict / Data cost (`ict-data-cost`) | The ITU price-basket series is archived, and *Fixed broadband subscription* holds no Zimbabwe rows |
| ict / Services online (`ict-egov`) | An e-government service count; the UN index that measures it is not a series this platform reads |
| psc / Funded posts filled (`psc-establishment`) | An establishment return; no publisher publishes it |
| psc / Officers aged over 55 (`psc-age`) | An establishment age profile; no publisher publishes it |
| psc / Appraisals completed (`psc-appraisal`) | An internal performance-management return; no publisher publishes it |
| psc / Training days per officer (`psc-training`) | An internal training return; no publisher publishes it |
| lg / Feeder roads in good condition (`lg-roads`) | *Roads, total network* (latest 2002) measures road length, not feeder-road condition |
| lg / Devolution absorption (`lg-absorption`) | A budget-execution return; no publisher publishes it |
| mfa / Diplomatic missions (`mfa-missions`) | A missions list; no series this platform reads publishes it |
| mfa / Consular document turnaround (`mfa-consular`) | A consular service measure; no publisher publishes it |
| mfa / Preferential access utilisation (`mfa-trade-util`) | A preference-utilisation return; *Trade (% of GDP)* measures something else |
| env / Environmental licence turnaround (`env-licences`) | A licensing service measure; no publisher publishes it |
| env / Adaptation plans in place (`env-climate`) | No series counts adopted local adaptation plans; *Renewable energy consumption* measures mitigation |
| def / Personnel at readiness (`def-readiness`) | *Armed forces personnel, total* (2020) counts all personnel, not those assessed deployable |
| def / Veteran benefits processed (`def-veterans`) | A benefits-processing return; no publisher publishes it |
| def / Civil support response (`def-response`) | A response-time measure; no publisher publishes it |
| def / Equipment serviceability (`def-equipment`) | An equipment-readiness return; no publisher publishes it |

**Every one of the 63 indicators is now researched.** 24 are published figures naming their publisher,
publication and period; the other 39 are labelled `Modelled`, each with the reason recorded in the table
above (final research: R4 and R5, 2026-09-29).

### 7.5 R4 and R5 — the last ten departments, researched in 2026-09-29

**R4 — `opc`, `health`, `edu`, `hedu`, `ict` (13 indicators).** Three became published figures (rows in
7.1), each re-framed to the published measure rather than quietly re-valued: "Nurse posts filled" →
**Nurses and midwives (per 1,000 people)**; "Secondary transition" → **Primary completion rate**;
"Research outputs registered" → **Scientific and technical journal articles**. The other ten — the whole
of the Office of the President and Cabinet's set, health's facilities and medicines measures, education's
feeding measure, higher education's vocational-share and graduation measures, and ICT's data-cost and
online-services measures — stay `Modelled` (rows in 7.4).

**R5 — `psc`, `lg`, `mfa`, `env`, `def` (15 indicators).** Every one stays `Modelled` (rows in 7.4).

**Why nothing else qualified.** Each remaining measure is an operational or administrative return that no
body publishes for Zimbabwe. Where a World Bank series exists on the same general subject, it measures
something **materially different** from the indicator's own wording, so it was not substituted:
*Hospital beds (per 1,000 people)* (latest 2014) measures hospital capacity, not whether a primary
facility is open and staffed; *Roads, total network* (latest 2002) measures road length, not the condition
of the feeder network; *Armed forces personnel, total* (2020) counts all personnel, not those assessed
deployable; *Current health expenditure per capita* measures financing, not medicine availability;
*Renewable energy consumption* measures mitigation, not adopted adaptation plans; *Pupil-teacher ratio,
tertiary* measures class size, not graduation. Re-pointing an indicator at one of these would make its
label untrue, which is the exact defect Phase AD exists to remove.

**Checked, not assumed.** Every series above was read from the World Bank's own API for Zimbabwe, and the
full indicator catalogue was searched for terms matching each remaining measure (nurse, physician,
medicine, hospital, diplomatic, consular, climate, environmental, road, military, vocational, graduation,
internet and data cost among them). Two series are **archived** and return no data at all
(`IT.BBD.USEC.CD`, `IT.NET.EDUC.ZS`), and one holds **no Zimbabwe rows** (`AG.LND.IRIG.AG.ZS`).

**Sources for PART 7:** World Bank Open Data — World Development Indicators, read from
`api.worldbank.org/v2/country/ZW/indicator/<series>` on 2026-09-29.
