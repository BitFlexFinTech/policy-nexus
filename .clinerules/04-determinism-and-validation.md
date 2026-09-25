# 04 — DETERMINISM, EVIDENCE, AND VALIDATION

## Determinism (this is a frontend-only scenario build)
- NEVER use `Math.random()`, `Date.now()`, or `new Date()` to generate or display content.
- Use the seeded PRNG (`src/lib/prng.ts`, `mulberry32` over a string hash of
  `departmentId + normalised policy text + template id`).
- Dates come from `REFERENCE_DATE = "2026-09-24"` (`src/config/reference.ts`).
- Same department + same policy input ⇒ byte-identical scenario result. Proven by a
  deep-equal replay test, not by inspection.
- No runtime network: no CDN scripts, no AI APIs, no Puter, no external fonts at runtime.
  The only permitted external requests are none.
- Mock-first: the UI talks to an `AssessmentService` interface only. Scenario implementation
  today; MiroFish implementation later must be a credential/config swap, not a UI change.
  Every mock/placeholder is listed in `PRODUCTION_READINESS.md`.

## Evidence over claims
Proof that counts: validator PASS/FAIL output, fresh grep counts before/after, real command
output pasted into the report, a diff shown. Claims without attached evidence = not done.
Never report "done", "complete", or "passing" without re-reading the file / re-running the
build, typecheck, or validator in the SAME session.

## Standing validation suite (run before any "done" claim)
```bash
npm run validate      # copy/banned-term + determinism + 16-department file validators
npm run typecheck     # tsc -b
npm run lint          # react-hooks rules-of-hooks + exhaustive-deps = error
npm test              # vitest: determinism replay, dept coverage, session, smoke renders
npm run build         # vite build
npx playwright test   # end-to-end journey on the production preview build
```
Push ONLY when every one of the above is green. If anything is red: fix it (see rule 05) or
report PARTIAL/BLOCKED with the exact failing step — never push on red, never push to `main`.

## Page-by-page functional parity (before any UI stage is reported complete)
1. Hooks lint enabled as error, passing.
2. Every route/admin view smoke-renders with realistic seeded data without throwing.
3. Listing screens render the full canonical count (16 departments) — never a silent subset.
4. A component whose name implies a capability must implement it inline (no redirect-only "Hub").
5. Every summary/metric card opens to more detail on click.