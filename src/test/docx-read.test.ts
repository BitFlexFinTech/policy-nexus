import { describe, it, expect } from "vitest";
import { deflateRawSync } from "node:zlib";
import { createStoredZip, crc32 } from "@/services/documents/zip";
import { extractPolicyFile } from "@/services/extraction/extractPolicyText";
import { textFromDocumentXml } from "@/services/extraction/docxText";
import { readZipEntry } from "@/services/extraction/zipRead";

/**
 * A Word document body, in the shape Word writes it: text runs inside paragraphs,
 * entities encoded, a break and a tab where Word puts them.
 *
 * The `xmlns:w="…"` declaration Word writes on the root element is deliberately NOT
 * repeated here. It is a namespace identifier rather than something a program fetches,
 * but it contains a URL literal — and this project's own `npm run validate` forbids a
 * runtime URL anywhere under `src/**`, a rule worth more than the extra fidelity of an
 * attribute this reader never looks at. It reads the `w:` run and paragraph tags.
 */
const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document><w:body>
<w:p><w:r><w:t>National Policy Coordination Framework</w:t></w:r></w:p>
<w:p><w:r><w:t>Each ministry must submit a costed annual work programme.</w:t></w:r><w:r><w:t xml:space="preserve"> It escalates blocking issues to the Cabinet committee.</w:t></w:r></w:p>
<w:p><w:r><w:t>Thresholds are 4.2% &amp; rising &#8212; see Annex A.</w:t></w:r></w:p>
</w:body></w:document>`;

const EXPECTED_TEXT = [
  "National Policy Coordination Framework",
  "Each ministry must submit a costed annual work programme. It escalates blocking issues to the Cabinet committee.",
  "Thresholds are 4.2% & rising — see Annex A.",
].join("\n");

const encoder = new TextEncoder();

/** A stored (uncompressed) .docx — built with the platform's own ZIP writer. */
const storedDocx = (): Uint8Array =>
  createStoredZip([
    { name: "[Content_Types].xml", data: encoder.encode("<Types/>") },
    { name: "word/document.xml", data: encoder.encode(DOCUMENT_XML) },
  ]);

/**
 * A deflated .docx — how Word actually writes one. Built here with the test runtime's
 * own compressor, so the unpacking path is genuinely exercised rather than assumed.
 */
const deflatedDocx = (): Uint8Array => {
  const name = encoder.encode("word/document.xml");
  const raw = encoder.encode(DOCUMENT_XML);
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
  centralView.setUint32(42, 0, true);
  central.set(name, 46);

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, 1, true);
  eocdView.setUint16(10, 1, true);
  eocdView.setUint32(12, central.length, true);
  eocdView.setUint32(16, local.length, true);

  const out = new Uint8Array(local.length + central.length + eocd.length);
  out.set(local, 0);
  out.set(central, local.length);
  out.set(eocd, local.length + central.length);
  return out;
};

const asFile = (bytes: Uint8Array, name = "brief.docx"): File =>
  new File([bytes as unknown as BlobPart], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

const asBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

/**
 * BATCH D — a real Word file an officer actually has is read in the browser, with no
 * server, no dependency and no network call. The old build recorded its filename and
 * said the text was not read; these gates fail if that comes back.
 */
describe("reading a real Word .docx in the browser (BATCH D)", () => {
  it("takes the text out of the document XML, run by run and paragraph by paragraph", () => {
    expect(textFromDocumentXml(DOCUMENT_XML)).toBe(EXPECTED_TEXT);
  });

  it("decodes entities, and keeps a line break and a tab where Word put one", () => {
    const xml = `<w:body><w:p><w:r><w:t>A &lt; B</w:t><w:br/><w:t>C &amp; D</w:t></w:r></w:p></w:body>`;
    expect(textFromDocumentXml(xml)).toBe("A < B\nC & D");
    const tabs = `<w:body><w:p><w:r><w:t>Name</w:t><w:tab/><w:t>Value</w:t></w:r></w:p></w:body>`;
    expect(textFromDocumentXml(tabs)).toBe("Name\tValue");
  });

  it("finds one named part inside a zip container, and returns null for a part that is not there", async () => {
    const archive = asBuffer(storedDocx());
    const found = await readZipEntry(archive, "word/document.xml");
    expect(found).not.toBeNull();
    expect(new TextDecoder().decode(found!)).toContain("National Policy Coordination Framework");
    expect(await readZipEntry(archive, "word/footer1.xml")).toBeNull();
    expect(await readZipEntry(encoder.encode("not a zip").buffer as ArrayBuffer, "x")).toBeNull();
  });

  it("reads a STORED .docx end to end, as the platform writes one", async () => {
    const result = await extractPolicyFile(asFile(storedDocx()));
    expect(result.kind).toBe("docx");
    expect(result.extracted, result.status).toBe(true);
    expect(result.text).toBe(EXPECTED_TEXT);
  });

  it("reads a DEFLATED .docx end to end — how Word actually writes one", async () => {
    const result = await extractPolicyFile(asFile(deflatedDocx()));
    expect(result.extracted, result.status).toBe(true);
    expect(result.text).toBe(EXPECTED_TEXT);
  });

  it("is deterministic: the same file always yields the same text", async () => {
    expect(await extractPolicyFile(asFile(deflatedDocx()))).toEqual(
      await extractPolicyFile(asFile(deflatedDocx())),
    );
  });

  it("fails with a plain reason for a file that is not a Word document, and never claims to have read it", async () => {
    const result = await extractPolicyFile(new File(["PK-but-not-a-zip"], "broken.docx"));
    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toMatch(/^Not read — /);
    expect(result.status).not.toContain("(Mock)");
  });

  it("reads a Word file whose body holds no text, and says exactly that", async () => {
    const empty = createStoredZip([
      {
        name: "word/document.xml",
        data: encoder.encode("<w:body><w:p><w:r><w:t></w:t></w:r></w:p></w:body>"),
      },
    ]);
    const result = await extractPolicyFile(asFile(empty));
    expect(result.extracted).toBe(false);
    expect(result.status).toContain("no readable text");
  });
});
