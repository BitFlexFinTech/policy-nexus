# ZIMBABWE_POLICY_STRUCTURE.md — the real national-policy format we must replicate

**Why this file exists.** The owner's strict rule: *"the draft policy format must always be the
same, based on the format Zimbabwe Policies are in."* This file records the **real** structure of
Zimbabwean national policies, from the documents themselves, so the platform's drafted policy
replicates it instead of a derived, report-shaped list. It is the reference the drafting library
(`src/config/draftingPrompts.ts`) and the generator (`src/services/assessment/policyDraft.ts`)
must follow.

**The owner's complaint this fixes (raised twice).** The drafted policy currently *"reads more like
a report that just cites the modelled indicators and stakeholder groups than an actual draft
policy."* The fix is two-fold: **the section order replicates the real instrument**, and **the
content reads as policy, not as commentary about the examination**.

## Sources (real Zimbabwean documents; publisher, title, period)

- **ZEPARI**, *Strengthening the Zimbabwe National Policy Making Process* — the Government's own
  account of how national policy is made (`zepari.co.zw`).
- **Government of Zimbabwe**, *National Development Strategy 2 (NDS2) 2026–2030* — the current
  national plan every sector policy aligns to (Treasury: `zimtreasury.co.zw`).
- **Government of Zimbabwe**, *National Agriculture Policy Framework (NAPF) 2019–2030* — nine policy
  pillars (Food & Nutrition Security; Knowledge/Technology/Innovation; Inputs; Infrastructure;
  Marketing & Trade; Finance & Credit; Land; Resilient & Sustainable Agriculture; Institutional
  Arrangement).
- **Ministry of Health and Child Care**, *National Health Strategy 2021–2025*.
- **Government of Zimbabwe**, *Devolution and Decentralisation Policy 2019*.
- **Government of Zimbabwe**, *National Trade Policy 2019–2023* and *National Industrial
  Development Policy 2019–2023*.

**Honest limitation (updated 2026-10-07).** The tool used to fetch can read web **pages** but **not
PDFs**, and this machine has no PDF reader, so the **exact table of contents of every departmental
policy could not be extracted**. The **per-department note** at the foot of this file records the
real document each of the 16 departments' draft follows, the two structures that *were* read (the
ICT policy 2016 and the nine NAPF pillars), and — where a document could not be opened — names it
and uses the **verified national skeleton** above. A section list is never invented. The one open
item is the exact table of contents of the fourteen PDF-only documents, which needs a PDF-reading
tool (see *What is still open, and why*).

## The real Zimbabwean national-policy skeleton (what the drafted policy must follow)

1. **Cover / identification** — Republic of Zimbabwe; the Ministry; the policy title and period;
   the Vision 2030 / NDS2 framing.
2. **Foreword** — by the responsible Minister, marked for signature and date.
3. **Acronyms and abbreviations**.
4. **Executive summary**.
5. **1. Introduction and background** — the mandate, and the link to NDS2 and Vision 2030.
6. **2. Situation analysis** — the **sector's** situation, with sourced figures. *(This is analysis of
   the sector, not a description of the platform's model.)*
7. **3. Vision, mission and objectives** — a goal, then objectives.
8. **4. Guiding principles**.
9. **5. Policy measures / priority areas / pillars** — **THE HEART OF THE INSTRUMENT.** Each pillar
   is a **policy statement** plus the strategies that carry it. (In the NAPF this is the nine
   pillars; a real policy puts most of its substance here.)
10. **6. Legal and institutional framework** — the Acts, statutory instruments and institutions.
11. **7. Implementation framework** — who does what, and the coordination structures.
12. **8. Resource mobilisation and financing**.
13. **9. Risk management**.
14. **10. Monitoring, evaluation and reporting**.
15. **Annexes** — matrices, the M&E framework, costing, the documents relied upon; and references.

## The one rule that makes it read as policy, not a report

**The instrument never talks about the platform, the examination or the indicator table.** It states
what the Department shall do. So, in the drafted policy's own voice, none of these may appear:
"the examination modelled…", "the platform's table records…", "the indicators below are…",
"the examination raised N risks…". The assessment's **findings** become the policy's **measures and
provisions**; they are not narrated.

## Per-department note — the real instrument each department's draft follows

**Method (2026-10-07).** For each of the 16 departments the real Zimbabwean national document its
draft should follow was searched for on the open web, then the document itself was read where it
could be found. **A real PDF reader was installed locally for this** — the Python package *PyMuPDF*
(`pip install --user pymupdf`), a research tool on this machine, **not** a project dependency —
because the assistant's fetch tool returns a PDF's raw bytes rather than its words. With it, the
**table of contents of six documents was read and is recorded below**. For the ten documents that
could not be located (their hosts refused to connect or the search engines throttled), the document
is **named** and the draft uses the **verified national skeleton** above. A section list is never
invented.

| Department | The real national document (publisher · period) | Structure read? |
|---|---|---|
| **opc** — Office of the President and Cabinet | *National Development Strategy 2 (2026–2030)* (Government of Zimbabwe) — the plan every sector policy aligns to | Named (already a cited instrument) |
| **ict** — Ministry of ICT, Postal and Courier Services | *Zimbabwe National Policy for Information and Communication Technology (ICT) 2016*; with *National ICT Policy 2022–2027* and the *National AI Strategy* | **Read** — see below |
| **fin** — Ministry of Finance, Economic Development and Investment Promotion | *National Development Strategy 2 (2026–2030)* and the annual *National Budget Statement* (the Treasury) | Named |
| **agri** — Ministry of Lands, Agriculture, Fisheries, Water and Rural Development | *National Agriculture Policy Framework (NAPF) 2019–2030* | **Read** — nine pillars, see below |
| **health** — Ministry of Health and Child Care | *National Health Strategy 2021–2025* | **Read** — see below |
| **edu** — Ministry of Primary and Secondary Education | *Education Sector Strategic Plan (ESSP) 2016–2020* and *ESSP 2021–2025* | Named |
| **hedu** — Ministry of Higher and Tertiary Education, Innovation, Science and Technology Development | *Education 5.0 / Heritage-Based Education* doctrine | Named |
| **mines** — Ministry of Mines and Mining Development | *Mines and Minerals Act [Chapter 21:05]* (the governing law) | Named |
| **energy** — Ministry of Energy and Power Development | *National Energy Policy 2012* and *National Renewable Energy Policy 2019* | **Read** — the renewable-energy policy, see below |
| **psc** — Public Service Commission | *Public Service Act* (the governing law) | Named |
| **lg** — Ministry of Local Government and Public Works | *Devolution and Decentralisation Policy 2019* | **Read** — see below |
| **mfa** — Ministry of Foreign Affairs and International Trade | *National Trade Policy 2019–2023* and *National Industrial Development Policy 2019–2023* | Named |
| **env** — Ministry of Environment, Climate and Wildlife | *National Environmental Policy and Strategies 2009*; *National Climate Policy 2017*; *National Climate Change Response Strategy 2014* | **Read** — the climate policy, see below |
| **def** — Ministry of Defence and War Veterans Affairs | *Defence Act* (the governing law) | Named |
| **zimra** — Zimbabwe Revenue Authority | *Revenue Authority Act [Chapter 23:11]* (the governing law) | Named |
| **zida** — Zimbabwe Investment and Development Agency | *Special Economic Zones Act [Chapter 14:34]* (the governing law) | Named |

**The six structures read (2026-10-07).**

- **ict** — *Zimbabwe National Policy for ICT 2016*. Its own contents: **Foreword · Abbreviations and
  Acronyms · Introduction · Section I — Background (1 Background, 1.1 Vision, 1.2 Mission) · Section II
  — Main Socio-Economic Development Indicators and ICT Status in Zimbabwe (2 Key Demographic and
  Socio-Economic Indicators, 3 Previous ICT Policy Outcomes, 4 ICT Sector Challenges, 5 Status of ICTs)
  · Section III — The Policy (6 Key Policy Objectives, 7 ICT Infrastructure — national backbone,
  infrastructure sharing, national data centre; 8 e-Government; 9 Content — content development; 10 ICT
  Sector Growth — number portability, converged licensing, entrepreneurship …)**, then the policy
  statements and implementation programmes. (Read in full at veritaszim.)

- **agri** — *National Agriculture Policy Framework (NAPF) 2019–2030*. Its substance is **nine pillars**
  (also recorded by the FAO in its FAOLEX index): **1 Food and Nutrition Security and Resilience ·
  2 Agricultural Knowledge, Technology and Innovation System · 3 Production and Supply of Agricultural
  Inputs · 4 Development of Agricultural Infrastructure · 5 Agricultural Marketing and Trade
  Development · 6 Agricultural Finance and Credit · 7 Access, Tenure Security and Land Administration ·
  8 Resilient and Sustainable Agriculture · 9 Institutional Arrangement for Policy Implementation.**
  This is exactly the "measures / priority areas / pillars" chapter the national skeleton describes.

- **health** — *National Health Strategy 2021–2025*. Its contents: **Foreword · Acknowledgements ·
  Acronyms · Executive Summary · 1 Introduction (1.1 Background, 1.2 the strategy's development
  process, 1.3 Geography and demography, 1.4 Health policy and service structure, 1.5 Health status,
  1.6 Health sector profile — maternal care, child health, immunisation, nutrition, HIV/TB/malaria,
  NCDs, 1.7 Procurement and supply management for essential medicines, 1.8 Human Resources for Health,
  1.9 Health financing, 1.10 Leadership, governance and accountability) · a strategic-priorities chapter
  numbered 3, whose areas run 3.1–3.10 (e.g. 3.3 health infrastructure and medical equipment; 3.5
  access to primary, secondary, tertiary, quaternary and quinary care; 3.6 essential medicines and
  commodities; 3.7 water, sanitation and health environment; 3.8 human-resources performance), each
  with its strategic directions and interventions · and the implementation and monitoring chapters that
  follow.**

- **lg** — *Devolution and Decentralisation Policy 2019*. Its contents: **Devolution and
  Decentralisation Policy · Urban Councils and Rural District Councils · Implementation Framework ·
  Local Governance Architecture · Pace of Devolution · Devolved Functions · Constitution of Devolved
  Governance Structures · Interface with Central Government · Citizen Participation · Local
  Development Plans · Devolution Coordination · Financial Resourcing · Developing Implementation
  Capacity · Role Clarity and Devolved Service Delivery · Staffing Devolved Mandates · Financial and
  Administrative Capacity · Absorptive Capacity of Devolved Mandates · Fiscal Equalisation · Devolved
  Service Delivery · Service Delivery Capacity Gaps · Support for Regional Economic Development ·
  Financial Conduct and Accountability · Devolved Financial Management · Budgets Preparation ·
  Sub-national Government Sources of Revenue · Financial Obligations of Local Authorities · Accounting
  and Financial Reporting · Borrowing and Investments · Spatial Planning and the Regional Town and
  Country Planning Act · Inter-Governmental Governance Relations · Annexure.**

- **env** — *National Climate Policy 2017*. Its contents: **Foreword · Preface · Acknowledgements · List
  of Acronyms · CHAPTER 1 Introduction (Background, Principles, Policy Direction, Vision, Purpose,
  Goals, Implementation) · CHAPTER 2 Climate Change Adaptation (Water, Agriculture, Health, Forestry
  and Biodiversity, Infrastructure, Human Settlement) · CHAPTER 3 Climate Change Mitigation and Low
  Carbon Development · CHAPTER 4 Education, Training and Awareness · CHAPTER 5 Weather, Climate
  Research and Modelling · CHAPTER 6 Technology Transfer and Information Sharing · CHAPTER 7
  Governance and Institutional Framework · CHAPTER 8 Conclusion.**

- **energy** — *National Renewable Energy Policy 2019*. Its contents: **1 Country Overview
  (Demographics, Economy, Energy Sector, Current Acts and Policies, Consultations) · 2 Renewable Energy
  in Zimbabwe (Potential) · 3 Barriers to Uptake of Renewable Energy · 4 Policy Vision, Goal and
  Objectives (Vision, Policy Principles, Goals and Objectives) · 5 Policy Term · 6 Setting Targets for
  Renewable Energy · 7 Incentives for Promoting Investment · 8 Procurement Mechanisms · 9 Addressing
  the Development Risks · 10 Promoting Off-grid Technologies and Other Clean Energy Solutions ·
  11 Promote Local Manufacturing of Renewable Energy Technologies · 12 Skills Development and
  Technology Transfer · 13 Biofuels · 14 Funding Mechanisms · 15 Improving Socio-economic Conditions.**

**What is still open, and why (honest).** The **exact table of contents of ten documents is not
recorded**, because none could be located and downloaded: their hosts refused to connect from this
machine (an HTTP 403 on the Global Partnership for Education's education-plan PDFs and on the Zimbabwe
government document pages), or the only working search engine (*Brave*) was **throttled (HTTP 429)**
after the first requests, so the remaining document addresses could not be found. Those ten drafts
therefore follow the **verified national skeleton** above. Closing the gap needs only a working route
to ten more document addresses — **the reading itself now works** (PyMuPDF).

**Doors tried (2026-10-07)** — recorded so a later session can tell a real dead end from an untried
one. **Worked:** *Brave Search* located the six documents read (health, agriculture, ICT, energy,
climate, devolution); *veritaszim* served the ICT policy 2016 as readable HTML; and a locally
installed **PyMuPDF** read the six tables of contents. **Did not work:** *Google, Bing, DuckDuckGo,
Mojeek, Ecosia, Startpage and Yandex* all blocked automated retrieval (a captcha, generic results, or
an HTTP 403); *Brave* returned **429 (throttled)** after the first queries; *FAOLEX* detail pages
returned **403**; the Global Partnership for Education and Planipolis education-plan PDFs returned
**403**; and the agriculture and health PDFs were over the **5 MB** fetch limit.
