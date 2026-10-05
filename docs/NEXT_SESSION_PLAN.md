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
## Measured facts (2026-10-05 — produced by running the generator, not assumed)

- **Drafted-policy length per department:** MIN **8,191 words** (zimra) · MAX **12,477** (health) ·
  AVG **9,368** · every department is **27 parts**.
- **Length is driven by the data:** `words ≈ 6,400 (fixed) + ~88 × (number of real indicators)`.
- **The build's floor is too low:** `WORD_FLOOR = 5000` in `src/test/policy-document.test.ts` — BELOW the
  real minimum (8,191), so it never fires.
- **Uploading documents adds ~0 policy length today:** fin 10,301 words with no documents → 10,172 with
  five long documents. Documents change the run's seed and its `metric-documents` count, but the drafted
  policy does **not** yet use their text. **This is why Batch 5 exists.**
- **Formats today:** `.txt` REAL · `.docx` REAL (browser) · `.pdf` **Mock** (recorded by name, not read,
  labelled) · `.xlsx` **unsupported**.
- **Department documents are browser-only:** `localStorage["nzwisiso.department-documents.v1"]`, keyed by
  department; every run of that department receives them. **No server → no cross-machine sharing.**
- **A stale record to fix:** `PRODUCTION_READINESS.md` and the policy test still say "5,770–6,491 words";
  the truth is **8,191–12,477**.

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
- **Batch 4 — Excel reading.** Read `.xlsx` in-browser via the existing unpack approach (sharedStrings +
  sheet XML). No new dependency, no network.
- **Batch 5 — documents used in the policy.** Add a **"Documents and data relied upon"** annex (documents
  really read) and use them in the situation analysis — real content, not padding.
- **Batch 6 — the Run-Simulation notification.** A dismissible pop-up (once per department, remembered) +
  a small permanent note beside the button; honest wording; link to the Library.
- **Batch 7 — the minister-facing line.** One honest sentence; **owner approves the exact wording first.**

## Resume instructions (cold session)

- **Read in order:** `PROJECT_STATUS.md` → its **RESUME HERE** block → this file →
  `docs/PLATFORM_ENRICHMENT_PLAN.md` PART 11 and the named files for the batch.
- **Branch:** `feature/unified-platform` (never `main`); confirm the tip with `git log --oneline -1` and a
  clean, IN-SYNC tree before starting.
- **Start with Batch 1**, then 2a, 2b, 2c, then 3 → 4 → 5 → 6 → 7.
- **Never** raise the length floor with invented content; **never** claim team sharing before the server
  exists; **never** make a UI/UX decision the owner has not approved.

