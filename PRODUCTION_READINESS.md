# PRODUCTION_READINESS.md — Mock → Real go-live checklist

Every active mock, placeholder, or simulated capability in this build, what replaces it,
and where it is entered. **Updated every session.** Nothing here is a bug — these are
deliberate scenario-mode implementations behind swappable seams.

## 1. Simulation / assessment engine
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Assessment engine / `src/services/assessment/**` | **BUILT — Phase E.** `AssessmentService` interface + factory (`AssessmentService.ts`), deterministic engine (`scenario.ts`), seeded PRNG (`src/lib/prng.ts`), canonical schema (`types.ts`), and a persistent register of run inputs (`runStore.ts`). The same request always reproduces a byte-identical `AssessmentRun`; nothing reaches the network. **Visibly labelled**: the workspace pill reads `Scenario (Mock)` and runs state `Seed … — computed locally, no external request`. | Remote backend (HTTP service) | `.env` → `VITE_ASSESSMENT_MODE=service`; register the client in `CLIENTS` in `src/services/assessment/AssessmentService.ts` |
| Decision-support disclaimer | Static string in `src/config/brand.ts`, rendered on the executive summary and the full assessment and carried into every export | Stays (always present) | `src/config/brand.ts` |
| Simulation visualisation | **BUILT — Phase F.** `/app/simulations/:id` reveals the run's own rounds one at a time (a deterministic replay; only the reveal cadence is timed) and ends at **Assessment Complete**. The workspace `AgentFeed` remains the pre-run scenario-preparation view. | Live streaming from the backend over the same `AssessmentService` contract | No UI change required (seam requirement) |
| Generated documents — long-form report + drafted policy | **BUILT — Phase K.** `src/services/assessment/documents.ts` derives two documents from a completed run using the run's own seed (`<seed>::long-report`, `<seed>::policy-draft`), so the same inputs always produce byte-identical text. The drafted policy turns the submitted draft's **own sentences** into operative measures and turns the modelled risks / reactions / recommendations into mitigation, engagement and monitoring provisions. Deterministic and local. **Visibly labelled:** the drafted policy states it was generated locally by the *Nzwisiso simulation core (Mock)* and is a draft for review. | A backend drafting model behind the same function signatures | Replace `buildLongReport` / `buildPolicyDraft` in `src/services/assessment/documents.ts`; the pages and the export seam need no change |

**Seam rule:** no component may import `scenario.ts` directly; only `assessmentService` from the
factory. Swapping the implementation must require zero UI code changes. The store persists run
**inputs** (`runStore.ts`), never generated output, so a stored run is always recomputed by whatever
client is registered.

## 2. Authentication / session
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Sign-in | One-click department session — no credentials, no network call. **`src/session/session.ts` is the seam**: `signInToDepartment` / `getSession` / `clearSession`. There is **no** `VITE_AUTH_MODE` environment switch yet; an earlier draft of this file claimed one and it does not exist. | Government SSO / identity provider | Replace the three functions in `src/session/session.ts`; callers use `sessionActions` from `src/session/useSession.ts` and need no change |
| Session identity | `localStorage["nzwisiso.session.v1"] = { departmentId, mode, signedInAt }` where `mode: "oneclick"` and `signedInAt = REFERENCE_DATE` | Server session / token | Same seam |
| Storage fallback | If the browser refuses local storage, the session falls back to memory for the visit. `isSessionPersistent()` reports which is in use. | Unchanged | Same seam |
| Mock marker | `mode: "oneclick"` is stored in state **and visibly labelled in the workspace header as `Entry: one-click (Mock)`** | Removed by real auth | Same seam |
| Route guard | `src/routes/RequireSession.tsx` — `/app/**` redirects to `/` without a session | Unchanged (a real guard would also check the token) | Same seam |

## 3. Policy ingestion
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| `.txt` / `.pdf` / `.docx` upload | File accepted, name and size recorded. **No text extraction** — when only files are supplied the recorded file list *is* the policy text and the run's `source` states `upload` plainly, so the UI never implies the file was parsed. | Server-side document extraction | Backend service call behind `AssessmentService` (`extractPolicyText`) |
| Preset chips | Department-aware: read from `department.policyTemplates` (`src/config/departments.ts`); selecting a chip also records its `templateId`, so the run's reference and horizon come from the department's own draft | unchanged | n/a |
| Parse progress | Deterministic fixed-step progress (`PARSE_STEP` / `PARSE_TICK_MS` in `src/components/PolicyInput.tsx`) — no `Math.random` | Real progress from the backend | Same seam |
| Run Simulation action | **Real, deterministic, and labelled.** The button is `Run Simulation`; it calls `assessmentService.run()`, records the request and opens `/app/simulations/:id`. The engine is the scenario engine (Mock) — the UI says so on the run, the register and the assessment. | Unchanged button; the service behind it changes | `src/components/PolicyInput.tsx` → `AssessmentService` seam |

## 4. Document actions
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Save as PDF | Opens the browser print dialogue via `window.print()` — choose "Save as PDF" as the destination. No `jspdf` dependency and no new dependency added. | Native server-side PDF renderer | Backend endpoint behind `DocumentActions` (`src/components/assessment/DocumentActions.tsx`) |
| Download Word | Real downloadable `.doc` built from a Word-compatible HTML Blob (`application/msword`) — **HTML-based, not OOXML `.docx`** | Server-side real `.docx` | Backend endpoint behind `DocumentActions` |
| Print | Real `window.print()`; `@media print` in `src/index.css` hides the workspace chrome and any `data-print="hide"` control, so the printed page is the assessment alone | unchanged | n/a |
| Share | `navigator.share` where the platform provides a share sheet, otherwise the clipboard (`navigator.clipboard.writeText`). The shared text is the plain-text rendering of the run plus the disclaimer. **No network call and no email client is invoked.** | Server-side email / link dispatch | Backend endpoint behind `DocumentActions` |

## 5. Data
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Department content (16 departments) | Authored deterministic config: `src/config/departments.ts` — **built in Phase B**, verified by importing the module: 16 departments, 64 priorities, 63 indicators, 48 policy templates, 49 documents | CMS / ministry content service | Config loader |
| Brand identity, disclaimer, engine vocabulary | `src/config/brand.ts` — **built in Phase B** | Stays (identity and disclaimer are permanent) | `src/config/brand.ts` |
| Simulation history / policy register | **Phase E/F:** `/app/policies` and `/app/simulations` list the department's prepared drafts, and the register and the workspace history table list **real recorded runs** for that department (reference, result, and a link to the assessment). `src/services/assessment/runStore.ts` persists the run *requests* in `localStorage["nzwisiso.runs.v1"]`; results are recomputed from them, so a stored run can never drift from its inputs. | Database of real runs | `AssessmentService.listRuns()` — already the call site |
| `REFERENCE_DATE = "2026-09-24"` | Fixed reference date for all dates shown — **built in Phase B** | Real clock | `src/config/reference.ts` |
| Reference rates (ZiG, policy rate, inflation) | Static config value in `REFERENCE_RATES`, labelled as a reference input | Live data feed | `src/config/reference.ts` |
| Stakeholder segments | 16 canonical segments in `STAKEHOLDER_SEGMENTS`; departments may reference these ids only | CMS / segmentation service | `src/config/reference.ts` |

## 6. Non-credential work still outstanding (no credential can fix these)
- ~~Build `src/services/assessment/**`~~ — **DONE (Phase E):** interface + factory + deterministic engine + PRNG + run store.
- ~~Build the live simulation view and the assessment / executive-summary / full-assessment screens~~ — **DONE (Phase F/G):** `/app/simulations/:id`, `/app/assessments/:id`, `/app/assessments/:id/full`.
- ~~PDF / Word / print / share document actions (`src/components/assessment/DocumentActions.tsx`)~~ — **DONE (Phase G)**, with the caveats in §4 above (print-dialogue PDF, HTML-based `.doc`).
- ~~Derive a long-form report and a drafted policy from a completed run~~ — **DONE (Phase K):**
  `src/services/assessment/documents.ts` (deterministic), routes `/app/assessments/:id/report` and
  `/app/assessments/:id/policy-draft`, editable draft text, exported through the Phase G seam.
- Robust PDF/DOCX text extraction (server-side).
- Real `.docx` / native PDF rendering.
- Remote assessment service endpoint + client construction in `CLIENTS` (`src/services/assessment/AssessmentService.ts`).
- Government SSO integration.
- ~~Playwright Chromium binary is not installed and no `e2e/` spec exists yet — Phase H.~~
  **DONE (Phase H):** `e2e/journey.spec.ts` exists and `npx playwright test` passes **4/4** against
  the production `vite preview` build, asserting **0 console errors** and **0 off-origin requests**.

## 6b. Verified clean in Phase D
- `npm run validate` → **PASS — all checks green** (banned copy, predictive phrasing, vendor
  terminology, determinism, network URLs, 16 department ids, reference date, disclaimer).
- Zero runtime network references in the built output (`grep -roE 'https?://' dist/index.html dist/assets/*.css` → 0).

## 6c. Verified in a real browser (Phase H)
- `npx playwright test` → **4/4 PASS** against the production `vite preview` build: home lists all
  16 departments · one-click entry · session survives navigation **and a full reload** · paste →
  Run Simulation → **Assessment Complete** → executive summary → metric drill-down →
  Print / Save-as-PDF / Download-Word (a real `…-executive-summary.doc`) / Share · upload → the run
  records `source upload`.
- Every browser test asserts **0 console errors, 0 uncaught page errors, and 0 off-origin requests** —
  the built bundle provably makes **no runtime network call**, which is the strongest available form
  of the mock-first / no-CDN guarantee.
- Stated plainly: the journey was verified against the **local** production preview. The live host
  still serves the older **Phase D** bundle until `dist/` is redeployed.

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
  **"A Project by the Ministry of IT"** with **"For Internal Use Only"** beneath it in smaller text
  (asserted against the **real computed font size**: 11px vs 9px).
- **Phase N** redesigned its hero, after the user questioned it: the `<h1>` is now the researched task
  line **"Test the policy before you decide"**, rendered in CAPITALS by CSS (`uppercase` + positive
  tracking) with the DOM text kept in sentence case, rather than the brand tagline; the hero is a
  two-column grid whose right column is a bordered **"Reference date and inputs"** panel (reference
  date, fiscal year, ZiG exchange rate, policy rate, annual inflation — all read from
  `src/config/reference.ts`); the tagline closes that panel. `npm test` → **9 files, 145 tests**,
  including a test that pins every panel value to configuration, one that asserts the panel heading is
  unique on the page, and one that asserts the caps are styling rather than typed capitals.
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
- **Operational note (cost a real debugging cycle):** `npm run dev` serves at
  **http://localhost:8080/** — `vite.config.ts` pins `server.port = 8080`. Opening 5173 shows a stale
  build. This, not the code, was why the new landing page appeared missing.
- Stated plainly: this is verified against the **local** production preview. The live host still
  serves the **Phase D** bundle until `dist/` is redeployed.

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
| Server files to preserve | `cgi-bin/`, `.well-known/pki-validation/<token>.txt` | Never deploy with `mirror --delete` |

**Credential status:** the FTP password is a **real, live credential**, supplied in plaintext and
therefore compromised — **rotate it in cPanel → FTP Accounts**. It is not stored anywhere in this
repo. No API keys, tokens, or `.env` files ship in `dist/` (the build is a static SPA with zero
runtime network calls).

**Non-credential work still outstanding for hosting:** none required for the current static
build. If server-side PDF/DOCX extraction or the MiroFish backend is added later, that needs a
Node/PHP service endpoint — the current host serves static files plus `cgi-bin/` only.