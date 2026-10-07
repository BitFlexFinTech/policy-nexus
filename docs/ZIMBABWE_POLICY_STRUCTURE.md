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
draft should follow was searched for on the open web. Where the document could be **opened and
read**, its structure is recorded below. Where it exists only as a **PDF this machine's tools
cannot read** (the fetch tool returns the raw file, not its words — see *Doors tried* below), the
document is **named** and the draft uses the **verified national skeleton** above. A section list is
never invented.

| Department | The real national document (publisher · period) | Structure read? |
|---|---|---|
| **opc** — Office of the President and Cabinet | *National Development Strategy 2 (2026–2030)* (Government of Zimbabwe) — the plan every sector policy aligns to | Named (already a cited instrument) |
| **ict** — Ministry of ICT, Postal and Courier Services | *Zimbabwe National Policy for Information and Communication Technology (ICT) 2016*; with *National ICT Policy 2022–2027* and the *National AI Strategy* | **Read** — see §ICT below |
| **fin** — Ministry of Finance, Economic Development and Investment Promotion | *National Development Strategy 2 (2026–2030)* and the annual *National Budget Statement* (the Treasury) | Named |
| **agri** — Ministry of Lands, Agriculture, Fisheries, Water and Rural Development | *National Agriculture Policy Framework (NAPF) 2019–2030* | **Read** — nine pillars, see §agri below |
| **health** — Ministry of Health and Child Care | *National Health Strategy 2021–2025* | Named |
| **edu** — Ministry of Primary and Secondary Education | *Education Sector Strategic Plan (ESSP) 2016–2020* and *ESSP 2021–2025* | Named |
| **hedu** — Ministry of Higher and Tertiary Education, Innovation, Science and Technology Development | *Education 5.0 / Heritage-Based Education* doctrine | Named |
| **mines** — Ministry of Mines and Mining Development | *Mines and Minerals Act [Chapter 21:05]* (the governing law) | Named |
| **energy** — Ministry of Energy and Power Development | *National Energy Policy 2012* and *National Renewable Energy Policy 2019* | Named |
| **psc** — Public Service Commission | *Public Service Act* (the governing law) | Named |
| **lg** — Ministry of Local Government and Public Works | *Devolution and Decentralisation Policy 2019* | Named |
| **mfa** — Ministry of Foreign Affairs and International Trade | *National Trade Policy 2019–2023* and *National Industrial Development Policy 2019–2023* | Named |
| **env** — Ministry of Environment, Climate and Wildlife | *National Environmental Policy and Strategies 2009*; *National Climate Policy 2017*; *National Climate Change Response Strategy 2014* | Named |
| **def** — Ministry of Defence and War Veterans Affairs | *Defence Act* (the governing law) | Named |
| **zimra** — Zimbabwe Revenue Authority | *Revenue Authority Act [Chapter 23:11]* (the governing law) | Named |
| **zida** — Zimbabwe Investment and Development Agency | *Special Economic Zones Act [Chapter 14:34]* (the governing law) | Named |

**§ICT — the one full structure read.** The *Zimbabwe National Policy for ICT 2016* (read in full at
veritaszim) carries the policy's own areas in this order: **Institutional Framework · Legal and
Regulatory Framework · Universal Access and Service to ICTs · National Broadband Plan · Management
of National Resources (spectrum, satellite orbits, numbering and naming) · Broad-Based
Entrepreneurship and Innovation (local content) · Empowerment and Indigenisation for Service
Providers and Vendors · Incentives to Attract Foreign Investors · ICT Sector Competitiveness and
Viability · Infrastructure Sharing · Human Resource Skills, Capacity Building and Research.**

**§agri — the substance chapter read.** The *National Agriculture Policy Framework (NAPF)
2019–2030* states its substance as **nine pillars** (recorded by the FAO in its FAOLEX index):
**1 Food and Nutrition Security and Resilience · 2 Agricultural Knowledge, Technology and
Innovation System · 3 Production and Supply of Agricultural Inputs · 4 Development of Agricultural
Infrastructure · 5 Agricultural Marketing and Trade Development · 6 Agricultural Finance and
Credit · 7 Access, Tenure Security and Land Administration · 8 Resilient and Sustainable
Agriculture · 9 Institutional Arrangement for Policy Implementation.** This is exactly the
"measures / priority areas / pillars" chapter the national skeleton describes — and it confirms
that a real policy puts most of its substance there.

**What is still open, and why (honest).** The **exact table of contents** of the other fourteen
documents is not recorded, because none could be opened: each exists only as a **PDF**, and this
machine's tools cannot read a PDF's words — the fetch tool returns the raw file (verified on the
ICT policy 2016 PDF), refuses a file over the 5 MB limit (the health strategy), or times out on a
14 MB file (the agriculture framework); and local extraction fails because the PDFs embed **subset
fonts with custom character maps** (verified on the ICT and renewable-energy PDFs). Those drafts
therefore follow the **verified national skeleton** above. Capturing the exact section lists needs
either a machine with a PDF reader or an assistant tool that extracts PDF text.

**Doors tried (2026-10-07)** — recorded so a later session can tell a real dead end from an untried
one. **Worked:** *Brave Search* located the health strategy, the agriculture framework, the ICT
policies, the education sector plans, the energy policies, the climate policies, the devolution
policy and the higher-education doctrine; *veritaszim* served the ICT policy 2016 as readable HTML.
**Did not work:** *Google, Bing, DuckDuckGo, Mojeek, Ecosia, Startpage and Yandex* all blocked
automated retrieval (a captcha, generic results, or an HTTP 403); *FAOLEX* detail pages returned
**403** and its policy PDFs were **over the 5 MB fetch limit** or refused.
