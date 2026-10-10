import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEPARTMENT_IDS } from "@/config/departments";
import {
  DEPARTMENT_CORPUS_DIRECTORY,
  departmentCitation,
  departmentCorpusPath,
  forgetDepartmentCorpus,
  loadDepartmentCorpus,
} from "@/services/documents/departmentCorpus";

/**
 * The shipped department corpora, read once. Each file holds one department's published documents'
 * text, so re-reading them inside every test would needlessly slow the whole suite.
 */
const CORPUS_DIR = join(process.cwd(), "public/department-corpus");
const FILES = readdirSync(CORPUS_DIR).filter((name) => name.endsWith(".json"));
const SHIPPED = FILES.map((name) => ({
  department: name.replace(/\.json$/, ""),
  ...(JSON.parse(readFileSync(join(CORPUS_DIR, name), "utf8")) as {
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
  }),
}));

/**
 * THE DEPARTMENT DOCUMENTS MUST BE REAL (Batch B2). The owner's one rule that never moves: real data
 * only, never invented. These gates prove every built department ships a real, cited set of documents,
 * that a picture-only scan is recorded honestly rather than faked, that the set only ever covers real
 * departments, and that a failure to read a department's file degrades safely instead of breaking.
 */
describe("the department document library", () => {
  beforeEach(() => {
    forgetDepartmentCorpus();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("ships a real, cited set for every department that has been built", () => {
    // Batch B2 builds departments 1 to 8; Batch B3 adds the rest. Every built set carries the
    // agreed minimum (6 documents), and this test grows with the set.
    expect(SHIPPED.length).toBeGreaterThanOrEqual(8);
    for (const corpus of SHIPPED) {
      expect(corpus.documents.length, `${corpus.department} ships at least six documents`).toBeGreaterThanOrEqual(6);
    }
  });

  it("only ever covers real departments", () => {
    for (const corpus of SHIPPED) {
      expect(DEPARTMENT_IDS, `${corpus.department} is a real department id`).toContain(corpus.department);
    }
  });

  it("cites every document: title, publishing body, date and the published address", () => {
    for (const corpus of SHIPPED) {
      for (const document of corpus.documents) {
        expect(document.title, `${document.id} is cited by its title`).toBeTruthy();
        expect(document.publisher, `${document.id} names the body that published it`).toBeTruthy();
        expect(document.date, `${document.id} carries its date`).toBeTruthy();
        expect(document.url, `${document.id} carries the address of the published file`).toMatch(/^https?:\/\//);
        expect(document.pages, `${document.id} records its page count`).toBeGreaterThan(0);
      }
      expect(new Set(corpus.documents.map((document) => document.id)).size).toBe(corpus.documents.length);
    }
  });

  it("records a picture-only scan by name, and never fakes its text", () => {
    for (const corpus of SHIPPED) {
      for (const document of corpus.documents) {
        if (document.read) {
          expect(document.text.length, `${document.id} is marked read so it must carry text`).toBeGreaterThan(200);
        } else {
          expect(document.text, `${document.id} is not readable so its text must be empty`).toBe("");
        }
      }
    }
  });

  it("reads a department's set from our own site, and names each document with its publisher and date", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        documents: [
          {
            id: "ict-001",
            section: "Sector policy",
            title: "Zimbabwe National Policy for Information and Communications Technology (ICT), 2016",
            publisher: "Ministry of Information Communication Technology, Postal and Courier Services",
            date: "2016",
            url: "/sites/veritas_d/files/Zimbabwe%20National%20Policy%20for%20ICT%202016.pdf",
            pages: 44,
            read: true,
            characters: 12,
            text: "Zimbabwe National Policy for ICT 2016.",
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const documents = await loadDepartmentCorpus("ict");

    expect(fetchMock).toHaveBeenCalledWith(departmentCorpusPath("ict"), expect.anything());
    expect(departmentCorpusPath("ict")).toBe(`${DEPARTMENT_CORPUS_DIRECTORY}/ict.json`);
    expect(documents).toHaveLength(1);
    expect(departmentCitation(documents[0])).toBe(
      "Zimbabwe National Policy for Information and Communications Technology (ICT), 2016 — " +
        "Ministry of Information Communication Technology, Postal and Courier Services, 2016",
    );
  });

  it("returns nothing rather than throwing when a department's set cannot be read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    );
    await expect(loadDepartmentCorpus("zida")).resolves.toEqual([]);
  });
});
