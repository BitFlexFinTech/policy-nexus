/**
 * Read the data out of a real Excel `.xlsx` file, in the browser.
 *
 * An `.xlsx` is a zip container holding its numbers and words as XML, exactly like the
 * Word file `./docxText` reads. This module opens that container with `./zipRead` and
 * reads the two parts Excel keeps a sheet's data in:
 *
 *   - `xl/sharedStrings.xml` — the words, held ONCE and referenced by number, so a label
 *     repeated down a column is stored a single time;
 *   - `xl/worksheets/sheet*.xml` — the grid, where each cell is a number, a boolean, or a
 *     reference into the shared words.
 *
 * The result is one tab-separated line per spreadsheet row, with the worksheets separated
 * by a blank line, so a department's return or statistics table becomes readable text the
 * examination can use — instead of being recorded by its filename.
 *
 * WHAT IT DOES NOT DO: it does not calculate formulas (Excel stores the last result it
 * computed, and that stored result is what is read), it does not read charts, pictures,
 * pivot caches, comments or cell formatting, and it does not keep each sheet's own name.
 * It reads the data an officer's spreadsheet actually holds.
 *
 * NO DEPENDENCY and NO NETWORK: the container is unpacked with the platform's own reader
 * and the browser's own decompressor.
 *
 * DETERMINISM: pure text work. The same file always yields the same text.
 */

import { decodeXml } from "./docxText";
import { listZipEntries, readArchiveBytes, readZipEntry } from "./zipRead";

/** The part of a workbook that holds the words the cells reference by number. */
const SHARED_STRINGS_PART = "xl/sharedStrings.xml";

/** A worksheet part, e.g. `xl/worksheets/sheet1.xml`. */
const WORKSHEET_PART = /^xl\/worksheets\/sheet(\d+)\.xml$/;

/**
 * The text of one stored string — an `<si>` in the shared table, or an `<is>` written
 * inside a cell. Both hold the wording in one or more `<t>` runs, and both may carry a
 * phonetic guide (`<rPh>`) that is a reading hint rather than the cell's text.
 */
const textOfStoredString = (xml: string): string => {
  const withoutPhonetic = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, "");
  const runs = [...withoutPhonetic.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => match[1]);
  return decodeXml(runs.join(""));
};

/**
 * The shared string table, in the order the workbook stores it. A cell that reads
 * `t="s"` holds the INDEX into this list, so the order matters and is kept as written.
 */
export const textFromSharedStringsXml = (xml: string): string[] =>
  [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) => textOfStoredString(match[1]));

/** Column letters in a cell reference ("A", "AB") → a zero-based column number. */
const columnNumber = (reference: string): number => {
  const letters = reference.replace(/[^A-Za-z]/g, "").toUpperCase();
  let value = 0;
  for (const letter of letters) value = value * 26 + (letter.charCodeAt(0) - 64);
  return value - 1;
};

/**
 * One cell's text. `shared` is the workbook's shared string table. An empty cell yields an
 * empty string — an empty cell is a real, empty cell, not a missing one.
 */
const cellText = (attributes: string, body: string, shared: string[]): string => {
  const type = /\bt="([^"]*)"/.exec(attributes)?.[1] ?? "n";

  if (type === "inlineStr") {
    const inline = /<is(?:\s[^>]*)?>([\s\S]*?)<\/is>/.exec(body);
    return inline ? textOfStoredString(inline[1]) : "";
  }

  const value = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1];
  if (value === undefined) return "";
  if (type === "s") {
    const index = Number(value.trim());
    return Number.isInteger(index) && index >= 0 ? (shared[index] ?? "") : "";
  }
  if (type === "b") return value.trim() === "1" ? "TRUE" : "FALSE";
  return decodeXml(value);
};

/**
 * Turn one worksheet part into text: one line per row, cells separated by a tab. A cell
 * that names its column is placed at that column, so a skipped cell leaves a gap rather
 * than shifting the rest of the row left; trailing empty cells are dropped so a short row
 * does not end in a run of tabs.
 */
export const textFromSheetXml = (xml: string, shared: string[]): string => {
  const rows = [...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map((row) => {
    const cells: string[] = [];
    for (const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cell[1] ?? "";
      const reference = /\br="([A-Za-z]+\d+)"/.exec(attributes)?.[1];
      const at = reference ? columnNumber(reference) : cells.length;
      const text = cellText(attributes, cell[2] ?? "", shared);
      while (cells.length < at) cells.push("");
      if (at < cells.length) cells[at] = text;
      else cells.push(text);
    }
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    return cells.join("\t");
  });
  return rows.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

/**
 * Read a `.xlsx` file's data. Throws with a plain-language reason when the file cannot be
 * opened, so the caller can state it rather than showing nothing.
 */
export const readXlsxText = async (file: File): Promise<string> => {
  const archive = await readArchiveBytes(file);
  const names = listZipEntries(archive);
  if (names.length === 0) {
    throw new Error("This file is not a spreadsheet that can be opened.");
  }

  const sharedPart = await readZipEntry(archive, SHARED_STRINGS_PART);
  const shared = sharedPart ? textFromSharedStringsXml(new TextDecoder().decode(sharedPart)) : [];

  const sheets = names
    .map((name) => ({ name, number: Number(WORKSHEET_PART.exec(name)?.[1] ?? Number.NaN) }))
    .filter((entry) => Number.isFinite(entry.number))
    .sort((left, right) => left.number - right.number);

  if (sheets.length === 0) {
    throw new Error("This file is not a spreadsheet that can be opened, or it holds no worksheet.");
  }

  const parts: string[] = [];
  for (const sheet of sheets) {
    const bytes = await readZipEntry(archive, sheet.name);
    if (bytes) parts.push(textFromSheetXml(new TextDecoder().decode(bytes), shared));
  }

  return parts
    .filter((part) => part.length > 0)
    .join("\n\n")
    .trim();
};
