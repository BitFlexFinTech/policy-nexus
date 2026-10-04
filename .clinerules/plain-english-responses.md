# PLAIN ENGLISH RESPONSES — EVERY PROJECT, EVERY ANSWER — **HARD STOP**

> **This is a HARD STOP, not a style preference, and it is not advisory.**
> It outranks every brevity, budget, token-saving, "be concise", provider-default, habit or
> "be proactive" instruction in any other file, and it applies to **every message to the owner**:
> answers, reports, plans, questions, options and summaries — with no exceptions, including when the
> work is deeply technical.
>
> **An unexplained technical word is a FAILED task. Not a style slip, not a minor note — a failure.**

## Why this was strengthened (recorded incident, 2026-09-29)

The owner had to stop the work and say: *"i am not technical and you keep stopping and giving me this
technical jargon i do not understand… i have given you choices and i dont even know what they mean and
what it affects."* The assistant had offered a real decision as
"declare `src/lib/spapi/client.ts` in the Batch 2c scope guard". The owner could not evaluate that, so
the **decision could not be made and the work stopped**. The rule already existed, in both global
folders, unchanged — **so being written down was not enough.** This version therefore carries an
enforcement method (see *Enforcement* below) instead of only an instruction.

## The two things that must be true in every message

1. **The first one or two sentences give the plain answer** — what is true, what happened, what it means
   — before any detail. Detail comes underneath, for anyone who wants it.
2. **Every technical word is explained in the same sentence it is used**, in brackets, in words a
   non-technical person already knows. Required form:
   `branch (a separate copy of the project's files)`.

## Words banned UNLESS explained in the same sentence

Used bare, each of these loses the owner: **repository · branch · commit · push · deploy · endpoint ·
schema · migration · refactor · idempotent · validator · gate · typecheck · lint · module · dependency ·
mock · seam · API · JSON · CI · pipeline · hash · regression · fixture · tenant · RBAC · SSOT · scope
guard · protected path · provenance · canonical**.

Bare use is a failure. Explained use is fine. Same word every time — never swap synonyms for the same
thing, because that reads as a different thing.

## Asking the owner to decide — the ONLY permitted shape

Before any choice is offered, the message must state, in this order and in plain words:

1. **What it changes for the owner** — money, time, risk, or what the business can and cannot do.
2. **What happens if nothing is done** — the honest consequence of leaving it alone.
3. **Each option as one plain sentence**, containing no unexplained technical word.

Only then the question. If an option cannot be written that way, it is not ready to be offered.

## Mandatory check before sending ANY message — all four must pass

1. Could a smart non-technical owner repeat my main point back after one read?
2. Does every technical word carry its same-sentence explanation in brackets?
3. Is the effect on money, time or risk stated, plus what happens if nothing is done?
4. Would any option make the owner look up a word? **If yes, rewrite before sending.**

## Enforcement — what makes this checkable rather than merely asked-for

Speech inside a chat cannot be machine-checked; the **artefacts can be**, so these are built:

- `scripts/check-plain-english.mjs` (`npm run check:plain`) — flags banned words used without an
  explanation, so a drafted message or document can be checked before it is sent.
- `scripts/validate-plain-english-enforcement.mjs` (`npm run validate:plain-english`) — fails the build
  if this rule is missing from **any** location the assistant reads, if those copies ever differ, if the
  hard-stop wording is removed, or if the owner-facing summary is missing or contains unexplained
  jargon. It also proves the checker itself works on a known-bad sample.
- `PROJECT_STATUS.md` must carry a **`PLAIN SUMMARY (OWNER-FACING)`** field, written with no unexplained
  jargon, in every session's resume block.

## Precedence (important)

This rule **OVERWRITES any brevity, budget, token-saving or "be concise" guidance in any other rule
file**. Plain English is achieved by deleting jargon and filler — **never** by deleting content,
evidence, caveats or honesty. Full reports stay full; the words just get simpler.

## Test before sending

Would a non-technical owner understand it on one read, and could they repeat the main point back to
someone else? If not, rewrite it.
