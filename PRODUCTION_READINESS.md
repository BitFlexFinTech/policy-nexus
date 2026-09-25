# PRODUCTION_READINESS.md — Mock → Real go-live checklist

Every active mock, placeholder, or simulated capability in this build, what replaces it,
and where it is entered. **Updated every session.** Nothing here is a bug — these are
deliberate scenario-mode implementations behind swappable seams.

## 1. Simulation / assessment engine
| Item | Current implementation | Real replacement | Where it is switched |
|---|---|---|---|
| Assessment engine | `src/services/assessment/scenario.ts` — deterministic seeded generator (PRNG over `departmentId + policy text`) | MiroFish backend (HTTP service) | `.env` → `VITE_ASSESSMENT_MODE=mirofish`; factory in `src/services/assessment/AssessmentService.ts` |
| Decision-support disclaimer | Static string in `src/config/brand.ts` | Stays (always present) | `src/config/brand.ts` |
| Simulation visualisation | Deterministic SVG knowledge map + feed ticks (presentation only) | Live streaming from the backend over the same `AssessmentService` contract | No UI change required (seam requirement) |

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
| `.txt` upload | Real `FileReader` read — content genuinely drives the simulation | unchanged | n/a |
| `.pdf` / `.docx` upload | File accepted, name/size recorded; **text extraction is NOT implemented** — falls back to the department template text with an explicit on-screen note (`XX-PENDING-EXTRACTION`) | Server-side document extraction | Backend service call behind `AssessmentService.extractPolicyText()` |
| Parse progress | Deterministic tick-based progress (seeded) | Real progress from the backend | Same seam |

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
| Simulation history / policy register | Seeded deterministic records derived from department config | Database | `AssessmentService.listRuns()` |
| `REFERENCE_DATE = "2026-09-24"` | Fixed reference date for all dates shown — **built in Phase B** | Real clock | `src/config/reference.ts` |
| Reference rates (ZiG, policy rate, inflation) | Static config value in `REFERENCE_RATES`, labelled as a reference input | Live data feed | `src/config/reference.ts` |
| Stakeholder segments | 16 canonical segments in `STAKEHOLDER_SEGMENTS`; departments may reference these ids only | CMS / segmentation service | `src/config/reference.ts` |

## 6. Non-credential work still outstanding (no credential can fix these)
- Robust PDF/DOCX text extraction (server-side).
- Real `.docx` / native PDF rendering.
- MiroFish service endpoint + contract implementation (`AssessmentService` interface exists).
- Government SSO integration.

## 7. Disabled by default (deliberate)
- Puter CDN script and `puter.ai.chat()`: **removed**, not just disabled. Phase B deleted the
  `<script src="https://js.puter.com/v2/">` tag from `index.html`; the remaining `puter` reads in
  `PolicyInput.tsx` are dead code and are removed in Phase E. No third-party AI call can occur.
- Google Fonts CDN: **removed** in Phase B. Inter and JetBrains Mono are now self-hosted from
  `public/fonts/` via `src/fonts.css`. Verified: `grep -roE 'https?://' dist/index.html
  dist/assets/*.css` returns zero matches, so the built application makes no runtime network
  request of any kind.
- Note on the fonts: Google served the *same* variable woff2 for every requested weight
  (confirmed by md5), so the build ships one file per family with the full weight axis declared,
  rather than four identical copies of Inter.