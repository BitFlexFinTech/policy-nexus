/**
 * Policy-file text extraction.
 *
 * REAL for plain text: a `.txt` file is read in the browser and its own text
 * becomes the policy text of the run.
 *
 * REAL for Word: a `.docx` file is unpacked in the browser (see `./docxText`) and
 * its own paragraphs become the policy text of the run. No server, no dependency,
 * no network call.
 *
 * REAL for Excel: an `.xlsx` file is unpacked in the browser (see `./xlsxText`) and its
 * own cells become the policy text of the run — the same no-server, no-dependency,
 * no-network path as the Word file.
 *
 * NOT EXTRACTED: `.pdf`. Reading a PDF needs a parser or a server, and neither
 * exists in this build, so the file is recorded by name and the screen says plainly
 * that it was not read — rather than showing a progress bar that implies it was.
 * Nothing here makes a network call, and nothing here reads a clock, so the same
 * file always yields the same result
 * (see .clinerules/04-determinism-and-validation.md and PRODUCTION_READINESS.md §4).
 */

import { liveService } from "@/config/platform";
import { readDocxText } from "./docxText";
import { readXlsxText } from "./xlsxText";
import { requestTextExtraction } from "./httpExtractionClient";

export type ExtractionKind = "text" | "pdf" | "docx" | "xlsx" | "unsupported";

export interface ExtractedPolicyFile {
  name: string;
  sizeLabel: string;
  kind: ExtractionKind;
  /** True ONLY when the real file text is in `text`. */
  extracted: boolean;
  /** The file's real text. Empty unless `extracted` is true. */
  text: string;
  /** One plain-language line stating exactly what happened to this file. */
  status: string;
}

/** Reading limit for a text file; larger files are refused rather than truncated silently. */
const MAX_TEXT_BYTES = 2000000;

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

/** What a file is, decided from its name and MIME type. */
export const classifyPolicyFile = (name: string, type?: string): ExtractionKind => {
  const lower = name.toLowerCase();
  if (type === "text/plain" || lower.endsWith(".txt")) return "text";
  if (type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "docx";
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lower.endsWith(".xlsx")
  ) {
    return "xlsx";
  }
  return "unsupported";
};

/** The upload zone accepts these; anything else is ignored at the input. */
export const isAcceptedPolicyFile = (name: string, type?: string): boolean =>
  classifyPolicyFile(name, type) !== "unsupported";

/**
 * Normalise extracted text: unify line endings, drop null bytes, trim each line,
 * and collapse runs of blank lines. No clock, no randomness.
 *
 * Leading and trailing whitespace on each line is removed rather than preserved:
 * indentation carried over from a text file is invisible in the draft box and
 * would otherwise reach the engine as part of the policy text.
 */
export const normalisePolicyText = (raw: string): string =>
  raw
    .split("\r\n")
    .join("\n")
    .split("\r")
    .join("\n")
    .split("\u0000")
    .join("")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .split(/\n{3,}/)
    .join("\n\n")
    .trim();

const readAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      file.text().then(resolve, reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("The file could not be read."));
    reader.readAsText(file);
  });

/**
 * Extract one uploaded file. Never throws for an unsupported or unreadable file —
 * it returns a result that says so, so the screen can state it.
 */
export const extractPolicyFile = async (file: File): Promise<ExtractedPolicyFile> => {
  const kind = classifyPolicyFile(file.name, file.type);
  const base = { name: file.name, sizeLabel: formatFileSize(file.size) };

  if (kind === "text") {
    if (file.size > MAX_TEXT_BYTES) {
      return {
        ...base,
        kind,
        extracted: false,
        text: "",
        status: `Text extraction skipped — the file is larger than the ${MAX_TEXT_BYTES / 1000000} MB reading limit.`,
      };
    }
    let raw: string;
    try {
      raw = await readAsText(file);
    } catch {
      return {
        ...base,
        kind,
        extracted: false,
        text: "",
        status: "Text extraction failed — the browser could not read this file.",
      };
    }
    const text = normalisePolicyText(raw);
    if (!text) {
      return { ...base, kind, extracted: false, text: "", status: "Text extraction found no text — the file is empty." };
    }
    return { ...base, kind, extracted: true, text, status: "Text extracted." };
  }

  if (kind === "docx" || kind === "xlsx") {
    // REAL PATH — unpacked in the browser, with no server and no dependency. Tried
    // before the configured service, because it needs nothing configured to work.
    const label = kind === "docx" ? "Word document" : "spreadsheet";
    try {
      const text = normalisePolicyText(
        kind === "docx" ? await readDocxText(file) : await readXlsxText(file),
      );
      if (text) {
        return {
          ...base,
          kind,
          extracted: true,
          text,
          status: `Text extracted from the ${label} in this browser.`,
        };
      }
    } catch (error) {
      // A genuine failure is reported in plain words, then the service is offered a
      // chance below — never disguised as "not read".
      const reason =
        error instanceof Error ? error.message : `The ${label} could not be opened.`;
      if (!liveService("extraction")) {
        return {
          ...base,
          kind,
          extracted: false,
          text: "",
          status: `Not read — ${reason}`,
        };
      }
    }
  }

  if (kind === "pdf" || kind === "docx" || kind === "xlsx") {
    // LIVE PATH: only reachable when an administrator has completed the
    // extraction capability in platform administration, or when the local Word or
    // spreadsheet reader above could not open the file. Otherwise the file is recorded
    // by name and the screen says so.
    const live = liveService("extraction");
    if (live) {
      const label = kind.toUpperCase();
      try {
        const remoteText = await requestTextExtraction(file, live);
        if (remoteText) {
          const text = normalisePolicyText(remoteText);
          if (text) {
            return {
              ...base,
              kind,
              extracted: true,
              text,
              status: `Text extracted by the configured service (${label}).`,
            };
          }
        }
        return {
          ...base,
          kind,
          extracted: false,
          text: "",
          status: `The configured service returned no readable text for this ${label} file.`,
        };
      } catch {
        return {
          ...base,
          kind,
          extracted: false,
          text: "",
          status: `The configured service could not be reached; the file is recorded by name.`,
        };
      }
    }
    return {
      ...base,
      kind,
      extracted: false,
      text: "",
      status:
        kind === "docx"
          ? "Not read — the Word document held no readable text in its body."
          : kind === "xlsx"
            ? "Not read — the spreadsheet held no readable cells."
            : "Text extraction (Mock) — recorded by name; PDF text is not read in this build.",
    };
  }

  return { ...base, kind, extracted: false, text: "", status: "Unsupported file type (Mock) — recorded by name only." };
};
