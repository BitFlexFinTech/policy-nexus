import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEPARTMENT_IDS, findDepartment } from "@/config/departments";
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
      characters: number;
      text: string;
    }>;
  }),
}));

/**
 * THE DEPARTMENT DOCUMENTS MUST BE REAL (Batch B2 built departments 1-8; Batch B3 completed all 16). The owner's one rule that never moves: real data
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

  it("ships a real, cited set for every department", () => {
    // Batch B3 completes the set: all sixteen departments hold their own real published documents,
    // and every set carries the agreed minimum (6 documents). The gate grows with the set — it now
    // requires the whole country, not a subset, so a department whose documents silently disappear
    // fails here instead of going unnoticed.
    expect(SHIPPED.length).toBe(DEPARTMENT_IDS.length);
    expect([...SHIPPED.map((corpus) => corpus.department)].sort()).toEqual([...DEPARTMENT_IDS].sort());
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

  it("is exactly what the app's register carries, for every department", () => {
    // BATCH B4 — the register every screen reads (`src/config/departmentDocuments.ts`) is GENERATED
    // from these corpus files by `scripts/build-department-register.mjs`, and `npm run validate`
    // re-runs the generator in check mode. This is the app-side half of the same gate: it proves the
    // register the application actually imports describes each document exactly as the corpus does,
    // and carries no text of its own — the text belongs in the corpus, which is loaded on demand.
    for (const corpus of SHIPPED) {
      const department = findDepartment(corpus.department);
      expect(department, `${corpus.department} is a real department`).toBeTruthy();
      expect(
        department!.documents.map((document) => document.id),
        `${corpus.department} register ids`,
      ).toEqual(corpus.documents.map((document) => document.id));

      for (const document of corpus.documents) {
        const registered = department!.documents.find((entry) => entry.id === document.id)!;
        expect(registered, `${document.id} is in the register`).toBeTruthy();
        expect(registered.title, `${document.id} title`).toBe(document.title);
        expect(registered.section, `${document.id} section`).toBe(document.section);
        expect(registered.publisher, `${document.id} publisher`).toBe(document.publisher);
        expect(registered.date, `${document.id} date`).toBe(document.date);
        expect(registered.url, `${document.id} address`).toBe(document.url);
        expect(registered.pages, `${document.id} pages`).toBe(document.pages);
        expect(registered.read, `${document.id} read flag`).toBe(document.read);
        expect(registered.characters, `${document.id} characters`).toBe(document.characters);
        expect("text" in registered, `${document.id} carries no text in the register`).toBe(false);
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
