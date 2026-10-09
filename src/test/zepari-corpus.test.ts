import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { libraryDocuments } from "@/services/research/researchDocuments";
import { findSources, questionWords } from "@/services/research/researchRetrieval";
import {
  ZEPARI_CORPUS_PATH,
  forgetZepariCorpus,
  loadZepariCorpus,
  zepariCitation,
} from "@/services/research/zepariCorpus";

/**
 * The shipped corpus, read once. The file is about 9.4 MB, so re-reading it inside every test would
 * needlessly slow the whole suite.
 */
const SHIPPED_CORPUS = JSON.parse(
  readFileSync(join(process.cwd(), "public/zepari-corpus.json"), "utf8"),
) as {
  documents: Array<{
    id: string;
    title: string;
    text: string;
    publisher?: string;
    date?: string;
    url?: string;
    section?: string;
  }>;
};

/**
 * ZEPARI's own published documents are the research library (the owner's strict rule, 2026-10-07: the
 * library must be their real publications, never "an extract"). These gates prove the shipped corpus is
 * real and complete, that it is read from our own site, and that a failure to read it degrades safely
 * instead of breaking a screen.
 */
describe("ZEPARI's published library", () => {
  beforeEach(() => {
    window.localStorage.clear();
    forgetZepariCorpus();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("ships ZEPARI's real published corpus — every listing, every page", () => {
    const documents = SHIPPED_CORPUS.documents;
    // The three listing pages held 103 publications between them when the corpus was built.
    expect(documents.length).toBeGreaterThanOrEqual(100);
    expect(documents.filter((document) => String(document.text).length > 0).length).toBeGreaterThanOrEqual(90);
    for (const document of documents) {
      expect(document.title, "every document is cited by its title").toBeTruthy();
      expect(document.publisher, "every document names the body that published it").toBeTruthy();
      expect(document.date, "every document carries its date").toBeTruthy();
      expect(document.url, "every document carries the address of its published PDF").toBeTruthy();
    }
    expect(new Set(documents.map((document) => document.id)).size).toBe(documents.length);
    for (const section of ["Policy Briefs", "Research Studies", "Economic Barometer"]) {
      expect(
        documents.some((document) => document.section === section),
        `the corpus covers ${section}`,
      ).toBe(true);
    }
  });

  it("reads them from our own site, and names each one with its publisher and date", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        documents: [
          {
            id: "zep-001",
            section: "Policy Briefs",
            title: "Energy and Poverty",
            publisher: "ZEPARI",
            date: "31 Jan 2022",
            url: "/sites/default/files/energy.pdf",
            pages: 6,
            read: true,
            characters: 12,
            text: "Electricity subsidies and poverty.",
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const documents = await loadZepariCorpus();

    expect(fetchMock).toHaveBeenCalledWith(ZEPARI_CORPUS_PATH, expect.anything());
    expect(documents).toHaveLength(1);
    expect(zepariCitation(documents[0])).toBe("Energy and Poverty — ZEPARI, 31 Jan 2022");
  });

  it("returns nothing rather than throwing when the library cannot be read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    );
    await expect(loadZepariCorpus()).resolves.toEqual([]);
  });

  it("searches ZEPARI's published documents alongside anything added here", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          documents: [
            {
              id: "zep-001",
              section: "Research Studies",
              title: "Mining Sector Policy",
              publisher: "ZEPARI",
              date: "31 Dec 2019",
              url: "/sites/default/files/mining.pdf",
              pages: 134,
              read: true,
              characters: 42,
              text: "Mineral revenue and beneficiation policy in Zimbabwe.",
            },
          ],
        }),
      })),
    );

    const documents = await libraryDocuments();

    expect(documents.some((document) => document.name.includes("Mining Sector Policy"))).toBe(true);
  });

  it("judges a question on the words that carry it, not the common ones", () => {
    // "give", "the" and "for" say nothing about a document, so they are dropped; "ICT" is kept even
    // though it is short, because it is the word that decides what the question is about.
    expect(questionWords("give me a brief on the National Policy for ICT 2016")).toEqual([
      "brief",
      "national",
      "policy",
      "ict",
      "2016",
    ]);
  });

  it("answers the owner's own question from ZEPARI's published documents", () => {
    const documents = SHIPPED_CORPUS.documents
      .filter((document) => document.text)
      .map((document) => ({ id: document.id, name: document.title, text: document.text }));

    const sources = findSources(
      "give me a brief on the National Policy for ICT 2016 and what it focused on",
      documents,
    );

    expect(sources.length, "the owner's question must match real ZEPARI publications").toBeGreaterThan(0);
    // An excerpt carries "…" where it was cut out of the document, and its own spacing is tidied, so
    // the check flattens both sides before proving the quotation really appears.
    const flat = (value: string) => value.replace(/…/g, "").replace(/\s+/g, " ").trim();
    for (const source of sources) {
      const document = documents.find((entry) => entry.id === source.id);
      expect(document, "every source is a real document in the corpus").toBeTruthy();
      expect(
        flat(document?.text ?? ""),
        "every quotation really appears in the document it is attributed to",
      ).toContain(flat(source.excerpt));
    }
  });
});
