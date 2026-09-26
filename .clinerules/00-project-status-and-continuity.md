# 00 — READ ORDER, PROJECT_STATUS, AND SESSION CONTINUITY

## Read order (do not exceed this unless the task demands it)
1. `PROJECT_STATUS.md` — the ONLY required read at session start.
2. The specific file(s) named in its `RESUME HERE` block.
3. Only then, targeted greps (`grep -rn '<symbol>' src/`) for anything else.

## Hard rules
- Never read the whole repo. Never `ls`/`cat` directories to "look around".
- Never edit a file from memory of an earlier read — read it immediately before editing.
- A new chat that says "continue where you left off" must be able to start working
  from `PROJECT_STATUS.md` alone, with no chat history and no clarifying questions.

## PROJECT_STATUS.md contract (it is the source of truth for project state)
It is not a diary and not a plan. It must ALWAYS contain:
1. **Locked constraints** — what must never be re-derived or "improved".
2. **Every work item** with `NOT STARTED` / `IN PROGRESS` / `DONE`.
   `DONE` only if verified in the same session it was written; unverified things are
   written as caveats, never as done.
3. **A `RESUME HERE` block** at the bottom: branch, HEAD sha, tree clean?, the exact
   next command(s) to run, and which file(s) to read first.
4. **A verification log** — last green commands with real output, so a cold session can
   trust the baseline without re-running everything.
5. **Known-red / blockers** — explicit, so PARTIAL is never mistaken for DONE.
6. **Files touched this session** — so the next session knows what to re-read.

## Update cadence
Update at EVERY discrete checkpoint, not only at the end. If a session stops for any
reason, the file already reflects that exact stopping point (never rely on a chance to
write it later).

## Clean-tree protocol ("the tree is always clean for the next chat")
When pausing or stopping, ALL of the following are true:
- `git status` is clean — no half-edited file, no stray scratch script, no orphan build output.
- On branch `feature/unified-platform` (never detached, never mid-rebase/merge). `main` untouched.
- `dist/`, `playwright-report/`, `test-results/`, `*.zip` are gitignored and never committed.
- `PROJECT_STATUS.md` + `PRODUCTION_READINESS.md` are committed, so state travels with the code.
- Small logical commits, so `git log --oneline` is a second opinion on state.
- Nothing is added to the repo that isn't needed by the app (no vendored doc repos).
- If a change must stop mid-way: finish it, or commit it as an explicit WIP on the
  feature branch AND record the exact incomplete point in `PROJECT_STATUS.md`.