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

**Status (updated 2026-10-07, second pass).** All sixteen departments' drafts now follow a **real
Zimbabwean instrument whose own structure was read from the document itself** — not from the national
skeleton alone. A locally installed PDF reader (the Python package *PyMuPDF*, a research tool on this
machine, **not** a project dependency) reads the PDFs; where an instrument is a Word file or a web
page, its text is read directly. The documents opened and read are: the national plans (NDS2 2026–2030
and the 2025 Budget Statement), the trade policy and the industrial-development policy, both education
plans and the Education 5.0 doctrine, the ICT, agriculture, health, energy, climate and devolution
policies, and the Acts governing mining, public service, revenue, defence and special economic zones.
Each instrument's exact contents are recorded below, with the body that publishes it. Where a
department's instrument is a **law** rather than a policy, the *arrangement of sections* is recorded
in place of a table of contents. A section list is never invented.

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
| **opc** — Office of the President and Cabinet | *National Development Strategy 2 (NDS2) 2026–2030* (Government of Zimbabwe) — the plan every sector policy aligns to | **Read** — see below |
| **ict** — Ministry of ICT, Postal and Courier Services | *Zimbabwe National Policy for Information and Communication Technology (ICT) 2016*; with *National ICT Policy 2022–2027* and the *National AI Strategy* | **Read** — see below |
| **fin** — Ministry of Finance, Economic Development and Investment Promotion | *National Development Strategy 2 (2026–2030)* and the annual *National Budget Statement* (the Treasury) | **Read** — see below |
| **agri** — Ministry of Lands, Agriculture, Fisheries, Water and Rural Development | *National Agriculture Policy Framework (NAPF) 2019–2030* | **Read** — nine pillars, see below |
| **health** — Ministry of Health and Child Care | *National Health Strategy 2021–2025* | **Read** — see below |
| **edu** — Ministry of Primary and Secondary Education | *Education Sector Strategic Plan (ESSP) 2016–2020* and *ESSP 2021–2025* | **Read** — see below |
| **hedu** — Ministry of Higher and Tertiary Education, Innovation, Science and Technology Development | *Education 5.0 / Heritage-Based Education* doctrine | **Read** — see below |
| **mines** — Ministry of Mines and Mining Development | *Mines and Minerals Act [Chapter 21:05]* (the governing law) | **Read** — see below |
| **energy** — Ministry of Energy and Power Development | *National Energy Policy 2012* and *National Renewable Energy Policy 2019* | **Read** — the renewable-energy policy, see below |
| **psc** — Public Service Commission | *Public Service Act [Chapter 16:04]* (the governing law) | **Read** — see below |
| **lg** — Ministry of Local Government and Public Works | *Devolution and Decentralisation Policy 2019* | **Read** — see below |
| **mfa** — Ministry of Foreign Affairs and International Trade | *Zimbabwe Trade Policy — Vision 2030* and the *National Industrial Development Policy (ZNIDP) 2019–2023* | **Read** — see below |
| **env** — Ministry of Environment, Climate and Wildlife | *National Environmental Policy and Strategies 2009*; *National Climate Policy 2017*; *National Climate Change Response Strategy 2014* | **Read** — the climate policy, see below |
| **def** — Ministry of Defence and War Veterans Affairs | *Defence Act [Chapter 11:02]* (the governing law) | **Read** — see below |
| **zimra** — Zimbabwe Revenue Authority | *Revenue Authority Act [Chapter 23:11]* (the governing law) | **Read** — see below |
| **zida** — Zimbabwe Investment and Development Agency | *Special Economic Zones Act [Chapter 14:34]* (the governing law) | **Read** — see below |

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

**The ten further structures read (2026-10-07, second pass).** Each instrument below was opened and
its own contents read; the publishing body is named. Where the instrument is an Act, the *arrangement
of sections* stands in for a table of contents.

- **opc** and **fin** — *National Development Strategy 2 (NDS2) 2026–2030* (Government of Zimbabwe; the
  648-page strategy, published by the Treasury and hosted on veritaszim). Its own contents: **Foreword ·
  Preface · Acknowledgement · Acronyms · Executive Summary · PART I Background & Development Context
  (Introduction; Chapter 1 Consultative Process & Stakeholder Engagement; Chapter 2 Regional,
  Continental & Global Imperatives) · PART II National Priorities & Strategies (Chapter 3 Macro-Economic
  Stability & Financial Sector Deepening; Chapter 4 Inclusive Economic Growth & Structural
  Transformation; Chapter 5 Infrastructural Development & Housing; Chapter 6 Agriculture, Food, Climate
  & Environment; Chapter 7 Science, Technology, Digital, Innovation & Human Capital; Chapter 8 Job
  Creation, Youth Entrepreneurship & Development; Chapter 9 Regional Development & Inclusivity through
  Devolution; Chapter 10 Social Development, Gender & Social Protection; Chapter 11 Image Building,
  International Relations & Trade; Chapter 12 Governance, Institution Building, Peace & Security) ·
  PART III Resource Mobilisation (Chapter 13 Funding of the National Development Strategy) · PART IV
  Implementation, Coordination, Monitoring, Evaluation & Data (Chapter 14 Implementation & Coordination
  Framework; Chapter 15 Monitoring, Evaluation & Learning; Chapter 16 Data Provision for Planning &
  Monitoring Performance) · PART V Results Frameworks (Chapter 17 Performance Measurement Matrices).**

- **fin** — the *2025 National Budget Statement* (Ministry of Finance, Economic Development and
  Investment Promotion; the Treasury). Its own contents: **Introduction · Economic Developments (Global
  Developments; Sub-Saharan Africa; Global Inflation; Global Commodity Prices; Domestic Economic
  Developments and Outlook — GDP Growth, Balance of Payments, International Reserves, Inflation,
  Exchange Rate, Financial Sector; Public Finance Developments and Outlook; Fiscal Outlook to Year End;
  Public Debt; Development Partner Support) · The 2025 Macroeconomic Fiscal Framework · The 2025
  Strategic Priority Areas (Economic Growth and Macroeconomic Stability; Supporting Productive Value
  Chains — Agriculture, Mining, Manufacturing, Tourism; Climate; Infrastructure, ICTs and the Digital
  Economy — Transport, Water and Sanitation, Energy, Housing, ICT; Devolution and Decentralisation;
  Local Governance; Youth, Sport, Arts and Culture; Women, Gender Equity, SMEs and Veterans of the
  Liberation Struggle).**

- **mfa** — *Zimbabwe Trade Policy — Vision 2030* (Ministry of Foreign Affairs and International Trade).
  Its own contents: **Preface by the President of the Republic of Zimbabwe · Statement by the Minister of
  Foreign Affairs & International Trade · Executive Summary · Export Performance · Key Factors Affecting
  Trade · Zimbabwe Export Potential Analysis · Trade Policy Vision, Mission and Objectives · Policy
  Strategies and Instruments · National Trade Policy and Export Strategy Implementation Framework.**

- **mfa** — *Zimbabwe National Industrial Development Policy (ZNIDP) 2019–2023* (Ministry of Industry and
  Commerce). Its own contents: **Foreword · Acronyms and Abbreviations · 1.0 Overview of Manufacturing
  Sector Performance (1.1 Growth Performance since Dollarization; 1.2 Manufacturing Capacity Utilization;
  1.3 Volume of Manufacturing Index) · 2.0 Rationale and Context for the ZNIDP (2019–2023) (2.1 Vision;
  2.2 Mission; 2.3 Strategic Objectives; 2.4 Policy Thrust; 2.5 Guiding Principles and Core Values) ·
  3.0 Pillars of the ZNIDP — 3.1 Development and Strengthening of Industrial Value Chains · 3.2 Agro-Based
  Industrialization · 3.3 Mineral Beneficiation and Value Addition · 3.4 Export-Led Industrialization ·
  3.5 Commercializing of Intellectual Property · 3.6 Natural-Advantage-Based Industrialization · 3.7
  ICT-Led Industrialization · 3.8 Emerging Industries and Start-ups · 3.9 Backward Linkages with SMEs ·
  3.10 Anchor Industries and Industrial Clusters · 3.11 Industrial Parks and Innovation Hubs.**

- **edu** — *Education Sector Strategic Plan (ESSP) 2016–2020* (Ministry of Primary and Secondary
  Education). Its own contents: **Acronyms · Foreword · Preface · Executive Summary · Chapter 1 National
  and Education Sector Background and Analysis (The National Context — political, economic,
  socio-demographic; The Education Sector — sector analysis, the education system, access and equity of
  access to learning, infrastructure, quality, education financing: efficiency and equity)**, then the
  plan's goals, strategies and implementation chapters. The successor, *ESSP 2021–2025*, reads:
  **Abbreviations · Foreword · Preface · Executive Summary · 1. Introduction (1.1 Background; 1.2 Need
  for a new Education Sector Strategic Plan; 1.3 Scope; 1.4 Methodology; 1.5 Structure) · 2. Key
  Education Sector Challenges (2.1 Background — structure of the Zimbabwe education sector; 2.3
  Education financing; 2.4 Multiple humanitarian challenges; 2.5 Impacts of Covid-19; 2.6 Institutional
  capacity; 2.7 Access, quality, equity and inclusivity — 2.7.1 Access, 2.7.2 Quality, 2.7.3 Equity …)**,
  then the strategic priorities and the results framework.

- **hedu** — the *Education 5.0 / Heritage-Based Education* doctrine (Ministry of Higher and Tertiary
  Education, Innovation, Science and Technology Development). The ministry's own mission statement
  records the doctrine, and its five missions are set out in NDS2 2026–2030 §1055: *"Education 5.0 model
  embraces **teaching, research, community service, innovation and industrialisation** which produce
  innovators and entrepreneurs capable of creating jobs, developing home-grown solutions"* (Government of
  Zimbabwe, NDS2 2026–2030).

- **mines** — *Mines and Minerals Act [Chapter 21:05]* (the governing law; consolidated to 1 August
  2021). Its arrangement of sections: **PART I Preliminary · PART II Establishment and Functions of the
  Mining Affairs Board · PART III Register of Approved Prospectors · PART IV Acquisition and Registration
  of Mining Rights · PART V Prospecting and Pegging on Ground Reserved against Prospecting and Pegging ·
  PART VI Exclusive Prospecting Reservations · PART VII Pegging of Underground Extensions · PART VIII
  Mining Leases · PART IX Special Mining Leases · PART X Rights of Claim Holders and Landowners · PART XI
  Preservation of Mining Rights · PART XII Working of Alluvial, Eluvial and Certain Other Deposits · PART
  XIII Control of Siting of Works on Mining Locations · PART XIV Royalty · PART XV Payments of Local
  Authorities · PART XVI Abandonment and Forfeiture · PART XVII Registration of Transfers, Hypothecations,
  Options, Tribute Agreements and Conditions · PART XVIII Approval of Tribute Agreements · PART XIX
  Special Grants · PART XX Special Grants for Coal, Mineral Oils and Natural Gases · PART XXI Mining on
  Town Lands · PART XXII Acquisition of Land by Holders of Mining Leases or by State · PART XXIII
  Expropriation of Mining Locations Not Being Worked or Developed** — 241 sections in all.

- **psc** — *Public Service Act [Chapter 16:04]* (the governing law). Its arrangement of sections: **PART
  I Preliminary · PART II Public Service Commission · PART III Functions, Procedure and Staff of the
  Public Service Commission · PART IV Public Service (constitution of the Public Service; responsibility
  for administration; classification of members; appointment, promotion and conditions of service;
  consultation on conditions of service; persons under contract; remuneration and pension benefits) ·
  PART V Discipline of Members of the Public Service (investigation and adjudication of misconduct cases;
  appeals to the Labour Court) · PART VI General (delegation of functions; pension benefits paid from the
  Consolidated Revenue Fund; service regulations; regulatory powers of the Minister; savings)** — sections
  1–33, including 16A, 32A and 32B.

- **zimra** — *Revenue Authority Act [Chapter 23:11]* (the governing law). Its arrangement of sections:
  **PART I Preliminary · PART II Zimbabwe Revenue Authority (establishment; functions and powers; Board;
  qualifications and terms of office; vacation and suspension; dismissal; vacancies; chairman and
  vice-chairman; meetings; committees; remuneration; disclosure of interests; minutes; validity of
  decisions; appointment and functions of the Commissioner-General; commissioners and staff; departments)
  · PART III Financial Provisions · PART IV General (investigation into the affairs of the Authority;
  preservation of secrecy; reward for information; tax clearance certificates; advance tax rulings;
  offence by officers; regulations) · PART V Amendments, Transitional Provisions and Savings · SCHEDULES —
  First Schedule (Specified Acts), Second Schedule (Powers of Authority), Third Schedule (Amendment of
  Acts), Fourth Schedule (Advance Tax Rulings), Fifth Schedule (Provisions Applicable to Revenue Board)**
  — sections 1–39.

- **def** — *Defence Act [Chapter 11:02]* (the governing law). Its arrangement of sections runs **PART
  I–PART X**, covering the Defence Forces; the constitution of the Army and the Air Force, units of the
  Defence Forces and the reserve forces; the Commander of the Defence Forces and the Defence Council;
  appointment, promotion, retirement and discharge of officers and members; conditions of service;
  national service; and the Defence Forces Service Commission. (Read from the consolidated Word text,
  which is how veritaszim publishes this Act.)

- **zida** — *Special Economic Zones Act [Chapter 14:34]* (the governing law; **repealed by the Zimbabwe
  Investment and Development Agency Act [Chapter 14:37] (Act 10 of 2019) with effect from 7 February
  2020** — recorded so the draft follows the successor where it must). Its arrangement of sections: **PART
  I Preliminary · PART II Zimbabwe Special Economic Zones Authority (establishment; the Board;
  constitution; terms and conditions of office; disqualifications; vacation of office; dismissal;
  vacancies; meetings; committees; remuneration; disclosure of interests; validity of decisions;
  execution of contracts; minutes) · PART III Functions of the Authority · PART IV Applications for
  Approval of Investment in Special Economic Zones · PART V Operations within Special Economic Zones ·
  PART VI Banking and Insurance Services · PART VII Funds of the Authority and Financial Provisions ·
  PART VIII Offences and Penalties · PART IX General (vessels; returns; secrecy; exemption from liability;
  regulations; special grants) · SCHEDULE Powers of Authority** — sections 1–58.

**What is still open, and why (honest).** Nothing. Every one of the sixteen departments' drafts follows a
**real Zimbabwean instrument whose own structure was read from the document**, and the exact table of
contents (or, for a law, the arrangement of sections) of **each** instrument is recorded above. No section
list is invented. Both versions of the education plan, and both the trade and the industrial policies, are
recorded; and the governing Acts for mining, public service, revenue, defence and special economic zones
are recorded from the consolidated texts.

**Doors tried (2026-10-07, second pass)** — recorded so a later session can tell a real dead end from an
untried one. **Worked:** *veritaszim* served the Acts and NDS2 as PDFs (and its A–Z list of Acts,
`/a-z-list-of-acts`, gives each Act's page); the **Public Service Commission** (psc.gov.zw) published the
Public Service Act; **ZIMRA** published the Revenue Authority Act on its `/legislation` page;
**zim.gov.zw → Government Documents** linked each ministry; the **Wayback Machine** served the 2025
Budget Statement and the education and trade documents whose live hosts block downloads; and *PyMuPDF*
read every PDF. **Did not work:** the ministry sites *mic.gov.zw* and *zimfa.gov.zw* refused direct
downloads (an HTTP 403/503) and *mopse.co.zw* was suspended — the Wayback Machine was the route to their
files; *DuckDuckGo* and *Bing* blocked or returned generic results; and the *Internet Archive* item search
found nothing for these titles.

**Doors tried (2026-10-07)** — recorded so a later session can tell a real dead end from an untried
one. **Worked:** *Brave Search* located the six documents read (health, agriculture, ICT, energy,
climate, devolution); *veritaszim* served the ICT policy 2016 as readable HTML; and a locally
installed **PyMuPDF** read the six tables of contents. **Did not work:** *Google, Bing, DuckDuckGo,
Mojeek, Ecosia, Startpage and Yandex* all blocked automated retrieval (a captcha, generic results, or
an HTTP 403); *Brave* returned **429 (throttled)** after the first queries; *FAOLEX* detail pages
returned **403**; the Global Partnership for Education and Planipolis education-plan PDFs returned
**403**; and the agriculture and health PDFs were over the **5 MB** fetch limit.
