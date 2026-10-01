/**
 * SINGLE SOURCE OF TRUTH — what answers each recommended step, and where to find it.
 *
 * The owner's request: *"the recommended next steps should draft all the plans and documents for the
 * user to carry out those recommended next steps… the user should have the option to click the action
 * button next to the implement the recommended steps."*
 *
 * The research that shaped this, done before any code was written: the platform ALREADY drafts the
 * plans — they are inside the drafted policy, as the implementation matrix, the cost categories, the
 * monitoring and evaluation matrix and the stakeholder analysis. What was missing is that no
 * recommendation said WHERE its answer is, so an officer had to open a long instrument and hunt.
 *
 * One row per recommendation, and each row names the section of the drafted policy that answers it and
 * what the officer does with it. The generator's remedies and this table must stay in step: a test
 * checks that every remedy the engine can produce has a row here, so a new recommendation can never
 * appear beside a dead button.
 *
 * Determinism: plain authored data. No clock, no randomness.
 */

/** The part of the paperwork that answers one recommended step. */
export interface RecommendationTarget {
  /** The section of the drafted policy to open — the same ids the document renders. */
  sectionId: string;
  /** That section, named the way the document names it, so the reader knows where they are going. */
  label: string;
  /** What the officer does with it, in one plain line. */
  use: string;
}

/**
 * Where a step that has no row of its own lands: the annex that lists every recommended step with the
 * requirement each carries. A fallback exists so a remedy added to the engine can never leave a
 * recommendation with nowhere to go.
 */
export const RECOMMENDATION_FALLBACK: RecommendationTarget = {
  sectionId: "annex-a",
  label: "Annex A — Implementation matrix for the steps the examination recommended",
  use: "Open the annex that lists this step with the requirement it carries.",
};

/** Every remedy the engine can recommend, and the part of the drafted policy that answers it. */
export const RECOMMENDATION_TARGETS: Record<string, RecommendationTarget> = {
  "rec-assign": {
    sectionId: "implementation",
    label: "Implementation framework — Table 4, the implementation matrix",
    use: "Fill in the responsible office, the target date and the funding source, then send the matrix on.",
  },
  "rec-schedule": {
    sectionId: "implementation",
    label: "Implementation framework — Table 4, the implementation matrix",
    use: "Fill in the responsible office, the target date and the funding source, then send the matrix on.",
  },
  "rec-phase": {
    sectionId: "transitional",
    label: "Transitional provisions",
    use: "Record the commencement date and any change to the phases, which are the department's to decide.",
  },
  "rec-align": {
    sectionId: "transitional",
    label: "Transitional provisions",
    use: "Record the commencement date and any change to the phases, which are the department's to decide.",
  },
  "rec-fund": {
    sectionId: "finance",
    label: "Financial implications — Table 4 funding column and Table 5, cost categories",
    use: "Name the budget line or levy for each action, using the cost categories as the checklist.",
  },
  "rec-support": {
    sectionId: "implementation",
    label: "Implementation framework — Table 4, the implementation matrix",
    use: "Set out the training, staffing or procedure support each action needs before it starts.",
  },
  "rec-engage": {
    sectionId: "annex-b",
    label: "Annex B — Stakeholder analysis, group by group",
    use: "Take the groups the draft does not address, and brief them with their own modelled position.",
  },
  "rec-scope": {
    sectionId: "measures",
    label: "Policy measures",
    use: "Add the groups and activities the policy applies to, so every reader takes the same meaning.",
  },
  "rec-instrument": {
    sectionId: "citations",
    label: "Annex C — Instruments relied on",
    use: "Check the cited Act against the department's own register and add it if it belongs there.",
  },
  "rec-enforce": {
    sectionId: "implementation",
    label: "Implementation framework — Table 4, the implementation matrix",
    use: "Name the office that inspects or audits, so the penalty has machinery behind it.",
  },
  "rec-adjust": {
    sectionId: "measures-arising",
    label: "Measures arising from the examination",
    use: "Visit the measures that carry the negative movement, then run the edited wording through again.",
  },
  "rec-review": {
    sectionId: "monitoring",
    label: "Monitoring, evaluation and review",
    use: "State in advance what would cause the policy to be revisited, and what data would show it.",
  },
  "rec-monitor": {
    sectionId: "monitoring",
    label: "Monitoring, evaluation and review — Table 6, the monitoring and evaluation matrix",
    use: "Set the target and the collecting office for each indicator, then send the matrix to planning.",
  },
};

/** The target for one recommendation. Unknown ids land on the annex, never on a dead button. */
export const recommendationTarget = (recommendationId: string): RecommendationTarget =>
  RECOMMENDATION_TARGETS[recommendationId] ?? RECOMMENDATION_FALLBACK;

/**
 * The address that opens the drafted policy at one section.
 *
 * The drafted-policy screen renders every section with `data-doc-section="<id>"`, so the browser's own
 * `#hash` is enough to land the reader on the right table — no new route, no new state.
 */
export const policyDraftPartPath = (runId: string, sectionId: string): string =>
  `/app/assessments/${encodeURIComponent(runId)}/policy-draft#${encodeURIComponent(sectionId)}`;
