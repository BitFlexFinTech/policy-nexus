/**
 * ZEPARI'S PUBLISHED RESEARCH LIBRARY — every publication on their three listing pages.
 *
 * The owner's strict rule (2026-10-07): *"you were supposed to download the available public files / pdfs
 * that are zepari's website … stop making excuses and saying you only downloaded an extract."* So this is
 * NOT an extract and NOT a sample: it is every publication listed on
 * `zepari.co.zw/publications/policy-briefs`, `/research-studies` and `/economic-barometer`, including
 * every page of each listing — **103 documents**, of which **98 carried a text layer** and **5 are
 * image-only scans** that are recorded by name and honestly marked as not read.
 *
 * WHERE THE TEXT LIVES. The full text is about 9.4 MB, which is far more than a browser's storage will
 * hold and far more than should sit inside the application's own bundle. It therefore ships as a data
 * file on OUR OWN SITE — `public/zepari-corpus.json`, published with the rest of the site — and is read
 * once, on demand, when the research assistant needs it. Nothing is ever requested from outside our own
 * site, and no key or question is involved in fetching it.
 *
 * WHAT IT KEEPS FOR EVERY DOCUMENT: its title, the body that published it, its date, the address of the
 * published PDF, its page count, whether its text could be read, and the text itself — so every answer
 * can be quoted and cited, and nothing has to be invented.
 *
 * FAILURE IS SAFE AND VISIBLE. If the file cannot be read (no connection, or a host that has not been
 * published yet), this returns an empty list rather than throwing into a screen; the caller says plainly
 * that ZEPARI's published documents could not be loaded.
 */

export interface ZepariCorpusDocument {
  /** Stable id, `zep-001`… — assigned when the corpus was built. */
  id: string;
  /** Which listing page it came from: Policy Briefs · Research Studies · Economic Barometer. */
  section: string;
  title: string;
  /** The body that published it, named in every citation. */
  publisher: string;
  /** The publication date as their own listing states it. */
  date: string;
  /** The address of the published PDF on zepari.co.zw, so any quotation can be checked. */
  url: string;
  pages: number;
  /** True only when the published PDF carried a text layer that could really be read. */
  read: boolean;
  characters: number;
  /** The document's real text. Empty for the image-only scans. */
  text: string;
}

/** Where the corpus ships. On our own site, beside the application. */
export const ZEPARI_CORPUS_PATH = "/zepari-corpus.json";

/** How a document is named wherever it is cited or listed. */
export const zepariCitation = (document: ZepariCorpusDocument): string =>
  `${document.title} — ${document.publisher}, ${document.date}`;

let cache: readonly ZepariCorpusDocument[] | null = null;
let pending: Promise<readonly ZepariCorpusDocument[]> | null = null;

/** Drop the held copy. Used by tests and by a full browser-data clear. */
export const forgetZepariCorpus = (): void => {
  cache = null;
  pending = null;
};

const isDocument = (value: unknown): value is ZepariCorpusDocument => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ZepariCorpusDocument>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.text === "string"
  );
};

/**
 * ZEPARI's published documents, read once and kept. A failure returns an empty list rather than
 * throwing, so a screen can say honestly that the library could not be loaded instead of breaking.
 */
export const loadZepariCorpus = async (): Promise<readonly ZepariCorpusDocument[]> => {
  if (cache) return cache;
  if (!pending) {
    pending = fetch(ZEPARI_CORPUS_PATH, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ZEPARI's published documents answered ${response.status}.`);
        }
        return response.json() as Promise<{ documents?: unknown }>;
      })
      .then((payload) => {
        const documents = Array.isArray(payload?.documents)
          ? payload.documents.filter(isDocument)
          : [];
        cache = documents;
        return cache;
      })
      .catch(() => {
        // Allow a later attempt (a connection may come back); never break a screen.
        pending = null;
        return [] as readonly ZepariCorpusDocument[];
      });
  }
  return pending;
};
