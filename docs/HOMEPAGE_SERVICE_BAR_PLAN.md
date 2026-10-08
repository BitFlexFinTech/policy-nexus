# HOME PAGE — SERVICE BAR AT THE VERY TOP + A DIGNIFIED BLACK-AND-GOLD

Written 2026-10-07 so a brand-new chat can type **"continue where you left off"** and build it with no chat
history and no clarifying questions. **Nothing in this plan has been built yet.**

**Read order for the next session:** `PROJECT_STATUS.md` (its `RESUME HERE` block) → **this file** → the files
named below. Then build in the order in §4.

## 0. The owner's two complaints, in their words
1. **"i told you to put the Nzwisiso AI™ Policy Simulation Assistant and ZEPARI Policy Research Assistant
   cards at the very top so they don't disturb the content on the main homepage but they are still in the
   same place!"** — In the current build the home page's top band runs *title → standfirst → cards*, so the
   cards still sit BELOW the heading. They must be the very first thing on the page.
2. **"the yellow background on the hero is not nice and ugly and does not look like a government platform …
   this looks childish and not like government platform."** — the home hero was painted a full-bleed bright
   yellow (`--gold`, #FFD700). Gold must be an **accent**, never a big yellow field.

## 1. What to build
- **Order on the home page `/`:** masthead → **slim black-and-gold service bar holding ONLY the two cards** →
  page title + standfirst → the national story → footer. The cards are the very first thing and never push
  the content.
- **Colour:** the bar is the **Zimbabwe flag's black with gold accents** — a gold hairline under the
  masthead, **dark cards with a gold border and gold card titles**, a **gold action button**. **No yellow
  background anywhere.**
- **Tools unchanged:** `/simulation` stays emerald, `/research` stays ZEPARI blue, both keep the masthead
  "← Back to home". Only the home page changes.

## 2. Files to change
- `src/pages/Home.tsx` — the `hero` prop given to `PublicPageShell` becomes the **cards-only** bar; the
  eyebrow / `h1` / standfirst move back into the normal content below it.
- `src/components/public/PublicPageShell.tsx` — the `SURFACE.gold` identity becomes **black-with-gold**
  (masthead `bg-gold-foreground` with a gold rule; footer `bg-gold-foreground` with gold text) instead of the
  gold background. `accent="gold"` stays the mechanism.
- `e2e/journey.spec.ts` — the order check must assert the **service bar sits ABOVE the page title**; the
  colour test must assert the home masthead is **dark/black with gold (not yellow)** and differs from the
  tool's green.
- `scripts/validate.mjs` — tighten **check 43** so the home page stops being the tool's colour AND cannot
  revert to a full gold background.
- Records after publishing: `PROJECT_STATUS.md`, `PRODUCTION_READINESS.md`, `docs/PROPOSAL_PROMPT.md`; refresh
  `Review Zip/nzwisiso-policy-dashboard-review.zip`.

## 3. State when this plan was written
Branch `feature/unified-platform`. Live site serves `assets/index-Cl0c4LKm.js`. Suite green: validate PASS ·
typecheck 0 · lint 0 errors · 618 unit tests · 35 browser tests. The home page currently uses
`accent="gold"` with a **yellow** hero band — that band is the thing to fix.

## 4. Build order (staged, then prove)
1. Cards-only service bar at the very top; title/standfirst back into the content below it.
2. Black-with-gold bar + cards; remove the yellow.
3. Update the tests and tighten check 43; **mutation-prove** it (break → FAIL → restore byte-identical).
4. Full suite: `npm run validate && npm run typecheck && npm run lint && npm test && npm run build`, then
   `npx playwright test`.
5. Publish (FTPS `lftp mirror -R`, **never `--delete`**), verify the served sha256, `npm run sync:check`
   IN SYNC, refresh the records and the one review zip.

**No `package.json` dependency change. No changes to the tool pages. Never push `main`.**
