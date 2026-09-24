# NZwisiso AI Policy Dashboard — Build Plan (spec v1.0)

Keep everything that exists (documents, deterministic engine, approval tracker, results page, PDF export, comparison view). Add what is missing.

## 1. Rebrand and visual system
- New palette: Forest Green #1B5E20, Gold #FFB300, Terracotta #C62828, Ink #212121, Off-white #F5F5F0. Remove any gradients.
- Fonts: Montserrat Bold headlines, Inter body, JetBrains Mono data.
- Motifs: Ndebele geometric border strip, Great Zimbabwe bird watermark (low opacity), flag-colour ribbon dividers, Coat of Arms in headers.
- Rename brand to "NZwisiso" everywhere; branding audit so no MiroFish/OASIS/GraphRAG/Zep text is visible.

## 2. Pages and flow
```text
/            Public homepage (formal gov landing, "Sign in" link only)
/login       16 one-click department buttons (demo sign-in)
/dashboard   Department-tailored dashboard (current Index, upgraded)
/simulation  Existing results page (+ Cabinet brief export)
/compare     Existing comparison view (wired into nav)
/library     Scenario library
/audit       Audit log + version history
/rooms       Cross-departmental simulation rooms
```
- Demo session held in memory (per tab); signing out returns to /login. Production note: Government SSO.

## 3. Department variants (16)
Config per department: name, short code, policy domains, default scenario, 2–3 policy templates, terminology labels, clearance level. Header shows Coat of Arms + department name.

## 4. Dashboard panels
- A Policy Draft Input: text area, templates, department selector (defaults to signed-in dept), Run Simulation.
- B Status Card: Simulation Core (Ready/Running/Complete, agent count, progress bar), Knowledge Map (entities, relationships, density, last indexed), Agent Memory (utilisation, episodes, health).
- C Agent Feed: agent ID, persona, environment (broadcast/threaded), stance, interaction type; colour by sentiment; streams during a run with fixed scripted timing.
- D History: search + sortable columns (Title, Department, Date, Duration, Agents, Key Finding, Status); expand row shows report summary, interaction log, small knowledge map graph.

## 5. Government features
Version control (draft revisions + diff list), Cabinet brief PDF, collaboration rooms (multi-ministry, seeded), scenario library, stakeholder influence map (SVG graph), risk heatmap (economic/social/political/environmental), offline indicator with queued sync, audit log of actions, role-based permissions by clearance (Viewer/Analyst/Director/Minister gating actions), API gateway + WOGMELS adapter stubs.

## 6. Engine adapter
Single `DEMO_MODE` flag. Demo uses the seeded deterministic engine; live mode calls the Flask backend on port 5001 (`/api/simulate`, `/api/status`, `/api/history`). Seeded history entries with fixed dates.

## 7. Docs and deployment
- `tasks/todo.md` (checklist + review), `tasks/lessons.md`.
- `Dockerfile` (build + nginx), `docker-compose.yml` (frontend + backend service placeholder on 5001), `nginx.conf`.
- Puter.js kept, labelled demo/pilot only.

## Technical notes
- History and audit data are in-memory seeded for demo (no browser database); real persistence is the backend SQLite in live mode.
- AI Q&A assistant stays on Puter.js (Lovable Cloud is disabled).
- Verify with Playwright: homepage → login → dashboard → run → results → export → compare; build log clean; grep audit for banned strings.
