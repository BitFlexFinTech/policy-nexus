# HOMEPAGE REBUILD + FOOTER & ZEPARI-LOGO FIXES — the plan to BUILD next

> **STATUS: DONE — 2026-10-07.** Every step in §5 was built and verified in one session
> (validate · typecheck · lint · 616/616 unit tests · build · 34/34 Playwright). See the
> `RESUME HERE` block of `PROJECT_STATUS.md` for the build list and the evidence. This file
> remains the SPEC. The only thing NOT done is publishing to the live host (a separate step).

Written 2026-10-07, so a brand-new chat can type **"continue where you left off"** and start the build
with no history and no clarifying questions. This file is the SPEC; `PROJECT_STATUS.md` points here.

**Read order for the next session:** `PROJECT_STATUS.md` (its RESUME HERE block) → **this file** → the
files named in each step. Then build in the order in §5. This SUPERSEDES `docs/ZEPARI_BUILD_PLAN.md`
Stage D (the three throwaway UI options are done; the owner is now directing a concrete rebuild).

---

## 0. The owner's three asks, in their words, and what each means

1. **A brand-new MAIN homepage at `/`.** Today's `/` page is the **Nzwisiso policy-simulation landing**.
   Now that ZEPARI exists, `/` must become a **completely new platform homepage** that introduces the
   whole platform: the national story **and both tools** (each on its own, and how they work together),
   readable end-to-end **without hovering anything**. Today's page **moves to its own address**.
   On the new homepage's two doors: **hovering a door turns the whole page into a static PICTURE of that
   tool's landing page** (colours + content change, but **nothing in the preview is clickable**); **moving
   the mouse off the door reverts** to the neutral homepage; **clicking** the door opens the real tool.
   It is a **flourish only** — it changes nothing about how either tool works.
2. **Footer copyright.** Add **`© 2026 Oreida Pvt Ltd. All rights reserved.`**, **centred** in the footer.
   (The Ministry of ICT's own footer reads "© 2025 Ministry of ICT, Postal & Courier Services. All rights
   reserved." — so this matches government house style.)
3. **The ZEPARI logo looks cheap** ("plastered"). Make it look professional.

## 1. THE PAGE MODEL (decided)

| Surface | Address | Look | Job |
|---|---|---|---|
| **NEW platform homepage** | `/` | Government emerald + gold, its OWN new design | National story + BOTH tools explained + how they work together + two doors |
| **Nzwisiso policy-simulation landing** (today's `/` page, MOVED) | **`/simulation`** (default; see §4) | Emerald, unchanged look | The policy tool's own landing; its action stays "Choose your Department" → `/start` |
| **ZEPARI research landing** | `/research` (already there) | ZEPARI blue + gold | The research assistant's own landing |
| Department workspace | `/app` (unchanged) | Emerald | Unchanged |
| Department chooser | `/start` (unchanged) | Emerald | Unchanged |

## 2. WHAT THE NEW HOMEPAGE MUST SAY (content, all sourced)

Frame everything around **benefit for Government** (this is a government-internal tool). Use ONLY the
national framing below, each with its source named on the page:

- **Government's commitment to full digitalisation by 2030**, and **Vision 2030** (upper-middle-income
  economy by 2030).
- **The Ministry of ICT, Postal and Courier Services' own vision (verbatim):** *"A connected
  knowledge-based society with secure information systems by 2030."* — and its mission line about a
  "knowledge-based society", ICT infrastructure and ICT literacy. Source: ictministry.gov.zw.
- **Zimbabwe National Artificial Intelligence Strategy 2026–2030** — priority sectors **healthcare,
  agriculture, education, financial inclusion**; and the **"Nzwisiso.ai"** campaign named in it (**p.43**).
- The **Ministry's own documents** may be named: Zimbabwe National Policy for ICT 2022–2027 · Cyber and
  Data Protection Act · National Broadband Plan 2023–2030.

Then, in plain words: **the two tools** — Nzwisiso (policy simulation: test a draft against the groups it
reaches, before implementation) and ZEPARI (research: the evidence behind a policy) — and **how they work
together** (evidence reaches the policy desk; the policy desk can ask the evidence desk; private by
design; the strict boundary that **no research figure ever feeds the simulation engine**). Reuse the
already-written blocks: `GOVERNMENT_PAGE` in `src/config/research.ts`, and `GOVERNANCE`,
`MINISTER_STATEMENT`, `SUPPORTED_INITIATIVE` in `src/config/brand.ts`.

**DO NOT USE:** the "ICT Hub commissioned at JITI High School, Shamva" news item, or any other school /
robotics news — the owner said these are **irrelevant** to this tool (recorded 2026-10-07).

## 3. LOCKED CONSTRAINTS

- **Nothing invented. Ever.** Every national claim carries its body + publication + period, on screen.
- **The department side keeps emerald + the Coat of Arms.** The ZEPARI side wears **blue + gold** and the
  **ZEPARI logo**. The new homepage wears **emerald + gold** with the Coat of Arms.
- **The product name always carries its configured mark** (™), composed from `NAME` in `src/config/brand.ts`
  (validate check 15 forbids a bare "Nzwisiso" in any reader-facing file).
- **No new runtime dependency.** The hover preview is plain CSS.
- **Hover preview safety:** it is a **static picture** (the preview layer is `aria-hidden` and
  `pointer-events-none`); it switches **off on phones/tablets** via `@media (hover: hover) and
  (pointer: fine)`; it honours **`prefers-reduced-motion`** (snap, don't fade); the hovered **door never
  moves**, so it stays clickable; a short intent delay avoids flicker. (Basis: MDN `@property` —
  Baseline 2024; MDN `prefers-reduced-motion` — Baseline 2020.)

## 4. DEFAULTS I WILL TAKE unless the owner says otherwise

- **The Nzwisiso landing moves to `/simulation`** (workspace stays `/app`; chooser stays `/start`).
- **The footer copyright is ADDED, and the existing credit line (`PROMOTER.line`) is KEPT** — the owner
  has not said which, so adding (not replacing) is the safe default; changing it later is one line.
- **The hover preview uses a plain cross-fade** (two stacked layers; opacity transition ~0.25s) with the
  page's accent swapping to the tool's palette. No `@property` registration needed.

## 5. THE BUILD, IN ORDER (one step per logical commit; run the full suite at the end)

**Step 1 — the ZEPARI logo (item 3).** Stop putting the little white-background picture in a white box on
a dark bar. Give the ZEPARI side a **light header**, exactly as ZEPARI's own site uses it, so the logo sits
naturally: the logo at its real size (never enlarged past 230px wide), a thin gold rule beneath, navy
typeset text beside it for the institute name. Use their **PNG** (`https://zepari.co.zw/sites/default/files/logo.png`,
230×49) instead of the JPG for cleaner edges — saved as `src/assets/zepari-logo.png`. Apply to
`src/components/zepari/ZepariMark.tsx` and the ZEPARI mastheads (`src/components/research/ResearchShell.tsx`,
`src/components/research/ResearchHeader.tsx`, and the Stage D concept pages if they are kept). Note in the
records that **their official vector/high-res file is still worth requesting** — only the 230×49 image is
published (checked: zepari.co.zw theme + archives).

**Step 2 — the footer copyright (item 2).** Add `PROMOTER.copyright = "© 2026 Oreida Pvt Ltd. All rights
reserved."` in `src/config/brand.ts` (one home) and render it **centred** in: the public footer
(`src/components/public/PublicPageShell.tsx`), the ZEPARI landing footer (`ResearchShell.tsx`) and the
workspace footer (`src/components/SovereignFooter.tsx`). Keep `PROMOTER.line`.

**Step 3 — move today's landing to `/simulation`.** In `src/App.tsx`, render the current `Landing`
component at **`/simulation`** and free `/` for the new homepage. Retarget every test and validator that
assumes the old page sits at `/` (see §7).

**Step 4 — build the NEW `/` homepage.** A NEW file (e.g. `src/pages/Home.tsx`) — its own government
design, distinct from both tool landings. Sections: masthead + notice strip (reuse `PublicPageShell`) ·
national hero (Vision 2030, "full digitalisation by 2030", the Ministry's verbatim vision) · the national
AI Strategy 2026–2030 block (priority sectors + "Nzwisiso.ai") · **the two tools** (Nzwisiso; ZEPARI) each
with its door · **how they work together** · governance + the minister-facing line · closing CTA with both
doors · the official footer. Fully readable with no hovering. Sources named on the page.

**Step 5 — the hover preview (item 1, the flourish). SUPERSEDED TWICE on 2026-10-07; the geometry below
is the one in force.** The layer was first built fading in "over the page"; the owner then reported the
"Internal service" line being covered, so it was moved below the page's chrome; and then the owner
reported that the tool's page was still **cut off** — only its middle was visible, because the picture
was pinned to the top of the screen and the tool page's own header sat behind the cards. **In force
now:** the picture begins at the **bottom edge of the cards' bar** (measured from the bar's
`getBoundingClientRect().bottom`, re-measured on scroll and resize) and runs to the bottom of the window,
so the tool's page is read from its own header down; the home page's own notice line steps aside while it
is up (the tool's page brings its own); and the wheel over the cards slides the picture, non-passively, so
the whole page is reachable. Held by validate check 46 (mutation-proved three ways) and measured by the
homepage browser test with a card hovered. The rest of this step stands: a preview state
(`null | "simulation" | "zepari"`) drives a second **static layer** showing that tool's landing content
(reuse the real components as read-only, `aria-hidden`, `pointer-events-none`); the doors never move;
guarded by `@media (hover: hover)`, `prefers-reduced-motion`, and a short intent delay. Plain CSS in
`src/index.css`; no new library.

**Step 6 — prove & record.** Full suite green (see §8), update `PROJECT_STATUS.md` + `PRODUCTION_READINESS.md`,
refresh the ONE review zip.

## 6. SOURCES (render the source line beside each national claim)

- The Ministry's vision + mission + leadership + its documents list → **Ministry of ICT, Postal and Courier
  Services (ictministry.gov.zw)**.
- Full-digitalisation-by-2030 and the National AI Strategy priority sectors, and the "Nzwisiso.ai" campaign
  → **Zimbabwe National Artificial Intelligence Strategy 2026–2030** (campaign named p.43) and the
  Government's own statements as already recorded in the project (pitch deck / proposal).
- **Honest note to keep:** the exact owning office / official spelling of "Digitalize Zimbabwe" is recorded
  as unconfirmed in `Minister Submission/Oreida_Proposal_Minister_of_ICT.md` §12 — keep to what is cited.

## 7. WHAT MOVING THE PAGE TOUCHES (retarget — do not leave a gate broken)

- `src/test/landing.test.tsx` — asserts the current landing (the initiative `<h1>`, the assessment card,
  "How it works", the engine block, the authority line). **Retarget `renderLanding()` to `/simulation`.**
- `src/test/routes.test.tsx` — "renders the public landing page at /" expects the initiative heading at
  `/`. **Change it: `/` now shows the NEW homepage; add a case for `/simulation`.**
- `src/test/content-admin.test.tsx` — renders `/` and expects "How the platform works" after an admin edit.
  **Retarget to `/simulation`.**
- `src/test/research.test.tsx` — expects `/` to carry heading **"Choose a service"** and a link named
  **"Enter the research assistant"** → `/research`. **Keep those accessible names ON THE NEW HOMEPAGE.**
- `src/test/promoter.test.tsx` — renders `/` for the footer credit; the footer stays on every public page,
  so this keeps passing (verify both `/` and `/simulation`).
- `e2e/journey.spec.ts` — `openChooser()` and `enterWorkspace()` open `/` and click "Choose your Department";
  after the move they must reach `/simulation` first (click the Nzwisiso door, then "Choose your Department").
  Every test that does `page.goto("/")` and then asserts landing content must point at `/simulation`. The
  "opens with a choice of two services" test stays on `/`.
- `scripts/validate.mjs` — **check 26** reads `src/pages/Landing.tsx` for `MINISTER_STATEMENT` (keep the line
  reachable: on the new homepage and/or the moved landing); **check 33** reads `src/pages/Landing.tsx` for
  "Choose a service" and `to="/research"` (point it at the NEW homepage file). **Add a new gate:** the new
  homepage exists at `/`, the moved landing exists at `/simulation`, the centred copyright line is present,
  and the hover preview is a static layer that cannot be clicked.
  **Mutation-prove each new/changed gate** (break it, watch it fail, restore byte-identical).

## 8. VERIFICATION (before any "done")

`npm run validate && npm run typecheck && npm run lint && npm test && npm run build`, then
`npx playwright test`. New assertions to add: the copyright line is present and centred; the ZEPARI logo
renders on a light header (not a white box on a dark bar); hovering a door shows the preview and moving the
mouse away reverts it; clicking the door opens the tool; the preview is absent on a phone viewport; and it
still appears under `prefers-reduced-motion` but with the fade skipped (§5 is authoritative on this — motion
is reduced, never the content removed).
Then refresh the ONE review zip (`Review Zip/nzwisiso-policy-dashboard-review.zip`,
**no `.env` inside**). **Never push `main`.** Publishing to the live host is a separate later step.

## 9. FILES THE BUILD WILL TOUCH (expected)

`src/App.tsx` (routes) · `src/pages/Home.tsx` (NEW homepage) · `src/pages/Landing.tsx` (now the `/simulation`
landing) · `src/components/public/PublicPageShell.tsx` (footer + nav) · `src/components/SovereignFooter.tsx`
(footer) · `src/components/research/ResearchShell.tsx` + `ResearchHeader.tsx` (light header + logo + footer) ·
`src/components/zepari/ZepariMark.tsx` (logo treatment) · `src/config/brand.ts` (`PROMOTER.copyright`, any
new national copy) · `src/config/research.ts` (`GOVERNMENT_PAGE` reuse) · `src/index.css` (preview
transitions + guards) · `src/assets/zepari-logo.png` (new) · the tests named in §7 · `scripts/validate.mjs` ·
the records (`PROJECT_STATUS.md`, `PRODUCTION_READINESS.md`).

**No `package.json` dependency change. No department-side behaviour change. No new colour outside the
existing emerald/gold and ZEPARI blue/gold tokens.**
