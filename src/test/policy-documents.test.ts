import { describe, expect, it } from "vitest";
import { findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import { priorityTerms } from "@/services/assessment/policyDraft";
import type { AssessmentRequest, DepartmentDocumentInput } from "@/services/assessment/types";

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

/** A department's own material that really carries two of its stated priorities. */
const FIN_MATERIAL =
  "The fiscal consolidation path holds the deficit within the framework agreed with creditors. " +
  "Currency stability depends on credible settlement rules, and the ministry reviews them each quarter. " +
  "A short closing note follows the tables.";

const documents: DepartmentDocumentInput[] = [
  { id: "doc-fin-1", name: "fiscal-notes.txt", text: FIN_MATERIAL },
  // A file the browser could not read: recorded by name, and it must contribute nothing.
  { id: "doc-fin-2", name: "scanned-return.pdf", text: "" },
];

const draftFor = async (departmentId: string, docs?: DepartmentDocumentInput[]) => {
  const department = findDepartment(departmentId)!;
  const run = await assessmentService.buildRun({ ...requestFor(departmentId), documents: docs });
  return { department, run, draft: buildPolicyDraft(run, department) };
};

/**
 * BATCH 5 — THE DEPARTMENT'S OWN DOCUMENTS ARE USED IN THE POLICY.
 *
 * Before this batch the drafted policy ignored the documents a department supplied: the run counted
 * them and the seed changed, but the policy itself never mentioned them, so a department's own
 * reports, spreadsheets and statistics could not make the instrument longer or better grounded.
 * These gates hold the new behaviour: the documents really read are listed at Annex D, the situation
 * analysis quotes the department's OWN wording where it carries one of its stated priorities, a file
 * that could not be read contributes nothing, and no claim is ever made without the sentence that
 * proves it.
 */
describe("Batch 5 — the department's own documents are used in the drafted policy", () => {
  it("lists the documents really read at Annex D, with the ones not read marked as such", async () => {
    const { draft } = await draftFor("fin", documents);
    const annex = draft.sections.find((section) => section.id === "annex-documents")!;
    const text = renderDocumentText(draft);

    expect(annex.heading).toBe("Annex D — Documents and data relied upon");
    expect(text).toContain("ANNEX D — DOCUMENTS AND DATA RELIED UPON");

    // The table names both documents and states what was and was not read.
    expect(annex.table).toBeDefined();
    const rows = annex.table!.rows;
    expect(rows.map((row) => row[0]).sort()).toEqual(["fiscal-notes.txt", "scanned-return.pdf"]);
    const read = rows.find((row) => row[0] === "fiscal-notes.txt")!;
    const notRead = rows.find((row) => row[0] === "scanned-return.pdf")!;
    expect(read[1]).toBe("Read");
    expect(read[2]).toBe(String(FIN_MATERIAL.length));
    expect(notRead[1]).toBe("Not read — recorded by name");
    expect(notRead[2]).toBe("0");
  });

  it("quotes the department's own wording in the situation analysis, for the priorities it carries", async () => {
    const { department, draft } = await draftFor("fin", documents);
    const situation = draft.sections.find((section) => section.id === "situation-documents")!;
    const bullets = situation.bullets ?? [];

    expect(bullets.length).toBeGreaterThan(0);
    const quoted = bullets.join("\n");
    // The quoted sentence is the material's own, not something the platform wrote.
    expect(quoted).toContain(
      "The fiscal consolidation path holds the deficit within the framework agreed with creditors.",
    );
    expect(quoted).toContain("fiscal-notes.txt");

    // Every priority it claims is really carried by the quoted sentence — no claim without proof.
    bullets.forEach((bullet) => {
      const label = bullet.split(" — ")[0];
      const quote = bullet.split('"')[1] ?? "";
      const terms = priorityTerms(label);
      expect(terms.length, `${label} has no searchable term`).toBeGreaterThan(0);
      expect(
        terms.some((term) => quote.toLowerCase().includes(term)),
        `${label} is claimed but its wording is not in the quote`,
      ).toBe(true);
    });

    // It claims only the priorities the material really carries, not all of them.
    const claimed = bullets.map((bullet) => bullet.split(" — ")[0]);
    expect(claimed).toContain("Fiscal consolidation");
    expect(claimed).toContain("Currency stability");
    expect(claimed).not.toContain("Investment promotion");
    expect(department.priorities.length).toBeGreaterThan(claimed.length);
  });

  it("claims no priority when the material does not carry one", async () => {
    const { draft } = await draftFor("fin", [
      {
        id: "doc-x",
        name: "unrelated.txt",
        text: "A short note about office accommodation and parking arrangements for the coming year.",
      },
    ]);
    const situation = draft.sections.find((section) => section.id === "situation-documents")!;
    expect(situation.bullets).toEqual([
      "No sentence of the supplied material repeats the wording of any of the department's stated priorities, so none is claimed here.",
    ]);
  });

  it("says plainly when no document was supplied, and invites the department to add one", async () => {
    const { draft } = await draftFor("fin");
    const situation = draft.sections.find((section) => section.id === "situation-documents")!;
    const annex = draft.sections.find((section) => section.id === "annex-documents")!;
    const text = renderDocumentText(draft);

    expect(situation.bullets).toBeUndefined();
    expect(situation.paragraphs.join(" ")).toContain("supplied no document of its own");
    expect(annex.table).toBeUndefined();
    expect(annex.paragraphs.join(" ")).toContain("supplied no document of its own");
    // The reader is told how to make the policy rest on more: the Document Library.
    expect(text).toContain("Document Library");
  });

  it("changes the draft when a document is added, and is byte-identical for the same inputs", async () => {
    const without = await draftFor("fin");
    const withDocs = await draftFor("fin", documents);
    expect(renderDocumentText(withDocs.draft)).not.toBe(renderDocumentText(without.draft));

    const again = await draftFor("fin", documents);
    expect(renderDocumentText(again.draft)).toBe(renderDocumentText(withDocs.draft));
  });

  it("resolves every annex it refers to", async () => {
    const { draft } = await draftFor("health", documents);
    const headings = new Set(draft.sections.map((section) => section.heading));
    const referenced = [
      ...new Set([...renderDocumentText(draft).matchAll(/Annex [A-Z]\b/g)].map((match) => match[0])),
    ];

    expect(referenced.length).toBeGreaterThan(2);
    referenced.forEach((reference) =>
      expect(
        [...headings].some((heading) => heading.startsWith(reference)),
        `${reference} is referred to but no such annex exists`,
      ).toBe(true),
    );
  });
});
