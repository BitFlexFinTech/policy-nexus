/**
 * SINGLE SOURCE OF TRUTH — grounded retrieval over the research library.
 *
 * A question is matched against the documents ZEPARI added (ZEPARI Batch C), purely and
 * deterministically, and the passages that matched are returned as SOURCES. This is the grounding
 * the chat shows: every answer is drawn from these passages, and the source that carries each point
 * is named. The retrieval reads no figure the platform did not really read from a document.
 *
 * DETERMINISM: plain text matching. No clock, no randomness. The same question over the same
 * documents always returns the same sources.
 */

import type { ResearchDocumentRecord } from "./researchDocuments";

/** One matched source: the document, and the passage that matched (quoted as it appears). */
export interface ResearchSource {
  id: string;
  name: string;
  excerpt: string;
}

/** The shortest word a question is matched on, so "the"/"and" cannot make every document match. */
const MIN_WORD_LENGTH = 4;

/** The distinct, meaningful words in a question, lower-cased. */
export const questionWords = (question: string): string[] => {
  const words = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return Array.from(new Set(words.filter((word) => word.length >= MIN_WORD_LENGTH)));
};

/** A short passage around the first matched word, tidied to a single line. */
const excerptAround = (text: string, words: readonly string[]): string => {
  const lower = text.toLowerCase();
  let at = -1;
  for (const word of words) {
    const index = lower.indexOf(word);
    if (index >= 0 && (at < 0 || index < at)) at = index;
  }
  if (at < 0) return "";
  const start = Math.max(0, at - 80);
  const end = Math.min(text.length, at + 220);
  const slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
};

/**
 * The documents that match the question, best match first, each with its matched passage. A document
 * with no read text cannot match, so the platform never shows a source it did not really read.
 */
export const findSources = (
  question: string,
  documents: readonly ResearchDocumentRecord[],
  limit = 5,
): ResearchSource[] => {
  const words = questionWords(question);
  if (!words.length) return [];
  return documents
    .filter((document) => document.text)
    .map((document) => {
      const lower = document.text.toLowerCase();
      const matched = words.filter((word) => lower.includes(word));
      return { document, matched };
    })
    .filter((entry) => entry.matched.length > 0)
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length || a.document.name.localeCompare(b.document.name),
    )
    .slice(0, limit)
    .map((entry) => ({
      id: entry.document.id,
      name: entry.document.name,
      excerpt: excerptAround(entry.document.text, entry.matched),
    }));
};