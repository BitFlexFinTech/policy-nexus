import { describe, it, expect } from "vitest";
import { deflateRawSync } from "node:zlib";
import { createStoredZip, crc32, type ZipEntry } from "@/services/documents/zip";
import { extractPolicyFile } from "@/services/extraction/extractPolicyText";
import {
  readXlsxText,
  textFromSharedStringsXml,
  textFromSheetXml,
} from "@/services/extraction/xlsxText";
import { listZipEntries } from "@/services/extraction/zipRead";

/**
 * A workbook in the shape Excel writes one: the words are held ONCE in a shared table and
 * each cell that holds a word carries the INDEX of its entry, while numbers are written
 * straight into the cell.
 *
 * The namespace declarations Excel puts on the root elements (`xmlns=…`) are deliberately
 * NOT repeated here. They are identifiers rather than anything a program fetches, but they
 * carry a web address — and this project's own `npm run validate` forbids a runtime address
 * anywhere under `src/**`, a rule worth more than the fidelity of an attribute this reader
 * never looks at. It reads the `si`, `t`, `c`, `v` and `row` tags.
 */
const SHARED_STRINGS_XML = `<sst count="6" uniqueCount="6">
<si><t>Indicator</t></si>
<si><t>Value</t></si>
<si><t>Year</t></si>
<si><t>Revenue collected</t></si>
<si><t>ZWG 116.47 billion</t></si>
<si><r><t>Registered</t></r><r><t xml:space="preserve"> taxpayers</t></r></si>
</sst>`;

const SHEET_ONE_XML = `<worksheet><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>
<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>116.47</v></c><c r="C2"><v>2024</v></c></row>
<row r="3"><c r="A3" t="s"><v>5</v></c><c r="C3"><v>2024</v></c></row>
</sheetData></worksheet>`;

const SHEET_TWO_XML = `<worksheet><sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>Inline note</t></is></c><c r="B1" t="b"><v>1</v></c></row>
</sheetData></worksheet>`;

/** Row 3 skips column B, so a gap must stay a gap rather than shifting the row left. */
const SHEET_ONE_TEXT = [
  "Indicator\tValue\tYear",
  "Revenue collected\t116.47\t2024",
  "Registered taxpayers\t\t2024",
].join("\n");

const EXPECTED_TEXT = `${SHEET_ONE_TEXT}\n\nInline note\tTRUE`;

const encoder = new TextEncoder();

const WORKBOOK_ENTRIES: ZipEntry[] = [
  { name: "[Content_Types].xml", data: encoder.encode("<Types/>") },
  { name: "xl/sharedStrings.xml", data: encoder.encode(SHARED_STRINGS_XML) },
  { name: "xl/worksheets/sheet1.xml", data: encoder.encode(SHEET_ONE_XML) },
  { name: "xl/worksheets/sheet2.xml", data: encoder.encode(SHEET_TWO_XML) },
];

/** A stored (uncompressed) .xlsx — built with the platform's own ZIP writer. */
const storedXlsx = (): Uint8Array => createStoredZip(WORKBOOK_ENTRIES);

/**
 * A deflated .xlsx — how Excel actually writes one. Built here with the test runtime's own
 * compressor, so the unpacking path is genuinely exercised rather than assumed.
 */
const deflatedZip = (entries: ZipEntry[]): Uint8Array => {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const raw = entry.data;
    const deflated = new Uint8Array(deflateRawSync(Buffer.from(raw)));
    const crc = crc32(raw);

    const local = new Uint8Array(30 + name.length + deflated.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 8, true); // deflate
    localView.setUint32(14, crc, true);
    localView.setUint32(18, deflated.length, true);
    localView.setUint32(22, raw.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(deflated, 30 + name.length);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, 8, true); // deflate
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, deflated.length, true);
    centralView.setUint32(24, raw.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((total, record) => total + record.length, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);

  const parts = [...locals, ...centrals, eocd];
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

const asFile = (bytes: Uint8Array, name = "return.xlsx"): File =>
  new File([bytes as unknown as BlobPart], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

const asBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

/**
 * BATCH 4 — a real Excel file an officer actually has is read in the browser, with no
 * server, no dependency and no network call. The old build recorded its filename and said
 * the type was unsupported; these gates fail if that comes back.
 */
describe("reading a real Excel .xlsx in the browser (BATCH 4)", () => {
  it("takes the words out of the shared table, joining a word split across runs", () => {
    expect(textFromSharedStringsXml(SHARED_STRINGS_XML)).toEqual([
      "Indicator",
      "Value",
      "Year",
      "Revenue collected",
      "ZWG 116.47 billion",
      "Registered taxpayers",
    ]);
  });

  it("decodes the entities XML encodes in a stored word", () => {
    expect(textFromSharedStringsXml(`<sst><si><t>A &amp; B &#8212; rising</t></si></sst>`)).toEqual([
      "A & B — rising",
    ]);
  });

  it("turns a sheet into one tab-separated line per row, keeping a skipped cell as a gap", () => {
    const shared = textFromSharedStringsXml(SHARED_STRINGS_XML);
    expect(textFromSheetXml(SHEET_ONE_XML, shared)).toBe(SHEET_ONE_TEXT);
  });

  it("reads a number, a boolean and an inline word as their own text", () => {
    const shared = textFromSharedStringsXml(SHARED_STRINGS_XML);
    expect(textFromSheetXml(SHEET_TWO_XML, shared)).toBe("Inline note\tTRUE");
  });

  it("lists an archive's parts, so the worksheets can be found rather than assumed", () => {
    expect(listZipEntries(asBuffer(storedXlsx()))).toEqual([
      "[Content_Types].xml",
      "xl/sharedStrings.xml",
      "xl/worksheets/sheet1.xml",
      "xl/worksheets/sheet2.xml",
    ]);
    expect(listZipEntries(encoder.encode("not a zip").buffer as ArrayBuffer)).toEqual([]);
  });

  it("reads a STORED .xlsx end to end, as the platform writes one", async () => {
    const result = await extractPolicyFile(asFile(storedXlsx()));
    expect(result.kind).toBe("xlsx");
    expect(result.extracted, result.status).toBe(true);
    expect(result.text).toBe(EXPECTED_TEXT);
  });

  it("reads a DEFLATED .xlsx end to end — how Excel actually writes one", async () => {
    const result = await extractPolicyFile(asFile(deflatedZip(WORKBOOK_ENTRIES)));
    expect(result.extracted, result.status).toBe(true);
    expect(result.text).toBe(EXPECTED_TEXT);
  });

  it("is deterministic: the same file always yields the same text", async () => {
    expect(await extractPolicyFile(asFile(deflatedZip(WORKBOOK_ENTRIES)))).toEqual(
      await extractPolicyFile(asFile(deflatedZip(WORKBOOK_ENTRIES))),
    );
  });

  it("reads a workbook with no shared table, taking the words written inside the cells", async () => {
    const inline = createStoredZip([
      {
        name: "xl/worksheets/sheet1.xml",
        data: encoder.encode(
          `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Direct text</t></is></c></row></sheetData></worksheet>`,
        ),
      },
    ]);
    const result = await extractPolicyFile(asFile(inline));
    expect(result.extracted, result.status).toBe(true);
    expect(result.text).toBe("Direct text");
  });

  it("fails with a plain reason for a file that is not a spreadsheet, and never claims to have read it", async () => {
    const result = await extractPolicyFile(new File(["PK-but-not-a-zip"], "broken.xlsx"));
    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toMatch(/^Not read — /);
    expect(result.status).not.toContain("(Mock)");
  });

  it("reads a workbook whose worksheet holds no cells, and says exactly that", async () => {
    const empty = createStoredZip([
      {
        name: "xl/worksheets/sheet1.xml",
        data: encoder.encode("<worksheet><sheetData></sheetData></worksheet>"),
      },
    ]);
    const result = await extractPolicyFile(asFile(empty));
    expect(result.extracted).toBe(false);
    expect(result.status).toContain("no readable cells");
  });

  it("throws with a plain reason when a file holds no worksheet at all", async () => {
    const noSheet = createStoredZip([
      { name: "xl/sharedStrings.xml", data: encoder.encode(SHARED_STRINGS_XML) },
    ]);
    await expect(readXlsxText(asFile(noSheet))).rejects.toThrow(/no worksheet/i);
  });
});
