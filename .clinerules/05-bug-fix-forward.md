# 05 — BUG-FIX-FORWARD: FIND IT, FIX IT, MOVE FORWARD. COMPLETED = NO BUGS.

Encountering a problem is not a stopping point and not something to defer. It is part of the
work: **identify → fix → verify → move forward**, in the same session.

## Identify
- Reproduce it FIRST and capture evidence: a failing test, real command output, an assertion
  that genuinely fails. No fix is written against a guess.
- Report it explicitly: what broke, where, the reproduction, expected vs actual.
- Never quietly adjust the goalposts (rename the item, narrow the scope, soften the wording)
  so the problem appears to disappear.

## Fix (root cause, never a symptom patch)
Forbidden: disabling or downgrading a lint rule, `// @ts-ignore`, `any` casts to silence a
type error, swallowing errors in try/catch, deleting or weakening a failing assertion,
skipping a test, hardcoding around a bad value, or commenting out the offending code.
A change that makes the check stop complaining without removing the cause is not a fix and
must be reported as such.

## Verify, then move forward
Re-run the failing check AND the full suite (`validate`, `typecheck`, `lint`, `test`, `build`,
Playwright journey) to prove no downstream regression, then update `PROJECT_STATUS.md`. Never
proceed to the next item with the suite still red.

## Definition of "completed"
- **Completed = no bugs, and the whole journey works end to end.**
- Journey that must actually pass, deterministically, on the production build, with ZERO
  console errors and ZERO runtime network requests: homepage loads → all 16 departments render
  → department selectable → one-click sign-in → department context persists across navigation
  and reload → dashboard loads → upload policy works → paste policy works → Run Simulation
  works → simulation runs → Assessment Complete appears → executive summary renders → full
  assessment opens → PDF, Word, print work → share flow works.
- If ANY step fails, the status is **PARTIAL with the exact failing step named** — never
  "mostly done", never "works".
- "No bugs found" only counts if the end-to-end suite was actually run to earn it. Absence of
  evidence is not evidence; a typecheck alone cannot support a clean bill of health.
- A bug found late REOPENS the item it invalidates: earlier `DONE` claims that depended on it
  are re-verified and moved back to `IN PROGRESS` if needed, and this is stated plainly.
- Never claim a step works if it could not truly be verified (e.g. visual aesthetics with no
  browser) — mark it explicitly unverified instead.