/**
 * Read the text out of a real Word `.docx` file, in the browser.
 *
 * A `.docx` holds its wording in `word/document.xml` inside a zip container. This
 * module opens that container with `./zipRead` and takes the text runs out of the
 * document XML — so a policy an officer actually has as a Word file becomes the
 * policy text of the run, instead of being recorded by its filename.
 *
 * WHAT IT DOES NOT DO: it does not lay the document out, keep its styling, or read
 * a `.docm` macro, a text box or a footnote. It reads the body's paragraphs and
 * their text, which is what a policy draft consists of. A file it cannot open fails
 * with a plain reason, and is then recorded by name — never silently.
 *
 * NO DEPENDENCY and NO NETWORK: the container is unpacked with the platform's own
 * reader and the browser's own decompressor.
 *
 * DETERMINISM: pure text work. The same file always yields the same text.
 */

import { readZipEntry } from "./zipRead";

/** The part of a `.docx` that holds the document body. */
const DOCUMENT_PART = "word/document.xml";

/** One XML entity, decoded to the character it stands for. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

const decodeXml = (value: string): string =>
  value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (match) => ENTITIES[match] ?? match);

/**
 * Turn `word/document.xml` into plain text: one line per paragraph, a tab where
 * Word put a tab, a line break where Word put a break, and nothing else.
 */
export const textFromDocumentXml = (xml: string): string => {
  const prepared = xml
    // Drop the FORMATTING whitespace a pretty-printed document.xml carries between its
    // tags. Only whitespace that spans a line break is removed, so a single-space run
    // (`<w:t xml:space="preserve"> </w:t>`) keeps its space. Without this step the
    // file's own indentation would arrive as blank lines in the policy text.
    .replace(/>\r?\n\s*</g, "><")
    .replace(/<w:(?:br|cr)\s*\/>/g, "\n")
    .replace(/<w:tab\s*\/>/g, "\t");
  const lines = prepared.split(/<\/w:p>/).map((paragraph) =>
    decodeXml(
      paragraph
        // Take the text out of each run, still encoded...
        .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_match, inner: string) => inner)
        // ...then drop every remaining tag. Entities are decoded AFTER the tags are
        // gone, because decoding first would turn `&lt;` into a real `<` and the tag
        // stripper would eat the text that followed it. The newline and tab markers
        // above are plain characters by now, so a break BETWEEN two runs survives.
        .replace(/<[^>]+>/g, ""),
    )
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n"),
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

/**
 * Read a file's bytes. `File.arrayBuffer` is not available in every environment this
 * code runs in (older browsers, and the test environment), so the FileReader route is
 * the fallback rather than a failure.
 */
const readArchiveBytes = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    if (typeof file.arrayBuffer === "function") {
      file.arrayBuffer().then(resolve, reject);
      return;
    }
    if (typeof FileReader === "undefined") {
      reject(new Error("This browser cannot read the file."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
    reader.onerror = () => reject(reader.error ?? new Error("The file could not be read."));
    reader.readAsArrayBuffer(file);
  });

/**
 * Read a `.docx` file's text. Throws with a plain-language reason when the file
 * cannot be opened, so the caller can state it rather than showing nothing.
 */
export const readDocxText = async (file: File): Promise<string> => {
  const archive = await readArchiveBytes(file);
  const part = await readZipEntry(archive, DOCUMENT_PART);
  if (!part) {
    throw new Error("This file is not a Word document that can be opened, or its text part is missing.");
  }
  return textFromDocumentXml(new TextDecoder().decode(part));
};
