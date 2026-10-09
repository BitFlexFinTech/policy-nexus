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

/** The least a document must carry to be searched: a stable id, the name it is cited under, its text. */
export interface RetrievableDocument {
  id: string;
  name: string;
  text: string;
}

/** One matched source: the document, and the passage that matched (quoted as it appears). */
export interface ResearchSource {
  id: string;
  name: string;
  excerpt: string;
}

/** The shortest word a question is matched on. Three, so a short but decisive word like "ICT" counts. */
const MIN_WORD_LENGTH = 3;

/**
 * Words so common in English that matching on them says nothing about a document — a question must be
 * judged on the words that carry it. Without this, a question about ICT policy matched almost every
 * document in ZEPARI's library merely because they all contain the word "policy".
 */
const COMMON_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "had", "are", "was", "were",
  "will", "would", "shall", "can", "could", "should", "may", "might", "must", "not", "but", "any",
  "all", "also", "each", "other", "only", "same", "very", "just", "like", "make", "made", "more",
  "most", "some", "such", "than", "then", "they", "them", "their", "there", "these", "those", "been",
  "being", "does", "did", "doing", "its", "our", "your", "his", "her", "what", "when", "which", "who",
  "whom", "how", "why", "give", "tell", "show", "about", "into", "over", "under", "between", "onto",
  "upon", "say", "says", "said", "use", "used", "using", "get", "got", "let", "put", "see", "seen",
]);

/** The distinct, meaningful words in a question, lower-cased. */
export const questionWords = (question: string): string[] => {
  const words = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return Array.from(
    new Set(words.filter((word) => word.length >= MIN_WORD_LENGTH && !COMMON_WORDS.has(word))),
  );
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
 *
 * THE RANKING WEIGHS RARE WORDS HIGHER (measured 2026-10-09). A question about "the National Policy for
 * ICT 2016" matched 95 of ZEPARI's 98 readable documents when every matched word counted the same,
 * because they all contain the word "policy". A word carried by only a few documents is therefore worth
 * more than a word carried by nearly all of them, so the documents that actually deal with the subject
 * rise to the top. The same question always ranks the same documents in the same order.
 */
export const findSources = (
  question: string,
  documents: readonly RetrievableDocument[],
  limit = 5,
): ResearchSource[] => {
  const words = questionWords(question);
  if (!words.length) return [];
  const searchable = documents.filter((document) => document.text);
  if (!searchable.length) return [];

  const lowered = searchable.map((document) => ({ document, lower: document.text.toLowerCase() }));
  /** How much one matched word is worth: high for a rare word, low for one nearly every document holds. */
  const worth = (word: string): number => {
    const holding = lowered.filter((entry) => entry.lower.includes(word)).length;
    return holding === 0 ? 0 : 1 + Math.log(searchable.length / holding);
  };
  const weights = new Map(words.map((word) => [word, worth(word)]));

  return lowered
    .map((entry) => ({
      document: entry.document,
      matched: words
        .filter((word) => entry.lower.includes(word))
        .sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0)),
    }))
    .filter((entry) => entry.matched.length > 0)
    .map((entry) => ({
      ...entry,
      score: entry.matched.reduce((total, word) => total + (weights.get(word) ?? 0), 0),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.document.name.localeCompare(b.document.name),
    )
    .slice(0, limit)
    .map((entry) => ({
      id: entry.document.id,
      name: entry.document.name,
      excerpt: excerptAround(entry.document.text, entry.matched),
    }));
};