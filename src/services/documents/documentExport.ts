/**
 * SINGLE SOURCE OF TRUTH — downloading a document as a Word file.
 *
 * There was already exactly one place that turned a printed document into a `.docx` file, inside the
 * export buttons. The owner's recommended-step actions need the same thing for a SINGLE part of a
 * document (send the implementation matrix to the finance office, and nothing else), so the mechanism
 * lives here once and both callers use it — rather than a second copy that could drift.
 *
 * Nothing here makes a network request: the file is assembled in the browser from the same plain text
 * the screen shows, and handed to the browser's own download.
 */

import { createDocxBlob } from "./docx";

/**
 * An explicitly supplied export payload: the title, the exact text, and the filename stem. The four
 * document actions are otherwise identical whatever is being exported, so one shape serves them all.
 */
export interface DocumentExportPayload {
  title: string;
  text: string;
  fileStem: string;
  /**
   * The moment the document was recorded (ISO), carried into the Word file's own created date.
   * Omitted for a document with no run behind it.
   */
  createdAt?: string;
}

/**
 * Download one payload as a real `.docx` file.
 *
 * Returns a plain-language line saying what happened, so the caller can show it rather than silently
 * doing nothing when a browser refuses the download.
 */
export const downloadAsWord = (payload: DocumentExportPayload): string => {
  try {
    const blob = createDocxBlob({ title: payload.title, body: payload.text, createdAt: payload.createdAt });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payload.fileStem}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return `Word document downloaded: ${payload.fileStem}.docx`;
  } catch {
    return "The Word download could not be prepared in this browser.";
  }
};
