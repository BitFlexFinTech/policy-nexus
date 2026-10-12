# TECHNICAL SPECIFICATION

## Nzwisiso AI Policy Platform — a public-private partnership proposal from Oreida Pvt Ltd to the Government of Zimbabwe

**GOVERNMENT OF ZIMBABWE**

**Nzwisiso AI Policy Platform — Public-Private Partnership Proposal**

*A browser-based capability that tests a draft policy against a simulated population before it is implemented, and produces structured findings for human review.*

**Addressed to:** the Honourable Minister of Information Communication Technology, Postal and Courier Services — **Hon. Tatenda Mavetera, MP** · **Co-addressed to:** Dr. Gibson Chigumira, Executive Director, ZEPARI

**Submitted by:** **Oreida Pvt Ltd** — **Edmore Zviitwah (Business Lead)** · **Tadii Tendayi (Technical Lead)**

**Date:** October 2026

**Status table — stated honestly:**

| State | What it covers |
|---|---|
| **Working today** | The scenario simulation, the deterministic engine, the department workspaces, the drafted policy and its exports (PDF, Word, print), the reference screen and the document library — all running in an ordinary web browser with no network connection at run time. |
| **Demonstrated with sample data** | The research assistant, the drafting assistant and document text extraction, shown against clearly labelled sample material. |
| **Proposed** | Server-side document text extraction, server-side identity verification, and deployment to a production service under service levels (the three build steps). |
| **Requires external approval** | Government infrastructure hosting, data-protection sign-off, and use of the national Coat of Arms. |

**Disclaimers:** This is a technical specification supporting a proposal. It is not an agreement and not a Government publication. It does not represent a Government approval, endorsement or commitment.

---

## 1. Purpose and scope

This document states, in engineering terms, what the Nzwisiso AI Policy Platform is, how it is built, what it does today, and what the three proposed build steps add. It is written so that a Government technical reviewer or an independent assessor can check the claims in the proposal against the system itself.

It covers the platform as it stands in **October 2026** and the changes Oreida Pvt Ltd proposes to make it fit for Government production use. It does not restate the commercial proposal, which is a separate document.

## 2. What the platform is

The platform is a **browser-based** capability — it runs in an ordinary web browser, with no software to install on the officer's machine. An officer of a Government department selects their department, supplies a draft policy (by typing it, choosing a preset, or uploading a file), and runs a **scenario simulation**. The platform returns a structured, reproducible analysis for a human reader: how a set of modelled stakeholder groups is projected to respond, over a chosen time horizon, with the figures shown against the department's own reference indicators.

The platform **informs a decision; it does not take one.** Every number it presents is a simulation, plainly labelled as simulated, and never presented as measured public opinion or an administrative result.

## 3. System architecture

The platform is a single web application with a clear internal seam between the **user interface**, the **engine**, and the **data**.

| Layer | What it is | Where the boundary sits |
|---|---|---|
| Presentation | Pages, the department workspace, the reference screen, the document library, exported documents | Rendering only; never holds a second copy of a result shape |
| Engine | The deterministic scenario simulation, the drafting stage, the research retrieval | Reached only through a defined service interface |
| Data | Departments, reference indicators, stakeholder groups, the published-document corpora | Single-source configuration modules; one shape per concept |
| Service seam | The interface every engine call passes through | The one place a server-backed implementation is later switched in |

The stack is deliberately mainstream and inspectable: **TypeScript**, **React 18**, **Vite** as the build tool, **Tailwind** for styling, and a small set of stock interface components. There is **no proprietary runtime, no hidden service and no runtime network dependency** in the scenario build.

## 4. The deterministic simulation engine

The engine is the heart of the system, and its most important property is **determinism**: the same department and the same policy text always produce a **byte-identical** result.

- The engine is seeded by a **pseudorandom number generator driven by a hash of the department identifier, the normalised policy text and the template identifier** — not by a clock and not by the browser's random source.
- **No wall-clock time and no random source enter a figure.** The platform reads the real clock in exactly one place — the on-screen "today" and the moment a run is recorded — and that moment is metadata only: it is never part of the seed, so it cannot change a figure.
- Figures are computed for a **fixed data frame** (a stated reference date), not for "today", so a result is stable and citable.
- Every figure the platform presents is produced by this engine and read through the **single result schema**. **The interface never invents a shape; it renders the one the engine defines.**

This property is what makes a run auditable: a reviewer can re-run the same department and the same policy and get the same numbers, and can prove the record was not altered.

## 5. Data model and sources

- **16 Government departments**, each with its own workspace and its own configuration.
- A body of **reference indicators** and **stakeholder groups**, each carrying its published source where one exists, and each plainly marked where a value is a modelled assumption rather than a published figure.
- A **library of real published documents** — the governing laws, policies, committee reports and audits that a department works under — each recorded with the body that published it, its date, its page count and the address of the published file.
- **One shape per concept**: departments are defined in one module, result types in one module, and identity strings in one module, so the platform cannot drift into two versions of the same fact.

The platform's governing rule is the same one stated in the proposal and the underlying evidence base: **real, named, published sources in; clearly-labelled simulated output out.** A figure with no source is not permitted, whatever it is called.

## 6. The service seam — scenario today, server later

Every engine call passes through a single **service interface**. Behind that interface sit two possible implementations:

- a **scenario implementation**, which is what ships today and needs no network; and
- a **server-backed implementation**, which is what a hosted production service will use.

Switching from one to the other is a **configuration change, not an interface change**. That is deliberate: it means the platform can be handed to the Government today in scenario form and moved to a live, hosted service later **without rewriting the screens the officers use**. The same seam governs the other capabilities the platform exposes — research, drafting, document extraction, the document library and sign-on — each of which has a clearly stated state (**working**, **demonstrated with sample data**, or **not yet connected**).

## 7. Security, privacy and data protection

- **No runtime network connection in the scenario build.** With the scenario implementation active, a simulation makes **no external request at all** — no third-party script, no external font, no analytics call, and no policy text leaves the browser. This is verifiable from the served page and is a matter the Government can test.
- **Policy text stays in the browser** in the scenario build. It is not transmitted anywhere.
- **A single, honest statement of the boundary:** the AI-written parts of the drafted policy are produced over a defined interface. In the **costed end state**, the model runs **locally**, on hardware under Oreida Pvt Ltd's control, so no policy text is sent to an external service. **That statement is true of the end state, not necessarily of the demonstration an officer is shown today** — this is stated plainly rather than implied.
- **Data protection** obligations and the responsible authority are to be confirmed with the Government before any personal data is processed in production.
- **Identity and access.** In the pilot, sign-in is a one-click demonstration context; the **server-side identity verification** build step is what makes access real and government-grade.

## 8. Deployment and hosting

The platform is delivered as a **static web build** — a set of files served over HTTPS — which is why it can be hosted on ordinary Government infrastructure without a bespoke application server for the scenario capabilities. The proposed end state is a **production service under service levels**, run and hosted for the Ministry by Oreida Pvt Ltd under the licence, with the platform and all data reverting to the Government at the end of the term.

Nothing in this document should be read as saying the platform **today** runs on Government infrastructure. It does not.

## 9. The three proposed build steps

The proposal asks for funding for **three named build steps**, each of which hardens the demonstration for Government use. They are the only parts of the system that are not built today.

| Step | What it adds | Why it is needed |
|---|---|---|
| **Server-side document text extraction** | Reads the text of an uploaded policy document on the server, so a PDF or a scanned file can seed a run, rather than only a typed or plain-text source | Officers work from documents, frequently in PDF; extracting their text reliably is a server task |
| **Server-side identity verification** | Real, government-grade sign-in, so a run is attributable to a named officer | A Government system must know who ran a simulation and when |
| **Deployment to a production service under service levels** | A hosted, monitored, supported service with stated availability and support terms | A pilot becomes a service the Ministry can rely on |

## 10. Browser support, accessibility and performance

The platform runs in current mainstream browsers on ordinary Government desktops and laptops; it needs no installation and no special hardware. It is designed for the fixed-layout workspace an officer uses, with keyboard reachable controls, labelled inputs, sufficient contrast and print rules that produce a clean printed document from the on-screen view. Performance in the scenario build is bounded by the browser alone, because no network call is made while a run is produced.

## 11. Operating and maintenance

In the proposed public-private partnership, Oreida Pvt Ltd **runs, hosts, powers, maintains and supports** the platform for the Ministry over a **ten-year term, reviewed at the fifth year**, under the service levels set out in the Service Agreement. The monthly service charge covers hosting, operation, support and maintenance; it is not a per-officer or per-use fee. At the end of the term the **platform and all data revert to the Government**, and the source code is held in escrow so the Government holds a real right from the first day.

## 12. Verification and testing approach

The platform is built and shipped under an automated check suite that runs on every change, and whose results are recorded rather than assumed. It includes, at minimum:

- a **replay test** that proves the same department and the same policy produce a byte-identical result, and that the recorded date cannot change a figure;
- **coverage checks** that every one of the 16 departments ships its own real published documents and no listing screen silently shows a subset;
- **render (smoke) tests** that every screen renders with realistic seeded data without error;
- **end-to-end browser tests** of the officer's journey, run against the production build;
- a **determinism guard** that fails the build if a random source or the wall clock is used to generate content outside the single clock module.

A claim in this document is only made where the corresponding check exists and passes. Where something cannot be verified in the build — for example the visual rendering of a printed page on the Government's own printer — that is stated rather than implied.

## 13. Limitations, stated plainly

- The **scenario build is a demonstration**, not a deployed national system. Its figures are **simulated**, not measured.
- **Document text extraction, real identity verification and production hosting are not built** — they are the three funded build steps.
- The **live research assistant and drafting assistant are demonstrated against sample material**, not connected to a live model in the scenario build.
- The platform **does not run on Government infrastructure today**, and no Government data is processed by it today.
- Where a modelled figure has no published source, the platform **says so**; it does not present an estimate as a fact.

## 14. Glossary

| Term | Meaning |
|---|---|
| **Scenario simulation** | A reproducible projection of how modelled stakeholder groups are expected to respond to a draft policy; a simulation, not a measurement |
| **Deterministic** | The same inputs always give the same output, to the byte |
| **Data frame** | The fixed reference date the figures are computed for, which does not move |
| **Service seam** | The single interface every engine call passes through, where a hosted implementation is later switched in |
| **Reference indicator** | A figure the platform shows as the department's own evidence base, carrying its published source where one exists |
| **Stakeholder group** | A modelled population group the simulation projects a response for |

**END OF DOCUMENT**