/**
 * ASSEMBLING AN ANSWER FROM THE LIBRARY — the FREE path, with NO model connected.
 *
 * The owner's own build plan (`docs/ZEPARI_BUILD_PLAN.md`, Stage B) requires the engine to answer
 * "from the library WITH OR WITHOUT AI". This is the WITHOUT half, and it is the default: the
 * passages the question matched are stitched into an answer in which every point names the document
 * it was quoted from.
 *
 * WHAT THIS IS NOT: it is not a model writing prose. Every quotation below really appears in
 * ZEPARI's own documents, and the words around them are the platform's own plain statements about
 * what it did. Nothing is invented, and nothing is inferred beyond "this question matched these
 * documents". That is why the answer says plainly that it was ASSEMBLED, not written.
 *
 * DETERMINISM: plain text work over the retrieved passages. No clock, no randomness. The same
 * question over the same documents always assembles the same answer.
 */

import type { ResearchSource } from "./researchRetrieval";

/** One quoted point: the document it came from, and the passage quoted. */
const quoteLines = (sources: readonly ResearchSource[]): string[] =>
  sources.flatMap((source, index) => [
    `${index + 1}. ${source.name}`,
    `   “${source.excerpt}”`,
    "",
  ]);

/**
 * The answer to a question, with no model connected: the matched passages, quoted, each under the
 * name of the document it was read from.
 */
export const assembleAnswer = (sources: readonly ResearchSource[]): string =>
  [
    `ZEPARI's research library matched this question in ${sources.length} document${
      sources.length === 1 ? "" : "s"
    }.`,
    "No answer model is connected, so everything below is QUOTED from ZEPARI's own documents — " +
      "no words were written for you, and no figure is stated that is not in them.",
    "",
    ...quoteLines(sources),
  ]
    .join("\n")
    .trim();

/** The plain line that says exactly what happened, shown beside an assembled answer. */
export const ASSEMBLED_ANSWER_DETAIL =
  "Assembled from ZEPARI's own documents. No answer model is connected, so this answer quotes the " +
  "passages the question matched and names each document they came from.";

/**
 * The brief, with no model connected: the same quotations, laid out in the brief's own fixed
 * sections. A section that needs a judgement — a recommendation — says plainly that it was not
 * produced rather than inventing one.
 */
export const assembleBrief = (
  topic: string,
  sources: readonly ResearchSource[],
  sections: readonly string[],
): string => {
  const [first, ...rest] = sources;
  const body = (section: string): string[] => {
    if (section === "Purpose") {
      return [
        `This brief was requested on “${topic}”.`,
        "No brief model is connected, so the brief below is ASSEMBLED from ZEPARI's own documents: " +
          "every quotation is text that really appears in them.",
      ];
    }
    if (section === "Recommendations") {
      return [
        "Not produced. A recommendation is a judgement, and with no brief model connected the " +
          "platform will not invent one. The passages quoted above are everything the library " +
          "matched for this topic.",
      ];
    }
    if (section === "Context" && first) {
      return [`Quoted from ${first.name}: “${first.excerpt}”`];
    }
    const quoted = section === "Context" ? [] : rest.length ? rest : first ? [first] : [];
    if (!quoted.length) {
      return ["No passage in the research library matched this topic for this section."];
    }
    return quoted.map((source) => `• “${source.excerpt}” — ${source.name}`);
  };

  return sections
    .flatMap((section) => [section, ...body(section), ""])
    .join("\n")
    .trim();
};

/** The plain line that says exactly what happened, shown beside an assembled brief. */
export const ASSEMBLED_BRIEF_DETAIL =
  "Assembled from ZEPARI's own documents. No brief model is connected, so this brief quotes the " +
  "passages the topic matched, in the brief's fixed sections, and says plainly which section it " +
  "could not produce.";