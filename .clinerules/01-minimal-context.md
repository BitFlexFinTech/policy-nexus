# 01 — MINIMAL CONTEXT ONLY

Goal: understand enough to act correctly, without paying to re-read the repo every session.

## Rules
- Start from `PROJECT_STATUS.md`. It is the entry point for every session.
- Read only the files it names, plus files you are about to edit.
- Use targeted search before reading: `grep -rn '<symbol>' src/` or a filename search.
  Never `cat`/read a whole directory or adjacent files "just to look around".
- Never read `node_modules/`, `dist/`, lockfiles, or `src/components/ui/**` unless the task
  is specifically about them (they are stock shadcn primitives — treat as stable).
- Never re-read a file you already read this session unless you are about to edit it or
  several edits happened since; always re-read immediately before editing.
- Truncate noisy command output (`| tail`, `| grep -E 'error|FAIL'`) — extract only results.
- When a task is done, the knowledge gained goes into `PROJECT_STATUS.md`, not into another
  full-repo exploration next time.

## This project's stable facts (do NOT re-derive)
- Stack: Vite + React 18 + TS + Tailwind + shadcn/ui. Package manager: **npm**
  (`bun.lock` also exists — never regenerate or run `bun install`).
- Routes: `/` Home (department select) · `/app` dashboard · `/app/policies`
  · `/app/simulations` · `/app/simulations/:id` · `/app/assessments/:id`
  · `/app/assessments/:id/full` · secondary `/app/documents`, `/app/reference`.
- LOCKED: emerald/gold Zimbabwe palette in `src/index.css`; Inter + JetBrains Mono.
- LOCKED: ONE shared dashboard layout for all 16 departments, config-driven.
- Identity strings live ONLY in `src/config/brand.ts`; departments ONLY in
  `src/config/departments.ts`; result types ONLY in `src/services/assessment/types.ts`.
- Determinism: no `Math.random`, no `Date.now()`, no `new Date()`. `REFERENCE_DATE = "2026-09-24"`.
- No runtime network: no CDN scripts, no AI APIs, no Puter. Scenario mode only.

## Commands
```bash
npm run validate && npm run typecheck && npm run lint && npm test && npm run build
npx playwright test          # end-to-end journey, against vite preview
git status --short && git log --no-pager --oneline -5
```