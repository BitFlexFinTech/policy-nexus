/**
 * THE DEPARTMENT DOCUMENT LIBRARY (Batch B2).
 *
 * The real published documents that belong to ONE department — its governing law, its sector
 * policy, the parliamentary committee's reports on it and the audits of it. They are the
 * department side's counterpart to ZEPARI's corpus (`zepariCorpus.ts`) and the national
 * cross-cutting set (`nationalCorpus.ts`), built the same way, by the same rule: a real, named,
 * published source — never an invented one.
 *
 * WHERE THE TEXT LIVES. The full text is far larger than a browser's storage will hold and far more
 * than should sit inside the application's own bundle, so each department's set ships as its own
 * data file on OUR OWN SITE — `public/department-corpus/<departmentId>.json`, published with the
 * rest of the site — and is read once, on demand, when a screen needs it. One file per department
 * means a run reads only the department it is about, never all sixteen.
 *
 * WHAT IT KEEPS FOR EVERY DOCUMENT: its title, the body that published it, its date, the address of
 * the published file, its page count, whether its text could be read, and the text itself — so every
 * quotation can be checked against the publication it came from.
 *
 * FAILURE IS SAFE AND VISIBLE. If a department's file cannot be read (no connection, or a
 * department whose set has not been built yet), this returns an empty list rather than throwing
 * into a screen; the caller says plainly that the department's documents could not be loaded.
 */

export interface DepartmentCorpusDocument {
  /** Stable id, `<departmentId>-001`… — assigned when the corpus was built. */
  id: string;
  /** Which group it belongs to, e.g. "Governing law", "Sector policy", "Committee report". */
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

/** Where the department corpora ship. On our own site, beside the application. */
export const DEPARTMENT_CORPUS_DIRECTORY = "/department-corpus";

/** The one file that carries one department's documents. */
export const departmentCorpusPath = (departmentId: string): string =>
  `${DEPARTMENT_CORPUS_DIRECTORY}/${departmentId}.json`;

/** How a document is named wherever it is cited or listed. */
export const departmentCitation = (document: DepartmentCorpusDocument): string =>
  `${document.title} — ${document.publisher}, ${document.date}`;

const cache = new Map<string, readonly DepartmentCorpusDocument[]>();
const pending = new Map<string, Promise<readonly DepartmentCorpusDocument[]>>();

/** Drop the held copies. Used by tests and by a full browser-data clear. */
export const forgetDepartmentCorpus = (): void => {
  cache.clear();
  pending.clear();
};

const isDocument = (value: unknown): value is DepartmentCorpusDocument => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DepartmentCorpusDocument>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.text === "string"
  );
};

/**
 * One department's published documents, read once and kept. A failure returns an empty list rather
 * than throwing, so a screen can say honestly that the department's library could not be loaded
 * instead of breaking.
 */
export const loadDepartmentCorpus = async (
  departmentId: string,
): Promise<readonly DepartmentCorpusDocument[]> => {
  const held = cache.get(departmentId);
  if (held) return held;
  const inFlight = pending.get(departmentId);
  if (inFlight) return inFlight;

  const request = fetch(departmentCorpusPath(departmentId), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`The ${departmentId} document library answered ${response.status}.`);
      }
      return response.json() as Promise<{ documents?: unknown }>;
    })
    .then((payload) => {
      const documents = Array.isArray(payload?.documents)
        ? payload.documents.filter(isDocument)
        : [];
      cache.set(departmentId, documents);
      return documents;
    })
    .catch(() => {
      // Allow a later attempt (a connection may come back); never break a screen.
      pending.delete(departmentId);
      return [] as readonly DepartmentCorpusDocument[];
    });

  pending.set(departmentId, request);
  return request;
};
