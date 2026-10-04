# Nzwisiso AI Policy Dashboard

Deterministic, scenario-mode policy assessment workspace for Zimbabwe government departments.

**Understanding before action.**

## What it is

A single config-driven dashboard for 16 departments that turns a policy draft into a structured,
repeatable assessment: the draft is understood and mapped, becomes a simulated population of agents,
those agents interact, and only then is an assessment produced — findings, risks and recommendations
for human review.

- **Scenario mode only.** No backend, no database, no external AI call, no runtime network request.
- **Deterministic.** The same department and the same policy text always produce a byte-identical
  run and byte-identical generated documents.
- **Decision support, not decision making.** The platform informs review; it does not determine
  policy outcomes.

## Stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui. Package manager: **npm**. Fonts are
self-hosted in `public/fonts/`.

## Routes

| Route | Screen |
|---|---|
| `/` | Landing (public) |
| `/start` | Choose your Department (public) |
| `/app` | Department dashboard |
| `/app/policies`, `/app/simulations` | Policy and simulation registers |
| `/app/simulations/:id` | Live deterministic simulation |
| `/app/assessments/:id` · `/full` · `/report` · `/policy-draft` | Assessment outputs |
| `/app/documents`, `/app/reference` | Document library, methodology and limitations |

## Commands

```bash
npm install
npm run dev        # http://localhost:8080/
npm run build
npm test
npm run validate && npm run typecheck && npm run lint
npx playwright test
```

## Project state

- `PROJECT_STATUS.md` — current verified state, verification log and resume instructions.
- `PRODUCTION_READINESS.md` — the mock → real go-live checklist.
- `docs/OFFLINE_DEMO.md` — one page: run the demonstration on a laptop with **no network**.

