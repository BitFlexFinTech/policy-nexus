# NEXT SESSION PLAN — the drafted policy: grounding, length, and the department data library

Written 2026-10-05 at the owner's request, so a new chat continues without re-explaining anything.
Read this together with `PROJECT_STATUS.md` (its RESUME HERE block) and `docs/PLATFORM_ENRICHMENT_PLAN.md`.

## Why this file exists

The owner asked why the drafted policy is shorter than the length we agreed, and then asked for a
notification and a department data library. During the discussion one earlier proposal was wrong: a plan to
GROW data in order to HIT a 70-page target was rejected by the owner — the length must never be met with
invented or padded content. The rule now is: **the length floor is whatever the platform can honestly
produce, measured — never a number that forces fabrication.**

## Owner decisions (LOCKED — do not re-open, do not ask again)

1. **The drafted-policy length FLOOR must be GROUNDED.** It is set to the real minimum the current data
   produces, **measured** by running the generator. It is **never** raised by padding or invention driving
   toward a page target.
2. **The three earlier items stand:**
   - **(1) Stakeholder groups — grow REAL data first.** Search for more groups with a real published share,
     and more real indicators, so the engine is more grounded AND the policy can honestly grow. Niche
     groups with no publisher stay labelled `Modelled`.
   - **(2) The graph node click** must open the node's data in a panel **on the right of the graph card,
     with a close control** (and Escape). Nothing else on that screen changes.
   - **(3) The button strip** (Back · This run · Executive summary · Full assessment · Full report ·
     Drafted policy · Implementation pack · Re-run simulation) must **read as clickable** — a different
     colour from a plain card.
3. **Each department feeds the engine REAL data through the Document Library.** The library is
   **department-owned** and **reused by every run** that department makes.
4. **Document Library sharing — route A (+B seam), the honest default.**
   - Keep the library department-owned and reused by every run (already true).
   - **State the browser-only limit plainly on the panel.**
   - Add a **mock-first `library` seam** (Batch 3) so that when a server exists, connecting it is
     **address + key on the administration screen with NO platform rebuild**.
   - **The SERVER ITSELF IS A SEPARATE BUILD.** The seam makes the platform *ready*; it does not create a
     server. **Never claim the library is "shared with your team" while it is browser-only.**
5. **A notification on "Run Simulation"** with honest wording: it states the draft is built from the
   **currently limited** real data the engine holds for the department, and invites the department to add
   its own reports/spreadsheets/statistics in the Document Library to make the policy longer and better
   grounded.
6. **A minister-facing line** — one honest sentence stating the platform's output is only as good as the
   real data each department feeds it, and that they feed it through the Document Library. **The owner
   must approve the exact wording before it is published.**
## Measured facts

**As they were when this plan was written (2026-10-05), kept so the starting point is on record:** drafted-policy
length MIN **8,191 words** (zimra) · MAX **12,477** (health) · **27 parts**; `WORD_FLOOR = 5000`, below the real
minimum so it never fired; uploading documents added **~0** policy length; formats `.txt` REAL · `.docx` REAL ·
`.pdf` Mock · `.xlsx` unsupported; department documents browser-only.

**Measured now (after Batches 1–5, 2026-10-05 — produced by running the generator, not assumed):**

- **Drafted-policy length per department:** MIN **8,341 words** (zimra) · MAX **12,627** (health) · every
  department is **28 parts** — Batch 5 added the `2.4 Departmental material the examination read` clause and
  **Annex D — Documents and data relied upon**.
- **The floor is grounded:** `WORD_FLOOR = 8250`, just under the real minimum (8,341), and a gate fails the build
  if the floor is ever raised above the smallest real output (which could only be satisfied by padding).
- **Uploading documents now shapes the policy:** the run carries the text really read, the situation analysis
  quotes the department's own wording where it carries one of its stated priorities, and Annex D lists every
  document with what was and was not read. A file that could not be read contributes nothing.
- **Formats today:** `.txt` REAL · `.docx` REAL (browser) · `.xlsx` REAL (browser, Batch 4) · `.pdf` **Mock**
  (recorded by name, not read, labelled).
- **Department documents are browser-only:** `localStorage["nzwisiso.department-documents.v1"]`, keyed by
  department; every run of that department receives them. **No server → no cross-machine sharing.**

## The batches — each ends with the full suite, a deploy and a status update

**Every batch:** `npm run validate && npm run typecheck && npm run lint && npm test && npm run build`,
then `npx playwright test`; then deploy (`lftp mirror -R --only-newer`, never `--delete`), verify the
served file byte-identical, `npm run sync:check`, refresh the review zip. Never push on red.

- **Batch 1 — the grounded floor + a measurement gate.** Set `WORD_FLOOR` to **8,000 words** (just under
  zimra's 8,191); correct the stale "5,770–6,491" claims to 8,191–12,477; add a gate that measures all 16
  departments and fails if any falls below the floor; prove it can fail by mutation.
- **Batch 2 — the three earlier items.** (2a) Graph node → right-hand panel with Close + Escape, one
  `role="list"` kept, stacks below `lg`, compact form untouched (`RelationshipGraphCard.tsx`).
  (2b) Button strip → `bg-primary-tint` (`DocumentNav.tsx`), keeping `role="navigation"`, aria-label and
  links. (2c) Groups — grow real data first: more real shares + indicators; update config, the two test
  pins and the docs; report every publisher that cannot be added, with the reason.
- **Batch 3 — the Library seam (mock-first).** `DepartmentDocumentStore` (list/add/remove) with a **Local**
  client (today) and a **Shared** HTTP client, plus a chooser reading a new **`library` capability** in
  `src/config/platform.ts`; record the server contract in `docs/SERVER_CONTRACT.md`; label Local
  unmistakably.
- **Batch 4 — Excel reading. DONE 2026-10-05.** `.xlsx` is now read **in-browser** via the existing unpack
  approach: `src/services/extraction/xlsxText.ts` reads `xl/sharedStrings.xml` (the shared word table) plus
  every `xl/worksheets/sheet*.xml` (the grid), giving one tab-separated line per row, worksheets separated by
  a blank line, numbers/booleans/in-cell words included and a skipped cell kept as a gap. `zipRead.ts` gained
  `listZipEntries` + `readArchiveBytes` (shared with the Word reader). No new dependency, no network. Gate:
  `scripts/validate.mjs` check 23 (mutation-proved). Tests: 523/523 (new `src/test/xlsx-read.test.ts`) and
  Playwright 19/19 (a real workbook uploaded in a real browser). Published and verified byte-identical.
- **Batch 5 — documents used in the policy. DONE 2026-10-05.** The run now carries the **text really read** from
  each document (`RunDocumentRecord.text`). The drafted policy gained the **`2.4 Departmental material the
  examination read`** clause, which quotes the department's OWN sentence where it carries one of its stated
  priorities (a priority is claimed only when a distinctive word really appears and the sentence can be quoted),
  and a new **Annex D — Documents and data relied upon** (Table 7) listing every document with Read / Not-read and
  characters. Annexes D–E became **E–F**; every annex cross-reference now reads the ONE `ANNEX` list. Gate:
  `scripts/validate.mjs` check 24 (mutation-proved). Tests: 529/529 (new `src/test/policy-documents.test.ts`) and
  Playwright 20/20. The length floor was re-measured and raised with reality to **8,250** (MIN now 8,341).
  **Deliberately NOT done:** the document text is not sent to the remote drafting grounding.
- **Batch 6 — the Run-Simulation notice. DONE 2026-10-05.** A dismissible pop-up shown **once per department**
  (then remembered) + a small permanent note beside the button; honest wording; link to the Document Library.
  It never blocks a run. Gate: `scripts/validate.mjs` check 25 (the store, the notice and the wiring).
  Tests: 534/534 (new `src/test/run-notice.test.tsx`, 5) and Playwright 20/20. Published and verified
  byte-identical (`assets/index-BVEy_RXC.js`).
- **Batch 7 — the minister-facing line. DONE 2026-10-06.** The owner approved the exact wording (the first of
  three drafts). One honest sentence is now on the **public landing page**, below the primary action, stated once
  in `src/config/brand.ts` (`MINISTER_STATEMENT`). Gate: `scripts/validate.mjs` check 26 (mutation-proved) and
  `src/test/landing.test.tsx`. Tests: 535/535 and Playwright 20/20. Published and verified byte-identical
  (`assets/index-Dn7j_QgE.js`).

## Resume instructions (cold session)

- **Read in order:** `PROJECT_STATUS.md` → its **RESUME HERE** block → this file →
  `docs/PLATFORM_ENRICHMENT_PLAN.md` PART 11 and the named files for the batch.
- **Branch:** `feature/unified-platform` (never `main`); confirm the tip with `git log --oneline -1` and a
  clean, IN-SYNC tree before starting.
- **Start with Batch 1**, then 2a, 2b, 2c, then 3 → 4 → 5 → 6 → 7.
  **Batches 1, 2a, 2b, 3, 4, 5, 6 and 7 are DONE and published — the drafted-policy series is complete.
  Batch 2c is BLOCKED on the owner's decision; the next work is whatever the owner chooses (Batch 2c, or a
  NEXT PHASE item such as the `/platform-admin` guard).**
- **Never** raise the length floor with invented content; **never** claim team sharing before the server
  exists; **never** make a UI/UX decision the owner has not approved.

