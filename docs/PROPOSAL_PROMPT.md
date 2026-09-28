# PROPOSAL_PROMPT.md — the copy-and-paste prompt for Claude

**What this is.** A self-contained brief to paste into Claude (claude.ai, Projects, or the API) to
produce the five documents that take the Zimbabwe AI Policy Intelligence Initiative from a working
demonstration to an approved programme: **the full proposal, the pitch deck, the legal instrument,
the procurement route, and the stated ask.**

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
turn a working technical demonstration into the five documents needed to have it **approved,
funded and procured**.

### The context in one paragraph

A fully working, browser-based policy assessment platform has already been built and deployed. Its
purpose is to let a government department test a draft policy against a simulated population before
the policy is implemented, and to produce structured findings for human review. It is **not** a
concept, a mock-up or a slideware promise — it runs today, inside the Government estate, and it is
the proof of concept for a proposed national capability: the **Zimbabwe AI Policy Intelligence
Initiative**, championed by the **Minister of Information Communication Technology, Postal and
Courier Services, Hon. Tatenda A. Mavetera, MP**, and delivered on the **Nzwisiso AI** platform.


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
- **16 modelled stakeholder groups**: civil servants; urban households; rural households; informal
  traders and transporters; formal business; mining operators; smallholder farmers; diaspora
  households; youth; women-led enterprises; exporters; the financial sector; local authorities;
  development partners; health workers; and educators.
- **63 published reference indicators** authored across those 16 institutions, each with a plain
  note and a named source.
- **48 prepared policy drafts** — three per institution — ready to be run today, so a demonstration
  needs no preparation by the department being shown.
- **49 reference documents** and **64 stated institutional priorities** held in the same
  configuration.
- **A complete officer journey that works end to end**: choose a department → upload or paste a
  policy draft → run the simulation → watch the modelled population and its relationships build up
  live → read an executive summary, a long-form report and a full assessment → export to PDF, Word
  or print → generate an editable **drafted policy** from the run.
- **Reproducibility is a design property, not a claim**: the same department and the same policy
  text always produce a byte-identical result. There is no randomness and no clock in the result,
  which is what makes a finding defensible in a meeting.
- **The assessment runs entirely inside the Government estate.** The demonstration build makes **no
  network request at all** — no external AI service is called, no document text leaves the machine,
  and no third-party script is loaded. This is verifiable, and it is the platform's strongest
  governance property.
- **Every run models a population of 2,000–3,200 simulated agents**, drawn as the relationships
  between the modelled groups. The platform states plainly what each drawn mark represents rather
  than overstating the picture, and it should keep doing so.
- **The governance boundary is built into the product**: the platform states, word for word, that
  *"the platform does not replace policymakers or determine policy outcomes"* and that it provides
  *"an additional analytical lens to support informed human judgement"*. Every generated document
  carries a decision-support disclaimer. **Do not soften these lines and do not contradict them.**

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

### The five deliverables, and the exact shape each must take

Produce all five, in this order, as one document with clear part headings.

**Part 1 — The proposal / Cabinet memorandum (2 to 4 pages, recommendation first).**
Written the way a ministerial briefing is written: short, structured, numbered paragraphs, neutral
in tone, and **carrying a recommendation**. Sections, in this order:
1. **Recommendation** — what is being asked for, in three sentences, at the very top.
2. **Background** — what the platform is, and that it already exists and works.
3. **The problem it addresses** — policies are implemented without a structured way to examine
   likely stakeholder responses first; the cost of that is discovered after implementation.
4. **What has already been delivered** — the verified facts above, stated plainly and without
   inflation, including that it runs inside the Government estate with no external service.
5. **What approval would enable** — the transition from a demonstration to a supported national
   capability: which institutions come first, and what changes for them.
6. **Legal and governance considerations** — see Part 3; summarise and cross-reference here.
7. **Financial implications** — a cost table, every figure marked as an assumption, with the
   recurring and one-off costs separated and no figure presented as approved.
8. **Implementation approach and timeframe** — phased, with the three named build items first
   (server-side extraction, server-side identity verification, a deployed production host).
9. **Risk and mitigation** — including the reputational risk of overclaiming, and how the product
   design already mitigates it.
10. **Consultation** — which offices must be consulted before submission (Treasury, the Public
    Service Commission, the Attorney General's office, the data protection authority), each marked
    as a question if the correct list is not known.

**Part 2 — The pitch deck (12 to 16 slides, outline plus speaker notes).**
It must survive being read *without* a presenter, and it must never claim more than the platform
does. Suggested spine: the problem · what is different here · a live demonstration, not a promise ·
what one run actually produces · the governance boundary · who it serves first · what has been
built already · what approval unlocks · the cost, marked as estimates · the roadmap · the ask ·
the close. **Speaker notes must say what to click and in what order during a live demonstration**,
including what to do if the network is unavailable.

**Part 3 — The legal instrument (skeleton plus drafting notes).**
Do **not** present a finished law; present a well-formed skeleton with every substantive choice
marked as a decision. Cover: the enabling authority; the instrument's objective; definitions;
establishment of the capability and the body responsible for it; permitted and prohibited uses of
the platform; **the statutory decision-support boundary** (the platform informs; it does not
decide); data custody, sovereignty and retention; audit, logging and access control; obligations
on departments that use it; review and reporting to Parliament; offences and penalties *if any*;
commencement; and a schedule of the institutions in scope. Add drafting notes explaining each
choice, and flag where the Attorney General's office must settle wording.

**Part 4 — The procurement route (decision paper, with options).**
Compare the realistic routes for a Zimbabwean public-sector technology programme and recommend one:
direct procurement under a framework; an open tender; a build-transfer or managed-service
arrangement; or phased in-house development with contracted expertise. For each: what it is, when it
is appropriate, the approvals it needs, its timeline, its main risk, and its cost shape. Then
recommend one route with reasons, and state exactly which approving office must sign it. Mark every
threshold, timeline and figure as an assumption.

**Part 5 — The stated ask.**
One page, unmistakable: exactly what approval is being requested, from whom, by when, and what
happens if it is granted. Separate what is needed **now** from what is needed at each later stage.
If the correct approval route is unknown, say so and list the questions to resolve rather than
guessing.


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
- Number every paragraph in Parts 1, 3, 4 and 5 so a reader in a meeting can refer to "paragraph 7.3".
- Put every table in a table. Do not describe a table in prose.
- Finish with a **one-page executive summary** that can be read alone, and a **"What we could not
  confirm"** paragraph.

### Before you hand anything over — run this checklist out loud

1. Does the **recommendation** appear in the first three sentences of Part 1?
2. Is every **cost, date, threshold and legal reference** marked as an assumption or a question?
3. Have you avoided every claim on the honesty rails — no prediction, no "the AI decided", no
   outcome attributed to the platform that it does not produce?
4. Does the legal instrument keep the **decision-support boundary** intact — the platform informs,
   a human decides?
5. Is the pitch deck readable with **no presenter**, and does its demonstration script say what to
   click, in order?
6. Is there a **"What we could not confirm"** paragraph, and does it name who to ask?
7. Could a Minister read Part 1 and know, within one minute, exactly what is being asked of them?

---

## END OF THE PROMPT

**Notes for you, the person pasting it (not part of the prompt):**

- Add the real figures where you have them: the budget envelope, the ministry's cost-sharing, the
  approval deadline, the number of institutions to prioritise first. The prompt will mark these as
  assumptions if you do not.
- Ask Claude for **one part at a time** if the reply is truncated — the five parts are designed to
  stand alone.
- Keep `PROJECT_STATUS.md` and `PRODUCTION_READINESS.md` for **yourself**, not for the meeting: they
  are the engineering record of exactly what is built and what is still simulated. They are internal
  documents and contain deployment and credential notes, so **do not hand them to the Minister or to
  Cabinet**. The document for that room is Part 1 of this prompt's output.
- **The live site is current as at 2026-09-28.** The host `nzwisiso.bitflex.app` was redeployed that day
  and serves `assets/index-BeggQU9V.js`, so the authority line, the modelled agent population and the
  named sources are all on the live host. (The paragraph that used to sit here told the reader to
  "deploy before you present" because the live site was a much older build; that is no longer true, and
  the prompt below is being rewritten down to three documents under **AB-7** in `PROJECT_STATUS.md`.)

