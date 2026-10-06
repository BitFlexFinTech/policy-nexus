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

/** The pop-up's message, naming the department. */
export const runNoticeBody = (departmentName: string): string =>
  `The drafted policy is built from the real, published data the engine holds for ${departmentName} today, together with the draft you submit. That data is currently limited, so the policy can only be as good as what it rests on. ${departmentName} can make it longer and better grounded by adding its own reports, spreadsheets and statistics to its Document Library — every run the department makes then reads them, and they are kept for its next run.`;

/** The short form of the same message, shown permanently beside the Run Simulation button. */
export const runNoticeNote = (departmentName: string): string =>
  `Built from the real, published data the engine holds for ${departmentName} today — add its own reports, spreadsheets and statistics in the Document Library to make it longer and better grounded.`;

/** The one place the Document Library is linked to from this notice. */
export const DOCUMENT_LIBRARY_PATH = "/app/documents";
