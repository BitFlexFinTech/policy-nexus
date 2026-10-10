# PRODUCTION_READINESS.md — Mock → Real go-live checklist

Every active mock, placeholder, or simulated capability in this build, what replaces it,
and where it is entered. **Updated every session.** Nothing here is a bug — these are
deliberate scenario-mode implementations behind swappable seams.

## ★ SAVED PLAN, 2026-10-10 — WHAT THE VPS UNLOCKS, AND WHAT IS DEFERRED

The plan to build is the block at the very top of `PROJECT_STATUS.md`. Two things here matter for go-live:

**What the VPS (a funded server) unlocks.** (a) The **API keys move server-side** — today the keys ship inside the built website, so a visitor can read one (acceptable only while these are the owner's demonstration keys, which he rotates); (b) the **register moves off the browser**, removing its storage limit; (c) the **full** document archives can be held (the demo keeps only 6–8 real documents per department, because the shared host has little space and a slow upload); (d) the **local models**; (e) a **server-side PDF reader**, so an officer's uploaded `.pdf` is really read.

**What is real today, and what is still placeholder — counted in the code on 2026-10-10, not from memory.** REAL: the **research assistant** (ZEPARI's 103 published documents) and the **drafted policy** (written by the AI). PLACEHOLDER — and honestly labelled on screen: **236 of 510** department figures are modelled (276 published); **130 of 150** stakeholder shares are modelled (20 published); the **50** department register documents carry **no text**, so nothing is read from them; an officer's PDF is not read; the simulation is **our own deterministic model**, not agents.

**Deferred and locked — never to be reported as working.** The **second re-run path** ("take the drafted policy back through the simulation") builds its request **without the department's documents**, so a run made that way ignores them; a demonstration uses only the labelled **"Re-run simulation"** control. See Batch G in `PROJECT_STATUS.md`.


## 0. THE RESEARCH ENGINE AND THE DRAFTED POLICY — WHAT IS REAL, AND WHAT THE OWNER HAS INSTRUCTED (plan saved 2026-10-07; the build starts in the next session)

| Item | Current implementation | What is left | Where it is switched |
|---|---|---|---|
| Answering a research question | **THE OWNER'S INSTRUCTION (2026-10-07): the in-browser model is REMOVED COMPLETELY — *"we dont need it, it failed."*** The failure is measured, not an opinion: on the live site, asked the owner's own question, it took **282 seconds** and answered with **one fragment of one sentence** ("management of national resources"), because that model can only point at words that already exist. The engine becomes the **OpenRouter research key**, **built into the platform** — the owner's strict rule is that nothing is typed (see *"The two OpenRouter keys"* row below). | ✅ **DONE:** Batch 1 removed the model's code, its files, its build step and its gate (2026-10-09), and **Batch A took its 53 MB off the live server** (2026-10-10); Batch 2 loaded ZEPARI's real corpus (103 documents) so an answer has substance. | `src/config/platform.ts` (`research`) · the key still reachable at `/platform-admin` if it ever needs changing |
| The model files | ✅ **DELETED — from the code 2026-10-09 (Batch 1, commit `1b4fee5`), from the LIVE SERVER 2026-10-10 (Batch A).** About 53 MB in all: the 26,903,231 B MobileBERT answering model (`…-ONNX/onnx/model_quantized.onnx`), ONNX Runtime's 26,861,777 B `ort-wasm-simd-threaded.asyncify.wasm`, the small tokenizer/config files, and three leftover model chunks the old build had left in `assets/` (`transformers.web-BNA0XoCc.js`, `transformers.web-CUHIBQwP.js`, `ort-wasm-simd-threaded.asyncify-CxOG5pUO.wasm`). The `models/` folder is no longer in the web-root listing and every one of those addresses now returns the site's 404 fallback. The `fetch:models` command, `scripts/fetch-models.mjs` and `scripts/prune-dist.mjs` are gone, the `@huggingface/transformers` dependency is removed, the build is plain `vite build`, and the build check fails if any of it returns. | Nothing further for the mock list. `dist/` is about 1.6 MB of application code plus the 9.4 MB corpus. | `scripts/fetch-models.mjs` (deleted) · `scripts/prune-dist.mjs` (deleted) |
| The research library's depth | **2 demonstration extracts today** (`researchSample.ts`: the National Agriculture Policy Framework's nine pillars and the ICT policy's areas). **The owner's strict instruction: ZEPARI's public PDFs are ALL downloaded** — from `/publications/policy-briefs`, `/publications/research-studies` and `/publications/economic-barometer` on `zepari.co.zw`, every page of each listing — converted to text with **PyMuPDF** (already installed) and loaded with **title + publisher + date**, cited. | Batch 2: download, convert, load, and report every document and every dead link **by name**. Never an extract presented as the whole document again. | the corpus data files (text only — their PDFs are not committed) |
| The drafted policy | **OFFLINE today: 28 parts, about 8,341–12,627 words — roughly 25–35 printed pages — and no page count is measured or gated anywhere.** The live path already exists: `liveService("drafting")` → `src/services/documents/remoteDraftingClient.ts`, which sends the run and the department's grounding and **rejects an answer that does not match the document's shape** rather than falling back silently. | Batch 3: measure the real printed-page count with the drafting key live, then assemble the instrument clause by clause to **a minimum of 40 printed pages** with real content — never padding — and gate it so it cannot regress. Report the number of model calls and tokens one drafted policy costs. | `src/config/platform.ts` (`drafting`) · the key typed at `/platform-admin` |
| The two OpenRouter keys | **SAVED, PROVED, AND BUILT INTO THE PLATFORM — the owner's strict rule (2026-10-07): no manual entry, ever.** `OPENROUTER_KEY_RESEARCH` (ZEPARI) and `OPENROUTER_KEY_POLICY` (Nzwisiso) live in **`.env`** (gitignored, never committed, never printed), and are read at **build time** into the platform's own defaults, so **opening the site needs nothing typed** — this is his machine, his demo. Each key was tested with a real request: **HTTP 200 both**. He **rotates both after the demo**. | Batch 1 wires the baked defaults (`.env` gains the two `VITE_`-prefixed names, `DEFAULT_PLATFORM_CONFIG` goes live with them) and removes the typing step from every instruction. **The exposure is named and accepted:** a key inside a published site can be read by a visitor, the keys are demonstration keys rotated immediately afterwards, and the VPS will use a server-side proxy instead. | `src/config/platform.ts` (`DEFAULT_PLATFORM_CONFIG`) · `.env` |


- **THE PICTURE OF A TOOL'S PAGE NOW BEGINS AT THE BOTTOM OF THE CARDS — AND THE WHOLE PAGE IS REACHABLE (2026-10-07, evening, fourth pass).** The owner's report, verbatim: *"when the mouse hovers over the card i cant see the whole page … its covered by the card. why dont you move the pages lower so the user can see the whole page?"* and then exactly what was wanted: *"the bottom of the card should be treated as the top of the screen. so the user sees the whole page for the tool including the header etc."* **The cause:** the picture was pinned to the very top of the screen (`fixed inset-0`), so the tool page's own header and its whole opening sat behind the Government header and the cards — the reader only ever saw the MIDDLE of that page. **Built:** the picture now begins at the **bottom edge of the cards' bar** (measured in `src/pages/Home.tsx` from `barRef`, and re-measured on scroll and resize so the edge never drifts) and runs to the bottom of the window, so the tool's page is read **from its own header down**. Because the tool's page now starts at the cards' bottom, the home page's own "Internal service" line so **steps aside** while a picture is up (the tool's page brings its own band, right under the cards) and returns the moment the pointer leaves. Rolling the wheel **over the cards** slides the picture, so the whole of that page is reachable without leaving the hover; that listener is attached directly and is **non-passive** and stops the page underneath scrolling — otherwise the cards move out from under the pointer and the picture vanishes mid-read, a real defect found and fixed during this build. **Unchanged, as the owner asked:** the cards do not move; nothing in the picture is clickable (it is a preview, not a page); **clicking a card still opens the real tool page**; and the tool pages themselves never show the cards (only `Home.tsx` hands that band to the page frame). Validate **check 46** is now measurable and **mutation-proved three ways**; the homepage browser test measures the edge in a real browser with a card hovered. No new mock, credential or cost.
- **THE ZEPARI STATUS BAND + THE HOVER FIX, PUBLISHED (2026-10-07, evening, third pass).** **(1)** The ZEPARI landing page (`/research`) was the only landing page without a status band; it now wears one — the badge "Internal service" plus a line worded for the **research** product (*"Decision support for ZEPARI's research and policy analysis. Answers come only from the documents in the research library, and every figure names the body that published it."*) with the live date, on ZEPARI's own light surface. It deliberately does **not** carry the department band's "Simulation results are modelled" sentence, which would be false there: the two wordings live in their own config homes (`SERVICE_NOTICE`, `RESEARCH_SERVICE_NOTICE`) and validate **check 45** fails if they are swapped. **(2) SUPERSEDED IN PART the same evening (fourth pass):** the picture is no longer merely drawn below the chrome — it now **begins at the bottom edge of the cards**, so the tool's page is read from its own header down with nothing of it cut off; see the bullet above and validate **check 46**. No new mock or credential is introduced by either change.
- **STAGE D SUPERSEDED (2026-10-07):** the three ZEPARI UI directions and the "Built for Government" page remain in the code at `/research/designs*`, but the owner moved on to the homepage directive without picking one, so **the build is NOT waiting on that choice any more** (an earlier line here said "nothing further is built until they pick" — that is no longer true).
- **STAGE D BUILT (2026-10-07):** the three UI directions of the ZEPARI research product (The Research Desk · The Analyst's Terminal · The Evidence Lab) plus the **Built for Government** page, on a new scoped **`.zepari` blue + gold** palette and the **ZEPARI logo** (`src/assets/zepari-logo.jpg`, from zepari.co.zw). Pages: `/research/designs` (chooser), `/research/designs/{desk,terminal,lab}`, `/research/designs/government`. Screenshots: `Review Zip/design-options/` (written by `e2e/designs.spec.ts`). **The build is stopped at Stage D for the owner's choice (1/2/3)** — nothing further is built until they pick.
- **Two products, one platform:** **Nzwisiso Policy Simulation Assistant** (departments — today's platform, unchanged) and **ZEPARI Policy Research Assistant** (research). One URL → a choice at the door; the ZEPARI landing carries **one-click logins for Dr. Gibson Chigumira** (Executive Director, ZEPARI) and **Dr. Jesimen Chipika** (Deputy Governor, RBZ; Chairperson, ZEPARI Board of Trustees).
- **AI = OpenRouter's API only.** ZEPARI's documents and data are stored on **the servers we set up**. A **SECOND OpenRouter key** is entered on the admin screen for the research assistant (the first drafts the policy), so usage and cost are measured **per key**. **Oreida Pvt Ltd's monthly fee covers the AI usage** — ZEPARI is not billed per token. **Batch A DONE (2026-10-07):** the second key is built — a `research` capability in `src/config/platform.ts` and a second OpenRouter card on `/platform-admin`, entered separately from the drafting key; it ships **simulated**, needs a key **and** a model, and flips with the one platform-mode control. Held by validate **check 32** (mutation-proved), with a source test that the two keys never share a value. **Batch B DONE (2026-10-07):** the front door is built — the opening page presents the **choice** of the two services first; the **ZEPARI research assistant** has its **own landing page at `/research`** with the **two one-click entries** (Dr. Gibson Chigumira; Dr. Jesimen Chipika), the confidentiality promise, the AI-usage line and the boundary rule, and a **workspace at `/research/app`**. The two products keep **separate sessions**, so a department session never opens the research side or the reverse. Held by validate **check 33** (mutation-proved). **Batch C DONE (2026-10-07):** the **research library** is built — ZEPARI's own documents are read in the browser through the existing extraction seam (`.txt`, `.docx`, `.xlsx` in full; a `.pdf` recorded by name and marked not read) or pasted, kept in **this browser for now**, and routed through a **mock-first seam** (`src/services/research/researchDocumentStore.ts`) so connecting ZEPARI's own server later is an **address and a key** on the administration screen and nothing else. The panel states the limit plainly ("This browser (Local) … Shared with nobody"). Held by validate **check 34** (mutation-proved). **Batch D DONE (2026-10-07):** the **institution data-connectors** are built — a **mock-first seam** (`src/services/research/researchConnectorStore.ts`) records the data sources ZEPARI's administrator enters (name, address, what it provides), kept in **this browser for now**; the surface is honest that **no figure is read until ZEPARI's own server is connected**, so the platform invents neither a source nor a figure. Held by validate **check 35** (mutation-proved). **Batch E DONE (2026-10-07):** the **grounded research chat** is built — a question is matched against ZEPARI's own library (deterministic, local retrieval) and the passages that matched are shown as **sources**; a written answer is produced by the **research model** (OpenRouter, the research key), drawn only from those sources and citing them. **With no model connected the platform shows the sources and writes NO answer** — it never fabricates one. Held by validate **check 36** (mutation-proved). **Batch F DONE (2026-10-07):** the **policy brief** is built — a topic is matched against the research library and the brief's **fixed structure** and its **sources** are shown; the **research model** drafts the words from those sources only. **With no model connected the structure and sources are still shown and NO brief is written** — it never fabricates one. Held by validate **check 37** (mutation-proved). **Batch G DONE (2026-10-07):** the **Economic Barometer** is built — ZEPARI records its own indicator readings, each a figure for one indicator in one period that **must name the body that published it**, tracked over time and kept in **this browser for now** behind a **mock-first seam**. A figure is never shown without its source. Held by validate **check 38** (mutation-proved). **The ZEPARI parts the owner listed are now all built** (library, data-connectors, chat-grounding, brief, barometer) **and findings-to-departments (2026-10-07)**: a finding is recorded and routed to the departments it concerns — a **NOTE for a human, never read by the simulation engine** (validate **check 39**, mutation-proved).
- **Confidentiality (to be stated on the page):** **Oreida Pvt Ltd cannot read any research.** As administrators we manage only live support, the servers and the API seams — **never the documents**.
- **STRICT RULE:** the **AI research side never feeds a figure into the deterministic engine.**
- **The drafted-policy rework (the owner raised it twice):** the instrument must read as a **POLICY**, not a report that cites modelled indicators and groups — the **measures/priority areas are its heart**. The analysed **real Zimbabwean policy structure** replaces the derived section list.
- Each new surface — **library · institution data-connectors · chat-grounding · policy brief · Economic Barometer · findings-to-departments** — carries its own build gate.


## 0b. NO DEMO DATA ANYWHERE — THE OWNER'S LOCKED DECISION (2026-10-09; the plan is saved, the build happens in a new chat)

**The owner's words:** *"now we have the real api key so everything should work no more demo data anywhere"* · *"all i meant was the policy should actually be a real policy draft not fake."*

**The locked decision (do not re-open it):** **every invented figure is REPLACED by a DIFFERENT measure that carries a real, named, published source.** No invented figure stays, and no screen is left thin either. The label `Modelled` disappears from the platform. Where no real substitute exists for one slot, that slot takes a different real measure relevant to that department, and the unsourceable slot is named in the report.

| Item | What it is today | What replaces it | Where |
|---|---|---|---|
| The department document register | ✅ **REAL as of 2026-10-10 (Batch B4).** The invented entries are **gone** — the made-up name, the made-up type and size, and the invented instrument each was said to be "prepared under" are all deleted from `src/config/departments.ts`. The register the screens read is now **GENERATED** from the corpora by `scripts/build-department-register.mjs` and gated by `npm run validate` **check 53** ("the department register matches the corpora") plus **5b** ("the register is data only") | Nothing; this IS the real register | `src/config/departmentDocuments.ts` (generated — never edit by hand) · `src/config/departments.ts` · `public/department-corpus/<departmentId>.json` |
| The 16 departments' own published documents | ✅ **REAL as of 2026-10-10 (Batch B3).** Every one of the 16 departments now ships **6–8 real published documents** of its own — its governing law, its sector policy, the parliamentary committees' reports on it and the audits of it — downloaded, read with PyMuPDF and cited by title · publishing body · date · address; **every document carries a real page count read from the PDF itself** | Nothing; these ARE the real documents. **✅ WIRED IN 2026-10-10 (Batch B4):** the register every screen reads is generated from these; the library rail, the library screen, the record dialog and the relationship graph's "read against" nodes all show them (the graph's edge weight is now each document's real share of the department's read material, so an unreadable scan weighs nothing); and the drafted policy **names every one of them at Annex D**, with its publishing body, its date, its page count, whether its text could be read, and the address of the published file. **One item outstanding, awaiting the owner's decision:** the drafted policy does not yet **quote** their wording, because that would put their text into a run and a run must be rebuilt in one breath from what was stored — both options and their cost are in `PROJECT_STATUS.md` | `public/department-corpus/<departmentId>.json` · built by `scripts/build-department-corpora.py` |
| Three departments' governing Acts | The Defence Act [Chapter 11:02], the War Veterans Act [Chapter 11:15] and the Public Service Act [Chapter 16:04] are published on veritaszim (the official law site) as **Word files, not PDFs**; a Word file carries **no reliable page count** and this set records a real one for every document | Each of those departments instead ships a real, cited set drawn from what the **same bodies publish as readable PDFs** (the committees' reports, the instruments and bills made under the Act). **Named in the builder's own comment rather than faked** — if a PDF of each Act is found, it is added | `scripts/build-department-corpora.py` (the `def` / `psc` entries) |
| Department indicator cards | **281 of 320 invented** (`Modelled`) | A real published measure for each slot, from a named body | `src/config/departments.ts` |
| Reference indicators | **235 of 510 invented** | A real published measure for each slot | `src/config/departments.ts` · `src/config/reference.ts` |
| Stakeholder groups | **130 of 150 modelled** | A real published basis, or the group is replaced by one that has one | `src/config/reference.ts` |
| The drafted policy | Written **offline by a template**, about 25–35 printed pages, reading only what an officer uploaded | Written by the **live** AI from the real documents and the real figures. **40 printed pages is a FLOOR, not a target** — it must be as long as the real content needs (we discussed up to about 70) | `src/services/documents/remoteDraftingClient.ts` |
| An officer's own uploaded PDF | **Not read at all** | Needs a **new component added to the app** — the owner must approve it; ask him | `src/services/extraction/extractPolicyText.ts` |
| The research library | ✅ **REAL as of 2026-10-09** — ZEPARI's 103 published documents | Nothing; do not re-break it | `public/zepari-corpus.json` |

**Standing rules that already govern this work:** every figure must name the body that publishes it, the publication and the period; **every door must be tried before a source is called unavailable** (JSON API · OData/SDMX · bulk download · the document itself · a registry or regulator list · an aggregator that names the origin), and the doors tried are recorded.

## 1. Simulation / assessment engine
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Assessment engine / `src/services/assessment/**` | **BUILT — Phase E.** `AssessmentService` interface + factory (`AssessmentService.ts`), deterministic engine (`scenario.ts`), seeded PRNG (`src/lib/prng.ts`), canonical schema (`types.ts`), and a persistent register of run inputs (`runStore.ts`). The same request always reproduces a byte-identical `AssessmentRun`; nothing reaches the network. **Visibly labelled**: the workspace pill reads `Scenario (Mock)` and runs state `Seed … — computed locally, no external request`. | Remote backend (HTTP service) | `.env` → `VITE_ASSESSMENT_MODE=service`; register the client in `CLIENTS` in `src/services/assessment/AssessmentService.ts` |
| Decision-support disclaimer | Static string in `src/config/brand.ts`, rendered on the executive summary and the full assessment and carried into every export | Stays (always present) | `src/config/brand.ts` |
| Simulation visualisation | **BUILT — Phase F.** `/app/simulations/:id` reveals the run's own rounds one at a time (a deterministic replay; only the reveal cadence is timed) and ends at **Assessment Complete**. The workspace `AgentFeed` remains the pre-run scenario-preparation view. | Live streaming from the backend over the same `AssessmentService` contract | No UI change required (seam requirement) |
| Generated documents — long-form report + drafted policy | **BUILT — Phase K; extended in AB-4; the policy rebuilt to the Zimbabwean standard (2026-09-29).** Two documents derive from a completed run using the run's own seed (`<seed>::long-report`, `<seed>::policy-draft`), so the same inputs always produce byte-identical text. The **long report** is generated by `src/services/assessment/documents.ts`. The **drafted policy** is generated by **`src/services/assessment/policyDraft.ts`** and is now the full Government instrument, in the order the published Zimbabwean documents use (researched from the National AI Strategy 2026–2030, 73 pp; the National Health Strategy 2021–2025, 104 pp; the National ICT Policy 2015, 42 pp; the Devolution and Decentralisation Policy, 70 pp; NDS1; the National Agriculture Policy Framework 2019–2030; ZEPARI's *Strengthening the Zimbabwe National Policy Making Process*, 47 pp; and, as the regional comparator, South Africa's Cabinet-approved National Policy Development Framework 2020): **front matter** (cover · contents · foreword with the Minister's name marked for signature · acknowledgements · acronyms derived from the document's own text · executive summary), **eleven numbered clauses** (introduction and background · situation analysis · vision, mission, objectives and guiding principles · legal and institutional framework · policy measures · implementation framework · risk management · stakeholder engagement and communication · financial implications · monitoring, evaluation and review · transitional provisions), **six annexes** (A implementation matrix for the recommended steps · B stakeholder analysis · C instruments relied on · D documents and data relied upon · E run inputs and reproducibility · F method and limitations) and a closing note — **28 parts and 8,341–12,627 words** (measured 2026-10-05, after Batch 5 added the departmental-material clause and the documents annex) for all 16 departments, against 1,512–1,725 words across 10 sections before. The submitted draft's **own sentences** are the operative measures; the modelled risks and recommendations become provisions **and** numbered measures; the matrices are real tables (implementation, cost, M&E, stakeholder). **Nothing is invented:** a figure is published-with-its-source or labelled `Modelled`, and every office, date, amount and signature the platform cannot know is printed as `[TO BE CONFIRMED BY THE DEPARTMENT]`. **Visibly labelled:** the policy states it was generated locally by the *Nzwisiso simulation core (Mock)* and is a draft for review, not an adopted instrument. **AB-4** adds the **citations annex** (every instrument derived from the department's own register via `citedInstrumentLabel`), a **provenance** record in the closing note and on the screen, and a **fail-closed citation check** (`src/services/documents/drafting.ts`) that refuses a document naming an instrument the register does not hold. **Gates:** `src/test/policy-document.test.ts` (40 guards) holds the structure, the part order, the **8,250-word floor** (grounded to the measured minimum — see below), the contents, the acronyms, the clause references, the table shapes and the two phrasing defects; `src/test/policy-documents.test.ts` (6 guards, Batch 5) holds the departmental material — that Annex D lists the documents really read, that the situation analysis quotes the department's OWN wording where it carries one of its stated priorities, that a file which could not be read contributes nothing, and that no claim is made without the sentence that proves it. | A backend drafting model behind the same function signatures; it receives the same `grounding` object (`docs/SERVER_CONTRACT.md` §2) and the same `POLICY_DRAFT_STRUCTURE` | Replace `buildLongReport` in `src/services/assessment/documents.ts` or `buildPolicyDraft` in `src/services/assessment/policyDraft.ts`, or point the drafting capability at a service; the pages, the prompt library, the grounding and the export seam need no change |

**Seam rule:** no component may import `scenario.ts` directly; only `assessmentService` from the
factory. Swapping the implementation must require zero UI code changes. The store persists run
**inputs** (`runStore.ts`), never generated output, so a stored run is always recomputed by whatever
client is registered.

## 2. Authentication / session
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Sign-in | One-click department session — no credentials, no network call. **`src/session/session.ts` is the seam**: `signInToDepartment` / `getSession` / `clearSession`. There is **no** `VITE_AUTH_MODE` environment switch yet; an earlier draft of this file claimed one and it does not exist. | Government SSO / identity provider | Replace the three functions in `src/session/session.ts`; callers use `sessionActions` from `src/session/useSession.ts` and need no change |
| Session identity | `localStorage["nzwisiso.session.v1"] = { departmentId, mode }` where `mode: "oneclick"` — the fixed `signedInAt` field was **removed on 2026-10-06** (it was never shown anywhere) | Server session / token | Same seam |
| Storage fallback | If the browser refuses local storage, the session falls back to memory for the visit. `isSessionPersistent()` reports which is in use. | Unchanged | Same seam |
| Mock marker | `mode: "oneclick"` is stored in state **and visibly labelled in the workspace header as `Entry: one-click (Mock)`** | Removed by real auth | Same seam |
| The officer who prepared a policy (item 1 — the paper trail) | **PARTLY REAL — Batch B1 (2026-09-30).** The officer types first name, surname and post on the entry screen (`/start`); the identity is stored in the session (`nzwisiso.session.v1`, `officer`), travels on the run request (`preparedBy`), and is named on the drafted policy's title block, in its provenance panel and on the run's own record. **The name is SELF-DECLARED**, and the platform says so wherever it appears: `OFFICER_SELF_DECLARED_NOTE` (`src/config/officer.ts`) plus `(self-declared at entry)` in the document line, and "Name source: Self-declared at entry (sign-in not enabled)" on the run record. Nothing claims the name was verified. | The name and post come from the Government identity provider (already planned: `src/session/sso.ts` + the `subject` field), and a server-side log that cannot be edited by the officer holds the trail | `src/config/officer.ts` (shape, one name composition, the honesty sentence) · `src/session/session.ts` (`setOfficer`) · the run's `preparedBy` — no screen change needed when the provider lands |
| Route guard | `src/routes/RequireSession.tsx` — `/app/**` redirects to `/` without a session | Unchanged (a real guard would also check the token) | Same seam |

## 3. Policy ingestion
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| `.txt` upload | **REAL — Phase X.** The file is read in the browser (`src/services/extraction/extractPolicyText.ts`) and its own text becomes the run's policy text; `source` still reads `upload`. Deterministic, no dependency, no network call. | unchanged for `.txt` | `extractPolicyFile()` — the extraction seam |
| `.docx` upload | **REAL — Batch D.** Unpacked **in the browser**, with no dependency and no server: `src/services/extraction/zipRead.ts` walks the ZIP central directory the format defines and unpacks a compressed entry with the browser's own `DecompressionStream`; `src/services/extraction/docxText.ts` takes the paragraphs and text runs out of `word/document.xml`. Handles both stored and deflated entries. A file it cannot open is reported in plain words as **not read** — never claimed to have been read. If the local reader fails and a service is configured, the service is tried next. | unchanged | `readDocxText()` behind `extractPolicyFile()` |
| `.xlsx` upload | **REAL — Batch 4.** Unpacked **in the browser**, with no dependency and no server: the same ZIP reader (`src/services/extraction/zipRead.ts`) opens the workbook, and `src/services/extraction/xlsxText.ts` reads `xl/sharedStrings.xml` (the words, held once and referenced by number) plus every `xl/worksheets/sheet*.xml` (the grid). The result is one tab-separated line per row, worksheets separated by a blank line; a skipped cell stays a gap rather than shifting the row. Numbers, booleans and words written inside a cell are all read, and a formula is read as the last result Excel stored. A file it cannot open is reported in plain words as **not read** — never claimed to have been read. | unchanged | `readXlsxText()` behind `extractPolicyFile()` |
| `.pdf` upload | **Mock — Phase X, unchanged.** Recorded by name; the screen shows `Text extraction (Mock) — recorded by name; PDF text is not read in this build`, so nothing implies the file was parsed. Only the PDF half is outstanding; the `.docx` half is real as of Batch D and the `.xlsx` half as of Batch 4. | Server-side PDF parsing | Replace the PDF branch of `extractPolicyFile()` in `src/services/extraction/extractPolicyText.ts` with a server call — one function, no UI change |
| Preset chips | Department-aware: read from `department.policyTemplates` (`src/config/departments.ts`); selecting a chip also records its `templateId`, so the run's reference and horizon come from the department's own draft | unchanged | n/a |
| Reading progress | **REAL — Phase X.** The bar advances one step per accepted file as that file is actually read, and each file lists what happened to it. The fixed-step `PARSE_STEP`/`PARSE_TICK_MS` animation is gone. | unchanged | `src/components/PolicyInput.tsx` |
| Run Simulation action | **Real, deterministic, and labelled.** The button is `Run Simulation`; it calls `assessmentService.run()`, records the request and opens `/app/simulations/:id`. The engine is the scenario engine (Mock) — the UI says so on the run, the register and the assessment. | Unchanged button; the service behind it changes | `src/components/PolicyInput.tsx` → `AssessmentService` seam |

## 4. Document actions
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Save as PDF | Opens the browser print dialogue via `window.print()` — choose "Save as PDF" as the destination. No `jspdf` dependency and no new dependency added. | Native server-side PDF renderer | Backend endpoint behind `DocumentActions` (`src/components/assessment/DocumentActions.tsx`) |
| Download Word | **REAL OOXML `.docx` — Phase X.** A genuine Word document: `src/services/documents/docx.ts` fills the WordprocessingML parts and `zip.ts` writes a deterministic ZIP. No dependency; `file` reports “Microsoft Word 2007+”; the same run is byte-identical. Verified with `unzip -t` and `xmllint` as well as in the browser. | A server-side renderer only if a house template is ever mandated | `createDocxBlob()` in `src/services/documents/docx.ts` |
| Print | Real `window.print()`; `@media print` in `src/index.css` hides the workspace chrome and any `data-print="hide"` control, so the printed page is the assessment alone | unchanged | n/a |
| Share | `navigator.share` where the platform provides a share sheet, otherwise the clipboard (`navigator.clipboard.writeText`). The shared text is the plain-text rendering of the run plus the disclaimer. **No network call and no email client is invoked.** | Server-side email / link dispatch | Backend endpoint behind `DocumentActions` |

## 5. Data
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Department content (16 departments) | Authored deterministic config: `src/config/departments.ts` — **built in Phase B**, verified by importing the module: 16 departments, 64 priorities, **495** indicators, 48 policy templates, 49 documents (the indicator set was raised from 63 to 160 on 2026-10-02, then to 320 on 2026-10-04 — twenty per department — and to 339 on 2026-10-04 with 23 new real published figures, and to 362 on 2026-10-05 with 23 more (PART 11 batch 2), to 414 on 2026-10-05 with 52 more (batch 3), and to 446 on 2026-10-05 with 32 more (batch 4) and to 480 on 2026-10-05 with 34 more (batch 5 — the flip: real, published figures now outnumber the modelled ones) and to 495 on 2026-10-05 with 15 more (batch 6 — widening the margin), PART 11 — twenty or more per department — for national policy drafting). **Since Phase AD each indicator carries a `basis`:** either a published figure that names its publisher, its publication and the period (a key into the one `NAMED_SOURCES` table), or plainly `Modelled`. **13 published / 50 modelled after R2, 21 / 42 after R3, and 24 published / 39 modelled after R4 and R5 (2026-09-29); then 24 published / 136 modelled after the 2026-10-02 expansion to 160; then 35 published / 125 modelled after batch 1 of the national-scale expansion (2026-10-04), which re-researched eleven of the modelled indicators against the World Bank's own API and found a series that measures the same thing; then 39 published / 121 modelled after batch 2 (2026-10-04), which swept the rest of the modelled set the same way; then 39 published / 281 modelled after batch 3 (2026-10-04), which added ten new Modelled indicators per department (demo figures, per the owner); then 51 published / 269 modelled after Batch B (2026-10-04), which found twelve more real World Bank series; then 54 published / 266 modelled after Batch B part 2 (2026-10-04), which widened the sweep to the other publishers the sourcing rule names (the International Monetary Fund, UNESCO UIS, WHO, FAO, UN Comtrade) and converted the three that genuinely measure what their indicator states — adding the IMF to `NAMED_SOURCES` for Zimbabwe's public debt; then 59 published / 261 modelled after the national sweep Batch S1 (2026-10-04), which read **Zimbabwe's own publishers** — the ZIMRA Annual Report 2024 and the RBZ Bank Supervision Annual Report 2025 — and added ZIMRA to `NAMED_SOURCES`; then 61 published / 259 modelled after Batch S2 began (2026-10-04), which queried UNESCO's statistics institute **properly** (the earlier attempt used guessed codes) and converted two education figures — adding UNESCO to `NAMED_SOURCES`; then 62 published / 258 modelled as S2 continued with a **Zimbabwean** publisher — TIMB's marketing-season statistics, which gave the tobacco figure — adding TIMB to `NAMED_SOURCES`; then 65 published / 255 modelled after Batch S3 began (2026-10-04), which queried UNESCO's **school-facility** series (schools with internet, basic drinking water, and single-sex basic sanitation); then 66 published / 254 modelled after Batch S4 began (2026-10-04), which converted the armed-forces personnel total from the World Bank's catalogue; then 67 published / 253 modelled when the owner decided the duplicate ICT measure found in S4 — one data-cost figure stays, and the freed slot now carries **Secure Internet servers** (World Bank, 2024); then 72 published / 248 modelled after the national sweep's **Treasury** batch (2026-10-04) — which read **Zimbabwe's own Treasury** (its 2025 Annual Budget Review and its 2024 Public Debt Report, at `zimtreasury.co.zw`, where the old `.gov.zw` address no longer resolves), converted four modelled Finance figures to real ones, resolved the duplicate "Budget execution" measure the way the owner resolved the ICT duplicate (the freed slot now carries the public-sector wage bill), and added the Treasury to `NAMED_SOURCES`; then 79 published / 241 modelled after Batch S5 (2026-10-04), which read **ZIMSTAT's own production and trade releases** — the quarterly Index of Mineral Production and Index of Electricity Generation (built from the Ministry of Mines and ZESA returns) and the monthly External Trade release — and the **Agriculture Ministry's** winter-wheat update, converting seven modelled figures (gold, platinum and lithium output; electricity generated, the independent producers' share of generation, and electricity imported; the winter-wheat planted area) and adding the Agriculture Ministry to `NAMED_SOURCES`; then 83 published / 237 modelled after Batch S6 (2026-10-04), which read **ZIMSTAT's Zimbabwe Demographic and Health Survey 2023-24** (facility deliveries, four-or-more antenatal visits, households with improved sanitation) and the **Environmental Management Agency's Annual Report 2024** (full impact assessments processed, environmental licences issued), converting four modelled figures and re-sourcing one already-published figure (antenatal visits, from the World Bank's 2019 series to the newer national survey), and adding the EMA to `NAMED_SOURCES`; then 85 published / 235 modelled after Batch S7 (2026-10-04), which read **ZIMSTAT's Environmental Resources Statistics Report 2023** (cotton production) and the **2022 Population and Housing Census** (households with piped water) — the conversion sweep is now complete for every department where a publisher exists, and the remaining `Modelled` figures are the departments' own operational returns; then 104 published / 235 modelled after **PART 11 batch 1** (2026-10-04), which **added 23 NEW indicators**, each carrying a real World Bank figure (GDP growth, inflation, agricultural land, under-5 mortality and more), so the platform now carries **362** indicators (127 published / 235 modelled, after **PART 11 batch 2** of 2026-10-05 added 23 more NEW real indicators — the WHO Global Health Observatory joined `NAMED_SOURCES`, and the rest are World Bank series: hospital beds, physicians, stunting, tuberculosis incidence, youth and female labour participation, industry and services value added, health worker density and more) — and every modelled one is labelled, never dressed as an official figure | CMS / ministry content service | Config loader |
| Brand identity, disclaimer, engine vocabulary | `src/config/brand.ts` — **built in Phase B** | Stays (identity and disclaimer are permanent) | `src/config/brand.ts` |
| Simulation history / policy register | **Phase E/F:** `/app/policies` and `/app/simulations` list the department's prepared drafts, and the register and the workspace history table list **real recorded runs** for that department (reference, result, and a link to the assessment). `src/services/assessment/runStore.ts` persists the run *requests* in `localStorage["nzwisiso.runs.v1"]`; results are recomputed from them, so a stored run can never drift from its inputs. **BATCH 0 (2026-10-10): the register keeps a REFERENCE and a FINGERPRINT per document, never the document's text** — the text is read back from the department's library only when a run is built (`src/services/assessment/runHydration.ts`), so a long list of runs can no longer fill the browser's storage; a document that has since been removed is reported as "no longer held" rather than quietly lost; and each generated document is written **once per run** (`src/services/documents/generatedDocumentStore.ts` + `useGeneratedDocument.ts`), so re-opening it makes no second model call. | Database of real runs | `AssessmentService.listRuns()` — already the call site |
| A department's own documents (item 3) | **REAL — Batch B2 (2026-09-30).** The Document Library gained "This department's own documents": `.txt`, `.docx` and (Batch 4, 2026-10-05) `.xlsx` are read **in the browser** (the same extraction seam), or text can be pasted; the department's documents are kept in `localStorage["nzwisiso.department-documents.v1"]` **per department**, and every run made afterwards receives them. The seed carries a short **digest** of the documents that were really read (never their text), so the same draft with more material is genuinely a different run, and `metric-documents` plus a sentence in the summary state how many were read. A `.pdf` is recorded by name with **no text**, and the run counts it as **not read** — a file that contributed nothing cannot change the run or appear in the count. **Batch 3 (2026-10-05)** put the store behind a **mock-first `library` seam** (`src/services/documents/departmentDocumentStore.ts`): the **Local** client is what runs today and is labelled *"This browser (Local)"* on the panel; completing the **`library` capability** on the administration screen (address + key) switches the same screens to the **Shared** HTTP client with **no code change**, and `docs/SERVER_CONTRACT.md` §5 records the calls it makes. | Department documents held server-side with the department, so a whole team shares them | `src/services/documents/departmentDocumentStore.ts` (the seam) + the `library` capability in `src/config/platform.ts`; `departmentDocumentInputs()` still feeds the run |
| ZEPARI's own research documents (ZEPARI Batch C, 2026-10-07) | **REAL, kept in this browser.** Added on the research workspace (`/research/app`): `.txt`, `.docx` and `.xlsx` are read in the browser through the existing extraction seam, or text is pasted; a `.pdf` is recorded by name and marked **not read**. The list is kept in `localStorage["nzwisiso.research-documents.v1"]`, and every add and remove goes through a **mock-first seam** (`src/services/research/researchDocumentStore.ts`), labelled *"This browser (Local) — shared with nobody"*. | ZEPARI's own document server (the servers ZEPARI holds), so the institute's whole team shares them | `src/services/research/researchDocumentStore.ts` (the seam) + the `library` capability in `src/config/platform.ts`; held by validate **check 34** |
| ZEPARI's institution data-connectors (ZEPARI Batch D, 2026-10-07) | **REAL CONNECTION REGISTRY, kept in this browser.** On the research workspace (`/research/app`), ZEPARI's administrator records its own data sources (name, address, what it provides), kept in `localStorage["nzwisiso.research-data-sources.v1"]` and routed through a **mock-first seam** (`src/services/research/researchConnectorStore.ts`). **It reads NO figures** — reading needs ZEPARI's server, and the surface says so. | ZEPARI's own server reads the figures and holds the list, so the whole institute shares it | `src/services/research/researchConnectorStore.ts` (the seam) + the `library` capability; held by validate **check 35** |
| ZEPARI's grounded research chat (ZEPARI Batch E, 2026-10-07) | **REAL retrieval + grounded answer.** On the research workspace (`/research/app`), a question is matched against the research library (`src/services/research/researchRetrieval.ts`, deterministic, no clock/random) and the matching passages are shown as **sources**. A written answer is produced by the **research model** (OpenRouter, the research key), drawn ONLY from those sources, and the model is instructed never to state a figure outside them and to say when the excerpts do not answer. **With no research model connected the platform shows the sources and writes no answer** — it never fabricates one. | unchanged (the same seam once ZEPARI's server holds the library) | `src/services/research/researchChat.ts` + the `research` capability; held by validate **check 36** |
| ZEPARI's research policy brief (ZEPARI Batch F, 2026-10-07) | **REAL structure + sources + grounded draft.** On the research workspace (`/research/app`), a topic is matched against the library (`researchRetrieval.ts`) and the brief's fixed structure (`RESEARCH_BRIEF_SECTIONS` in `src/config/research.ts`) and its sources are ALWAYS shown. The words are drafted by the **research model** (OpenRouter, the research key), drawn ONLY from those sources. **With no research model connected, the structure and sources are shown and no brief is written** — it never fabricates one. | unchanged (the same seam once ZEPARI's server holds the library) | `src/services/research/researchBrief.ts` + the `research` capability; held by validate **check 37** |
| ZEPARI's Economic Barometer (ZEPARI Batch G, 2026-10-07) | **REAL records + a mock-first seam.** On the research workspace (`/research/app`), ZEPARI records its own indicator readings — a figure for one indicator in one period, which **must name the body that published it** — kept in `localStorage["nzwisiso.research-barometer.v1"]` and routed through a **mock-first seam** (`src/services/research/researchBarometerStore.ts`), grouped by indicator as tracked series. A figure is never shown without its source. | ZEPARI's own server holds the readings, so the whole institute shares them | `src/services/research/researchBarometerStore.ts` (the seam) + the `library` capability; held by validate **check 38** |
| Findings to departments (ZEPARI, 2026-10-07) | **REAL routing register + a mock-first seam.** On the research workspace (`/research/app`), a finding is recorded and routed to the departments it concerns (chosen from the 16 canonical ids), kept in `localStorage["nzwisiso.research-findings.v1"]` and routed through a **mock-first seam** (`src/services/research/researchFindingsStore.ts`). A finding is a NOTE for a human — the strict boundary holds, so it is **never read by the simulation engine**. | Delivered to each department's workspace through the platform's own channels once the shared server exists | `src/services/research/researchFindingsStore.ts` (the seam) + the `library` capability; held by validate **check 39** |
| ZEPARI's demonstration sample (ZEPARI redesign, 2026-10-07) | **REAL, clearly labelled a sample.** So no research screen opens empty, the workspace **starts with a sample**: two library extracts, ZEPARI's **real, cited** economic figures (World Bank WDI, IMF WEO, the Treasury's Public Debt Report and the 2025 Budget Review) and two findings — every screen calling it a demonstration sample, with a **Reset the sample** control. Content authored in `src/services/research/researchSample.ts`; held by validate **check 40**. | ZEPARI's own server and key replace it once connected — the sample is a demonstration aid, never a live connection | `src/services/research/researchSample.ts` (the sample); the `library` capability |

| Versions of a department's policy | **REAL — Batch A (2026-09-30).** A run may be re-run from the drafted policy (`revisionOf` on the request), and its version number is **derived** by walking that chain (`src/services/assessment/revision.ts`), never stored beside the run. The identifier of a first run is unchanged by this: the lineage segment is appended to the seed only for a re-run, and `src/test/policy-revision.test.tsx` pins a first run's seed and id to the values the pre-Batch-A composition produced. | Database of policy versions, shared across officers | `src/services/assessment/revision.ts` + `runStore.ts` |
| The officer's working copy of a drafted policy | **REAL local storage — Batch A (2026-09-30).** `src/services/documents/draftStore.ts` keeps the officer's own wording in `localStorage["nzwisiso.policy-drafts.v1"]`, keyed by the run it belongs to. Only the officer's text is stored — the generated draft is recomputed from the run — and a browser that refuses persistent storage says so on the screen instead of losing the words silently. Nothing is sent anywhere. | Shared drafts held with the run on the server, so a drafting team sees one text | `src/services/documents/draftStore.ts` (the store) + `usePolicyDraft.ts` (the screen) |
| The date shown, and a run · own date | **The fixed "reference date" was REMOVED on 2026-10-06.** It was a fixed stamp only some internal records needed; it did not date any figure (every rate and indicator carries its own period), and shown beside the live date it only confused a reader. The DISPLAY now shows the live date and time alone (`src/lib/clock.ts`, `useNow()` — the one place the real clock is read), and a run is dated with the real moment it was recorded (`AssessmentRequest.recordedAt` in `runStore.ts`). An internal `SCENARIO_ANCHOR_DATE` remains only as a deterministic fallback for a record built with no real moment (a test, a preview), and is never shown. | Stays — the display clock is real, the documents stay deterministic and byte-identical | `src/lib/clock.ts` · `src/config/reference.ts` · `src/services/assessment/runStore.ts` |
| Reference rates (ZiG, policy rate, inflation) | **Reconciled to named sources in AB-5.** `REFERENCE_RATES` holds the **published figures** and each one now names the body that publishes it (`sourceId` → `NAMED_SOURCES`: Reserve Bank of Zimbabwe for the ZiG rate and the bank policy rate; ZIMSTAT for inflation) and the **period the figure is for** (`asOf`). The reference screen prints the publisher, what the figure is and its period under every rate, and states the platform's sourcing rule. AB-5 replaced three stale placeholders that matched no published figure (13.56 ZiG, 19.5%, 8.4% — the last contradicted ZIMSTAT's own release). | Live data feed | `src/config/reference.ts` |
| Stakeholder segments | **150** canonical segments in `STAKEHOLDER_SEGMENTS` (20 with a published share and a named source, 130 explicitly `Modelled` — 36 groups were added on 2026-10-02 and 78 on 2026-10-04 for national policy drafting); each of the 16 departments models **40** of them; departments may reference these ids only | CMS / segmentation service | `src/config/reference.ts` |
| The platform's sourcing rule ("Named sources" statement) | **AB-5**, extended in **Phase AD.** `NAMED_SOURCE_STATEMENT` + `NAMED_SOURCES` in `src/config/reference.ts`, rendered by the reference screen. Four clauses, each stating a rule the platform actually follows: shares are ZIMSTAT's published census figures or labelled `Modelled`; the reference inputs name their publisher and period; **every department indicator either names the body that publishes it, the publication it is taken from and the period, or it is shown as `Modelled`**; and every cited instrument is a real Act from the consolidated Acts index. | Stays (the sourcing rule is permanent) | `src/config/reference.ts`, `src/pages/Reference.tsx` |

## 6. Non-credential work still outstanding (no credential can fix these)
- ~~Build `src/services/assessment/**`~~ — **DONE (Phase E):** interface + factory + deterministic engine + PRNG + run store.
- ~~Build the live simulation view and the assessment / executive-summary / full-assessment screens~~ — **DONE (Phase F/G):** `/app/simulations/:id`, `/app/assessments/:id`, `/app/assessments/:id/full`.
- ~~PDF / Word / print / share document actions (`src/components/assessment/DocumentActions.tsx`)~~ — **DONE (Phase G)**, and the Word caveat is **closed in Phase X: the export is now a real OOXML `.docx`**. The only remaining caveat is the PDF path, which is the browser print dialogue by design.
- ~~Derive a long-form report and a drafted policy from a completed run~~ — **DONE (Phase K):**
  `src/services/assessment/documents.ts` (deterministic), routes `/app/assessments/:id/report` and
  `/app/assessments/:id/policy-draft`, editable draft text, exported through the Phase G seam.
- **PDF text extraction (server-side).** The `.txt` half is **DONE (Phase X)**, the **`.docx` half is
  DONE (Batch D)** and the **`.xlsx` half is DONE (Batch 4)** — all three read in the browser, no server
  needed. Only **PDF** still needs a server or a parser, and it stays Mock and labelled until it exists.
- ~~Real `.docx` rendering.~~ — **DONE (Phase X):** `src/services/documents/docx.ts` + `zip.ts` write a genuine OOXML `.docx` with zero dependencies (`file` reports “Microsoft Word 2007+”). **Native PDF rendering** — beyond the browser print dialogue — is still outstanding.
- Remote assessment service endpoint + client construction in `CLIENTS` (`src/services/assessment/AssessmentService.ts`).
- Government SSO integration.
- ~~Playwright Chromium binary is not installed and no `e2e/` spec exists yet — Phase H.~~
  **DONE (Phase H):** `e2e/journey.spec.ts` exists and `npx playwright test` passes **4/4** against
  the production `vite preview` build, asserting **0 console errors** and **0 off-origin requests**.

## 6b. Verified clean in Phase D
- `npm run validate` → **PASS — all checks green** (banned copy, predictive phrasing, vendor
  terminology, determinism, network URLs, 16 department ids, scenario anchor date, disclaimer).
- Zero runtime network references in the built output (`grep -roE 'https?://' dist/index.html dist/assets/*.css` → 0).

## 6c. Verified in a real browser (Phase H)
- `npx playwright test` → **4/4 PASS** against the production `vite preview` build: home lists all
  16 departments · one-click entry · session survives navigation **and a full reload** · paste →
  Run Simulation → **Assessment Complete** → executive summary → metric drill-down →
  Print / Save-as-PDF / Download-Word (a real `…-executive-summary.doc` at the time — Phase X changed it to a real OOXML `.docx`) / Share · upload → the run
  records `source upload`.
- Every browser test asserts **0 console errors, 0 uncaught page errors, and 0 off-origin requests** —
  the built bundle provably makes **no runtime network call**, which is the strongest available form
  of the mock-first / no-CDN guarantee.
- Stated plainly: the **Phase H** journey was verified against the **local** production preview, and the
  deployment state recorded beside it at the time — that the live host was running the Phase D bundle —
  is **superseded**: the live host (`nzwisiso.bitflex.app`) was redeployed on 2026-09-28 and at that date
  **served** `assets/index-BeggQU9V.js`
  (`c3d7055dda81f0ab50e65378899635a928b73258ac06f68d3a09f9ccf818529b`), whose sha256 is **the same value
  as the local `dist/assets/index-BeggQU9V.js`** built that day, checked with `shasum -a 256` on both the
  fetched file and the local one. That is the strongest form of the claim a local machine can make, and
  the fetched file was checked for this session's work markers ("Named sources", "Structural
  relationships"). `npm run validate` now checks that this file and `PROJECT_STATUS.md` agree on the
  bundle name and carry the hash, so the claim cannot go stale in silence.
- **Status today (2026-10-07, after the hover picture was moved to begin at the BOTTOM EDGE OF THE CARDS — so a hovered tool's page is read from its own header down with nothing cut off, and the wheel over the cards slides it so the whole page is reachable; on top of the ZEPARI landing page's own status band, the home page's cards placed under the Government header above the "Internal service" line, the home page's black-and-gold identity, the earlier homepage follow-up and the platform homepage rebuild, the ZEPARI research assistant rebuilt as a real seven-section workspace, and all sixteen departments' drafts made to follow a real Zimbabwean instrument; the host and the working copy are IN STEP).**
  `nzwisiso.bitflex.app` now serves `assets/index-CbLJTe2e.js`
  (`f27347d37a7cb40430344560435ede528668a406a10e9c0166ca679c60906be3`) — the **2026-10-10 Batch A
  build** — and before that it served `assets/index-DoddAYZ5.js`
  (`58a9a2479a544288d58e9118c48d940097404718486de842bf5b9c15893df394`) — the **2026-10-07 RESEARCH ENGINE
  build** — fetched
  and hashed against the local `dist/` build (identical), and the site returns **200**, with 0 console
  errors, 0 page errors and 0 off-origin requests. The upload was `lftp mirror -R` over
  explicit FTPS, **never `--delete`** — 14 files (1 new, 13 replaced, counted from the transfer log)
  — and the SSL validation token
  (`.well-known/pki-validation/`, 25 Sep) and `cgi-bin/` were confirmed intact afterwards. **`npm run
  sync:check` reports IN SYNC.** The published bundle carries the owner's items 1–11 plus the 2026-10-02
  expansion and the 2026-10-04 dataset-expansion batches 1–4 and the PART 11 batches 1–7 — **150** canonical stakeholder groups, every
  department modelling **40** of them, and **510** reference indicators (twenty or more per department, of which
  **275 are published figures and 235 are `Modelled`**). **LOCKED GOAL MET (owner, recorded 2026-10-04; reached 2026-10-05): real,
  published figures now OUTNUMBER the `Modelled` ones — **275 published to 235 modelled** (the group goal, 20 published /
  130 modelled groups, is still ahead). `npm run validate` now fails the build if the published figure count ever falls
  back to or below the modelled count, so the goal cannot be silently undone; the batches are in `docs/PLATFORM_ENRICHMENT_PLAN.md` PART 11.** It also carries the recommended-step actions (*Open what answers this*,
  *Download this part*) and the **Implementation pack** (generated, read-only). The form that used to ask
  an officer to fill the working matrices by hand is **gone** (the owner's instruction, 2026-10-02): those
  cells print the marked blank, and the department completes them in the copy it exports. It also carries
  the **corrected sourcing sentence**
  (the shares stand on ZIMSTAT's 2022 census **and** the Public Service Commission's *Public Service
  Sentinel*), which `src/test/reference-sources.test.tsx` now gates.
  `npm run validate` prints
  the served name and the locally built name side by side on every run, so any gap shows up in the machine
  output rather than in prose.

## 6d. Verified in a real browser (Phase K — report + drafted policy)
- `npx playwright test` → **5/5**: the 4 Phase H journeys plus one that opens **Open full report**
  (asserts the purpose/reproducibility/limitations sections render) and **Draft the policy** (asserts
  Preamble and "3. Policy measures", edits the wording in the textarea, then resets). Runtime
  invariants still hold: **0 console errors, 0 page errors, 0 off-origin requests**.
- `npm test` → **8 files, 133 tests**, including 40 generator tests proving byte-identical documents
  for the same run and full coverage of every modelled group, priority, risk and recommendation.
- Known limitation: the `.doc` export is HTML-based (`application/msword`), not OOXML — unchanged
  from Phase G; and the drafted policy is a text an officer must review, not legal drafting advice.

## 6e. Verified in a real browser (Phases L + M — public entry split)
- **Phase L** rebuilt the public entry as a government-styled page: official masthead + 3px gold rule,
  coat of arms, service notice strip, tagline, four capability cards, a coverage strip computed
  from `src/config/departments.ts`, three "how it works" steps, and an official footer carrying
  **"A Project by the Ministry of ICT"** with **"For Internal Use Only"** beneath it in smaller text
  (the owner corrected "Ministry of IT" to **ICT** on 2026-10-02)
  (asserted against the **real computed font size**: 11px vs 9px).
- **Phase P** implemented the brief's §8–§16 (supplied after Phase O) and **reversed four Phase O
  decisions**. The hero now reads: eyebrow *Understanding before action*, `<h1>` "Zimbabwe AI Policy
  Intelligence Initiative", *Powered by Nzwisiso AI®*, the §8 subheading "Explore potential policy
  responses before implementation.", the §9 description, and **one** primary action ("Choose your
  Department") with the disclaimer beneath it — the secondary "See what the platform does" link is
  gone. The hero card is **POLICY ASSESSMENT → three steps** closing on the tagline. Below:
  **"A new capability for policy assessment"** with three labelled blocks, a **"From policy draft to
  policy intelligence"** governance band whose second sentence is asserted verbatim (the platform
  "does not replace policymakers or determine policy outcomes"), coverage, how-it-works, the
  deterministic band, and a restrained **ministerial positioning panel** (Hon. Tatenda A. Mavetera, MP)
  carrying "Powered by Nzwisiso AI®". `npm test` → **9 files, 150 tests**; `npx playwright test` →
  **6/6**; `npm run validate` → **10/10** (check 3 now also blocks LLM/API vocabulary in user-facing
  copy). One refinement was made *after* inspecting the render, as §21 requires: the governance band's
  text was raised to 14px so it out-ranks the technical note beside it.
- **Phase O** (superseded by Phase P) re-positioned and refined the page: the `<h1>` became
  **"Zimbabwe AI Policy Intelligence Initiative"**, the eyebrow the service principle, the masthead
  right **"Zimbabwe AI Policy Intelligence"** and the subtitle **"Policy Intelligence Platform"**;
  `BRAND.workspaceLabel` was **deleted**. Its hero card held a 6-step workflow — Phase P replaced that
  card at the brief's instruction. Recorded because the reversal was deliberate, not a correction.
  `npm test` → **9 files, 147 tests**; `npx playwright test` → **6/6**, now also asserting the
  workflow's 6 steps, the closing boundary line, the h1 rendering in ≤3 lines at ≥30px, and the
  principle rendering smaller than the h1. `npm run validate` → **10/10**, including a new check that
  **measures** the contrast of every rendered colour pair and fails the build if one drops below its
  floor. That check exists because the palette it inherited had eight failing pairs, two of which are
  invisible by eye (secondary copy 4.45:1 on white; gold hairlines **1.38:1**). All now pass at AA;
  one known-red is recorded rather than fixed (see PROJECT_STATUS.md → Known-red).
- **Phase M** split that entry into **two** public screens, because a landing page that also contains
  the department picker is not a landing page:
  - `/` — **pure landing page**. Asserts it holds **no department picker**.
  - `/start` — **Choose your Department**, the 16-department picker (session banner,
    `Selected: …`, `Enter <department>`, *Overview* back-link).
  - Both render through one shared chrome component (`src/components/public/PublicPageShell.tsx`).
- `npx playwright test` → **6/6** against the production `vite preview` build, entering through the
  two-step flow, including the new test *"the landing page hands off to the chooser, which lists all
  16 departments"*. Runtime invariants still hold: **0 console errors, 0 page errors, 0 off-origin
  requests**.
- `npm test` → **9 files, 143 tests**. `npm run validate` → all 9 checks green.
- **Phases L+M+N together:** `npx playwright test` → **6/6**; `npm test` → **9 files, 144 tests**;
  `npm run validate` → all 9 checks green. The landing page has been rendered at 1440×900 and
  390×844 and inspected as images (two columns / single column, CTA above the fold, nothing clipped).
- **Operational note (updated 2026-10-07):** `npm run dev` serves at **http://localhost:5180/** —
  `vite.config.ts` pins `server.port = 5180` with `strictPort: true`, this project's **OWN** port under the
  global rule `unique-dev-port-per-project.md`. It used to be 8080, which **five other projects also
  pinned**, so two dev servers collided and one project's page appeared at another's address. Opening 5173
  or 8080 no longer shows this project.
- Stated plainly: the Phases L+M+N work recorded here was verified against the **local** production
  preview. That deployment note is **superseded** — see §6c: when it was written the live host
  (`nzwisiso.bitflex.app`) served the Phase D bundle, and the live host was redeployed again in **R7**
  (2026-09-29).

## 6f. Verified in a real browser (Phase R — what the engine does with a draft)
- **Phase R** added the public **"What happens behind the assessment"** section (`#behind-the-assessment`),
  between the capability cards and *How it works*, so the page cannot be read as "upload a document,
  receive an answer". It states the brief's four strings verbatim (heading, supporting statement —
  "One policy draft can generate a much larger analytical environment." — the explanation, and the
  transition to the officer's journey), then **five approved scale indicators**, then a two-column
  body: the **eight-stage process** (policy draft → policy understanding → knowledge map → simulated
  population → agent interactions → scenario run → policy intelligence → policy assessment) and the
  compact **simulated-environment schematic** with a **140**-mark agent field (40 before Phase AA).
- **Measured in the browser, not eyeballed:** h2 24px/600 vs the statement's 20px; five indicators on
  one aligned row at 1440 and 1024 (the `Scenario-based` figure wraps, so its height is reserved —
  without the reserve its label sat 16px low, which the render caught); columns 559/505px of 1104
  (**50.6% / 45.7%**); **no horizontal overflow** at 1440, 1024 or 390; no overlapping blocks; the
  agent field's motion is the app's existing `slide-up-fade`, **0.15s, one iteration** (not a loop),
  `motion-reduce:animate-none` honoured; **0 console errors and 0 off-origin requests**.
- **Language guards:** the rendered section contains no API/LLM/agent-based/knowledge-graph/
  embeddings/inference/PRNG/seed/orchestration vocabulary and no predictive claim (word-level test +
  browser check). The five indicators are **conceptual**, not measured counters, and the population
  figure is written once (`SIMULATED_AGENT_FIGURE`) and read by both the strip and the diagram.
- `npm test` → **9 files, 158 tests**; `npx playwright test` → **7/7** (now including a 390px
  no-sideways-scroll test); `npm run validate` → **PASS**.
- **Public copy change to note:** the landing page no longer prints the words "scenario mode (Mock)"
  (§16 rewrote that band to "Structured and repeatable… generated locally from the defined policy
  scenario and reference configuration"). The mock marker is still visible where the connection is
  shown — `Entry: one-click (Mock)` in the workspace header, `Scenario (Mock)` in engine status,
  `Engine … (Mock)` on the assessment and every export — and the notice strip still states that
  results are modelled and labelled as simulated. Nothing on the public page implies a live service.

## 6g. Verified in a real browser (Phase S — the graph relationship visualization)
- **What it is:** inside a run, the left column is the **Graph Relationship Visualization** card — the
  draft, the stakeholder groups the run models, the stated priorities and the department's reference
  documents, with the round each mark appears on read from the run's own event record. It is **fully
  arranged on the first paint** (the layout is computed synchronously), then grows one round at a
  time, and every mark can be **dragged**, with the surrounding nodes parting and closing again.
  On the public page the same graph appears in **compact** form inside the *Simulated population*
  block, drawn from the representative department `opc` and captioned in words as such.
- **No new dependency and no schema change:** the graph is a **pure function of the run**
  (`src/services/assessment/network.ts`); `AssessmentRun` in `types.ts` is untouched, so the
  mock → real (MiroFish) swap still only has to produce runs. The layout physics and the SVG renderer
  are hand-written (`src/lib/graph/swarm.ts`, `RelationshipGraphCard.tsx`).
- **Determinism:** seeded layout, fixed `dt = 1/60` steps, no `Math.random`/`Date.now`/`new Date`; a
  repeated run produces a byte-identical graph, and a re-settled swarm lands on identical
  coordinates. Both are asserted, not assumed.
- **Accessibility, verified in the DOM — four independent channels (sharpened in Phase AB-1):** a
  mark's **shape** carries its kind (the draft a ring, a group a circle, a priority a square, a
  document a diamond), its **fill** carries the group, its **size** carries its weight, and its
  **written label** is always drawn beside it — so nothing on the surface is carried by colour alone,
  which is the point: **one in 25 African males (4%)** is red–green colour-blind (Okabe & Ito,
  *Colour Universal Design*). The legend draws each kind **as its own shape** (`MarkSwatch`) and states
  *"Shape is the kind · colour is the group"*. Because the palest group fill measures only **1.32:1**
  against the white card, **every filled mark carries a pinned ink outline**, and a guard measures every
  fill against the real `--card` token parsed out of `src/index.css`. (`--warning` and `--gold` are the
  same value in this palette, which is why the kinds are never separated by token colour alone.) Every
  mark is a `role="button"` with an accessible name, operable by keyboard; selecting a mark states
  **all** of its relationships as text; the SVG's edge labels are `aria-hidden` because the panel is the
  same information, read once; `prefers-reduced-motion` starts no animation and keeps drag interactive.
- **Measured, not eyeballed:** settled layouts for five departments keep every pair of marks
  **≥ 88 units** apart inside the 1000×750 virtual frame; the model reaches a **true rest** (600
  further steps change nothing) in 249–2570 steps; the compact form draws at `visualScale` 1.6 so its
  labels are legible in the smaller card. **Phase AB-1 added the measurement that mattered most:** in
  the real browser at 1280 / 900 / 640 px the draft's ring paints **2 px**, a group's outline **1.25 px**
  and an edge **1.36 px** at *every* width — against **0.56 / 0.99 / 0.67 px** for the outline before
  the fix, which is the sub-pixel grey line that was reported.
- **Runtime (re-run on the Phase AB-1 bytes):** `npm run validate` **PASS**, `npm run typecheck` exit 0,
  `npm run lint` 0 errors, `npm test` **296/296 (23 files)**, `npm run build` ✓, `npx playwright test`
  **10/10** with **0 console errors and 0 off-origin requests** per test. The graph's browser test
  asserts the graph is incomplete at the start, grows on its own while the rounds run, states exactly the
  declared number of relationships on selection, keeps edge labels off until asked, moves a mark by drag,
  and is complete when *Assessment Complete* appears; the newest test measures the stroke weights at
  three card widths.
- **Making the reveal longer is what makes the growth visible:** `ROUND_TICK_MS` went **320 → 1150 ms**
  (exported as `RUN_ROUND_TICK_MS`), so a run now takes ~10–18 s. The unit test that drives the reveal
  derives its step count from that exported constant instead of hardcoding one, and additionally
  asserts the counter reaches `n / n rounds`.

## 6h. The agent population is now a modelled figure, drawn as far as it can be (Phase AA)

**What changed and why it matters for go-live.** The platform's copy promised "thousands of agents"
and "1,000+" while the graph drew 6–15 circles. That is a claim without a model behind it, and a
Minister who counts would find it. Phase AA made the population **real and singular**:

- `src/services/assessment/network.ts` now models a population of **2,000–3,200 agents per run**,
  drawn from the run's own seed, and splits it across the modelled stakeholder groups.
- The **caption, the on-screen figure and the marks drawn** are all derived from that one record
  (`AgentPopulation`), and `marks` is read from the field actually drawn — so the words can never
  claim a different number of marks from the ones on the screen.
- The field is **capped** (**320** marks on the full card, **140** on the compact one — lowered from
  600/180 in Phase AB-1, because 600 marks of one colour merged into a smudge) and, whenever the cap
  bites, the card says in plain words how many agents one mark stands for
  (*"Each mark stands for about 8 agents"*). This is deliberate: drawing one vector mark per agent at
  this population would be a smudge, not a picture.

| Item | Status now | What replaces it | Where it is entered |
|---|---|---|---|
| Modelled agent population (2,000–3,200 per run) | **Mock / scenario mode** — a seeded modelled figure, **not** a measured count of real people | The engine's own agent count, reported per run | `buildAgentField()` in `src/services/assessment/network.ts` — one function, no UI change |
| Split of the population across stakeholder groups | **Mock / scenario mode** — seeded weights, so group sizes differ believably but are not real census shares | Real population shares per segment | same function |
| Drawn marks (320 / 140 cap) and the stated ratio | **Presentation, deliberately capped** — an honesty device, not a limitation of the model | Nothing: a real engine with the same population should keep a cap and keep stating the ratio | `AGENT_MARK_CAP`, `AGENT_COMPACT_MARK_CAP` in the same file |

**Verified in a real browser (Chromium, built preview) — re-measured in Phase AB-1 after the caps
changed:** the public page reads **2,763** modelled agents over **140** marks (the compact cap exactly,
at both 1440 px and 390 px); a Finance-department run reads **2,495** agents over **274** marks and
*"15 / 15 entities"*, captioned *"Each mark stands for about 8 agents"*. (The Phase AA figures were
2,763 over 180 marks and 2,191 over 495.) Guards: 10 palette guards, 19 card tests and real-DOM counts
in `e2e/journey.spec.ts`.

**Outside the estate:** front-end only, so the deploy rule is unchanged — a new build must actually be
deployed before it is presented. **The claim made here when it was written (that the live host was still
on the Phase S bundle) is superseded:** the live host was redeployed on 2026-09-28 and at that date
**served**
`assets/index-BeggQU9V.js`
(`c3d7055dda81f0ab50e65378899635a928b73258ac06f68d3a09f9ccf818529b`) — the same file the local build
produced that day — and it was redeployed again in **R7** (2026-09-29). Later work rebuilt the bundle,
which left the host behind at that point; the **truth-sweep session published `assets/index-BgYDS9X7.js`**
(`bba26a71cb41038120a1079dc6f37ce241c07c9ac820ea5d09bab0a66b4bbcc5`). **Batch A then changed source again**,
which produced `assets/index-BrYtdYWT.js`, and the host was one build behind until it was redeployed again;
**the current deployment state is stated at §6c above.**

## 7. Disabled by default (deliberate)

- Puter CDN script and `puter.ai.chat()`: **fully removed.** Phase B deleted the
  `<script src="https://js.puter.com/v2/">` tag from `index.html`; **Phase D deleted the
  remaining dead `puter` reads from `PolicyInput.tsx`**, so no third-party AI call can occur
  and the vendor-term validator reports zero hits.
- Non-determinism: **fully removed in Phase D.** The two `Math.random()` calls (agent-feed
  stream delay, parse progress) are gone; `npm run validate` now passes the determinism check
  with zero hits in app source (one hit remains in stock `src/components/ui/sidebar.tsx`, which
  is excluded as non-app stock code).
- Google Fonts CDN: **removed** in Phase B. Inter and JetBrains Mono are now self-hosted from
  `public/fonts/` via `src/fonts.css`. Verified: `grep -roE 'https?://' dist/index.html
  dist/assets/*.css` returns zero matches, so the built application makes no runtime network
  request of any kind.
- Note on the fonts: Google served the *same* variable woff2 for every requested weight
  (confirmed by md5), so the build ships one file per family with the full weight axis declared,
  rather than four identical copies of Inter.

## 8. Production hosting / deployment (Phase J — DONE)
| Item | Current value | Notes |
|---|---|---|
| Live URL | `https://nzwisiso.bitflex.app/` | HTTP 301s to HTTPS. Verified 200 serving the app |
| Docroot | `/home/bitfempm/nzwisiso.bitflex.app` | FTP account is chrooted directly into it |
| FTP host | `ftp.bitflex.app` (`162.0.232.207`) | **NOT** `ftp.nzwisiso.bitflex.app` — that host does not resolve |
| FTP user | `nzwisiso@nzwisiso.bitflex.app` | cPanel account |
| Transport | Explicit **FTPS** (AUTH TLS), port 21 | No SSH/SFTP daemon exists (22/2222/990 closed) |
| SPA routing | `public/.htaccess` → `RewriteRule . /index.html [L]` | Shipped by Vite into `dist/`. Without it, refresh on `/app/**` 404s |
| Server files to preserve | `cgi-bin/`, `.well-known/pki-validation/<token>.txt` | Never deploy with `mirror --delete`. `scripts/deploy.sh` may delete **only** `assets/index-<hash>.js` / `.css` files the site's own `index.html` no longer names, and it deletes nothing at all if it cannot read those names |
| Stale bundle files | Removed by `npm run deploy` from 2026-10-10 | Before that, every past build's `assets/index-….js` stayed forever; after ~84 of them the account had **no room left** and the host began refusing writes (FTP `451`) — this was the root cause of a whole failed publishing session |
| Credentials | **`.env`** (gitignored, mode 600): `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_REMOTE_ROOT` | Added Phase Q so a cold session never has to ask again |

**Redeploy command (no questions asked, reads the gitignored `.env`):**
```bash
cd "policy-nexus" && npm run build && npm run deploy && npm run sync:check
```
**`npm run deploy` was rewritten on 2026-10-10 (and this note replaces the old `lftp` snippet).** The
previous one-liner used `lftp … mirror -R`, which on this host **hangs** — it would sit asleep with only
the control connection open and never finish. It also never deleted, which is how the account filled up.
The script now publishes with **`curl`** over the same explicit-FTPS connection and:
- sends each file **slowly** (`--limit-rate`, default `2k`; override with `DEPLOY_RATE`), because this
  host **silently truncates a fast upload** — a 73 KB file arrived as 16 KB, a 24 KB PNG as 8 KB;
- **checks every file after it lands** (same size; same fingerprint for files under 64 KB, since
  `index.html` can be rebuilt to the same size with different content) and finishes a part-sent file with
  `curl -C -` rather than restarting it;
- connects by the **resolved address**, because name resolution proved flaky under load;
- **prunes** old `assets/index-<hash>.js|.css` files the site's `index.html` no longer names — with a
  guard that deletes nothing if it cannot read those names.

The two safety rules are unchanged: **the target is `/`** and **we never delete anything this build did
not put there** (`cgi-bin/`, `.well-known/` remain untouched). Verified the same day: `bash -n` clean; a
dry-run of the keep/delete decision kept the two live bundles and removed a simulated old one; a real run
finished with **`removed 0 old bundle file(s)`** and nothing to upload; `npm run sync:check` printed
**IN SYNC** with the served bundle's fingerprint matching the local build.

**Credential status (updated in Phase Q):** the FTP credentials are stored in the **gitignored
`.env`**, so the deploy is repeatable without asking. The password was supplied in plaintext in chat
and has since appeared in transcripts more than once, so **rotating it in cPanel → FTP Accounts
remains good practice** — but it is never committed, and a build-time check confirms it does **not**
reach `dist/` (Vite exposes only `VITE_`-prefixed variables).

**Deployment history (2026-09-26): the host was on the Phase S bundle —**
`assets/index-qUyirbLr.js` + `assets/index-tZ1V4AO9.css`. Deployed upload-only (10 files, 1.41 MB,
2 new / 8 modified) with **no `--delete`**; `.well-known/pki-validation/01a0d6ee-…f00d.txt` and
`.htaccess` verified intact afterwards, and the live origin verified in a real browser: **2/2 checks
green, 0 console errors, 0 off-origin requests** (homepage carries the Phase R section and the Phase S
graph; chooser lists 16; one-click entry reaches the dashboard). Prior deployment (Phase Q) served the
**Phase P** bundle — `assets/index-u0q4jdaO.js` + `assets/index-CQrURZPQ.css`.

**Password handling rule for future sessions:** `ftp.nzwisiso.bitflex.app` (the hostname cPanel
displays) has **no DNS record** — verified against two public resolvers. The working host is
`ftp.bitflex.app`. Do not switch `.env` to the cPanel hostname unless a CNAME is created for it.

**Non-credential work still outstanding for hosting:** none required for the current static
build. If server-side PDF/DOCX extraction or the MiroFish backend is added later, that needs a
Node/PHP service endpoint — the current host serves static files plus `cgi-bin/` only.

## 9. Platform administration and live capabilities (Phase Y)

One screen, **not linked from any officer-facing page**, reached only by its address:
`/platform-admin`. The address is defined once as `ADMIN_ROUTE` in `src/config/platform.ts`,
so it can be re-homed behind a production URL by changing one line.

| Capability | Where it is entered | Simulated today | Live means | Client wiring |
|---|---|---|---|---|
| Assessment service | `/platform-admin` | scenario engine, `Scenario (Mock)` labels | `POST <endpoint>` returning a complete `AssessmentRun` | **BUILT AND CONNECTED (Phase Z)** — the run path now waits; the register, the run view and every assessment screen use it. While simulated the engine answers in the same render, so nothing appears to wait |
| Drafting model (OpenRouter) | `/platform-admin` — the **OpenRouter address** (prefilled), the **OpenRouter key**, and the **model** (any OpenRouter model id) | the platform's own deterministic generator (`src/services/assessment/policyDraft.ts`), driven by the department's own prompt library — so the workspace drafts with **no network at all** | an OpenRouter **chat-completions** call: `POST {model, messages}` → `choices[0].message.content` | **BUILT AND CONNECTED (2026-10-06)** — `useGeneratedDocument` calls `remoteDraftingClient`, which now speaks OpenRouter: it builds the prompt from `buildDraftingGrounding`, sends it, and turns the model's JSON answer into the document, **rejecting a malformed answer**. With nothing configured the local generator runs. The report and drafted-policy screens wait only when the capability is live, and **the citations are verified before the draft is shown, whoever produced it** |
| Research model (OpenRouter) | `/platform-admin` — the **ZEPARI research key** (entered separately from the drafting key) and the **research model** (any OpenRouter model id); the OpenRouter address fills in automatically | **nothing is sent anywhere** — the research assistant's screens are not built yet, so the card only holds the key | an OpenRouter **chat-completions** call made by the ZEPARI research assistant, metered against this **separate key** | **KEY CAPABILITY BUILT (ZEPARI Batch A, 2026-10-07)** — the second capability ships, defaults to simulated, requires a key **and** a model, and flips with the ONE platform-mode control; the screens that call it are the next ZEPARI batches. Held by `scripts/validate.mjs` **check 32** |
| Document text extraction | `/platform-admin` | `.txt` read in the browser; PDF/DOCX recorded by name | `POST <endpoint>` returning `{ text }` | **BUILT AND CONNECTED (Phase Y)** — `httpExtractionClient.ts`, reached only when the capability is live and complete |
| Government sign-in (SSO) | `/platform-admin` (issuer, client ID, redirect address, department claim) | one-click entry, `Entry: one-click (Mock)` | OIDC Authorization Code + PKCE against `<issuer>/authorize` and `<issuer>/token` | **BUILT AND CONNECTED (Phase Z)** — `/auth/callback` completes the exchange and reads the configured department claim. **A browser cannot verify the provider's signature**; a server must do that before real use, and the screen says so |

**The platform side is finished (Phase Z).** Nothing further needs building here: the only
remaining work is the services themselves, and each is used the moment its details are entered
above and the capability is switched on. While nothing is configured the platform stays simulated
and makes no request at all — and while simulated it answers in the same render, so no screen
waits and no spinner appears.


**Rules the screen enforces** (all verified by tests): a capability is `live` only when BOTH its
mode is switched on AND every required field is present; a half-configured capability reports
`misconfigured` and the platform keeps using the simulated implementation; every capability
defaults to simulated; nothing is constructed, fetched or called while a capability is simulated.

**Stated in the screen, not hidden from it:** credentials are held in this browser's local
storage and are readable through developer tools. Production requires a server-side proxy.

**The administrator gate (2026-10-06).** The screen sits behind a gate that asks one plain question
— *"Are you the administrator?"* — before it will show the settings, and remembers the answer for the
browser tab only (`src/session/adminAccess.ts`; the route is wrapped in `src/App.tsx`; held by
`scripts/validate.mjs` check 27). **It is honestly labelled as NOT real security:** because the whole
platform runs in the browser, the note on the screen says plainly that anyone who reaches the address
can confirm the same question too. It stops a casual visitor; it does not stop a determined one. **Real
authorisation needs the funded server and sign-in (§ the funded build steps)** — and when that exists,
the gate is replaced by changing the one module, with no other file touched (the same mock-first seam
the sign-in and document-library connections use).

**The administration dashboard and the ONE platform mode (2026-10-06).** The screen now leads with a
dashboard whose figures are all **DERIVED from real platform data** (never invented): a KPI row, six charts
built with **`recharts`** (an owner-approved dependency), recent-runs and recent-cases tables, and the
connection states. Measures only a server can know — active users, visits and geography, model/token cost,
uptime — are shown as a clearly-marked **"connects with the server"** panel rather than a fake number. A
single **Simulated ⇄ Live** switch (`platformMode` in `src/config/platform.ts`) sets the whole platform at
once: **Simulated** runs the scenario engine and shows its results; **Live** uses only real services and
shows **nothing** where a service is not connected — never a simulated figure dressed up as real. It also
simplified the drafting setup to **a key plus a searchable model picker** (default
`deepseek/deepseek-v4.1-flash`). Held by `scripts/validate.mjs` **check 30**.
### 9b. Landing page content and brand marks (item 9 — Batch C, 2026-09-30)

The same screen, reached the same way, carries **Landing page content**: the public landing page's
authored wording, the masthead mark and the browser-tab icon.

| What | Where it is entered | Kept where | Published to other visitors? |
|---|---|---|---|
| Landing page wording (authored sections) | `/platform-admin` → *Landing page content* | `localStorage["nzwisiso.content.v1"]` in this browser | **No** — browser-only until a server exists |
| Masthead mark | `/platform-admin` (image upload → data address) | same store | **No** |
| Browser-tab icon | `/platform-admin` (image upload → data address) | same store | **No** |

**The go-live note that matters:** a change made here is seen **only in the browser that made it**.
To change the wording every visitor sees, either (a) edit the default in `src/config/content.ts`
and redeploy, or (b) add a server that serves the override to everyone. There is no server today, so
option (a) is the shipping path.

**Not editable from the screen, on purpose:** the brief-fixed sentences (the governance sentence, the
engine explanation, the sovereignty statement, the service principle), the identity strings (product
name, entity, tagline — `index.html` must stay equal to `brand.ts`, which `npm run validate` checks),
and the official Coat of Arms file (validate pins its sha256). The screen shows each of these
read-only, with the reason.



**What a key alone cannot do:** PDF/DOCX extraction needs a server; sign-in needs a provider
registration (issuer, client ID, redirect address) rather than a key; and the assessment and
drafting clients need the run path to become asynchronous before they can serve a screen.
`docs/SERVER_CONTRACT.md` specifies exactly what each service must implement.
