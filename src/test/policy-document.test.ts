import { describe, it, expect } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import { BLANK, CLAUSE, KNOWN_ABBREVIATIONS } from "@/services/assessment/policyDraft";
import type { AssessmentRequest } from "@/services/assessment/types";

const requestFor = (departmentId: string): AssessmentRequest => {
  const department = findDepartment(departmentId)!;
  const template = department.policyTemplates[0];
  return {
    departmentId: department.id,
    policyText: template.policyText,
    source: "preset",
    templateId: template.id,
    timeHorizon: template.timeHorizon,
  };
};

const runFor = (departmentId: string) => assessmentService.buildRun(requestFor(departmentId));

/**
 * THE POLICY IS A REAL INSTRUMENT, AND THESE GATES SAY WHAT THAT MEANS.
 *
 * The platform used to produce a ten-section working draft of roughly 1,700 words — about
 * three printed pages — with no foreword, no acronyms, no executive summary, no contents
 * and no matrices. Real Zimbabwean policies are 40–100 pages and are read in a fixed order
 * (the National ICT Policy 2015 is 42 pages; the National Health Strategy 2021–2025 is 104;
 * the National AI Strategy 2026–2030 is 73). These tests hold the document to that shape:
 * every mandatory part present and in order, a length floor a thin draft cannot pass, a
 * contents list that matches the clauses, an acronym list that cannot list what the policy
 * does not use, clause references that resolve, and tables whose rows are all the same
 * width. They fail the build; they do not warn.
 */

/** The parts a Zimbabwean policy must have, in the order a reader meets them. */
const REQUIRED_ORDER = [
  "cover",
  "contents",
  "foreword",
  "acknowledgements",
  "acronyms",
  "executive-summary",
  "introduction",
  "situation-analysis",
  "situation-groups",
  "situation-priorities",
  "situation-documents",
  "vision",
  "principles",
  "legal",
  "measures",
  "measures-arising",
  "implementation",
  "risk",
  "engagement",
  "finance",
  "monitoring",
  "transitional",
  "annex-a",
  "annex-b",
  "citations",
  "annex-documents",
  "annex-run-inputs",
  "annex-method",
  "note",
];

/**
 * THE LENGTH FLOOR IS GROUNDED — set to what the platform ACTUALLY produces, measured, never to a
 * target that would force padded or invented content (the owner's rule, 2026-10-05).
 *
 * Measured across all 16 departments on 2026-10-05 by running the generator: **8,341 to 12,627
 * words each** (smallest `zimra`, largest `health`) after Batch 5 added the departmental-material
 * clause and the documents annex. The floor sits just under the smallest — 8,341 — so any change
 * that drops a clause, an annex, a matrix or a department's indicators fails here. As more real
 * data is added the floor rises WITH the measured minimum; it is never raised by hand.
 */
const WORD_FLOOR = 8250;

const words = (text: string) => text.trim().split(/\s+/).length;

describe("the drafted policy — a Zimbabwean instrument, not a summary", () => {
  it.each(DEPARTMENTS)("carries every mandatory part in order for $abbr", async (department) => {
    const draft = buildPolicyDraft(await runFor(department.id), department);
    const ids = draft.sections.map((section) => section.id);

    REQUIRED_ORDER.forEach((id) => expect(ids, `${department.abbr} is missing ${id}`).toContain(id));
    expect(ids).toEqual(REQUIRED_ORDER);
  });

  it.each(DEPARTMENTS)("reaches the length floor for $abbr", async (department) => {
    const draft = buildPolicyDraft(await runFor(department.id), department);
    const counted = words(renderDocumentText(draft));
    expect(counted, `${department.abbr} produced only ${counted} words`).toBeGreaterThanOrEqual(
      WORD_FLOOR,
    );
  });

  /**
   * THE FLOOR IS GROUNDED, NOT ASPIRATIONAL. The owner's rule (2026-10-05): the minimum must be what
   * the platform can honestly produce, so the floor may never exceed the smallest department's real
   * output — a floor above reality could only be satisfied by padding. This measures every department
   * afresh and fails if the floor is raised above what is really produced, or if a real regression
   * drops a department below it.
   */
  it("keeps the floor grounded — never above the smallest department's real output", async () => {
    const counts = await Promise.all(
      DEPARTMENTS.map(async (department) =>
        words(renderDocumentText(buildPolicyDraft(await runFor(department.id), department))),
      ),
    );
    const smallest = Math.min(...counts);
    expect(
      WORD_FLOOR,
      `the floor (${WORD_FLOOR}) must not exceed the smallest real output (${smallest}) — a floor above reality would force padding`,
    ).toBeLessThanOrEqual(smallest);
  });

  it("lists every numbered clause and annex in its contents, and nothing else", async () => {
    const department = findDepartment("fin")!;
    const draft = buildPolicyDraft(await runFor("fin"), department);
    const contents = draft.sections.find((section) => section.id === "contents")!;
    const expected = draft.sections
      .filter((section) => /^\d+\.\s/.test(section.heading) || /^Annex [A-Z]\b/.test(section.heading))
      .map((section) => section.heading);

    expect(contents.bullets).toEqual(expected);
    expect(expected.length).toBeGreaterThanOrEqual(16);
  });

  it("expands every abbreviation it lists, and lists every abbreviation it uses", async () => {
    const department = findDepartment("agri")!;
    const draft = buildPolicyDraft(await runFor("agri"), department);
    const acronyms = draft.sections.find((section) => section.id === "acronyms")!;
    const listed = (acronyms.bullets ?? []).map((line) => line.split(" — ")[0]);
    const body = draft.sections
      .filter((section) => section.id !== "acronyms")
      .map((section) =>
        [
          section.heading,
          ...section.paragraphs,
          ...(section.bullets ?? []),
          ...(section.table ? section.table.rows.flat() : []),
        ].join(" "),
      )
      .join(" ");

    listed.forEach((abbreviation) =>
      expect(
        new RegExp(`\\b${abbreviation}\\b`).test(body),
        `${abbreviation} is listed but never used`,
      ).toBe(true),
    );
    KNOWN_ABBREVIATIONS.filter(([abbreviation]) =>
      new RegExp(`\\b${abbreviation}\\b`).test(body),
    ).forEach(([abbreviation]) => expect(listed).toContain(abbreviation));
  });

  it("resolves every clause reference it makes", async () => {
    const department = findDepartment("health")!;
    const draft = buildPolicyDraft(await runFor("health"), department);
    const text = renderDocumentText(draft);
    const numbers = new Set(Object.values(CLAUSE).map(String));
    const referenced = [...text.matchAll(/clauses? (\d+)/g)].map((match) => match[1]);

    expect(referenced.length).toBeGreaterThan(10);
    referenced.forEach((number) =>
      expect(
        numbers.has(number),
        `the document refers to clause ${number}, which does not exist`,
      ).toBe(true),
    );
  });

  it("gives every table a caption, a header row and rows of one width", async () => {
    const department = findDepartment("mines")!;
    const draft = buildPolicyDraft(await runFor("mines"), department);
    const tables = draft.sections.filter((section) => section.table);

    expect(tables.length).toBeGreaterThanOrEqual(5);
    tables.forEach((section) => {
      const table = section.table!;
      expect(table.caption.length).toBeGreaterThan(0);
      expect(table.columns.length).toBeGreaterThan(1);
      expect(table.rows.length).toBeGreaterThan(0);
      table.rows.forEach((row) =>
        expect(row.length, `${table.caption} has a row of ${row.length} cells`).toBe(
          table.columns.length,
        ),
      );
    });
  });

  it("prints no generation artefact, and keeps its marked blanks visible", async () => {
    const department = findDepartment("zimra")!;
    const draft = buildPolicyDraft(await runFor("zimra"), department);
    const text = renderDocumentText(draft);

    ["undefined", "NaN", "[object Object]", "${"].forEach((artefact) =>
      expect(text.includes(artefact), `the document contains "${artefact}"`).toBe(false),
    );
    // The marked blanks are deliberate: a reader must see where the department supplies the
    // value, so an empty string instead of the marker would be the defect, not the fix.
    expect(text).toContain(BLANK);
  });

  it("stays byte-identical for the same run, and differs between departments", async () => {
    const department = findDepartment("energy")!;
    const run = await runFor("energy");
    const once = renderDocumentText(buildPolicyDraft(run, department));
    const again = renderDocumentText(buildPolicyDraft(run, department));
    expect(again).toBe(once);

    const other = findDepartment("lg")!;
    expect(renderDocumentText(buildPolicyDraft(await runFor("lg"), other))).not.toBe(once);
  });

  it("phrases the single-measure and the no-resistance cases correctly", async () => {
    // The two defects measured in the old draft: "Measures 1 to 1 restate the substance…"
    // and a sentence reading as though groups did require provisions when none is resistant.
    const department = findDepartment("psc")!;
    const single = await assessmentService.buildRun({
      ...requestFor("psc"),
      policyText: "Introduce one simplified procedure for all staff.",
    });
    const text = renderDocumentText(buildPolicyDraft(single, department));

    expect(text).not.toContain("Measures 1 to 1");
    expect(text).toContain("The single measure below gives effect to the submitted draft");
    expect(text).not.toMatch(/no group is modelled as resistant and require/i);
  });
});
