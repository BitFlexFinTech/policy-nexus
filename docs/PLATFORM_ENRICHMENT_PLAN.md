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

**Phase AD R6 and R7 (2026-09-29) — the research above is finished and the build is live.** **R6** trimmed
the duplicated publisher from the 24 published indicators' notes, because the drill-down's source line
already states the publisher, the publication and the period (derived from `indicatorBasisLabel`), and
gated it. **R7** redeployed the site: the live host serves `assets/index-DRweHRfT.js`
(`c601422c680a15fa077c1cdb9e599f37bdbdb79196d8fa35d7f057b2a6b3f24f`), byte-identical to the local build.
**Nothing in PART 7 needs re-researching** — the 24 published figures and the 39 recorded no-equivalent
reasons above are the record.

---

## PART 8 — The national policy-drafting expansion (2026-10-02)

The owner asked to add **more stakeholder groups and more reference indicators**, with none of the
new data needing a published source yet — *"this is just for demo purposes … once the project is
approved we will add the real data for each."* So every new item is **MODELLED** (`share: null` /
`basis: { kind: "modelled" }`), and **nothing already published was changed**.

| | Before | After | Rule kept |
|---|---|---|---|
| Canonical stakeholder groups (`STAKEHOLDER_SEGMENTS`) | 36 | **72** (+36, all Modelled) | a group is still only ever published-or-`Modelled`, never a bare number |
| Groups each of the 16 departments models | 16 | **24** | the "22–26, no repeats" gate in `src/test/departments.test.ts` still holds it |
| Reference indicators per department | 3–4 | **10** | each still carries a `basis`; no free-text source |
| Reference indicators (total) | 63 | **160** | published set unchanged (24); modelled 39 → **136** |

**Files:** `src/config/reference.ts` (36 new groups); `src/config/departments.ts` (16 re-cut
`segments` lists and 97 new indicator lines); `src/components/KPICards.tsx` (the strip now wraps with
`repeat(auto-fit, minmax(150px, 1fr))`, so ten cards read cleanly while three or four still occupy one
row); `src/lib/graph/palette.ts` (a stale "five to twelve groups" comment corrected to twenty-four).

**Gates that moved with the data (all count-strings, fixed at source):** the pinned
`DEPARTMENT_SEGMENTS` and the "22–26" range in `src/test/departments.test.ts`; the `MODELLED_IDS`
list in `src/test/stakeholder-weights.test.ts`; `toHaveLength(72)` in `src/test/workspace.test.tsx`;
the "72 nationally" text and heading in `e2e/journey.spec.ts`; and the "160 indicators" length in
`src/test/indicator-basis.test.tsx`. **Three defects were found by the gates and fixed at source:**
an energy indicator id clash (`energy-access` twice), a PSC id+label clash (`psc-establishment`
twice, "Funded posts filled" twice), and the stale palette comment.

**Verified on these bytes:** `npm run validate` **PASS (all checks green)** · typecheck **0** · lint
**0 errors, 7 pre-existing warnings** · tests **489/489 across 46 files** · build **✓** emitting
**`assets/index-CMAlJ9Ac.js`** · Playwright **17/17**. **Not yet deployed at the time of writing** — the site had not been
updated in that session; deploying the new build was the owner's decision. **(Deployed later the same day, and
republished again after the sourcing-statement fix — the deployment state is recorded in `PROJECT_STATUS.md`'s
2026-10-02 rows and in `PRODUCTION_READINESS.md` §6c.)**

---

## PART 9 — The national-scale dataset expansion, batch 1 (2026-10-04)

The owner chose **item 1** of the NEXT PHASE list: expand the datasets with **real published figures first**.
Batch 1 re-researched the **modelled** department indicators — the 97 added on 2026-10-02 were never
researched — against the **World Bank's own Open Data API**, the same source the original 24 published
figures use (`api.worldbank.org/v2/country/ZW/indicator/<series>`). **Every value below was read live from
that API during the session; nothing was invented.** Where a series measures something *materially different*
from the indicator's wording, the indicator **stays `Modelled`** and is not re-valued (the PART 7 discipline).

### 9.1 Eleven modelled indicators converted to published figures

| Department / indicator (id) | Value now shown | World Development Indicators series | Period |
|---|---|---|---|
| fin / Reserve cover (`fin-reserves`) | **0.5** months of imports | Total reserves in months of imports — `FI.RES.TOTL.MO` | 2024 |
| fin / National savings (`fin-savings`) | **10.7** % of GDP | Gross savings (% of GDP) — `NY.GNS.ICTR.ZS` | 2024 |
| fin / Broad money growth (`fin-money`) | **708.9** % | Broad money growth (annual %) — `FM.LBL.BMNY.ZG` | 2023 |
| health / Life expectancy (`health-life`) | **63.1** years | Life expectancy at birth, total (years) — `SP.DYN.LE00.IN` | 2024 |
| health / HIV treatment coverage (`health-hiv`) | **95** % | Antiretroviral therapy coverage (% of people living with HIV) — `SH.HIV.ARTC.ZS` | 2024 |
| edu / Repetition rate (`edu-repetition`) | **1.9** % | Repeaters, primary, total (% of total enrollment) — `SE.PRM.REPT.ZS` | 2013 |
| edu / Early childhood enrolment (`edu-ecd`) | **74.3** % gross | School enrollment, preprimary (% gross) — `SE.PRE.ENRR` | 2021 |
| ict / Individuals using the Internet (`ict-internet`) | **41.6** % | Individuals using the Internet (% of population) — `IT.NET.USER.ZS` | 2024 |
| mfa / Export earnings (`mfa-exports`) | **USD 7.50B** | Exports of goods and services (current US$) — `NE.EXP.GNFS.CD` | 2024 |
| env / Emissions per capita (`env-emissions`) | **0.8** t CO2e | CO2 emissions excluding LULUCF per capita (t CO2e/capita) — `EN.GHG.CO2.PC.CE.AR5` | 2024 |
| env / Renewable electricity share (`env-renewable`) | **88.3** % | Renewable electricity output (% of total electricity output) — `EG.ELC.RNEW.ZS` | 2021 |

**Two notes were re-framed to the published measure, not quietly re-valued:** `mfa-exports` now reads
*"goods and services"* (the series counts both) and `env-renewable` now reads *"including hydro"* (the series
counts hydro, which is why Zimbabwe's share is high) — the previous wording would have been untrue beside the
published number.

### 9.2 The split after batch 1

**160 indicators: 35 published / 125 modelled** (was 24 / 136). The split is derived
(`countIndicatorsByBasis`), so no screen states a number the configuration does not hold. The full published
set is pinned, value by value, in `src/test/indicator-basis.test.tsx`; the eleven new rows were added there,
and the gate was proved able to fail by mutation (changing `fin-money` from `708.9` to `708.8` made *"holds
every published figure"* fail) and restored byte-identical.

### 9.3 Still to do (the rest of item 1, NOT done in batch 1)

- **More indicators with published figures** — the remaining modelled indicators were **not** all re-checked
  in this batch; those with no matching series stay `Modelled` (to be recorded here as each is checked).
- **New indicators, 10 → 20 per department (160 → 320)** — not started.
- **More stakeholder groups, 72 → about 150, with more published shares** — not started; needs ZIMSTAT census
  tables rather than the World Bank API.
- **The pack** (`Minister Submission/**`) quotes the old 24 / 136 split and is the owner's file — **reported,
  not edited**.

### 9.4 Batch 2 — the rest of the modelled set swept (2026-10-04)

Every remaining modelled indicator was checked against the same World Bank API. **Four more genuinely measure
what their indicator says** and were converted (each value read live this session):

| Department / indicator (id) | Value now shown | World Development Indicators series | Period |
|---|---|---|---|
| env / Freshwater withdrawals (`env-water`) | **40.0** % of internal resources | Annual freshwater withdrawals, total (% of internal resources) — `ER.H2O.FWTL.ZS` | 2022 |
| health / Malaria incidence (`health-malaria`) | **11.4** per 1,000 at risk | Incidence of malaria (per 1,000 population at risk) — `SH.MLR.INCD.P3` | 2024 |
| health / Antenatal visits (`health-anc`) | **71.5** % | Pregnant women receiving prenatal care of at least four visits (% of pregnant women) — `SH.STA.ANV4.ZS` | 2019 |
| agri / Cereal yield (`agri-maize`) | **743.9** kg per hectare | Cereal yield (kg per hectare) — `AG.YLD.CREL.KG` | 2023 |

**Two re-framed to the published measure:** `health-malaria`'s unit is now *"per 1,000 population at risk"*
(the series is per population **at risk**, not per head) and `agri-maize` is now **"Cereal yield"** (the series
counts all cereals, not maize alone) — the previous wording would have been untrue beside the number.

**The split is now 160 indicators: 39 published / 121 modelled.** The four rows were added to the gate in
`src/test/indicator-basis.test.tsx`.

### 9.5 The modelled indicators that have no matching series (stay `Modelled`)

Checked and **rejected** this session because the series measures something **materially different** (or has
no Zimbabwe data), so the indicator keeps its honest `Modelled` label:

- `fin-debt` / `fin-debt-gdp` — the only debt series for Zimbabwe is **external** debt (`DT.DOD.DECT.CD`,
  `DT.DOD.DECT.GN.ZS`), which is not the **total public** debt these indicators state.
- `health-deliveries` — the series is **births attended by skilled staff** (`SH.STA.BRTC.ZS`), not births
  **in a facility**.
- `lg-water-piped` — the series is **safely managed** drinking water (`SH.H2O.SMDW.ZS`), not piped supply.
- `health-facilities` — the series is **hospital beds per 1,000** (`SH.MED.BEDS.ZS`, latest 2014), which
  measures capacity, not whether a primary facility is open and staffed (already rejected in PART 7).
- `hedu-research-spend` — `GB.XPD.RSDV.GD.ZS` holds **no Zimbabwe value**.
- Everything else checked is an **operational or administrative return** (border-clearance time, licence
  turnaround, filing rates, uptime, grievances, inspections, readiness, and the whole `opc` / `psc` / `zimra`
  / `zida` / `def` sets) that no publisher publishes for Zimbabwe.

### 9.6 Batch 3 — ten new indicators per department (2026-10-04)

The owner's target was **20 indicators per department (320 total)**. Batch 3 added **ten new Modelled
indicators to every one of the 16 departments** — 160 new lines in `src/config/departments.ts`. They are
**demo figures**, plainly labelled `Modelled`, per the owner's instruction that real data comes after
approval. Each carries a unique id, a plain note and a score, and the set is now **320 indicators
(39 published / 281 modelled)**. The gate in `src/test/indicator-basis.test.tsx` was raised from
`toHaveLength(160)` to `toHaveLength(320)`.

**New indicators by department (id suffix — label):**
- **opc:** delivery · directives · interfaces · maturity · reporting · bills · visits · provinces · satisfaction · analytics
- **fin:** revenue-gdp · expenditure · interest · capital · currency · npl · inflation · trade · remit-gdp · sovereign
- **agri:** wheat · cotton · horticulture · livestock-count · irrigated-hectares · mechanisation · storage · contracts · dams · climate
- **health:** full-immunisation · maternal · tb · blood · mental · referrals · bed-occupancy · chw · amr · ncd
- **edu:** literacy · numeracy · lower-secondary · girls · special · connectivity · absenteeism · water · feeding-kitchen · exam-pass
- **hedu:** lecturer-ratio · gender · apprentices · incubation · industry · completion · distance · lab · innovation-grants · graduate-employment
- **ict:** spectrum · fibre · mast · affordability · skills · govcloud · rural-broadband · incidents · ebusiness · school-lab
- **mines:** gold · platinum · lithium · csr · fatalities · artisanal · rents · value-local · water · closure
- **energy:** peak · coal · hydro · imports · gas · tariff · rural · netmeter · minigrid · efficiency
- **psc:** retirement · gender · disability · recruitment · discipline · performance · innovation · wellness · ethics · mobility
- **lg:** budget · capital · water-points · sanitation-hh · refuse · plans · audit · revenue-base · roads-grading · wards
- **mfa:** trade-delegations · passports · diaspora-register · consular-cases · trade-desks · afcfta · bilateral · visa-on-arrival · remit-cost · investment-forum
- **env:** air · wetlands · waste · carbon · trees · wildlife · eia-compliance · rivers · mine-sites · awareness
- **def:** personnel · air · vehicles · medical · logistics · training-days · cyber · community · veteran-employment · readiness-days
- **zimra:** e-payment · customs · risk · debt · education · refund-days · sme · transfer-pricing · integration · disputes
- **zida:** approved · value · export-value · sez · incentives · grievances · sectors · local · training · followup

**Still to do (the last part of item 1):** the **stakeholder groups, 72 → about 150**, which needs ZIMSTAT
census tables rather than the World Bank API — **NOT STARTED**.

### 9.7 Batch 4 — the stakeholder groups reach 150 (2026-10-04)

The canonical stakeholder list grew from **72 to 150** (78 new groups, all `Modelled` — demo figures), and
**every one of the 16 departments now models 40 of them** (was 24). The new groups cover the production and
supply chains the platform previously did not name: agro-processing and input suppliers, the manufacturing
sub-sectors, the mining and energy supply chains, the rest of the financial sector, transport and logistics,
tourism and the creative industries, the ICT and digital economy, media, the health and care workforce, and
the education and training workforce. Every new group is modelled (no published count), per the owner's
instruction. The split is now **150 groups: 20 published / 130 modelled**.

**Gates moved with the data (all fixed at source):** the `DEPARTMENT_SEGMENTS` pin and the range gate
("22–26" → "**36–44**") in `src/test/departments.test.ts`; `MODELLED_IDS` (+78 ids) and the "20 / 130" split
in `src/test/reference-sources.test.tsx` and `src/test/stakeholder-weights.test.ts`;
`toHaveLength(72)` → `toHaveLength(150)` in `src/test/workspace.test.tsx`; and "72 nationally" / the heading
`(72)` → "150 nationally" / `(150)` in `e2e/journey.spec.ts`. **One layout test was re-tuned, not weakened:**
`src/test/swarm.test.ts`'s impulse check uses a stronger shove (260/60 → **420/95**), because a 40-group
school is denser than a 24-group one and needs a bigger shove for the same visible separation — the property
(a shove separates the school, which then recoheres) is unchanged.

**Item 1 is now complete** — the indicators target (160 → 320) and the groups target (72 → 150) are both met.

### 9.8 Batch B part 2 — the sweep widened beyond the World Bank (2026-10-04)

The sourcing rule names more publishers than the World Bank, so the remaining modelled indicators were
checked against them too. **Three genuinely measure what their indicator says** and were converted; each
value was read live this session:

| Department / indicator (id) | Value now shown | Series, and the body that publishes it | Period |
|---|---|---|---|
| fin / Debt to GDP (`fin-debt-gdp`) | **70.4** % of GDP | *General government gross debt (% of GDP)* — **International Monetary Fund**, World Economic Outlook | 2024 |
| mfa / Remittance cost (`mfa-remit-cost`) | **5.3** % | *Average transaction cost of sending remittances to a specific country (%)* — World Bank, World Development Indicators | 2023 |
| edu / Girls' secondary enrolment (`edu-girls`) | **50.9** % | *School enrollment, secondary, female (% gross)* — World Bank, World Development Indicators | 2013 |

**One publisher was added** — the **International Monetary Fund** (`imf`) in `NAMED_SOURCES`, because the
IMF's World Economic Outlook, not the World Bank, is the body that publishes Zimbabwe's public debt. **Two
wordings moved to the published measure** so they stay true beside the number: `fin-debt-gdp` is now
*"general government gross debt"* (the IMF series counts general government, not central government), and
`edu-girls` is now *"gross"* (the series is the gross enrolment ratio, not girls' share of total
enrolment — the earlier note described a different measure).

**The split is now 320 indicators: 54 published / 266 modelled** (was 51 / 269).

#### 9.8.1 Checked and rejected — no publisher holds the measure

- `fin-debt` (**USD stock**) — the IMF's data service publishes general government debt **only as a share
  of GDP**; it holds no USD debt-stock series for Zimbabwe. Only the ratio could be converted.
- `fin-npl` — `FB.AST.NPER.ZS` holds **no Zimbabwe value**.
- `energy-imports` — the indicator states **imported electricity** as a share of supply. The only World
  Bank series, `EG.IMP.CONS.ZS`, is **net *energy* imports (% of energy use)**, 17.0 (2022) — all energy,
  not electricity. Materially different, so it stays `Modelled`.
- `agri-irrigated` / `agri-irrigated-hectares` — `AG.LND.IRIG.AG.ZS` holds **no Zimbabwe value**; FAO's
  AQUASTAT publishes irrigation area in downloadable tables with no queryable interface.
- `hedu-research-spend` — **UNESCO UIS**, the body that publishes research spending, returned no Zimbabwe
  record for the indicator codes queried; the World Bank series holds no Zimbabwe value either (9.5).
- `agri-tobacco` / `agri-cotton` / `agri-horticulture` — FAOSTAT's query interface returned **no Zimbabwe
  crop-production data**. **UN Comtrade does** publish Zimbabwe's trade, but it publishes **exports**, not
  **output** (tobacco exports 2024: 231.9 million kg / USD 1.33 billion; seed cotton 10.4 million kg). An
  export figure is a different measure from the output these indicators state, so they stay `Modelled`
  rather than being re-framed — re-framing would change what the department's dashboard reports, which is
  the owner's decision, not a research one.
- `edu-lower-secondary` — the World Bank series (`SE.SEC.CUAT.LO.ZS`) is **educational attainment** of the
  population aged 25+, not the completion rate the indicator states; UNESCO UIS returned no Zimbabwe
  record for the completion-rate codes queried.
- **The health operational returns** — WHO's Global Health Observatory publishes no series for medicine
  stock-outs, bed occupancy, referral turnaround, blood units collected, community health workers active,
  antibiotic-use monitoring or non-communicable screening.
- **The `opc` / `psc` / `zimra` / `zida` / `def` sets** — operational and administrative returns
  (turnaround times, filing rates, readiness, inspections, grievances). No publisher publishes them for
  Zimbabwe.

#### 9.8.2 The limit as it was stated then — and the correction

**This section originally claimed that "no publisher publishes them for Zimbabwe" and that "no source can
be invented for the remainder". That was WRONG, and it is corrected here.** The sweep in 9.8 covered only
the **six international data services with a queryable interface** (the World Bank, the IMF, UNESCO UIS,
WHO, FAO and UN Comtrade). It never looked at **Zimbabwe's own publishers** — ZIMSTAT, the Reserve Bank of
Zimbabwe, ZIMRA, the line ministries and their agencies — and two of its probes were malformed (the WHO
query searched indicator *names* for the word "Zimbabwe", which can never match anything; the UNESCO query
used guessed indicator codes). The owner asked whether the search had really been exhausted. It had not.

**The correct statement of that limit:** *the six international data services checked hold no series for
these measures; national publications had not been searched at that point.* The national search then began
(**PART 10**), and it found real published figures straight away — which is the proof that the earlier
conclusion was premature. What remains `Modelled` after each national batch is recorded there, with the
reason, and the replacement decision for those is the owner's (it is no longer a decision about 266
figures, because that number was based on an incomplete search).

---

## PART 10 — THE NATIONAL SOURCES (the sweep the owner asked for)

### 10.1 Batch S1 — money and the state of the economy (`fin`, `zimra`)

**The publishers read in this batch, and where the documents are:**

| Publisher | Document read | Where it lives |
|---|---|---|
| **Zimbabwe Revenue Authority (ZIMRA)** | **Annual Report 2024** (181 pages) | `zimra.co.zw` → About us → Annual Reports (`?download=4361:zimra-2024-annual-report`) |
| **Reserve Bank of Zimbabwe** | **Bank Supervision Annual Report 2025** (54 pages, the banking sector's own accounts) | `rbz.co.zw/documents/bank_sup/BSD_Annual_Reports/2025_BSD_Annual_Report.pdf` |
| **Reserve Bank of Zimbabwe** | **Statistics tables** — bank deposits, loans and advances, monetary aggregates (XLSX) | `rbz.co.zw/documents/statistics/2026/July/…` |

**Five indicators now carry a real published figure** (each value read from the document itself):

| Department / indicator | Value now shown | Published figure, and where it is stated | Period |
|---|---|---|---|
| fin / Foreign currency deposits (`fin-currency`) | **45.7** % | *Foreign currency deposits, % of total deposits* — RBZ Bank Supervision Annual Report 2025, consolidated balance sheet | 31 December 2025 |
| fin / Non-performing loans (`fin-npl`) | **3.47** % | *Non-performing loans to total loans* — RBZ Bank Supervision Annual Report 2025, asset quality | 31 December 2025 |
| zimra / Collections against target (`zimra-collection`) | **110.3** % | Net collections **ZWG116.47 billion** against a target of **ZWG105.63 billion** (exceeded by **10.26 %**) — ZIMRA Annual Report 2024 | 2024 |
| zimra / Registered taxpayers (`zimra-register`) | **120,234** | *Active registered taxpayers* — ZIMRA Annual Report 2024 | 2024 |
| zimra / Audit coverage (`zimra-audit`) | **3.53** % | 4,243 audits against 120,234 active registered taxpayers — ZIMRA Annual Report 2024 | 2024 |

**Two measures were re-framed to the published one**, because the platform's old wording described
something the publisher does not state:
- `fin-currency` was **"Local currency deposits"**; the RBZ balance sheet states the **foreign**-currency
  share, so the indicator is now **"Foreign currency deposits"** (the local-currency share is the
  complement, which would be a derived number rather than a published one).
- `zimra-audit` was **"Audit yield per case (USD 18k)"**; ZIMRA states audit **coverage** as a percentage
  (and its audit yield in two currencies at once, which cannot honestly be reduced to one figure per
  case), so the indicator is now **"Audit coverage"**.

**The split moved from 320 indicators: 54 published / 266 modelled to 59 published / 261 modelled.**

### 10.2 Checked and not converted in S1 — with the reason

- `zimra-refunds` (**"Refunds paid in time"**) — ZIMRA publishes the refund **amounts** for 2024 (ZWG6.0
  billion: ZWG3.38 billion paid, ZWG2.62 billion outstanding; VAT 99.44 % of the total) but **not** a
  "paid in time" rate. The published measure is not the one the indicator states, so it stays `Modelled`
  rather than being replaced with a different question.
- `zimra-filing` (on-time filing), `zimra-digital` (declarations filed online), `zimra-e-payment`,
  `zimra-customs` (cleared same day), `zimra-risk`, `zimra-vat-gap`, `zimra-education`,
  `zimra-refund-days`, `zimra-sme`, `zimra-transfer-pricing`, `zimra-integration`, `zimra-disputes`,
  `zimra-clearance` — the 2024 Annual Report does not state these as the indicator uses them.
- `fin-debt` (**USD stock**) — the RBZ documents read state the banking sector's balance sheet, not a USD
  public-debt stock; the IMF publishes the **ratio** only (converted in Batch B part 2).
- `fin-budget`, `fin-expenditure`, `fin-capital`, `fin-revenue-gdp`, `fin-taxbase`, `fin-sovereign` — the
  Treasury's budget and debt documents were **not read in this batch**; they are the next S1 step.
- The `mfa` set (passports, diaspora register, consular cases, trade desks) — the Ministry of Foreign
  Affairs and the Registrar-General publish these, and they were **not read in this batch**.

### 10.3 A practical note for whoever continues this

**`rbz.co.zw` refuses direct downloads** — a captcha service (ShieldSquare) answers a plain `curl`, so the
site's HTML pages cannot be read programmatically. The **document paths under `/documents/…` are not
protected**, so a PDF or XLSX can be fetched directly once its address is known, and the addresses can be
found by reading the site through a text-extraction reader (`r.jina.ai`). **`zimra.co.zw` needs a browser
user-agent** to serve its PDFs. **ZIMSTAT's own pages are readable** and confirm it publishes agriculture,
labour, external trade, energy, ICT, industrial, health, education and environment statistics — those are
the S2 and S3 sources.

### 10.4 Batch S2 begins — UNESCO's statistics institute, queried properly (2026-10-04)

The earlier sweep's UNESCO probe was malformed (guessed indicator codes), so UIS was wrongly reported as
holding nothing. This time the **UIS definitions list (5,063 indicators)** was fetched first, the right
codes found **by name**, and Zimbabwe's values then read from the UIS data service.

| Department / indicator | Value now shown | UIS series (code) | Period |
|---|---|---|---|
| edu / Lower-secondary completion (`edu-lower-secondary`) | **72.4** % | Completion rate, lower secondary education, both sexes (`CR.2`) | 2015 |
| hedu / Science and technology graduates (`hedu-stem`) | **23.8** % | Percentage of tertiary graduates from STEM programmes, both sexes (`FOSGP.5T8.F500600700`) | 2024 |

`hedu-stem`'s note now states what the series counts — a **share of all tertiary graduates** — which the
previous wording did not. **UNESCO was added to `NAMED_SOURCES`.** Split: **61 published / 259 modelled.**

**Checked and rejected (S2, so far) — with the reason:**
- `edu-numeracy` — UIS publishes *Grade 3 mathematics proficiency* (`MATH.G3`), but holds **no Zimbabwe
  value**.
- `hedu-graduation` — UIS's *gross graduation ratio from first degree programmes* (`GGR.6T7`) is **1.35 %**
  for Zimbabwe (2013): graduates relative to the whole graduation-age population, **not** the share of
  enrolled students who graduate that the indicator states. Rejected rather than re-framed, because a
  1.4 % "graduation rate" would read as a failure rate and would be untrue to both measures.
- `health-chw` — WHO's *Number of community health workers* (`HRH_06`) holds **no Zimbabwe value**.
- `health-outpatient` — WHO's *Outpatient visits (per 100,000)* (`MH_20`) sits inside WHO's **mental-health**
  series, so it is not the general outpatient measure the indicator states; its Zimbabwe value is also
  dated 2014.
- `fin-revenue-gdp` — the IMF's *Government revenue (% of GDP)* series holds **no Zimbabwe value**; the
  Treasury's own budget documents remain the route for that one.

**Still to read in S2:** ZIMSTAT's agriculture and trade tables (their file addresses are now known —
`zimstat.co.zw/wp-content/uploads/Macro/…`), the Ministry of Lands' crop and livestock assessments, and the
mines and energy publishers.

### 10.5 Batch S2 continues — a Zimbabwean publisher again: TIMB and the tobacco season (2026-10-04)

**TIMB (the Tobacco Industry and Marketing Board)** publishes the season's marketing statistics on its own
site, and its front page carried, on the day of this session:

> **DAY 127 · DATE: 22/09/2026 · SOLD MASS: 980 KGS · YTD MASS: 359,099,787 KGS · AVERAGE PRICE: 2.49 US$/KG**

| Department / indicator | Value now shown | Published figure | Period |
|---|---|---|---|
| agri / **"Tobacco sold"** (`agri-tobacco`) | **359.1** million kg | Year-to-date **sold mass 359,099,787 kg** — TIMB marketing-season statistics | season to 22 September 2026 |

**The label moved from "Tobacco output" to "Tobacco sold"**, because that is exactly what TIMB counts —
tobacco sold through the auction and contract floors — and "output" would claim something the publisher
does not state. **TIMB was added to `NAMED_SOURCES`.** Split: **62 published / 258 modelled.**

**Checked in S2 and not converted — with the reason:**
- **ZERA (the energy regulator)** — its 2024 Annual Report exists (13.47 MB) but the site returns **403
  Forbidden** to a direct download and its download page yields no usable link, so nothing could be read
  from it this session. Its front page does publish current prices (petrol, diesel, electricity, LPG as at
  17 September 2026), but those are **prices**, not the "tariff cost recovery" the platform's indicator
  states.
- **The Ministry of Mines** — `mines.gov.zw` returns **404** (and `/index.php` returns 403), so no ministry
  report could be read.
- **MMCZ (the Minerals Marketing Corporation)** — reachable, and its news pages state mineral exports of
  **US$3.4 billion in FY2025**, but its annual-report page yields no downloadable file and the figure does
  not match any indicator the platform holds (the platform's `mfa-exports` figure is already published from
  the World Bank).
- **ZIMSTAT's agriculture statistics page** hosts **no data files** (only a descriptive page), and its
  **external-trade tables are at 8-digit HS product level** — a "horticulture exports" total would have to
  be **summed across dozens of HS lines**, which is a derived figure, not a published one. The tables exist
  and are downloadable (`zimstat.co.zw/wp-content/uploads/Macro/Trade/…`), so a later batch can use them if
  the owner wants a derived total with its method stated.
- **The Chamber of Mines of Zimbabwe** — reachable, but the site is stale (its own header reads *Saturday,
  03 November 2018*), so nothing current could be sourced from it.

### 10.6 Batch S3 begins — UNESCO's school-facility series (2026-10-04)

The earlier sweeps never queried UNESCO's **school-facility** indicators (they sit outside the enrolment and
completion series). Three now convert, each value read from the UIS data service:

| Department / indicator | Value now shown | UIS series (code) | Period |
|---|---|---|---|
| edu / Schools with internet (`edu-connectivity`) | **35.3** % | Proportion of **primary** schools with access to the internet for pedagogical purposes (`SCHBSP.1.WINTERN`) | 2024 |
| edu / Schools with safe water (`edu-water`) | **92.0** % | Proportion of **primary** schools with access to basic drinking water (`SCHBSP.1.WWATA`) | 2024 |
| edu / **"Schools with single-sex sanitation"** (`edu-sanitation`) | **99.3** % | Proportion of **primary** schools with single-sex basic sanitation facilities (`SCHBSP.1.WTOILA`) | 2024 |

**One measure was re-framed:** `edu-sanitation` was *"School sanitation ratio (1:48)"* — pupils per toilet —
which UIS does not publish. UIS publishes the **proportion of schools** with single-sex basic sanitation, so
the label is now **"Schools with single-sex sanitation"** and the note says "primary schools". The other two
notes now say **primary** schools too, which is the level those series cover.

**Split: 65 published / 255 modelled.**

**Checked in S3 and rejected — with the reason:**
- `health-bed-occupancy` — WHO's bed series (`MH_13`, `MH_16`, `MH_15`) count **mental-health beds**, not the
  occupancy rate of general hospital beds the indicator states.
- `health-blood` — WHO publishes no blood-donation series for Zimbabwe (its "blood" indicators are blood
  pressure and blood glucose).
- `health-facilities` and `health-chw` — already recorded (9.5 and 10.4): no Zimbabwe value for the measures
  the platform uses.
- `health-mental` — WHO's mental-health outpatient series (`MH_20`, 572.8 per 100,000 in **2014**) is the
  right measure in principle, but the value is twelve years old and the indicator's unit is per 10,000; left
  `Modelled` rather than re-framed onto a 2014 figure.
