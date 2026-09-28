/**
 * A minimal, deterministic ZIP READER — the container a `.docx` is stored in.
 *
 * WHY THIS EXISTS: a `.docx` written by Word is a ZIP holding XML. The platform
 * already WRITES zip containers (`src/services/documents/zip.ts`); this reads one,
 * so a Word file an officer actually has can be understood without a server, a
 * parser dependency or a network call.
 *
 * It reads the archive the way the format defines it — the central directory is
 * the index, and the local header says where the bytes start — rather than guessing
 * at offsets. A compressed entry is unpacked with the browser's own
 * `DecompressionStream`, which is why no dependency is needed. Where the browser
 * cannot provide one, it fails with a plain reason instead of returning nothing.
 *
 * DETERMINISM: pure byte work. The same archive always yields the same bytes.
 */

/** Where the end-of-central-directory record starts, or -1 when the archive is not a zip. */
const findEndOfCentralDirectory = (view: DataView): number => {
  // The record is at least 22 bytes and its comment is at most 65,535 bytes.
  const earliest = Math.max(0, view.byteLength - 22 - 65535);
  for (let offset = view.byteLength - 22; offset >= earliest; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  return -1;
};

/** Unpack a raw-deflate stream using the browser's own decompressor. */
const inflateRaw = async (bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot unpack a compressed Word file.");
  }
  // Typed as BufferSource so it matches what DecompressionStream accepts; the
  // browser's own decompressor does the work, so no unpacking code lives here.
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = source.pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let at = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, at);
    at += chunk.length;
  });
  return out;
};

/**
 * Read one entry out of a zip archive. Returns `null` when the archive does not
 * hold that entry — an honest "not there", never an empty file pretending to be
 * the answer.
 */
export const readZipEntry = async (
  archive: ArrayBuffer,
  wanted: string,
): Promise<Uint8Array | null> => {
  const view = new DataView(archive);
  const eocd = findEndOfCentralDirectory(view);
  if (eocd < 0) return null;

  const entries = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const bytes = new Uint8Array(archive);
  const decoder = new TextDecoder();

  for (let index = 0; index < entries; index += 1) {
    if (cursor + 46 > view.byteLength || view.getUint32(cursor, true) !== 0x02014b50) return null;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    if (name === wanted) {
      if (localOffset + 30 > view.byteLength || view.getUint32(localOffset, true) !== 0x04034b50) {
        return null;
      }
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const stored = bytes.subarray(start, start + compressedSize);
      if (method === 0) return stored;
      if (method === 8) return inflateRaw(stored);
      throw new Error("This Word file uses a compression method this platform cannot open.");
    }

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return null;
};
