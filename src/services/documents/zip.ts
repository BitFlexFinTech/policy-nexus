/**
 * A minimal, deterministic ZIP writer — the container a `.docx` is stored in.
 *
 * Only the STORE method is used (no compression), so the writer needs no deflate
 * implementation and no dependency, and its output is a pure function of the
 * input bytes. The DOS date/time fields are a FIXED constant (1980-01-01 00:00)
 * and never the clock, so the same document always produces byte-identical
 * output (see .clinerules/04-determinism-and-validation.md).
 *
 * The local header, central directory and end-of-central-directory records are
 * written exactly as the ZIP specification requires; `src/test/docx.test.ts`
 * re-reads the result with an independent reader and re-checks every CRC.
 */

/** DOS date for 1980-01-01 — the earliest value the format allows, and fixed. */
const DOS_DATE = 0x0021;
/** DOS time 00:00:00 — fixed, never read from a clock. */
const DOS_TIME = 0x0000;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

/** CRC-32 (IEEE 802.3) of a byte sequence, as ZIP stores it. */
export const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

export interface ZipEntry {
  /** Path inside the archive, e.g. `word/document.xml`. */
  name: string;
  data: Uint8Array;
}

/**
 * Build a ZIP archive (STORE method) from the given entries, in the given order.
 * Deterministic: no clock, no compression, no platform-dependent bytes.
 */
export const createStoredZip = (entries: ZipEntry[]): Uint8Array => {
  const encoder = new TextEncoder();
  const fileRecords: Uint8Array[] = [];
  const centralRecords: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const header = new Uint8Array(30 + nameBytes.length);
    const headerView = new DataView(header.buffer);
    headerView.setUint32(0, 0x04034b50, true); // local file header
    headerView.setUint16(4, 20, true); // version needed to extract
    headerView.setUint16(6, 0, true); // general purpose flags
    headerView.setUint16(8, 0, true); // compression method: store
    headerView.setUint16(10, DOS_TIME, true);
    headerView.setUint16(12, DOS_DATE, true);
    headerView.setUint32(14, crc, true);
    headerView.setUint32(18, size, true); // compressed size
    headerView.setUint32(22, size, true); // uncompressed size
    headerView.setUint16(26, nameBytes.length, true);
    headerView.setUint16(28, 0, true); // extra field length
    header.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); // central directory header
    centralView.setUint16(4, 20, true); // version made by
    centralView.setUint16(6, 20, true); // version needed to extract
    centralView.setUint16(8, 0, true); // general purpose flags
    centralView.setUint16(10, 0, true); // compression method: store
    centralView.setUint16(12, DOS_TIME, true);
    centralView.setUint16(14, DOS_DATE, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true); // compressed size
    centralView.setUint32(24, size, true); // uncompressed size
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true); // extra field length
    centralView.setUint16(32, 0, true); // file comment length
    centralView.setUint16(34, 0, true); // disk number start
    centralView.setUint16(36, 0, true); // internal file attributes
    centralView.setUint32(38, 0, true); // external file attributes
    centralView.setUint32(42, offset, true); // relative offset of local header
    central.set(nameBytes, 46);

    fileRecords.push(header, entry.data);
    centralRecords.push(central);
    offset += header.length + size;
  }

  const centralSize = centralRecords.reduce((total, record) => total + record.length, 0);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); // end of central directory
  endView.setUint16(4, 0, true); // this disk
  endView.setUint16(6, 0, true); // disk with central directory
  endView.setUint16(8, entries.length, true); // entries on this disk
  endView.setUint16(10, entries.length, true); // entries total
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true); // offset of central directory
  endView.setUint16(20, 0, true); // comment length

  const parts = [...fileRecords, ...centralRecords, end];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const archive = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  return archive;
};
