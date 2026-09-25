# 03 — PRESERVE THE EXISTING UI. DO NOT BREAK WHAT WORKS.

The existing frontend is the starting point, not the problem. Preserve → simplify →
connect. Remove only what is proven unnecessary.

## Locked (never replaced or "improved")
- The emerald/gold Zimbabwe palette in `src/index.css` (`--primary: 120 100% 20%`,
  `--gold: 51 100% 50%`, `--success`, `--warning`). No new colour literals anywhere.
- Inter + JetBrains Mono typography system (`tailwind.config.ts` fontFamily).
- All `src/components/ui/**` shadcn primitives — keep byte-identical unless strictly required.
- The visual identity of: header bar + coat of arms, KPI card strip, engine-vitals panel,
  agent-feed rows (timestamp + coloured tag), simulation-history table, document-library rail,
  sovereign footer, policy input textarea/upload zone/preset chips.
- No new runtime dependency without explicit user approval. `package.json` dependencies must
  be unchanged at the end of a task (only `name`/`scripts` may change).
- `LICENSE` / `NOTICE` / licence headers are never altered.
- `main` is never committed to or pushed to by an agent.

## Rules
- New screens are composed from existing `ui/*` primitives + palette tokens. No gradients,
  glassmorphism, giant hero sections, neon AI styling, or marketing-card language.
- Extend existing components with OPTIONAL props (defaults reproduce current rendering) rather
  than rewriting them. If a shape change is unavoidable, reproduce the previous visual exactly
  and state the one-line reason in the report.
- Any deletion requires proof: a grep showing zero references, with before/after counts
  reported. Never delete code because it is "not immediately visible".
- Never remove useful non-workflow functionality — move it to secondary navigation instead.
- Surgical, route-scoped changes over broad sweeps. Respect `h-screen`/fixed-viewport layout
  assumptions; responsive changes are additive and only below `lg`.
- Print rules must live inside `@media print` so on-screen layout is untouched.
- Before reporting any task done: `git diff --stat` review + full validation suite.