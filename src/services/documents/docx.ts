/**
 * Real OOXML (`.docx`) rendering — a genuine Word document, not HTML renamed.
 *
 * A `.docx` is a ZIP archive of XML parts. This module fills the parts in
 * `./ooxml-parts/` and stores them with the deterministic ZIP writer, so the
 * export opens as a normal Word document and the same assessment always produces
 * byte-identical output. There is no dependency and no network call.
 *
 * The XML parts are kept as `.xml` files rather than inline strings because that
 * is what they are — templates. `{{PLACEHOLDER}}` tokens are substituted here.
 * Every value is XML-escaped before it is inserted, so policy text can contain
 * `&`, `<` or quotes without corrupting the document.
 *
 * SCOPE NOTE: this build exports the document; it does not read `.docx` files
 * back (see src/services/extraction/extractPolicyText.ts).
 */

import { BRAND } from "@/config/brand";
import { SCENARIO_ANCHOR_DATE } from "@/config/reference";
import { createStoredZip, type ZipEntry } from "./zip";
import appTemplate from "./ooxml-parts/app.xml?raw";
import contentTypes from "./ooxml-parts/content-types.xml?raw";
import coreTemplate from "./ooxml-parts/core.xml?raw";
import documentRelationships from "./ooxml-parts/document-relationships.xml?raw";
import documentTemplate from "./ooxml-parts/document.xml?raw";
import rootRelationships from "./ooxml-parts/root-relationships.xml?raw";
import styles from "./ooxml-parts/styles.xml?raw";

/** The MIME type of a Word document. */
export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface DocxInput {
  /** Document title — rendered as the document's Title paragraph. */
  title: string;
  /** Body text. One paragraph per line; `- ` and `* ` lines become bullet points. */
  body: string;
  /**
   * The moment the document was recorded (ISO), carried into the file's own created date so a
   * Word file is dated when it was made. Omitted for a document with no run behind it, in which
   * case the scenario anchor date is used.
   */
  createdAt?: string;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const textRun = (text: string): string =>
  `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

const bodyParagraph = (text: string): string => `<w:p>${textRun(text)}</w:p>`;

const emptyParagraph = (): string => "<w:p/>";

/** A bullet is an indented paragraph with the marker in the run, so the document
 *  needs no numbering part and cannot ask Word to repair a dangling reference. */
const bulletParagraph = (text: string): string =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>${textRun(`\u2022 ${text}`)}</w:p>`;

/** Turn the plain-text payload into WordprocessingML paragraphs. */
export const buildBodyXml = (body: string): string =>
  body
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return emptyParagraph();
      const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
      return bullet ? bulletParagraph(bullet[1]) : bodyParagraph(line);
    })
    .join("");

const subst = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [token, value]) => text.split(`{{${token}}}`).join(value),
    template,
  );

/**
 * The archive's entries, in order. Exported so a test can re-read the parts
 * without going through a Blob.
 */
export const buildDocxParts = ({ title, body, createdAt }: DocxInput): ZipEntry[] => {
  const encoder = new TextEncoder();
  // The document's own date: the run's recorded moment when there is one, otherwise the
  // scenario anchor date. It is a fixed value handed in, never the clock read here, so
  // the same document always produces the same bytes.
  const docDate =
    createdAt && createdAt.includes("T") ? createdAt : `${createdAt ?? SCENARIO_ANCHOR_DATE}T00:00:00Z`;
  const identity = {
    TITLE: escapeXml(title),
    CREATOR: escapeXml(`${BRAND.productName} (${BRAND.entityCustodian})`),
    DESCRIPTION: escapeXml(BRAND.summary),
    APPLICATION: escapeXml(BRAND.productName),
    COMPANY: escapeXml(BRAND.entity),
    // The document's own recorded moment (or the reference date) — never the clock, so the
    // bytes stay deterministic.
    DATE: docDate,
  };
  const document = subst(documentTemplate, {
    TITLE: identity.TITLE,
    BODY: buildBodyXml(body),
  });

  return [
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rootRelationships) },
    { name: "word/document.xml", data: encoder.encode(document) },
    { name: "word/styles.xml", data: encoder.encode(styles) },
    {
      name: "word/_rels/document.xml.rels",
      data: encoder.encode(documentRelationships),
    },
    { name: "docProps/core.xml", data: encoder.encode(subst(coreTemplate, identity)) },
    {
      name: "docProps/app.xml",
      data: encoder.encode(
        subst(appTemplate, { APPLICATION: identity.APPLICATION, COMPANY: identity.COMPANY }),
      ),
    },
  ];
};

/** The complete `.docx` as bytes. Deterministic: same input, same bytes. */
export const createDocxBytes = (input: DocxInput): Uint8Array =>
  createStoredZip(buildDocxParts(input));

/** The complete `.docx` as a Blob, ready to download. */
export const createDocxBlob = (input: DocxInput): Blob => {
  const bytes = createDocxBytes(input);
  // A fresh, non-shared ArrayBuffer is handed to Blob, so the part is
  // unambiguously a BufferSource without casting the typed array.
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: DOCX_MIME_TYPE });
};
