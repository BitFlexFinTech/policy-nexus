# SERVER_CONTRACT.md — what the services must implement

The platform is built mock-first: every capability runs simulated until a platform
administrator completes it at `/platform-admin`. This file is the contract those
services must satisfy so that completing the administration screen is the **only**
step required to go live.

Nothing here exists yet. Each section states plainly what the platform already
sends, what it expects back, and what it will do when the answer is wrong.

## 0. Rules that apply to every service

1. **The credential is a bearer token.** The platform sends
   `Authorization: Bearer <key>` on every request. It never sends the key anywhere
   else, and never in a query string.
2. **Answer with JSON.** `content-type: application/json`.
3. **Never answer partially.** The platform validates every payload against the
   canonical schema (`src/services/assessment/types.ts`) and **rejects anything
   incomplete** rather than rendering it. An incomplete answer is shown as a
   failure, never as a result.
4. **Determinism is the server's responsibility once live.** In simulated mode the
   platform guarantees "same input ⇒ same output". A live service inherits that
   promise only if it resolves the same request to the same body. If the drafting
   model is non-deterministic, say so — the guarantee must be described, not
   assumed.
5. **No wall-clock content.** Figures and documents are dated from the request's
   reference date (`2026-09-24` in this build), not from the server's clock.
6. **Errors are errors.** Use a 4xx/5xx status; the platform reports the status
   rather than substituting a simulated result.

## 1. Assessment service — `POST <assessment endpoint>`

Sent when the assessment capability is live.

```json
{ "request": {
    "departmentId": "fin",
    "policyText": "…the policy draft…",
    "source": "paste",
    "templateId": "fin-01",
    "timeHorizon": "short",
    "fileNames": ["draft.txt"]
} }
```

Expected: **200** with a complete `AssessmentRun` — every field in
`src/services/assessment/types.ts`:

```json
{ "id": "…", "departmentId": "fin", "departmentName": "…", "departmentAbbr": "FIN",
  "reference": "FIN-01", "policyTitle": "…", "policyText": "…", "source": "paste",
  "fileNames": [], "createdAt": "2026-09-24", "seed": "…", "timeHorizon": "short",
  "horizonLabel": "Short term", "status": "complete", "confidence": 70,
  "summary": "…", "rounds": [], "reactions": [], "impacts": [],
  "risks": [], "recommendations": [], "metrics": [] }
```

Also required by the same client:

| Call | Meaning |
|---|---|
| `GET <endpoint>/<runId>` | One recorded run. **404** is treated as "no such run" (the platform shows its own not-found screen). |
| `GET <endpoint>?department=<departmentId>` | The department's runs, newest first. A non-2xx answer is shown as an empty register, not as a fabricated one. |

## 2. Drafting service — `POST <drafting endpoint>`

```json
{ "kind": "report" | "policy-draft", "model": "…", "run": { …the completed AssessmentRun… } }
```

Expected: **200** with a complete `GeneratedDocument`
(`src/services/assessment/types.ts`): `kind`, `title`, `subtitle`, `fileStem`, and a
non-empty `sections` array whose entries each carry `id`, `heading` and
`paragraphs` (optionally `bullets`, `listStyle`).

The platform rejects a document with no sections rather than rendering an empty
instrument.

## 3. Document text extraction — `POST <extraction endpoint>`

`multipart/form-data` with one part, `file`.

Expected: **200** with `{ "text": "…the extracted text…" }`. A blank or missing
`text` is reported as "no readable text", not as success. PDF and DOCX are the
formats that need this service; plain text is read in the browser.

## 4. Government sign-in — an OIDC provider

The client is OIDC Authorization Code + PKCE (S256), no dependency
(`src/session/sso.ts`). Expected endpoints, beneath the configured issuer address:

| Path | Purpose |
|---|---|
| `<issuer>/authorize` | Receives `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256` |
| `<issuer>/token` | `application/x-www-form-urlencoded` with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`; answers `{ "id_token": "…" }` |

The `redirect_uri` must be registered with the provider — that registration is
outside this platform's reach.

## 5. Wiring that is still outstanding (platform side)

Named so it cannot be mistaken for "done":

1. **The run path must become asynchronous.** `AssessmentService` — the interface
   the screens use — is synchronous, so the remote assessment client
   (`src/services/assessment/remoteAssessmentClient.ts`) and the remote drafting
   client (`src/services/documents/remoteDraftingClient.ts`) are **built, unit-
   tested against a stubbed transport, and NOT connected to any screen.** Wiring
   them means: make the interface return promises, then follow that through the
   policy input, `useAssessmentRuns`, `useRun`, and every register that lists runs,
   adding loading and error states. Until then, live mode changes nothing on screen.
2. **A callback route and a claim mapping for sign-in.** `completeSignIn` returns
   the identity token; something must receive the callback at the configured
   redirect address and map the token's claims to one of the 16 department IDs.
   Neither is possible without a registered provider.
3. **Credential storage.** Keys are held in the browser's local storage and are
   readable through developer tools. A production deployment should hold them in a
   server-side proxy and give the browser only a session token.
