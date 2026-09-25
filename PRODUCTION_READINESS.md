# PRODUCTION_READINESS.md — Mock → Real go-live checklist

Every active mock, placeholder, or simulated capability in this build, what replaces it,
and where it is entered. **Updated every session.** Nothing here is a bug — these are
deliberate scenario-mode implementations behind swappable seams.

## 1. Simulation / assessment engine
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Assessment engine / `src/services/assessment/**` | **NOT BUILT YET — Phase E/F.** There is no `AssessmentService`, no `scenario.ts` and no PRNG in this tree. Because of that, Phase D renders only authored configuration data in the workspace and never presents a generated result as a run. | MiroFish backend (HTTP service) | `.env` → `VITE_ASSESSMENT_MODE=mirofish`; factory in `src/services/assessment/AssessmentService.ts` (to be created in Phase E) |
| Decision-support disclaimer | Static string in `src/config/brand.ts` | Stays (always present) | `src/config/brand.ts` |
| Simulation visualisation | **NOT BUILT YET — Phase E/F.** The agent feed is now a deterministic rendering of the department's own modelled segments (`src/components/AgentFeed.tsx`), not a live visualisation. | Live streaming from the backend over the same `AssessmentService` contract | No UI change required (seam requirement) |

**Seam rule:** no component may import `scenario.ts` directly; only the factory. Swapping the
implementation must require zero UI code changes.

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
| `.txt` / `.pdf` / `.docx` upload | File accepted, name and size recorded only. **No text extraction and no `FileReader` read is wired yet** — an earlier draft of this file claimed the `.txt` content drives the simulation; it does not (there is no engine yet). | Server-side document extraction | Backend service call behind `AssessmentService.extractPolicyText()` (Phase E) |
| Preset chips | Department-aware: read from `department.policyTemplates` (`src/config/departments.ts`) | unchanged | n/a |
| Parse progress | Deterministic fixed-step progress (`PARSE_STEP` / `PARSE_TICK_MS` in `src/components/PolicyInput.tsx`) — no `Math.random` | Real progress from the backend | Same seam |
| Scope review action | **Mock, and labelled as such.** The button is `Review scope`, not "Run Simulation", because no simulation runs. It lists the department's modelled stakeholder segments for the draft and the output panel is titled `Scenario engine — scenario scope (Mock)`. | The button becomes "Run Simulation" and calls `AssessmentService.run()` (Phase E) | `src/components/PolicyInput.tsx` → `AssessmentService` seam |

## 4. Document actions
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Download PDF | Print-optimised report via the browser print dialog ("Save as PDF") — no `jspdf` dependency | Native server-side PDF renderer | Backend endpoint behind `DocumentActions` |
| Download Word | `.doc` file generated from print-clean HTML Blob (opens in Word) — **HTML-based, not OOXML `.docx`** | Server-side real `.docx` | Backend endpoint behind `DocumentActions` |
| Print | Real `window.print()` with `@media print` hiding app chrome | unchanged | n/a |
| Share by email | Real `mailto:` with pre-filled subject/body | Server-side email dispatch | Backend endpoint behind `DocumentActions` |

## 5. Data
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Department content (16 departments) | Authored deterministic config: `src/config/departments.ts` — **built in Phase B**, verified by importing the module: 16 departments, 64 priorities, 63 indicators, 48 policy templates, 49 documents | CMS / ministry content service | Config loader |
| Brand identity, disclaimer, engine vocabulary | `src/config/brand.ts` — **built in Phase B** | Stays (identity and disclaimer are permanent) | `src/config/brand.ts` |
| Simulation history / policy register | **Phase D:** config-derived, department-scoped. `/app/policies` and `/app/simulations` list the department's prepared drafts (`department.policyTemplates`) with an explicit empty state for runs and no fabricated result figures. They are not seeded run records. | Database of real runs | `AssessmentService.listRuns()` (Phase E) |
| `REFERENCE_DATE = "2026-09-24"` | Fixed reference date for all dates shown — **built in Phase B** | Real clock | `src/config/reference.ts` |
| Reference rates (ZiG, policy rate, inflation) | Static config value in `REFERENCE_RATES`, labelled as a reference input | Live data feed | `src/config/reference.ts` |
| Stakeholder segments | 16 canonical segments in `STAKEHOLDER_SEGMENTS`; departments may reference these ids only | CMS / segmentation service | `src/config/reference.ts` |

## 6. Non-credential work still outstanding (no credential can fix these)
- Build `src/services/assessment/**` (interface + factory + deterministic scenario implementation) — Phase E.
- Build the live simulation view and the assessment / executive-summary / full-assessment screens — Phase F.
- PDF / Word / print / share document actions (`src/components/assessment/DocumentActions.tsx`) — Phase F.
- Robust PDF/DOCX text extraction (server-side).
- Real `.docx` / native PDF rendering.
- MiroFish service endpoint + contract implementation (`AssessmentService` interface does not exist yet).
- Government SSO integration.
- Playwright Chromium binary is not installed and no `e2e/` spec exists yet — Phase H.

## 6b. Verified clean in Phase D
- `npm run validate` → **PASS — all checks green** (banned copy, predictive phrasing, vendor
  terminology, determinism, network URLs, 16 department ids, reference date, disclaimer).
- Zero runtime network references in the built output (`grep -roE 'https?://' dist/index.html dist/assets/*.css` → 0).

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