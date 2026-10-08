# PROPOSAL_PROMPT.md — the copy-and-paste prompt for Claude

**What this is.** A self-contained brief to paste into Claude (claude.ai, Projects, or the API) to
produce the **three** documents that take the Zimbabwe AI Policy Intelligence Initiative from a
working demonstration to an approved pilot: **the funding memo (2 pages), the pitch deck
(10–12 slides) and the one-page ask.**

**Why three, and not a heavier pack.** The agreed scope is deliberately small — three documents a
busy reader will actually finish. A separate **legal instrument**, a separate **procurement paper**,
a ministry **governance annex** and a **full sources register** were each considered and dropped:
the legal and procurement positions become **one short paragraph each inside the memo**, a short
**named-source statement** replaces the sources register, and a full Treasury business case is
**post-funding** work if it is ever asked for. Those are decisions, not gaps. (The scope decision is
recorded in `PROJECT_STATUS.md`, Phase AB.)

**Why it is a separate document and not part of the platform.** Research done in Phase AA found that,
in Commonwealth practice, approval is decided from a memorandum and a business case — not from a
website — and that a Minister's briefing is short, rigidly structured and carries a recommendation.
The platform is the **evidence and the demonstration**; the paperwork is separate. That is why the
landing page deliberately does not read as a proposal.

**What the person pasting it must supply.** Costs, the legal basis, the approval route and the exact
ask are **not** in this repository anywhere. The prompt tells Claude to mark every one of them as an
assumption or a question rather than invent them.

---

## COPY EVERYTHING BELOW THIS LINE INTO CLAUDE

### Your role

You are a senior policy and legal adviser to a Zimbabwean government ministry, working with a
technical team. You write for a **Cabinet Minister** as the first reader and for **Cabinet
colleagues, Treasury and the Public Service Commission** as the deciding readers. Your job is to
turn a working technical demonstration into the three documents needed to have it **approved,
funded and hosted**.

### Who the documents are addressed to — the four addressees

Submit the three documents, together, to **four named readers**. Address the documents to all four;
do not drop one, and do not add a fifth.

1. **Hon. Tatenda A. Mavetera, MP** — Minister of Information Communication Technology, Postal and
   Courier Services.
2. **Dr. Gibson Chigumira** — Executive Director, **ZEPARI**, the Zimbabwe Economic Policy Analysis
   and Research Institute.
3. **Dr. Jesimen Chipika** — Deputy Governor of the **Reserve Bank of Zimbabwe**, and Chairperson of
   the **ZEPARI Board of Trustees**.
4. **The ZEPARI Board of Trustees** — including the seats held by the **Chamber of Mines of
   Zimbabwe** and the **Confederation of Zimbabwe Industries (CZI)**.

**What is proposed to them, stated once.** Oreida Pvt Ltd seeks to **partner with ZEPARI and the
Ministry of ICT** to take a working policy-simulation demonstration to an approved, funded,
Ministry-hosted pilot. The Ministry is asked to **host** the pilot and to **endorse the platform as
a pilot for the Digitalize Zimbabwe initiative**. ZEPARI is asked to **partner on the evidence base
and the methods** and to **endorse the platform as a pilot for ZEPARI's evidence-based policy work**.
**Neither endorsement is held today, and both are part of the ask.**

### The context in one paragraph

A fully working, browser-based policy assessment platform has already been built and deployed. Its
purpose is to let a government department test a draft policy against a simulated population before
the policy is implemented, and to produce structured findings for human review. It is **not** a
concept, a mock-up or a slideware promise — it runs today in an ordinary web browser and makes **no
network request at all**, and it is the proof of concept for a proposed national capability: the
**Zimbabwe AI Policy Intelligence Initiative**, championed by the **Minister of Information
Communication Technology, Postal and Courier Services, Hon. Tatenda A. Mavetera, MP**, and
delivered on the **Nzwisiso AI™** platform. **The proposal is made jointly to the Ministry of ICT
and to ZEPARI:** Oreida Pvt Ltd seeks to partner with both — the Ministry to host the pilot inside
Government, and ZEPARI to partner on the evidence base and to endorse the platform for its
evidence-based policy work. It is reachable today at a demonstration address; moving it onto
Government infrastructure is one of the build items this memo asks to fund. **Do not state or imply
that it already runs on Government infrastructure or in the Government estate.**


### What already exists — treat every line below as a verified fact, and do not inflate it

- **A working platform**, built and deployed, used in a web browser. No installation on a
  department's machines, and no server is needed to demonstrate it.
- **Coverage of 16 government institutions**: Office of the President and Cabinet; Ministry of
  Finance, Economic Development and Investment Promotion; Ministry of Lands, Agriculture and Water;
  Ministry of Health and Child Care; Ministry of Primary and Secondary Education; Ministry of Higher
  and Tertiary Education, Innovation, Science and Technology Development; Ministry of Information
  Communication Technology, Postal and Courier Services; Ministry of Mines and Mining Development;
  Ministry of Energy and Power Development; Public Service Commission; Ministry of Local Government
  and Public Works; Ministry of Foreign Affairs and International Trade; Ministry of Environment,
  Climate and Wildlife; Ministry of Defence and War Veterans Affairs; Zimbabwe Revenue Authority;
  Zimbabwe Investment and Development Agency.
- **150 modelled stakeholder groups** — civil servants; urban and rural households; informal traders
  and transporters; informal-sector workers; cross-border traders; formal business; manufacturers;
  mining operators and artisanal small-scale miners; smallholder farmers; the diaspora; youth;
  women; women-led enterprises; pensioners; the financial sector; exporters; local authorities;
  development partners; health workers; educators; researchers and technical professionals;
  traditional leaders; faith-based organisations; trade unions; employer federations; cooperatives;
  the media and broadcasting; tourism operators; transport operators; energy and water utilities;
  ICT and network operators; communities living by protected areas; persons with disabilities;
  war veterans and their dependants; parliament and legislators; the judiciary and the courts;
  small and medium enterprises; farmer unions and commodity associations; mining host communities;
  fishing communities; refugees, migrants and returnees; professional regulatory councils; tertiary
  students; water user associations; village savings and loan groups; commuter transport
  associations; traditional healers; youth councils and organisations; cross-border labour
  migrants; informal settlement residents; urban ratepayers; rural district councils; religious
  leaders; teachers' unions; nurses and health worker associations; horticulture growers;
  livestock producers; timber and forestry operators; wildlife conservancies; safari and hunting
  operators; hospitality and hoteliers; aviation operators; freight and logistics operators;
  fintech and mobile money providers; microfinance institutions; the insurance sector;
  construction contractors; pharmaceutical manufacturers and distributors; medical aid societies;
  private and independent schools; grain millers and processors; cotton ginners; sugar producers;
  dairy producers; poultry producers; aquaculture and fish farmers; beekeepers and honey producers;
  seed and input suppliers; agro-processors; tobacco merchants and contractors; cement and
  building-material producers; food and beverage manufacturers; textile and clothing producers;
  leather and footwear producers; chemical and plastics producers; furniture and woodwork
  producers; printing and publishing firms; engineering and metal-fabrication firms; coal
  producers; fuel retailers and depots; LPG distributors; solar installers and technicians; mine
  equipment suppliers; smelters and refineries; mineral dealers and buyers; diamond sector
  operators; pension fund administrators; insurance brokers; stockbrokers and securities dealers;
  asset managers; bureaux de change operators; mobile money agents; building societies; savings and
  credit cooperatives; micro-insurers; customs clearing and forwarding agents; commuter omnibus
  operators; haulage and long-distance operators; taxi associations; shipping and port agents;
  warehousing and storage operators; courier and express firms; drivers' associations; rail freight
  users; tour operators; travel agents; hoteliers and lodges; restaurants and caterers; creative
  and cultural industries; musicians and performers; film and television producers; software
  developers; internet service providers; telecom tower companies; data-centre operators;
  cybersecurity firms; e-commerce platforms; digital marketing firms; journalists and editors;
  community radio stations; advertising agencies; public-relations firms; online content creators;
  private clinics and surgeries; pharmacists and dispensers; medical laboratory technologists;
  radiographers and imaging staff; ambulance and emergency services; community caregivers; rural
  teachers; urban teachers; school heads and administrators; parents' and school associations;
  early-childhood caregivers; TVET instructors; polytechnic lecturers; apprentices and trainees;
  and quantity surveyors. **20 of the 150 stand on a published national share**, each
  naming the figure it stands for and the publication it came from; the remaining **130 are
  explicitly labelled `Modelled`**, because no published count exists. Each department models the
  **40** groups its own mandate covers, drawn from these 150.
- **510 reference indicators** across those 16 institutions, each with a plain note and a **stated
  basis**: **275 are published figures**, each naming its publisher, its publication and its period,
  and **235 are explicitly labelled `Modelled`**, because no publisher publishes that return. Say it
  exactly that way. They are coverage, not evidence of outcomes or savings.
- **48 prepared policy drafts** — three per institution — ready to be run today, so a demonstration
  needs no preparation by the department being shown.
- **49 reference documents** and **64 stated institutional priorities** held in the same
  configuration. Each document entry cites a **real, verified instrument** — a named Act, Statutory
  Instrument, policy or strategy, with a chapter number only where the official consolidated index
  confirms one. **The platform holds the register and the citations, not the document files**: say
  so plainly, and never present an entry as though the file itself were held.
- **A complete officer journey that works end to end**: choose a department → upload or paste a
  policy draft → run the simulation → watch the modelled population and its relationships build up
  live → read an executive summary, a long-form report and a full assessment → export to PDF, Word
  or print → generate an editable **drafted policy** from the run.
- **Reproducibility is a design property, not a claim**: the same department and the same policy
  text always produce a byte-identical result. There is no randomness and no clock in the result,
  which is what makes a finding defensible in a meeting.
- **The assessment runs entirely in the reader's own browser.** The demonstration build makes **no
  network request at all** — no external AI service is called, no document text leaves the machine,
  and no third-party script is loaded. That is what makes it **sovereign in operation**: nothing is
  sent anywhere to be processed. It is also why the platform can be moved onto Government
  infrastructure without being rebuilt — so the memo should **ask for that move**, not assert that
  it has already happened. This is verifiable, and it is the platform's strongest governance
  property.
- **Every run models a population of 2,000–3,200 simulated agents**, drawn as the relationships
  between the modelled groups. The platform states plainly what each drawn mark represents rather
  than overstating the picture, and it should keep doing so.
- **The governance boundary is built into the product**: the platform states, word for word, that
  *"the platform does not replace policymakers or determine policy outcomes"* and that it provides
  *"an additional analytical lens to support informed human judgement"*. Every generated document
  carries a decision-support disclaimer. **Do not soften these lines and do not contradict them.**

### The national programme this belongs to — "Digitalize Zimbabwe" (verified facts)

Use these facts and **no others**. Do not add detail about the programme that is not written here,
and do not rename it. The spelling the Government uses is **"Digitalize Zimbabwe"**.

- **Digitalize Zimbabwe is a real, named initiative of the Ministry of Information Communication
  Technology, Postal and Courier Services.** It was launched by the Minister of that ministry,
  **Hon. Tatenda A. Mavetera, MP**, at **Domboshava** in **April 2024**, together with the
  ministry's Permanent Secretary. Its stated horizon is **2030** — internet access and personal
  computers for citizens, young people first.
- Two things were unveiled at that launch: the **Digitalize Zimbabwe Magazine** and the
  **Presidential Internet Scheme**.
- The ministry has stated that its digitalisation drive sits inside the **Zimbabwe National ICT
  Policy 2022–2027** framework, and it names five workstreams: expanding digital infrastructure;
  affordable devices with rural areas first; **e-Government** services — its own examples are
  e-tax filing, e-health and e-payment systems; digital literacy training with schools, colleges
  and private partners; and innovation and entrepreneurship through technology hubs and funding
  programmes. It works with **Econet, NetOne and Telecel** on affordable devices and coverage.
- In **April 2025, Cabinet approved implementation of the Presidential Internet Scheme**: reliable
  broadband to **all 2,400 administrative wards**, using low-earth-orbit satellite and fibre,
  reaching **schools, information centres, police stations, health institutions, traditional
  leaders' homesteads, agriculture extension offices and courts**. It is grounded in the
  **Digital Economy thematic area of the National Development Strategy 1 (NDS1)**.
- Progress since: **8,000 Starlink kits** for schools and a **free public Wi-Fi programme**
  (January 2026). The work is now framed under **NDS2 (2026–2030)** and **Vision 2030**, and the
  Government states it is **"committed to full digitalisation by 2030"**.
- In **June 2026 the Government launched the National Artificial Intelligence Strategy** at an
  event in Harare themed **"AI for Impact"**, alongside an **AI Grand Challenge** for young
  innovators. The strategy's named priority sectors are **healthcare, agriculture, education and
  financial inclusion**, and it commits to AI that reflects **Zimbabwe's linguistic and cultural
  diversity**. A **National Cybersecurity Strategy** was finalised at the same time.
- The programme also runs **Digitalize Zimbabwe Expos** in the provinces — for example the
  **Manicaland Expo in June 2025**.

**Why this platform is the natural pilot for that programme — the only claim you may make:**

- The Government has already decided *that* Zimbabwe will digitalise public administration, and the
  **National AI Strategy (June 2026)** sets the direction. What does not yet exist is a **working,
  sovereign example that the Ministry itself hosts**. Nzwisiso AI™ is exactly that, one step short:
  it is not a concept or a mock-up, it runs today in a browser, it makes **no network request at
  all**, and hosting it inside the Ministry is a small, named step — not a rebuild.
- It answers the AI Strategy's own criteria in one product: applied AI in a public service
  (policy assessment), reproducible and reviewable, and keeping **every policy text and every
  result inside national custody** — the sovereignty property the programme is built on.
- It is a **delivery-against-existing-commitments** proposal, not a new programme: it needs no new
  national infrastructure to start, because the demonstration runs in a browser on machines
  departments already own.
- It is the right **size** for a pilot: one institution, one policy question, one run, with the
  result reviewable by a person — which is how a national capability can be assessed before any
  national rollout is committed to.

**Never claim** that the Government, the Ministry, ZEPARI or the Digitalize Zimbabwe programme has
endorsed, approved, funded or adopted this platform, or that it is an official digitalisation
project. The correct framing, everywhere, is: **"proposed as a pilot for the Digitalize Zimbabwe
initiative, in partnership with ZEPARI"** — a proposal put to the programme's and the institute's
owners, not a statement of their decision.

### The research partner — ZEPARI (verified facts)

Use these facts and **no others**. Do not add detail about ZEPARI that is not written here, and do
not rename or re-style it.

- **ZEPARI** is the **Zimbabwe Economic Policy Analysis and Research Institute** — an **autonomous
  economic policy analysis and research think-tank, established in 2003 by a Deed of Trust** (from
  its own site, `zepari.co.zw`).
- Its stated mission is to **conduct applied economic policy analysis, research and capacity
  building** to promote a culture of **evidence-based policy making** in Zimbabwe, and to inform the
  investing public. It publishes **research studies, policy briefs and an economic barometer**, and
  works through **research, capacity building and consultancy**.
- The leadership named in this proposal: **Dr. Gibson Chigumira** (Executive Director) and
  **Dr. Jesimen Chipika** (Chairperson of the Board of Trustees; also Deputy Governor of the Reserve
  Bank of Zimbabwe).
- **Why ZEPARI is the natural research partner — the only claim you may make:** ZEPARI's mandate is
  exactly the evidence base this platform consumes — it is the institution whose business is
  **evidence-based policy analysis**. Partnering with ZEPARI gives the pilot an **independent
  research owner** for the evidence and the methods, while the Ministry hosts the capability. Do
  **not** claim any relationship with ZEPARI beyond what is being proposed, and do not claim that
  ZEPARI has endorsed, approved or partnered with this platform.

### What you must NOT claim — the honesty rails

1. **This is scenario mode.** The current build models stakeholder responses deterministically. It
   is a structured, reproducible scenario analysis — **not** a prediction of public opinion, market
   outcomes or administrative results, and never "the AI decided".
2. **No external AI service is used, and none is needed for the demonstration.** Do not write as
   though a cloud AI subscription is the core of the proposal.
3. **No real credentials are configured yet.** Sign-in is a one-click demonstration entry, not
   Government SSO. PDF/DOCX text extraction on a server, and server-side identity verification, are
   specified but not yet built. Say so where it matters, and put them first in the implementation
   plan.
4. **The figures above are platform coverage, not outcomes.** 16 institutions and 63 indicators are
   what the platform holds. They are not evidence of savings, and must not be presented as such.
5. **Mark what you do not know.** Every cost, legal basis, procurement route and date you produce
   must be labelled `[ASSUMPTION — to be confirmed]` or `[QUESTION — needs a decision]`. A proposal
   with visible gaps is trustworthy; invented precision destroys the whole case.
6. **Do not invent anything about Digitalize Zimbabwe.** Every fact you use about the programme is
   in the section above and nowhere else. If you need a detail that is not there — the programme's
   budget, its owning office, its internal approval route, whether it has an open pilot intake —
   write it as a `[QUESTION — needs a decision]` and list it under "What we could not confirm".
   **Never** state or imply that the programme has endorsed this platform.

### The three documents, and the exact shape each must take

Produce all three, in this order, as one document with clear part headings.

**One rule applies to all three: a funding memo is not a proposal pack.** If a sentence does not
help the Minister decide, cut it. Length is part of the specification here — the memo is two pages,
the deck is 10 to 12 slides, and the ask is one page.

**Part 1 — The funding memo (2 pages, recommendation first).**
This is the document a Minister actually reads, so it is **two pages and no longer**, written the
way a ministerial briefing is written: short, structured, numbered paragraphs, neutral in tone, and
**carrying a recommendation**. Sections, in this order, each one kept as short as the memo can
afford:
1. **Recommendation** — what is being asked for, in three sentences, at the very top: approve the
   pilot; **endorse it for Digitalize Zimbabwe** and **partner with and endorse it for ZEPARI**; fund
   the three build steps; and host it in the Ministry.
2. **Background** — what the platform is, and that it already exists and works.
3. **The problem it addresses** — policies are implemented without a structured way to examine
   likely stakeholder responses first; the cost of that is discovered after implementation.
4. **What has already been delivered** — the verified facts above, stated plainly and without
   inflation, including that it runs in a browser with no network request and is **not yet on
   Government infrastructure**.
5. **The pilot case — Digitalize Zimbabwe.** One short section arguing the fit, in the programme's
   own terms. State what Digitalize Zimbabwe is using **only** the verified facts above; name the
   programme's own workstreams this platform delivers against (services delivered digitally,
   information held programmatically, no external service, reproducible results); and state plainly
   that what is proposed is a **pilot** — one institution, assessed on its results, before any
   national rollout is committed to. Quote the programme's own wording where the facts above supply
   it: *"committed to full digitalisation by 2030"*, the National AI Strategy's four named priority
   sectors, and the Presidential Internet Scheme's **2,400 wards**. Then state, in one or two
   sentences, the **ZEPARI research partnership** (using only the ZEPARI facts above): ZEPARI is
   asked to partner on the evidence base and the methods, and to endorse the platform as a pilot for
   its evidence-based policy work. **Close with the boundary**: this is a proposal put to the
   programme's and the institute's owners, not an announcement of their decision.
6. **Governance and legal position, in one paragraph.** The platform informs; a human decides. Every
   result is reproducible and reviewable, no document text leaves the machine, and every generated
   document carries the decision-support disclaimer. State that **a legal instrument would be
   drafted only after approval** — do not annex one.
7. **Procurement, in one paragraph.** Recommend **one** route from: direct procurement under a
   framework; an open tender; a managed service; or phased in-house development with contracted
   expertise. Give the reason in two sentences, and name the approving office as a
   `[QUESTION — needs a decision]` if it is not known. Every threshold and timeline is an
   assumption. Do **not** produce a separate procurement paper.
8. **Financial implications** — a short estimate table, **one-off** costs (the three build items
   below, the pilot study, and any deployment work) separated from **recurring** costs (hosting,
   support, training). Every figure `[ASSUMPTION — to be confirmed]`, none presented as approved. A
   full Treasury business case is **not** part of this memo. **Also state the proposed funding route,
   because no single budget should carry the whole cost** — four named buckets, each matched to what
   it should pay for:
   - **The build** (the three build steps) — the Ministry of ICT, through **Treasury**, or the
     **POTRAZ Universal Service Fund**.
   - **Capacity** (training and the transfer of know-how to officers) — **ZEPARI**, with **ACBF**
     (the African Capacity Building Foundation).
   - **The pilot study** (the one institution, one policy question, one run) — a **development
     partner ZEPARI already works with** — UNDP, the African Development Bank, the World Bank or
     USAID — marked as a `[QUESTION — needs a decision]` until one is named.
   - **The first sector pilot** (applying the tool to one industry) — the **Chamber of Mines of
     Zimbabwe** or the **Confederation of Zimbabwe Industries**.
   Present each as a **proposed** route, not an agreement already in place.
9. **Implementation approach and timeframe** — phased, with the three named build items first
   (server-side document extraction, server-side identity verification, and deployment onto
   Government infrastructure), and the **pilot institution named as the first milestone**.
10. **Risk and mitigation** — including the reputational risk of overclaiming, how the product
    design already mitigates it (the disclaimer, the `Modelled` labels, reproducibility), and the
    *specific* risk of borrowing a national programme's or an institution's name: say plainly that
    the platform holds **no** endorsement from Digitalize Zimbabwe, the Ministry **or ZEPARI**, and
    that obtaining those endorsements is part of what is being asked for.
11. **Consultation** — which offices must be consulted before submission (Treasury, the Public
    Service Commission, the Attorney General's office, the data protection authority), each marked
    as a question if the correct list is not known — plus **the office that owns Digitalize
    Zimbabwe**, marked as a question.

The memo closes with a **"What we could not confirm"** paragraph that names who to ask.

**Part 2 — The pitch deck (10 to 14 slides, outline plus speaker notes).**
It must survive being read *without* a presenter, and it must never claim more than the platform
does. Suggested spine: the problem · what is different here · **why this is the pilot for Digitalize
Zimbabwe** (one slide: what the programme is, in its own words, using only the verified facts above,
**and the line that no endorsement is held and is being asked for**) · **why ZEPARI is the research
partner** (one slide, using only the ZEPARI facts above, **and the same no-endorsement line for
ZEPARI**) · a live demonstration, not a promise · what one run actually produces · the governance
boundary · who it serves first · what has been built already · what approval unlocks · the cost,
marked as estimates · **the proposed funding route** (the four buckets) · the roadmap · the ask (both
endorsements, the funding route, the hosting) · the close. The deck may run to **14 slides** to carry
the ZEPARI partner and the funding route; do not pad it beyond that.

**Speaker notes must say what to click and in what order during a live demonstration**, including
what to do if the network is unavailable.

**Part 3 — The one-page ask.**
One page, unmistakable, and the only page some readers will read: exactly what approval is being
requested, from whom, by when, and what happens if it is granted. **Open it by naming the pilot**:
this platform is put forward as a pilot for the **Digitalize Zimbabwe** initiative **in partnership
with ZEPARI**, and the ask therefore includes **the programme's endorsement, ZEPARI's endorsement
and ZEPARI's research partnership** alongside the funding and the hosting decision. **Address it to
all four addressees.** Separate what is needed **now** from what is needed at each later stage, in a
short table, **and show the four funding buckets** (the build — Ministry/Treasury or the POTRAZ
Universal Service Fund; capacity — ZEPARI/ACBF; the pilot study — a ZEPARI development partner; and
the first sector pilot — the Chamber of Mines or CZI). If the correct approval route is unknown, say
so and list the questions to resolve rather than guessing.
Close with the **named-source statement** in two sentences, and a **"What we could not confirm"**
line naming who to ask.

### The named-source statement (short, and required in the memo and in the ask)

Two to four sentences naming where the platform's figures come from — the national statistics
office, the central bank, and the international publications used — and stating plainly which
figures are published and which are labelled `Modelled`. This replaces a full sources register on
purpose: it must be short enough that a reader actually finishes it.


### Research you must do, and how to handle what you cannot confirm

Before drafting, work out and state the **process**: how a proposal of this kind actually reaches
approval in Zimbabwe — the Cabinet memorandum route, which committee considers it, and what has to
be annexed. Use the Commonwealth convention as your working model where the national rule is not
known: a briefing for a Minister is **one to two pages, rigidly structured**, marked either *"for
information"* or *"for decision"*, and the *for-decision* form **must carry a recommendation**.

**State your uncertainty openly.** Search access may be limited; if you cannot confirm the exact
Zimbabwean format, say so in a short "What we could not confirm" paragraph at the end and list the
questions to put to the Cabinet Office and the ministry's legal desk. That paragraph is required —
do not omit it to look authoritative.

### Tone, length and formatting rules

- Write for a busy, non-technical reader: **short sentences, plain words, real numbers** from the
  fact list above.
- **Never use a technical term without explaining it in the same sentence.** Example of the required
  style: *"a server (a computer that stays switched on and answers requests from the app)"*.
- **No marketing language.** No "revolutionary", "game-changing", "world-class", "cutting-edge",
  "unlock the power of". Government documents persuade by being sober and specific.
- **One word per idea.** Once you have named something, keep using that name.
- British spelling. Zimbabwean English conventions. Currency in USD and ZWG, both marked as
  assumptions if you are converting.
- Number every paragraph in the memo and in the one-page ask, so a reader in a meeting can refer to
  "paragraph 7.3".
- Put every table in a table. Do not describe a table in prose.
- **Fit the stated lengths**: the memo is two pages, the deck is 10 to 14 slides, the ask is one
  page. Length is part of the specification, not a style preference.
- Finish with a **"What we could not confirm"** paragraph that names who to ask.

### Before you hand anything over — run this checklist out loud

1. Does the **recommendation** appear in the first three sentences of the memo?
2. Is every **cost, date, threshold and legal reference** marked as an assumption or a question?
3. Have you avoided every claim on the honesty rails — no prediction, no "the AI decided", no
   outcome attributed to the platform that it does not produce?
4. Does the memo's **governance paragraph** keep the **decision-support boundary** intact — the
   platform informs, a human decides — and does it leave any legal instrument to be drafted *after*
   approval, rather than annexing one?
5. Is the pitch deck readable with **no presenter**, and does its demonstration script say what to
   click, in order?
6. Is there a **"What we could not confirm"** paragraph, and does it name who to ask?
7. Could each of the four addressees read **the memo** and know, within one minute, exactly what is
   being asked of them?
8. Does the memo's **pilot case** name the programme exactly as **"Digitalize Zimbabwe"** and the
   research partner exactly as **"ZEPARI"**, use only the verified facts supplied, and carry the line
   that **no endorsement is held**? If any statement in the pack implies the programme or ZEPARI has
   already adopted the platform, that is a failure — fix it.
9. Do the documents **address all four addressees**, and do the memo, the deck and the ask carry
   **both endorsements** (Digitalize Zimbabwe and ZEPARI) and the **four-bucket funding route**?
10. Are there **exactly three documents** — the memo, the deck and the ask — with **no** separate
    legal instrument, procurement paper, governance annex or sources register?

---

## END OF THE PROMPT

**Notes for you, the person pasting it (not part of the prompt):**

- Add the real figures where you have them: the budget envelope, the ministry's cost-sharing, the
  approval deadline, the number of institutions to prioritise first. The prompt will mark these as
  assumptions if you do not.
- Ask Claude for **one part at a time** if the reply is truncated — the three parts are designed to
  stand alone.
- Keep `PROJECT_STATUS.md` and `PRODUCTION_READINESS.md` for **yourself**, not for the meeting: they
  are the engineering record of exactly what is built and what is still simulated. They are internal
  documents and contain deployment and credential notes, so **do not hand them to the Minister, to
  ZEPARI or to Cabinet**. The document for that room is **Part 1 — the funding memo**.
- **What the live site actually is today (re-checked 2026-10-07, at the end of the evening, after the ZEPARI landing page was given its own status band and the hover picture was moved below the page's chrome).**
  The host `nzwisiso.bitflex.app` serves `assets/index-C6cIFjNj.js`
  (`f104f60ecb5c9227c47cd8b335b4d0d0a99923753221d71e9bce4480a8c07c72`), which is byte-identical to the
  local build, so **the live site is the build published on 2026-10-07** (the platform homepage rebuild — a new `/` homepage with the national story and both tools, the policy-simulation landing moved to `/simulation`, and the centred footer copyright — now opening with a **black-and-gold service bar holding only the two cards, at the very top under the Government header**, the home masthead the flag's black with a gold hairline; the ZEPARI landing page now carries its own status band, worded for the research product) — it shows the **live date and
  time** (read back from the served page in a real browser: "Today 4 October 2026 · 04:20"), carries the newly published indicator figures (275 published / 235 modelled), and it carries the authority line, the modelled
  agent population, the named sources (with the corrected sentence naming both publishers the stakeholder
  shares stand on), the official Coat of Arms, the favicon set, the Nzwisiso.ai
  positioning section, all 275 published figures, and the owner's items 1–11, including reading a
  department's own `.txt`, `.docx` and `.xlsx` documents in the browser, the *Re-run
  simulation* action, the drafting stage, the recommended-step actions that open or send the part of the
  policy that answers each step, the **Implementation pack** (generated and read-only — the form that asked
  an officer to hand-fill the working matrices was removed at the owner's instruction on 2026-10-02), and
  every department modelling **40**
  stakeholder groups. (When
  this was checked on 2026-09-28 the host served
  `assets/index-BeggQU9V.js`, which was
  behind the code; **R7** closed that gap, and later work rebuilt the bundle several times, so the current
  build was published again on 2026-10-02.) **AB-7 is done (2026-09-29)**: this file asks for three
  documents — the memo, the deck and the ask — and `npm run validate` now fails if it ever drifts
  back to the heavier pack.

---

## Research record — the "Digitalize Zimbabwe" facts (kept here so they are never re-researched)

Researched **2026-09-28**. Every fact in the prompt's Digitalize Zimbabwe section comes from one of the
rows below, and nothing is asserted in the prompt that is not in this table. If a fact is not here, it
is not known.

| Verified fact | Source, and the date it carries |
|---|---|
| The initiative's name, and that it was launched by **Hon. Tatenda A. Mavetera, MP** (Minister of ICT, Postal and Courier Services) with the ministry's Permanent Secretary, at **Domboshava**, April 2024; the **2030** horizon; the unveiling of the **Digitalize Zimbabwe Magazine** and the **Presidential Internet Scheme**; the work with **Econet, NetOne and Telecel**; the Domboshava network booster | 263Chat, *"Minister of ICT Launches 'Digitalize Zimbabwe' Initiative in Domboshava"*, **16 April 2024** — `263chat.com/minister-of-ict-launches-digitalize-zimbabwe-initiative-in-domboshava/`. The same report ran on ZimEye, **16 April 2024** |
| The **Zimbabwe National ICT Policy 2022–2027** framework; the five workstreams (infrastructure; affordable devices, rural first; e-Government with e-tax filing, e-health and e-payment named; digital literacy with educational institutions and private partners; innovation and entrepreneurship through technology hubs and funding programmes); the **Digitalize Zimbabwe 2024 Expos** with **Video Promotions Africa** | 263Chat, *"ICT Ministry Launches Ambitious Digitalization Initiative for Rural and Urban Areas"*, **8 April 2024** |
| **Cabinet approved the Presidential Internet Scheme**; **2,400 administrative wards**; low-earth-orbit satellite and fibre; schools, information centres, police stations, health institutions, traditional leaders' homesteads, agriculture extension offices and courts; grounded in the **Digital Economy thematic area of NDS1** | TechAfrica News, *"Zimbabwe Cabinet Approves Nationwide Presidential Internet Scheme"*, **11 April 2025** |
| The **Manicaland Digitalize Zimbabwe Expo** | 263Chat, *"All Set for Manicaland Digitalize Zimbabwe Expo"*, **20 June 2025** |
| **8,000 Starlink kits** for schools | TechAfrica News, *"Zimbabwe Donates 8,000 Starlink Kits to Expand Internet Access in Schools"*, **21 January 2026** |
| The 2025 milestones review; **NDS2 and Vision 2030** framing; the **finalisation of Zimbabwe's National Artificial Intelligence Strategy and National Cybersecurity Strategy**; the Presidential Internet Scheme named as progress | TechAfrica News, *"Zimbabwe Charts Digital Future as ICT Investment Grows and Connectivity Expands"*, **22 January 2026** |
| The **National Artificial Intelligence Strategy** launched at Golden Conifer, Harare, June 2026, theme **"AI for Impact"**, with the **AI Grand Challenge**; priority sectors **healthcare, agriculture, education, financial inclusion**; the commitment to AI reflecting **Zimbabwe's linguistic and cultural diversity**; the youth-innovation emphasis | TechAfrica News, *"Zimbabwe Launches National AI Strategy and Grand Challenge to Drive Innovation"*, **4 June 2026** |
| **"Govt committed to full digitalisation by 2030"**, *"Digital drive gathers pace in rural areas"*, *"Digitisation of public services key to NDS2 aspirations"* | Herald headlines (heraldonline.co.zw), confirmed present in the Google News index on **2026-09-28**. **Headlines only — the article text could not be read**, because the Herald blocks automated access |

### What could not be confirmed — do not fill these in from guesswork

- **No public text of the National AI Strategy, the National Cybersecurity Strategy or the Smart
  Zimbabwe 2030 Strategy was found.** Their *existence* is sourced; their *contents and targets* are
  not. Anything beyond "these strategies exist, and the AI Strategy's named sectors are the four
  above" must be marked `[QUESTION — needs a decision]`.
- **No dedicated official Digitalize Zimbabwe web presence was reachable.** `digitalize.gov.zw` did
  not resolve, and `ictministry.gov.zw` (the ministry's address as recorded on its own Wikipedia
  entry) now serves unrelated commercial content. **The current official address for the programme
  is therefore unknown** and must be asked for, not guessed.
- **No budget figures, no office named as owning the programme, and no published pilot-intake
  process** were found for Digitalize Zimbabwe.
- **What was published after June 2026 was not researched** (search engines blocked automated
  queries; the findings above came from the Google News index and from the publications' own pages).

### Method note, stated honestly

The **firecrawl** search skill was invoked for this research but the `firecrawl` command is **not
installed on this machine**, so it could not be used — the findings above come from direct HTTP
requests to the publications and the Google News index instead. DuckDuckGo, Mojeek, Marginalia and
the Herald all blocked automated access, so the method was: find the article titles in the Google
News index, then read the article from the publisher's own site wherever it allowed it.

