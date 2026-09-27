import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyPolicyFile,
  extractPolicyFile,
  isAcceptedPolicyFile,
  normalisePolicyText,
} from "@/services/extraction/extractPolicyText";

const makeFile = (name: string, content: string, type = "") =>
  new File([content], name, { type });

describe("policy file extraction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies a file from its name and type", () => {
    expect(classifyPolicyFile("draft.txt")).toBe("text");
    expect(classifyPolicyFile("DRAFT.TXT", "text/plain")).toBe("text");
    expect(classifyPolicyFile("brief.pdf", "application/pdf")).toBe("pdf");
    expect(classifyPolicyFile("brief.docx")).toBe("docx");
    expect(classifyPolicyFile("notes.md")).toBe("unsupported");
  });

  it("accepts only the three documented upload types", () => {
    expect(isAcceptedPolicyFile("a.txt")).toBe(true);
    expect(isAcceptedPolicyFile("a.pdf", "application/pdf")).toBe(true);
    expect(isAcceptedPolicyFile("a.docx")).toBe(true);
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

  it("does not read a .docx and says so plainly", async () => {
    const result = await extractPolicyFile(makeFile("brief.docx", "PK"));
    expect(result.kind).toBe("docx");
    expect(result.extracted).toBe(false);
    expect(result.status).toContain("DOCX");
    expect(result.status).toMatch(/\(Mock\)/);
  });

  it("makes no network call for any file type", async () => {
    const hasFetch = typeof globalThis.fetch === "function";
    const fetchSpy = hasFetch ? vi.spyOn(globalThis, "fetch") : null;
    await extractPolicyFile(makeFile("a.txt", "text", "text/plain"));
    await extractPolicyFile(makeFile("a.pdf", "x", "application/pdf"));
    await extractPolicyFile(makeFile("a.docx", "x"));
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
});
