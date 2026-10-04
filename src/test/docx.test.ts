import { describe, it, expect } from "vitest";
import { DOCX_MIME_TYPE, buildDocxParts, createDocxBlob, createDocxBytes } from "@/services/documents/docx";
import { crc32 } from "@/services/documents/zip";
import { REFERENCE_DATE } from "@/config/reference";

const REQUIRED_PARTS = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
  "word/styles.xml",
  "word/_rels/document.xml.rels",
  "docProps/core.xml",
  "docProps/app.xml",
];

interface ReadEntry {
  data: Uint8Array;
  crc: number;
  method: number;
}

/**
 * An independent reader for the archive the writer produces. It walks the central
 * directory rather than trusting the writer's own bookkeeping, so a malformed
 * header, a wrong offset or a bad CRC fails here instead of passing quietly.
 */
const readArchive = (bytes: Uint8Array): Map<string, ReadEntry> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let endOfCentral = -1;
  for (let at = bytes.length - 22; at >= 0; at -= 1) {
    if (view.getUint32(at, true) === 0x06054b50) {
      endOfCentral = at;
      break;
    }
  }
  expect(endOfCentral, "end of central directory record").toBeGreaterThanOrEqual(0);

  const count = view.getUint16(endOfCentral + 10, true);
  let cursor = view.getUint32(endOfCentral + 16, true);
  const entries = new Map<string, ReadEntry>();

  for (let index = 0; index < count; index += 1) {
    expect(view.getUint32(cursor, true), "central directory signature").toBe(0x02014b50);
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    expect(view.getUint32(localOffset, true), `local header for ${name}`).toBe(0x04034b50);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;

    entries.set(name, { data: bytes.subarray(dataStart, dataStart + size), crc, method });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
};

const asText = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

const documentXml = (input: { title: string; body: string }) =>
  asText(readArchive(createDocxBytes(input)).get("word/document.xml")!.data);

describe("OOXML (.docx) writer", () => {
  const input = {
    title: "FIN-C1A2 — Small Business Tax Simplification",
    body: "# Preamble\n\n- First measure\n- Second measure & a \"quoted\" point\n\nRisks <not> outcomes.",
  };

  it("produces every part Word requires, in a fixed order", () => {
    expect(buildDocxParts(input).map((part) => part.name)).toEqual(REQUIRED_PARTS);
  });

  it("stores every part uncompressed with a CRC that matches the data", () => {
    const archive = readArchive(createDocxBytes(input));
    for (const name of REQUIRED_PARTS) {
      const entry = archive.get(name);
      expect(entry, name).toBeDefined();
      expect(entry!.method, `${name} method`).toBe(0);
      expect(entry!.crc, `${name} crc`).toBe(crc32(entry!.data));
    }
  });

  it("writes the title and the body into word/document.xml", () => {
    const document = documentXml(input);
    expect(document).toContain("Small Business Tax Simplification");
    expect(document).toContain("First measure");
    expect(document).toContain("Second measure");
    expect(document).toContain("Risks");
  });

  it("escapes XML-significant characters instead of emitting invalid XML", () => {
    const document = documentXml(input);
    expect(document).toContain("&amp;");
    expect(document).toContain("&quot;quoted&quot;");
    expect(document).toContain("&lt;not&gt;");
    expect(document).not.toContain("Risks <not> outcomes.");
  });

  it("renders `- ` lines as bullet paragraphs", () => {
    const document = documentXml(input);
    expect(document).toContain('<w:pStyle w:val="ListParagraph"/>');
    expect(document).toContain("\u2022 First measure");
  });

  it("keeps blank lines as paragraph breaks rather than dropping them", () => {
    expect(documentXml(input)).toContain("<w:p/>");
  });

  it("is byte-identical for the same input", () => {
    expect(Array.from(createDocxBytes(input))).toEqual(Array.from(createDocxBytes(input)));
  });

  it("changes when the content changes", () => {
    const other = createDocxBytes({ ...input, body: `${input.body}\nAn added line.` });
    expect(Array.from(other)).not.toEqual(Array.from(createDocxBytes(input)));
  });

  it("does not read a clock — two calls separated in time agree", async () => {
    const first = createDocxBytes(input);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(Array.from(createDocxBytes(input))).toEqual(Array.from(first));
  });

  it("declares the Word MIME type, and the Blob carries it", () => {
    expect(DOCX_MIME_TYPE).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(createDocxBlob(input).type).toBe(DOCX_MIME_TYPE);
  });

  it("dates the file with its own recorded moment, and falls back to the reference date", () => {
    // A document with no run behind it keeps the platform's reference date.
    const fallback = asText(readArchive(createDocxBytes(input)).get("docProps/core.xml")!.data);
    expect(fallback).toContain(`${REFERENCE_DATE}T00:00:00Z`);

    // A document that knows the moment it was recorded carries that exact moment instead,
    // so a Word file is dated when it was made — never the fixed reference date.
    const recorded = "2026-10-04T09:15:00.000Z";
    const core = asText(
      readArchive(createDocxBytes({ ...input, createdAt: recorded })).get("docProps/core.xml")!.data,
    );
    expect(core).toContain(recorded);
    expect(core).not.toContain(`${REFERENCE_DATE}T00:00:00Z`);
  });
});
