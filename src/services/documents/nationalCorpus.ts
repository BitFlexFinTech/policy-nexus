/**
 * THE NATIONAL CROSS-CUTTING DOCUMENT LIBRARY (Batch B1).
 *
 * The real published documents that apply to EVERY one of the sixteen departments: the National
 * Budget, the National Development Strategy, the Auditor-General's reports and ZIMSTAT's core
 * releases. They are the department side's counterpart to ZEPARI's corpus (`zepariCorpus.ts`) and
 * are built the same way, by the same rule: a real, named, published source — never an invented one.
 *
 * WHERE THE TEXT LIVES. The full text is far larger than a browser's storage will hold and far more
 * than should sit inside the application's own bundle, so it ships as a data file on OUR OWN SITE —
 * `public/national-corpus.json`, published with the rest of the site — and is read once, on demand,
 * when a screen needs it. Nothing is ever requested from outside our own site.
 *
 * WHAT IT KEEPS FOR EVERY DOCUMENT: its title, the body that published it, its date, the address of
 * the published file, its page count, whether its text could be read, and the text itself — so every
 * quotation can be checked against the publication it came from.
 *
 * FAILURE IS SAFE AND VISIBLE. If the file cannot be read (no connection, or a host that has not been
 * published yet), this returns an empty list rather than throwing into a screen; the caller says
 * plainly that the national documents could not be loaded.
 */

export interface NationalCorpusDocument {
  /** Stable id, `nat-001`… — assigned when the corpus was built. */
  id: string;
  /** Which group it belongs to: National Budget · National Development Strategy · Auditor-General · ZIMSTAT. */
  section: string;
  title: string;
  /** The body that published it, named in every citation. */
  publisher: string;
  /** The publication date as the source states it. */
  date: string;
  /** The address of the published file, so any quotation can be checked. */
  url: string;
  pages: number;
  /** True only when the published file carried a text layer that could really be read. */
  read: boolean;
  characters: number;
  /** The document's real text. Empty for the picture-only scans. */
  text: string;
}

/** Where the corpus ships. On our own site, beside the application. */
export const NATIONAL_CORPUS_PATH = "/national-corpus.json";

/** How a document is named wherever it is cited or listed. */
export const nationalCitation = (document: NationalCorpusDocument): string =>
  `${document.title} — ${document.publisher}, ${document.date}`;

let cache: readonly NationalCorpusDocument[] | null = null;
let pending: Promise<readonly NationalCorpusDocument[]> | null = null;

/** Drop the held copy. Used by tests and by a full browser-data clear. */
export const forgetNationalCorpus = (): void => {
  cache = null;
  pending = null;
};

const isDocument = (value: unknown): value is NationalCorpusDocument => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NationalCorpusDocument>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.text === "string"
  );
};

/**
 * The national cross-cutting documents, read once and kept. A failure returns an empty list rather
 * than throwing, so a screen can say honestly that the library could not be loaded instead of breaking.
 */
export const loadNationalCorpus = async (): Promise<readonly NationalCorpusDocument[]> => {
  if (cache) return cache;
  if (!pending) {
    pending = fetch(NATIONAL_CORPUS_PATH, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`The national document library answered ${response.status}.`);
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
        return [] as readonly NationalCorpusDocument[];
      });
  }
  return pending;
};
