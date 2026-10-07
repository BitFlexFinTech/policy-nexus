# ZIMBABWE_POLICY_STRUCTURE.md — the real national-policy format we must replicate

**Why this file exists.** The owner's strict rule: *"the draft policy format must always be the
same, based on the format Zimbabwe Policies are in."* This file records the **real** structure of
Zimbabwean national policies, from the documents themselves, so the platform's drafted policy
replicates it instead of a derived, report-shaped list. It is the reference the drafting library
(`src/config/draftingPrompts.ts`) and the generator (`src/services/assessment/policyDraft.ts`)
must follow.

**The owner's complaint this fixes (raised twice).** The drafted policy currently *"reads more like
a report that just cites the modelled indicators and stakeholder groups than an actual draft
policy."* The fix is two-fold: **the section order replicates the real instrument**, and **the
content reads as policy, not as commentary about the examination**.

## Sources (real Zimbabwean documents; publisher, title, period)

- **ZEPARI**, *Strengthening the Zimbabwe National Policy Making Process* — the Government's own
  account of how national policy is made (`zepari.co.zw`).
- **Government of Zimbabwe**, *National Development Strategy 2 (NDS2) 2026–2030* — the current
  national plan every sector policy aligns to (Treasury: `zimtreasury.co.zw`).
- **Government of Zimbabwe**, *National Agriculture Policy Framework (NAPF) 2019–2030* — nine policy
  pillars (Food & Nutrition Security; Knowledge/Technology/Innovation; Inputs; Infrastructure;
  Marketing & Trade; Finance & Credit; Land; Resilient & Sustainable Agriculture; Institutional
  Arrangement).
- **Ministry of Health and Child Care**, *National Health Strategy 2021–2025*.
- **Government of Zimbabwe**, *Devolution and Decentralisation Policy 2019*.
- **Government of Zimbabwe**, *National Trade Policy 2019–2023* and *National Industrial
  Development Policy 2019–2023*.

**Honest limitation (to close in the build).** The tool used to fetch can read web pages but **not
PDFs**, and this machine has no PDF reader, so the exact **table of contents of every departmental
policy could not be extracted here**. Where a department's real document cannot be opened, the
build must name it and use the closest verified Zimbabwean format — never invent one.

## The real Zimbabwean national-policy skeleton (what the drafted policy must follow)

1. **Cover / identification** — Republic of Zimbabwe; the Ministry; the policy title and period;
   the Vision 2030 / NDS2 framing.
2. **Foreword** — by the responsible Minister, marked for signature and date.
3. **Acronyms and abbreviations**.
4. **Executive summary**.
5. **1. Introduction and background** — the mandate, and the link to NDS2 and Vision 2030.
6. **2. Situation analysis** — the **sector's** situation, with sourced figures. *(This is analysis of
   the sector, not a description of the platform's model.)*
7. **3. Vision, mission and objectives** — a goal, then objectives.
8. **4. Guiding principles**.
9. **5. Policy measures / priority areas / pillars** — **THE HEART OF THE INSTRUMENT.** Each pillar
   is a **policy statement** plus the strategies that carry it. (In the NAPF this is the nine
   pillars; a real policy puts most of its substance here.)
10. **6. Legal and institutional framework** — the Acts, statutory instruments and institutions.
11. **7. Implementation framework** — who does what, and the coordination structures.
12. **8. Resource mobilisation and financing**.
13. **9. Risk management**.
14. **10. Monitoring, evaluation and reporting**.
15. **Annexes** — matrices, the M&E framework, costing, the documents relied upon; and references.

## The one rule that makes it read as policy, not a report

**The instrument never talks about the platform, the examination or the indicator table.** It states
what the Department shall do. So, in the drafted policy's own voice, none of these may appear:
"the examination modelled…", "the platform's table records…", "the indicators below are…",
"the examination raised N risks…". The assessment's **findings** become the policy's **measures and
provisions**; they are not narrated.

## Per-department note (to complete in the build)

For each of the 16 departments, read that department's real national policy and record its exact
section list here. Starting point: **agri** → NAPF 2019–2030; **health** → NHS 2021–2025; **ict** →
National ICT Policy + National AI Strategy; **lg** → Devolution & Decentralisation Policy 2019;
**mfa/fin** → National Trade / Industrial Development Policy; **opc** → NDS2 / Vision 2030. The
remainder (edu, hedu, mines, energy, psc, env, def, zimra, zida) to be added as each real document
is opened.
