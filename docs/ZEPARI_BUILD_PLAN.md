# ZEPARI BUILD PLAN — the two-product platform, built in ONE pass

Written 2026-10-07 at the owner's request, so a brand-new chat can start the build by typing
**"continue where you left off"** with no history and no clarifying questions.

**Read order for the next session:** `PROJECT_STATUS.md` (its RESUME HERE block) → **this file** →
the files named in each Stage. Then start at **Stage D** (the UI options the owner must choose).

This file SUPERSEDES `docs/NEXT_SESSION_PLAN.md` for new work; that older file records the
drafted-policy series, which is **DONE**.

---

## 0. What we are building, in one paragraph

ONE platform, TWO assistants:
- **Nzwisiso Policy Simulation Assistant** (the department / government side — today's platform, unchanged).
- **ZEPARI Policy Research Assistant** (the research side — ZEPARI's own evidence, answerable, publishable, discoverable).

They are kept **private to each other**, and share **only what a researcher deliberately publishes**,
through a controlled bridge called **The Evidence Exchange**. The research side **never feeds a figure
into the deterministic simulation engine** (the project's strict, locked boundary).

The whole point: make ZEPARI's job easier — take a finding from question → brief → published → in the
hands of the departments that act on it → cited and findable — from **one dashboard**, at **no per-use
AI cost** for the core.

---

## 1. STRICT RULES (LOCKED — do not change, do not re-ask)

1. **Pitch deck stays `.pptx`** (PowerPoint **and** Google Slides). **Proposal stays `.docx`.**
   Regenerate both with **pandoc 3.8.3** (`pandoc` is installed; LibreOffice is NOT). Never a PDF or an
   HTML slide deck. Speaker notes are the `::: notes` blocks.
2. **Logos:** the **ZEPARI logo** on the ZEPARI side; the **government Coat of Arms** on the Nzwisiso
   (department) side; the front-door choice page shows **both**.
   - Coat of Arms already in repo: `src/assets/zimbabwe-coat-of-arms.png` (sha256
     `8946d6e4396744bb1b7f6b03c07c1e9e1b2248d6f9d3c4e31864f01bfe496a3b`), pinned by validate.
   - ZEPARI logo source: `https://zepari.co.zw/sites/default/files/new%20logo_0.jpg` (HTTP 200; a JPG —
     clean the white background if needed, and look for a better/larger mark).
3. **Colour themes:** ZEPARI side = ZEPARI **blue + gold**; department side keeps **emerald + gold**.
   ZEPARI's real palette (read from their own stylesheet): blue `#3686d6` / deep navy `#1e4098` /
   light `#0094f0`; gold `#b58328` / lighter `#d2ac67`. Department palette stays as `src/index.css`.
   **This revises the old "never change the palette" rule at the owner's instruction.**
4. **Department side is untouched** — behaviour, tests, the shared dashboard layout, the emerald identity.
5. **No plumbing shown to the researcher** — never "Local model / Cloud model". The researcher only sees:
   ask → a structured, cited answer. The engine choice lives in administration and the records only.
6. **Nothing invented. Ever.** Every answer/figure comes from a real, named, published source, cited on
   screen (data-must-be-real-sources rule).
7. **The research side never feeds a figure into the deterministic engine.** A shared finding is a NOTE
   for a human, shown as evidence while drafting — never engine input.
8. **No new runtime dependency without the owner's approval.** The free, open-source, in-browser models
   (Stage B) are approved.
9. **No runtime network when nothing is configured** — the platform stays simulated and contacts nothing
   until an administrator configures a capability.

---

## 2. The value story, and the ZEPARI landing-page copy

**North star:** *ZEPARI's own evidence, instantly answerable and publishable in their own house style —
privately, in the browser, free to run.*

**Landing headline (recommended):** "Zimbabwe's economic evidence — from question to policy."
*(Alternates: "Ask. Draft. Publish. Be found." · "One dashboard for Zimbabwe's policy research.")*

**Standfirst:** "The ZEPARI Policy Research Assistant turns the institute's own evidence into answers,
briefs and publications — and puts them in front of the people who make policy. One dashboard, from the
first question to lasting impact."

**The four-move loop (one strip):** Ask · Draft · Publish · Reach.

**Capability cards** (each maps to a real surface — never promise what is not built):
- Answers from ZEPARI's own evidence (cited; nothing invented).
- Briefs in ZEPARI's house style (Abstract · Context · Objectives and Methods · Findings · Recommendations).
- The Economic Barometer, kept current (every figure named to its publisher).
- One-click Publish Pack (brief + press release + social posts + newsletter line).
- Connect and publish (website, Facebook, X, YouTube) — sign in once.
- Share with government (notice board + an inbox per ministry / Parliament committee).
- Citable and discoverable (a permanent citable link; push to RePEc, SSRN, Zenodo, Google Scholar).
- See it land (sent → opened → cited).
- Private and sovereign (ZEPARI's data stays ZEPARI's).

**Trust lines:** "Oreida Pvt Ltd cannot read any research." · "The monthly fee covers the AI usage." ·
"The research assistant and the simulation engine are kept apart."

---

## 3. The "Built for Government" page (its own page on the site — copy)

Tie to the Ministry of ICT's own material (verified on ictministry.gov.zw, 2026-10-07):
- **Ministry vision (their words):** "A connected knowledge-based society with secure information
  systems by 2030."
- **Documents they publish and host:** National ICT Policy 2022–2027 · Cyber and Data Protection Act
  (Chapter 12:07) · National Broadband Plan 2023–2030 · Postal and Telecommunications Act · a
  **Zimbabwe National AI Strategy** (an 83 MB PDF).
- **Digitalize Zimbabwe** (the programme the proposal already names) · **Vision 2030** (upper-middle-income
  economy by 2030) · Ministry pillars including **Governance and Institutional Strengthening** and
  **Human Capital Development**.

**Hero:** "From evidence to decision — one platform for Zimbabwe's policy work."
**Standfirst:** "The Nzwisiso Policy Simulation Assistant lets a department test a draft policy before it
is implemented. The ZEPARI Research Assistant provides the evidence behind it. Together they carry a
policy from research to decision — in step with Vision 2030 and the Ministry's vision of a connected,
knowledge-based society with secure information systems by 2030."

**Two assistants:** Nzwisiso = test before you implement · ZEPARI = the evidence behind it · one shared purpose.

**How they work together (the owner's three points, plus the rules):**
- Evidence reaches the policy desk.
- The policy desk can ask the evidence desk.
- Private by design.
- The rules, one line each: each side keeps control of its own data · only the minimum is shared · shared
  items are for a person to read, never for the machine · every item keeps its source · a record is kept of
  what was shared, to whom and when.

**Why it serves Government:** Vision 2030 · Ministry vision · National ICT Policy 2022–2027 · Cyber and
Data Protection Act (Ch. 12:07) · Zimbabwe National AI Strategy · Digitalize Zimbabwe.

**What Government gets:** faster evidence-based policy drafting · a sovereign, reproducible core (no
dependence on a foreign AI service) · a reusable national evidence base.

**Trust section + closing CTA:** "See the platform in a live demonstration."

---

## 4. The interoperability — "The Evidence Exchange" (grounded in real best practice)

Sources checked 2026-10-07: **IDSA (data sovereignty)** — organisations keep control of their data while
sharing it safely; **ICO data-sharing principles** — data minimisation, purpose limitation, transparency,
security, accountability; **NCSC zero trust** — least privilege, verify explicitly.

Seven rules:
1. Sovereign by default — nothing crosses unless a researcher explicitly publishes it.
2. Minimise — only the specific items selected cross, never the whole library.
3. Purpose-limited — a shared item is evidence for a human drafting a policy; never engine input.
4. Least privilege — shared to named departments only; a department sees only what was shared with it.
5. Provenance — every shared item carries its source (ZEPARI, the document, the date).
6. Auditable — a record of what was shared, to whom and when.
7. Separate identities — the two products keep separate sessions; the Exchange carries data, not logins.

Two directions:
- **ZEPARI → departments:** a researcher publishes a finding/brief/Barometer reading to named departments;
  the Nzwisiso workspace shows an "Evidence from ZEPARI" panel, cited, and the officer can attach a citation.
- **Departments → ZEPARI:** a department sends a question (or a draft); it lands in ZEPARI's request inbox
  and is answered from the library.

Existing seams to build on (do NOT duplicate): `src/session/researchSession.ts` (separate on purpose),
`src/services/research/researchFindings.ts` ("a note for a human, never a figure fed into the simulation
engine"), `researchFindingsStore.ts` (`local | shared`), `docs/SERVER_CONTRACT.md` (department-scoped).
Honest limit: the cross-machine Exchange needs each side's server (already recorded); demo it with the
mock-first seam and label it plainly.

---

## 5. The build stages (one pass)

**Stage A — Documents.** Load ZEPARI's real corpus as cited text in the repo (do NOT dump the 300+ PDFs
into git): policy briefs in full; working-paper abstracts + key sections; Economic Barometer volumes;
plus the Zimbabwe policy documents already researched. Sources (real PDFs, verified 2026-10-07): the
`/publications/policy-briefs`, `/publications/research-studies` and `/publications/economic-barometer`
pages on `zepari.co.zw`. Use PyMuPDF (installed locally as a research tool, NOT a project dependency) to
extract text; store as data files; cite each document.

**Stage B — The engine.** Answers from the library WITH OR WITHOUT AI.
- **Default (free):** a small open-source model runs IN THE BROWSER (Transformers.js — semantic search
  `Xenova/all-MiniLM-L6-v2` ~25 MB + extractive QA `Xenova/distilbert-base-uncased-distilled-squad`
  ~65 MB; optional small instruct model e.g. SmolLM2/Qwen2.5 for fuller prose). Fetched from our own site;
  no key, no cost, nothing to install. Confirm exact model names/sizes at build time.
- **Upgrade:** OpenRouter (paid) — the same structure, expanded prose. Never shown to the researcher.
- **Retrieval:** semantic + the ACRONYM FIX (do not drop words under 4 letters; use a stop-word list so
  ICT, RBZ, GDP, DSGE match).
- **Output = a ZEPARI-standard research note:** Question · Abstract · Context · Objectives and Methods ·
  Findings · Policy Recommendations · Sources · "not covered".

**Stage C — Features.** Ask · Library · Policy Brief · Economic Barometer · Findings→department ·
Data sources; PLUS: Publish Pack, one-click Connect (website/Facebook/X/YouTube), notice board + inbox,
citable & discoverable outputs (a DOI via Zenodo; push to RePEc/SSRN/Google Scholar), impact record,
"we already said this" reuse guard. Each behind a mock-first seam; label plainly what needs ZEPARI's
log-in or server.

**Stage D — UI (START HERE for the owner).** Build THREE options in ZEPARI blue+gold with the ZEPARI logo
(department side keeps emerald + the coat of arms): (1) "The Research Desk" (light, editorial); (2) "The
Analyst's Terminal" (dark, dense, data-forward); (3) "The Evidence Lab" (light dashboard, charts first).
Screenshot each at laptop and phone size; OPEN the screenshots; WAIT for the owner's choice; then build the
chosen one fully. Include the "Built for Government" page (§3).

**Stage E — The Evidence Exchange** (§4), shown on both sides.

**Stage F — Proposal + deck.** Update `docs/PROPOSAL_PROMPT.md` (one source of truth), then regenerate
`Minister Submission/Oreida_Proposal_Minister_of_ICT.docx` and `Oreida_Pitch_Deck_Minister_of_ICT.pptx`
with pandoc — FORMAT UNCHANGED (`.docx` / `.pptx`). Add: the two-assistant platform, the interoperability,
discoverability, and the alignment facts (§3).

**Stage G — Prove & lock.** Gates for the answer structure, the acronym/semantic match, the in-browser
engine and the design system; mutation-prove each; full suite
(`npm run validate && npm run typecheck && npm run lint && npm test && npm run build`, then
`npx playwright test`); publish (FTPS `lftp … mirror -R --only-newer`, never `--delete`); refresh the ONE
review zip (`Review Zip/nzwisiso-policy-dashboard-review.zip`, no `.env` inside); update `PROJECT_STATUS.md`.

---

## 6. UI design detail (frontend-design method, within the locked identity)

Concept: an economist's instrument — the answer IS a research brief, its evidence always beside it.
- **Colour discipline:** about 90% "paper" (the existing background/card/border tokens); ZEPARI **blue** for
  identity and the active state; **gold** once per view. No gradients, no shadow-heavy cards.
- **Type:** Inter for prose and UI; **JetBrains Mono** for every figure, citation and period (tabular).
  Scale ~11→34, tight headings, 1.6 prose leading.
- **Layout — three fixed zones:** left **SECTION rail** (Overview · Library · Ask · Brief · Barometer ·
  Findings · Sources), centre the **RESEARCH NOTE**, right the **EVIDENCE RAIL** (sources + the honest
  "not covered" line).
- **Principles:** data is the hero · every claim traceable · calm authority · density with air · instructive
  empty/loading/error states · reduced motion respected · visible keyboard focus.

---

## 7. Verification, gates and honest gaps

- **Gates to add/adjust:** the ZEPARI-standard answer structure; the acronym/semantic match (e.g. "ICT"
  now matches); the in-browser engine path; the design system (ZEPARI blue+gold tokens; the right logo on
  the right side). **Mutation-prove each** (break it, watch the gate fail, restore byte-identical).
- **The old gates MUST change:** validate check 36 ("no answer without a model") and its test
  `src/test/research-chat.test.tsx` currently DEMAND that there is no answer without an AI — rewrite both so
  the engine answers from the library with no AI. Same for check 37 and the policy brief.
- **Run the full suite before any "done"; publish only when green; never push `main`.**
- **HONEST GAPS to resolve in the browser during the build:** read the Zimbabwe National AI Strategy PDF
  (83 MB) there; find the live link for the National ICT Policy 2022–2027 (it 404'd for me); confirm
  "Digitalize Zimbabwe"'s official name and owning office; Google Scholar and RePEc blocked automated
  checks (verify by hand); confirm the ZEPARI logo is current and clean it if low quality.

---

## 8. How the next chat starts (resume instructions)

1. Read `PROJECT_STATUS.md` → its RESUME HERE block → then **this file**.
2. Branch `feature/unified-platform`; HEAD is the commit that added this file (see PROJECT_STATUS).
3. **FIRST ACTION: Stage D** — build the three UI options in ZEPARI blue+gold (with the ZEPARI logo; the
   department side keeps the coat of arms), screenshot them at laptop and phone size, and **ASK THE OWNER
   WHICH ONE**. Do not proceed past Stage D without the owner's pick.
4. Then Stages **A, B, C, E, F, G** in order — one pass, all gates green, then publish and refresh the review zip.
