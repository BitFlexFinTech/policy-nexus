/**
 * THE DRAFTED POLICY'S OWN NUMBERING — one source for every cross-reference.
 *
 * The clause numbers and the annex labels live here so that the document generator, the
 * provenance sentence printed inside a draft, the screen that shows it and the gate that
 * checks it all read the same values. They were prose in three places before, which is how a
 * document came to cite "clause 8" for a list that had moved to an annex.
 *
 * The order is the Zimbabwean one: see `POLICY_DRAFT_STRUCTURE` in `src/config/draftingPrompts.ts`.
 */

/** The numbered clauses of a drafted policy, in order. */
export const CLAUSE = {
  introduction: 1,
  situation: 2,
  vision: 3,
  legal: 4,
  measures: 5,
  implementation: 6,
  risk: 7,
  engagement: 8,
  finance: 9,
  monitoring: 10,
  transitional: 11,
} as const;

/** The annexes, by label. */
export const ANNEX = {
  implementationMatrix: "Annex A",
  stakeholderAnalysis: "Annex B",
  instruments: "Annex C",
  documents: "Annex D",
  runInputs: "Annex E",
  method: "Annex F",
} as const;

/** The annex that lists the instruments a draft relies on. */
export const CITATIONS_ANNEX = ANNEX.instruments;
