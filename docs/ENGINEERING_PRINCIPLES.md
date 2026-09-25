# ENGINEERING_PRINCIPLES.md

Distilled principles applied in this project from the reference material requested by the
user. The reference repositories are **not vendored** into this repo (that would bloat a
frontend project and contradict "do not overbuild"); only the principles that actually
shaped decisions here are recorded, with where they were applied.

## From system-design references (system-design-primer, system-design-101,
## karanpratapsingh/system-design, awesome-system-design, awesome-scalability,
## system-design-interview, ML-systems-design, system-design-academy)
1. **Separate the seam from the implementation** — put a stable interface where a volatile
   dependency will eventually live. Applied: `AssessmentService` interface + factory; the UI
   never imports the scenario generator or any backend client.
2. **Single source of truth for data and schema** — one canonical type/schema per concept.
   Applied: `src/config/departments.ts`, `src/services/assessment/types.ts`,
   `src/config/brand.ts`, `src/config/reference.ts`.
3. **Make state transitions explicit and reproducible** — deterministic inputs/outputs make a
   system testable. Applied: seeded PRNG + `REFERENCE_DATE` + replay deep-equal test.
4. **Design for the read path first, cache/persist deliberately** — Persist only what must
   survive: the chosen department (session), not derived simulation output.
5. **Fail loudly, degrade honestly** — an unconfigured real implementation should throw a
   clear "not configured" error, never silently return fake data.
   Applied: `mirofish.ts` seam throws; mock values use unmistakable placeholders.
6. **Keep blast radius small** — one consumer per shared module; additive over invasive change.
   Applied: optional props on existing components, route-scoped edits, `@media print` isolation.

## From agentic design patterns (sarwarbeing-ai)
7. **Tool-per-capability, not god-objects** — each module does one job with a typed contract.
   Applied: separate `lib/prng`, `config/*`, `services/assessment/*`, `components/simulation/*`.
8. **Deterministic tool outputs over stochastic ones** where the user needs reproducibility.
   Applied: simulation is a pure function of (department, policy, template).
9. **Human-in-the-loop framing** — generated content is advisory, with explicit provenance and
   disclaimers. Applied: "Prepared for decision support. Not a definitive forecast." on the
   assessment screens, plus simulation-language rules enforced by validator.

## From UI craft skills (jakubkrehel: better-ui / better-typography / better-colors;
## emilkowalski: emil-design-eng / review-animations / animation-vocabulary)
Installed **globally** (not vendored) and invoked only for UI/typography/colour/motion asks.
Within this project they operate inside `.clinerules/03-preserve-existing-ui-and-no-break.md`:
- Typography consistency: reuse the existing Inter scale and JetBrains Mono for numerals/IDs
  rather than inventing new sizes.
- Colour discipline: every value resolves to existing palette tokens (`primary`, `gold`,
  `success`, `warning`, `muted`) — no ad-hoc hex/hsl outside `src/index.css`.
- Motion restraint: animation is used only where it communicates state (simulation progress,
  feed ticks), keeps `prefers-reduced-motion` respect via the existing animation utilities, and
  never becomes decorative for government software.
- Interaction quality: visible focus states, accessible names on all department buttons,
  keyboard-operable grids — no visual effect at the cost of usability.