# PROJECT_STATUS.md — Nzwisiso AI Policy Dashboard (`policy-nexus`)

Source of truth for project state. **Read this FIRST at every session.**
Statuses: `NOT STARTED` / `IN PROGRESS` / `DONE`. Notes describe what is TRUE right now.
`DONE` only appears where it was verified in the same session it was written.

---

## Locked constraints (do not re-derive, do not "improve")
- **Palette LOCKED**: `src/index.css` `:root` — `--primary: 120 100% 20%` (emerald #006400),
  `--gold: 51 100% 50%` (#FFD700), `--success`, `--warning`. No new colour literals anywhere.
- **Typography LOCKED**: Inter + JetBrains Mono (`tailwind.config.ts` fontFamily). Self-hosted
  in Phase B to remove the Google Fonts CDN request — same faces.
- **One shared dashboard** for all 16 departments, config-driven. Never 16 dashboards.
- **Stack LOCKED**: Vite + React 18 + TS + Tailwind + shadcn/ui. Package manager **npm**
  (`bun.lock` exists — never run `bun install`, never regenerate it).
- **Design system LOCKED**: `src/components/ui/**` are stock primitives; not rewritten.
- **No new runtime dependency** without explicit user approval.
- `main` is never committed to or pushed to by an agent. Baseline tag
  `baseline-pre-unified-platform` → `7451db0` (restore with `git checkout main`).
- Branding: **Nzwisiso AI Policy Dashboard**, tagline **Understanding before action.**
  User-visible vocabulary: *Nzwisiso simulation core*, *Nzwisiso knowledge map*,
  *Nzwisiso agent memory*. Never expose MiroFish / OASIS / GraphRAG / Zep / Puter.
- Determinism: no `Math.random()`, no `Date.now()`, no `new Date()` for content.
  `REFERENCE_DATE = "2026-09-24"`. Same department + same policy ⇒ identical result.
- Scenario mode only: no backend, no DB, no AI APIs, no CDN scripts at runtime.

## Target route map (authoritative)
```
/                          Home (public, 16-department select)
/app                       Department dashboard (existing Index layout, department-aware)
/app/policies              Policy register
/app/simulations           Simulation register
/app/simulations/:id       Live deterministic simulation
/app/assessments/:id       Executive Summary + document actions
/app/assessments/:id/full  Full assessment
/app/documents             Secondary: department document library
/app/reference             Secondary: methodology & limitations
*                          NotFound (preserved)
```

## Department IDs (exact, 16)
`opc fin agri health edu hedu ict mines energy psc lg mfa env def zimra zida`

## Single source of truth (files that own data)
- `src/config/brand.ts` — product name, entity, tagline, disclaimer.
- `src/config/departments.ts` — the 16 departments + all authored department content.
- `src/config/reference.ts` — `REFERENCE_DATE`, reference rates, segment lists.
- `src/services/assessment/types.ts` — canonical assessment result schema.
- `src/services/assessment/AssessmentService.ts` — interface + factory (mock→real seam).

---

## WORK ITEMS

### Phase 0 — Safety + scaffolding + baseline gate
**Status: IN PROGRESS**

- Branch `feature/unified-platform` + tag `baseline-pre-unified-platform`: **DONE** — verified
  `git branch --show-current` → `feature/unified-platform`; tag → `7451db0ed3879d94977a79813672e5a2778c232c`.
- `.clinerules/` 6 rules (00 continuity, 01 minimal context, 02 role router, 03 preserve UI,
  04 determinism+validation, 05 bug-fix-forward): **DONE** — 6 files created.
- `PRODUCTION_READINESS.md`, `docs/ENGINEERING_PRINCIPLES.md`: **DONE** — files created.
- `scripts/validate.mjs` + `npm run validate` / `typecheck` / `e2e` scripts: **IN PROGRESS**.
- `package.json` `name` → `nzwisiso-policy-dashboard`: **DONE** (line 2, verified).
- **BUG FIXED (bug-fix-forward rule)**: `npm install` failed `ERESOLVE` —
  `lovable-tagger@1.1.13` requires peer `vite >=5.0.0 <8.0.0` while the project pins
  `vite ^8.0.0` (and `@vitejs/plugin-react@6` requires `vite ^8`, so downgrading vite would
  break the build). Root-cause fix applied: `lovable-tagger` bumped `^1.1.13` → `^1.3.4`
  (peer `vite >=5.0.0 <9.0.0`, verified via `npm view`). Not fixed with `--legacy-peer-deps`.
- Global skills install: **IN PROGRESS** — resolved exact sources: `jakubkrehel/skills`
  (11 skills: better-accessibility, better-colors, better-interface, better-layout,
  better-typography, better-ui, better-writing, break, explain-interface, interface-review,
  variant), `jakubkrehel/make-interfaces-feel-better` (1), `jakubkrehel/oklch-skill` (1),
  `emilkowalski/skills` (13: animate, animate-expo, animation-vocabulary, apple-design,
  ask-sonner, emil-design-eng, find-animation-opportunities, improve-animations,
  mobile-native, pick-ui-library, prototype, review-animations, write-swift).
- `npm install`: **IN PROGRESS** (attempt 2 after the fix; log `/tmp/nzw-npm-install2.log`).
- **Baseline gate** (`typecheck` + `build` + `test` + `lint` on the UNMODIFIED app):
  **NOT STARTED** — must be green before any feature code.
- Commit scaffolding: **NOT STARTED**.

### Phase A — Audit
**Status: DONE** — completed in the planning session; findings summarised here.

Verified audit facts (by command, not assumption):
- Repo is ONE page: `src/App.tsx` routes only `/` → `Index.tsx` and `*` → `NotFound.tsx`.
- NO homepage, NO departments, NO session/login, NO simulation visualisation, NO assessment
  screen, NO PDF/Word/print/share, NO service layer, NO persistence in the existing app.
- EXIST: coat of arms (`src/assets/zimbabwe-coat-of-arms.png`), emerald/gold palette, full
  shadcn/ui library (48 primitives incl. `chart.tsx`, `sidebar.tsx`, `tabs.tsx`), `HeaderBar`,
  `KPICards`, `EngineStatus`, `AgentFeed`, `HistoryTable`, `DocumentLibrary`, `PolicyInput`
  (drag/drop upload), `SovereignFooter`, `StatusPill`, `NavLink`.
- Problems found: `index.html` loads Puter CDN + Google Fonts (external network);
  `PolicyInput.tsx:26-27` calls `window.puter.ai.chat`; `Math.random()` at `AgentFeed.tsx:64`
  and `PolicyInput.tsx:76`; hardcoded data duplicated across 5 components; `src/App.css` dead
  and would break layout if imported; `playwright.config.ts` + `playwright-fixture.ts` import
  `lovable-agent-playwright-config` which is NOT installed (Playwright cannot run);
  `eslint.config.js` has react-hooks rules at `warn` not `error`; no `typecheck` script;
  `src/test/example.test.ts` is `expect(true).toBe(true)`; `node_modules` was absent;
  both `bun.lock` and `package-lock.json` present.

### Phase B — Homepage + 16-department grid + self-hosted fonts
**Status: NOT STARTED**

### Phase C — One-click department session (persistence + route guard)
**Status: NOT STARTED**

### Phase D — Dashboard simplification (department-aware, terminology scrub, secondary nav)
**Status: NOT STARTED**

### Phase E — Policy input (Upload / Paste wired to the service)
**Status: NOT STARTED**

### Phase F — Simulation (deterministic visualisation + progress + Assessment Complete)
**Status: NOT STARTED**

### Phase G — Assessment (Executive Summary, Full Assessment, PDF/Word/Print/Email)
**Status: NOT STARTED**

### Phase H — Verification (full suite + Playwright journey for all 16 departments)
**Status: NOT STARTED**

### Phase I — Push + review zip
**Status: NOT STARTED** (push ONLY when every suite is green; never to `main`).

---

## Verification log
| Date | Command | Result |
|---|---|---|
| 2026-09-24 | `git checkout -b feature/unified-platform` + `git tag` | PASS — branch `feature/unified-platform`; tag `baseline-pre-unified-platform` @ `7451db0` |
| 2026-09-24 | `npm view lovable-tagger` (peer deps) | PASS — 1.1.13 peer `vite >=5 <8`; 1.3.4 peer `vite >=5 <9` |
| 2026-09-24 | `npm install` attempt 1 | **FAIL (ERESOLVE)** — lovable-tagger 1.1.13 vs vite 8 |
| 2026-09-24 | `npm install` attempt 2 (after bump to `^1.3.4`) | PASS — *added 472 packages in 2m*; installed `lovable-tagger@1.3.4` verified via require() |
| 2026-09-24 | `npx skills add … -g -a cline` (4 sources) | PASS — 26 skills in `~/.agents/skills/`, `skills ls -g` reports **Cline** among registered agents |
| 2026-09-24 | baseline `typecheck`/`build`/`test`/`lint` | see next entry (in progress) |

## Known-red / open items
- `npm run validate` is expected to be **RED until Phase D**: the existing UI still contains
  vendor terminology (`OASIS`, `GraphRAG`, `Puter`), `Math.random()` in two components, and
  external CDN URLs in `index.html`. Those are the Phase B–D scrub targets, not regressions.
- Playwright currently **cannot run** until `playwright.config.ts` / `playwright-fixture.ts` are
  repaired (they import `lovable-agent-playwright-config`, which is not a dependency).
  Scheduled before Phase H. `@playwright/test` itself IS installed (devDependency).
- `npm install` reported 3 unapproved install scripts (`fsevents`, `esbuild`). esbuild's
  postinstall (`node install.js`) is a fallback path — `@esbuild/darwin-arm64` ships the binary
  via optional deps. The baseline `build` result is the real proof; if the build fails, that
  script must be approved before anything else.

## Files touched this session
`.clinerules/00*..05*.md`, `PROJECT_STATUS.md`, `PRODUCTION_READINESS.md`,
`docs/ENGINEERING_PRINCIPLES.md`, `scripts/validate.mjs`, `package.json`, `.gitignore`

---

## RESUME HERE
- Branch: `feature/unified-platform` · Baseline tag: `baseline-pre-unified-platform` (`7451db0`)
- Tree at last checkpoint: **dirty** (Phase 0 scaffolding not yet committed — expected).
- Next action: run the **baseline gate** on the unmodified app and record results:
  `npm run typecheck`, `npm run build`, `npm test`, `npm run lint`, then `npm run validate`
  (validate is expected RED — capture the counts as the Phase B–D work list).
  Then fix `playwright.config.ts` / `playwright-fixture.ts`, approve esbuild scripts if needed,
  and commit the Phase 0 scaffolding.
- Read next: this file, then `package.json`, then `scripts/validate.mjs`.
- Exact commands:
```bash
npm run typecheck; npm run build; npm test; npm run lint; npm run validate
npx playwright install chromium
git add -A && git commit -m "chore(phase-0): rules, status file, validators, dependency fix"
```