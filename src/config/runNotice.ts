/**
 * The copy, and the one link, for the "before you run" notice (the owner's item 5).
 *
 * The owner asked for a notification on Run Simulation that says, honestly, that the drafted
 * policy is built from the real, published data the engine holds for the department — which is
 * currently limited — and that a department can make its policy longer and better grounded by
 * adding its own reports, spreadsheets and statistics to its Document Library. It is shown before
 * EVERY run (the owner made this a strict rule, revised 2026-10-06), and a
 * small permanent note stays beside the Run Simulation button so the message is never lost.
 *
 * The wording is defined ONCE here and used by both the pop-up and the note, so the two cannot
 * drift apart. Every sentence states a fact about this platform: the data it holds is the real
 * published data, it is limited, and the department's own documents are what improves the draft.
 *
 * It lives in `config/` (like `brand.ts` and `platform.ts`) so the component that renders it
 * exports only components, and this wording has exactly one home.
 */

export const RUN_NOTICE_TITLE = "Before this run — what the draft rests on";

/**
 * The evidence-status card (Batch 0).
 *
 * ONE wording, used at three touchpoints — the top of the Document Library, the before-you-run
 * notice, and one line above the upload control — so a reader is never shown two different versions
 * of the same promise.
 *
 * The register was researched for an internal Government audience before it was written, from the
 * GOV.UK content and publishing guidance (the A-to-Z style guide: the active voice, plain English,
 * explain an abbreviation on first use, no "please") and the United States plain-language guidance
 * (the Plain Writing Act 2010: write for the specific audience, short sentences, everyday words).
 * So: plain English, active voice, short sentences, the department addressed directly, and facts
 * only — no marketing and no demand.
 *
 * HONESTY: the count is passed IN, so it is always the number the library really holds, read from
 * the data, and never typed here. The card states what is true today, and what will be true when
 * the department's archive is loaded on approval for Government use.
 */

/** The heading of the evidence-status card. */
export const LIBRARY_EVIDENCE_TITLE = "What this library holds";

/** How many documents a count represents, in words that stay right for one. */
const documentCountLabel = (documentCount: number): string =>
  `${documentCount} ${documentCount === 1 ? "document" : "documents"}`;

/** The line that states how many documents the library holds, and how each is cited. */
export const libraryHoldLine = (departmentName: string, documentCount: number): string =>
  `${departmentName} holds ${documentCountLabel(documentCount)} in this library, each cited to the instrument it is prepared under, together with any document the department adds itself.`;

/** The line that says what a run reads, and what adding the department's own material does. */
export const libraryReadsLine = (): string =>
  "Every run reads the documents the department adds here. The more of its own reports, spreadsheets and statistics it adds, the longer and better grounded its assessment and its drafted policy become.";

/** The line that states what arrives on approval for Government use. */
export const libraryArchivePromise = (departmentName: string): string =>
  `On approval for Government use, ${departmentName}'s full document archive will be loaded here, and every run will read it.`;

/** The whole card body, in reading order. */
export const libraryEvidenceLines = (departmentName: string, documentCount: number): string[] => [
  libraryHoldLine(departmentName, documentCount),
  libraryReadsLine(),
  libraryArchivePromise(departmentName),
];

/** The pop-up's message, naming the department, and carrying the archive line (Batch 0). */
export const runNoticeBody = (departmentName: string, documentCount: number): string =>
  `The drafted policy is built from the real, published data the engine holds for ${departmentName} today, together with the draft you submit. That data is currently limited, so the policy can only be as good as what it rests on. ${departmentName} can make it longer and better grounded by adding its own reports, spreadsheets and statistics to its Document Library — every run the department makes then reads them, and they are kept for its next run. ${libraryHoldLine(
    departmentName,
    documentCount,
  )} ${libraryArchivePromise(departmentName)}`;

/** The short form of the same message, shown permanently beside the Run Simulation button. */
export const runNoticeNote = (departmentName: string): string =>
  `Built from the real, published data the engine holds for ${departmentName} today — add its own reports, spreadsheets and statistics in the Document Library to make it longer and better grounded.`;

/** The one place the Document Library is linked to from this notice. */
export const DOCUMENT_LIBRARY_PATH = "/app/documents";
