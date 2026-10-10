import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NATIONAL_CORPUS_PATH,
  forgetNationalCorpus,
  loadNationalCorpus,
  nationalCitation,
} from "@/services/documents/nationalCorpus";

/**
 * The shipped national cross-cutting corpus, read once. The file holds every published document's
 * text, so re-reading it inside every test would needlessly slow the whole suite.
 */
const SHIPPED = JSON.parse(
  readFileSync(join(process.cwd(), "public/national-corpus.json"), "utf8"),
) as {
  documents: Array<{
    id: string;
    section: string;
    title: string;
    publisher: string;
    date: string;
    url: string;
    pages: number;
    read: boolean;
    text: string;
  }>;
};

/**
 * THE NATIONAL DOCUMENTS MUST BE REAL (Batch B1). The owner's one rule that never moves: real data
 * only, never invented. These gates prove the shipped library is real and complete, that every entry
 * can be checked back to the body that published it, that a picture-only scan is recorded honestly
 * rather than faked, and that a failure to read the file degrades safely instead of breaking a screen.
 */
describe("the national cross-cutting document library", () => {
  beforeEach(() => {
    forgetNationalCorpus();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("ships the real published documents, never fewer than the agreed set", () => {
    const documents = SHIPPED.documents;
    // Fifteen national documents were agreed for this first set (Budget, NDS, Auditor-General, ZIMSTAT).
    expect(documents.length).toBeGreaterThanOrEqual(15);
    // Most carry a text layer; the ones that do not are named below rather than faked.
    expect(documents.filter((document) => document.read && document.text.length > 0).length).toBeGreaterThanOrEqual(13);
  });

  it("cites every document: title, publishing body, date and the published address", () => {
    for (const document of SHIPPED.documents) {
      expect(document.title, "every document is cited by its title").toBeTruthy();
      expect(document.publisher, "every document names the body that published it").toBeTruthy();
      expect(document.date, "every document carries its date").toBeTruthy();
      expect(document.url, "every document carries the address of the published file").toMatch(/^https?:\/\//);
      expect(document.pages, "every document records its page count").toBeGreaterThan(0);
    }
    expect(new Set(SHIPPED.documents.map((document) => document.id)).size).toBe(
      SHIPPED.documents.length,
    );
  });

  it("covers every agreed group, so no department is left without national evidence", () => {
    for (const section of [
      "National Budget",
      "National Development Strategy",
      "Auditor-General",
      "ZIMSTAT",
    ]) {
      expect(
        SHIPPED.documents.some((document) => document.section === section),
        `the library covers ${section}`,
      ).toBe(true);
    }
  });

  it("records a picture-only scan by name, and never fakes its text", () => {
    for (const document of SHIPPED.documents) {
      if (document.read) {
        expect(document.text.length, `${document.id} is marked read so it must carry text`).toBeGreaterThan(200);
      } else {
        expect(document.text, `${document.id} is not readable so its text must be empty`).toBe("");
      }
    }
  });

  it("reads them from our own site, and names each one with its publisher and date", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        documents: [
          {
            id: "nat-001",
            section: "National Budget",
            title: "The 2024 National Budget Statement",
            publisher: "Ministry of Finance, Economic Development and Investment Promotion",
            date: "30 November 2023",
            url: "/sites/veritas_d/files/The%202024%20Budget%20Statement.pdf",
            pages: 250,
            read: true,
            characters: 12,
            text: "Consolidating Economic Transformation.",
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const documents = await loadNationalCorpus();

    expect(fetchMock).toHaveBeenCalledWith(NATIONAL_CORPUS_PATH, expect.anything());
    expect(documents).toHaveLength(1);
    expect(nationalCitation(documents[0])).toBe(
      "The 2024 National Budget Statement — Ministry of Finance, Economic Development and Investment Promotion, 30 November 2023",
    );
  });

  it("returns nothing rather than throwing when the library cannot be read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    );
    await expect(loadNationalCorpus()).resolves.toEqual([]);
  });
});
