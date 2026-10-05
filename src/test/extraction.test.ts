import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyPolicyFile,
  extractPolicyFile,
  isAcceptedPolicyFile,
  normalisePolicyText,
} from "@/services/extraction/extractPolicyText";
import { DEFAULT_PLATFORM_CONFIG, clearConfig, saveConfig } from "@/config/platform";

/** A local address, so the file carries no reachable remote address at all. */
const LOCAL = "http://localhost:8787/extract";

const makeFile = (name: string, content: string, type = "") =>
  new File([content], name, { type });

const makeLive = () =>
  saveConfig({
    ...DEFAULT_PLATFORM_CONFIG,
    extraction: { mode: "live", endpoint: LOCAL, key: "test-key", model: "" },
  });

describe("policy file extraction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearConfig();
  });

  it("classifies a file from its name and type", () => {
    expect(classifyPolicyFile("draft.txt")).toBe("text");
    expect(classifyPolicyFile("DRAFT.TXT", "text/plain")).toBe("text");
    expect(classifyPolicyFile("brief.pdf", "application/pdf")).toBe("pdf");
    expect(classifyPolicyFile("brief.docx")).toBe("docx");
    expect(classifyPolicyFile("return.xlsx")).toBe("xlsx");
    expect(
      classifyPolicyFile(
        "return.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("xlsx");
    expect(classifyPolicyFile("notes.md")).toBe("unsupported");
  });

  it("accepts only the four documented upload types", () => {
    expect(isAcceptedPolicyFile("a.txt")).toBe(true);
    expect(isAcceptedPolicyFile("a.pdf", "application/pdf")).toBe(true);
    expect(isAcceptedPolicyFile("a.docx")).toBe(true);
    expect(isAcceptedPolicyFile("a.xlsx")).toBe(true);
    expect(isAcceptedPolicyFile("a.png", "image/png")).toBe(false);
  });

  it("reads the real text of a .txt file", async () => {
    const result = await extractPolicyFile(
      makeFile("draft.txt", "  A real policy draft.  \n\n\n  Second line. ", "text/plain"),
    );
    expect(result.kind).toBe("text");
    expect(result.extracted).toBe(true);
    expect(result.text).toBe("A real policy draft.\n\nSecond line.");
    expect(result.status).toBe("Text extracted.");
  });

  it("normalises CRLF line endings", async () => {
    const result = await extractPolicyFile(makeFile("draft.txt", "One\r\nTwo\r\nThree", "text/plain"));
    expect(result.text).toBe("One\nTwo\nThree");
  });

  it("reports an empty text file rather than implying it was read", async () => {
    const result = await extractPolicyFile(makeFile("empty.txt", "   \n  ", "text/plain"));
    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toMatch(/no text/i);
  });

  it("does not read a .pdf and says so plainly", async () => {
    const result = await extractPolicyFile(makeFile("brief.pdf", "%PDF-1.4", "application/pdf"));
    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toContain("PDF");
    expect(result.status).toMatch(/\(Mock\)/);
  });

  it("reads a .docx from a real Word file, and says plainly when it cannot", async () => {
    // The specification CHANGED in BATCH D: a .docx is now read in the browser. The
    // end-to-end gates for that live in `src/test/docx-read.test.ts`. What must still
    // hold here is that a file that cannot be opened is never claimed to have been read.
    const result = await extractPolicyFile(makeFile("brief.docx", "PK"));
    expect(result.kind).toBe("docx");
    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toMatch(/^Not read — /);
  });

  it("makes no network call for any file type", async () => {
    const hasFetch = typeof globalThis.fetch === "function";
    const fetchSpy = hasFetch ? vi.spyOn(globalThis, "fetch") : null;
    await extractPolicyFile(makeFile("a.txt", "text", "text/plain"));
    await extractPolicyFile(makeFile("a.pdf", "x", "application/pdf"));
    await extractPolicyFile(makeFile("a.docx", "x"));
    await extractPolicyFile(makeFile("a.xlsx", "x"));
    if (fetchSpy) expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is deterministic — identical content yields an identical result", async () => {
    const first = await extractPolicyFile(makeFile("d.txt", "Same text", "text/plain"));
    const second = await extractPolicyFile(makeFile("d.txt", "Same text", "text/plain"));
    expect(second).toEqual(first);
  });

  it("normalises idempotently", () => {
    const once = normalisePolicyText(" a \r\n\r\n\r\n b ");
    expect(normalisePolicyText(once)).toBe(once);
  });

  it("stays simulated for a PDF while the extraction capability is not live", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractPolicyFile(makeFile("brief.pdf", "%PDF-1.4", "application/pdf"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.extracted).toBe(false);
    expect(result.status).toMatch(/\(Mock\)/);
  });

  it("asks the configured service for a PDF once the capability is live", async () => {
    makeLive();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ text: "Extracted policy text from the service." }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractPolicyFile(makeFile("brief.pdf", "%PDF-1.4", "application/pdf"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.extracted).toBe(true);
    expect(result.text).toBe("Extracted policy text from the service.");
  });

  it("reports honestly when the configured service is unreachable", async () => {
    makeLive();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );

    const result = await extractPolicyFile(makeFile("brief.pdf", "%PDF-1.4", "application/pdf"));

    expect(result.extracted).toBe(false);
    expect(result.text).toBe("");
    expect(result.status).toMatch(/could not be reached/);
  });

  it("reports honestly when the configured service answers without usable text", async () => {
    makeLive();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ text: "   " }) })));

    const result = await extractPolicyFile(makeFile("brief.pdf", "%PDF-1.4", "application/pdf"));

    expect(result.extracted).toBe(false);
    expect(result.status).toMatch(/no readable text/);
  });
});
