import { describe, it, expect } from "vitest";
import { findDepartment } from "@/config/departments";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import { buildImplementationPack } from "@/services/assessment/implementationPack";
import { BLANK } from "@/services/assessment/matrices";
import type { AssessmentRequest, GeneratedDocument } from "@/services/assessment/types";

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

const tableWithCaption = (doc: GeneratedDocument, caption: string) =>
  doc.sections.find((section) => section.table?.caption.startsWith(caption))?.table;

/**
 * The Implementation pack — the working companion to the drafted policy.
 *
 * Its whole reason to exist is that the matrices are otherwise buried inside a long instrument. The gate
 * that matters most is therefore the FIRST one: the pack and the policy must print the same matrices, from
 * one source, so a department cannot end up working from a table that disagrees with the policy it came
 * from.
 */
describe("the implementation pack", () => {
  const department = findDepartment("fin")!;
  const run = buildSimulatedRun(requestFor("fin"));
  const pack = buildImplementationPack(run, department);
  const policy = buildPolicyDraft(run, department);

  it("prints the same matrices as the drafted policy — one source, so they cannot disagree", () => {
    ["Table 4", "Table 5", "Table 6", "Table A1", "Table B1"].forEach((caption) => {
      const inPack = tableWithCaption(pack, caption);
      const inPolicy = tableWithCaption(policy, caption);
      expect(inPolicy, `${caption} is missing from the drafted policy`).toBeDefined();
      expect(inPack, `${caption} is missing from the pack`).toEqual(inPolicy);
    });
  });

  it("gathers the working parts and carries no second narrative", () => {
    expect(pack.kind).toBe("implementation-pack");
    expect(pack.sections.map((section) => section.id)).toEqual([
      "pack-purpose",
      "pack-implementation",
      "pack-costs",
      "pack-monitoring",
      "pack-steps",
      "pack-stakeholders",
      "pack-method",
    ]);
  });

  it("leaves the department's own values blank rather than inventing them", () => {
    // The working matrices carry no office, no date and no amount the platform cannot know.
    ["Table 4", "Table 5", "Table 6", "Table A1"].forEach((caption) => {
      const table = tableWithCaption(pack, caption)!;
      const blanks = table.rows.flat().filter((cell) => cell === BLANK);
      expect(blanks.length, `${caption} carries no marked blank`).toBeGreaterThan(0);
    });
  });

  it("says where it comes from, and does not claim to be an adopted policy", () => {
    expect(pack.subtitle).toContain(run.reference);
    const text = renderDocumentText(pack);
    expect(text).toContain("not an adopted policy");
    expect(text).toContain(department.name);
  });

  it("is deterministic — the same run always produces the same pack", () => {
    expect(renderDocumentText(buildImplementationPack(run, department))).toBe(renderDocumentText(pack));
  });
});
