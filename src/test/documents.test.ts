import { describe, it, expect } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { DISCLAIMER } from "@/config/brand";
import { assessmentService } from "@/services/assessment/AssessmentService";
import {
  buildLongReport,
  buildPolicyDraft,
  renderDocumentText,
} from "@/services/assessment/documents";
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

const flat = (value: string) => value.replace(/\s+/g, " ");

/**
 * The two generated documents — the long-form report and the drafted policy.
 * These are genuine, failable guards: the same run must always produce
 * byte-identical documents, and each document must actually account for every
 * modelled group, priority, risk and recommendation the run produced — not merely
 * render without throwing.
 */
describe("generated documents — the long-form report", () => {
  it("is byte-identical for the same run", async () => {
    const run = await runFor("fin");
    const department = findDepartment("fin")!;
    expect(JSON.stringify(buildLongReport(run, department))).toBe(
      JSON.stringify(buildLongReport(run, department)),
    );
  });

  it("accounts for every group, priority, risk and recommendation in the run", async () => {
    const run = await runFor("fin");
    const report = buildLongReport(run, findDepartment("fin")!);
    const text = renderDocumentText(report);

    expect(report.kind).toBe("report");
    run.reactions.forEach((reaction) => expect(text).toContain(reaction.label));
    run.impacts.forEach((impact) => expect(text).toContain(impact.label));
    run.risks.forEach((risk) => expect(text).toContain(risk.label));
    run.recommendations.forEach((item) => expect(text).toContain(item.label));
    expect(text).toContain(run.policyText);
    expect(text).toContain(DISCLAIMER.long);
    // The report states the reproducibility guarantee and names the inputs — but it must NOT
    // print the engine's starting code, which is built from the whole submitted draft. This
    // assertion used to require the code to be present, which is the opposite of correct.
    expect(text).toContain(`Horizon — ${run.horizonLabel}`);
    expect(text).not.toContain(run.seed);
  });

  it("gives every section a heading and at least one paragraph", async () => {
    const report = buildLongReport(await runFor("agri"), findDepartment("agri")!);
    report.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.paragraphs.length).toBeGreaterThan(0);
    });
  });

  it.each(DEPARTMENTS)("renders a report for $abbr", async (department) => {
    const report = buildLongReport(
      await assessmentService.buildRun(requestFor(department.id)),
      department,
    );
    const text = renderDocumentText(report);
    expect(report.sections.length).toBeGreaterThanOrEqual(8);
    expect(text).toContain(department.shortName);
    expect(text.length).toBeGreaterThan(2000);
  });

  it("differs between departments rather than emitting one generic document", async () => {
    const fin = renderDocumentText(buildLongReport(await runFor("fin"), findDepartment("fin")!));
    const env = renderDocumentText(buildLongReport(await runFor("env"), findDepartment("env")!));
    expect(fin).not.toBe(env);
  });
});

describe("generated documents — the drafted policy", () => {
  it("is byte-identical for the same run", async () => {
    const run = await runFor("health");
    const department = findDepartment("health")!;
    expect(JSON.stringify(buildPolicyDraft(run, department))).toBe(
      JSON.stringify(buildPolicyDraft(run, department)),
    );
  });

  it("turns the submitted draft into operative measures and keeps the findings", async () => {
    const run = await runFor("health");
    const department = findDepartment("health")!;
    const draft = buildPolicyDraft(run, department);
    const text = renderDocumentText(draft);

    expect(draft.kind).toBe("policy-draft");

    // The substance of the submitted draft is embedded, sentence by sentence.
    const measures = draft.sections.find((section) => section.id === "measures")!;
    expect(measures.bullets && measures.bullets.length).toBeGreaterThan(0);
    measures.bullets!.forEach((clause) => expect(flat(run.policyText)).toContain(clause));

    // ...and the simulation's findings become provisions.
    run.risks.forEach((risk) => expect(text).toContain(risk.label));
    department.priorities.forEach((priority) => expect(text).toContain(priority.label));
    department.indicators.forEach((indicator) => expect(text).toContain(indicator.label));
    expect(text).toContain(department.mandate);
    expect(text).toContain(DISCLAIMER.long);
  });

  it("numbers clause lists when rendered as text", async () => {
    const draft = buildPolicyDraft(await runFor("mines"), findDepartment("mines")!);
    const text = renderDocumentText(draft);
    expect(text).toMatch(/^1\. /m);
    expect(text).toMatch(/^2\. /m);
  });

  it("produces a different draft when the policy text actually changes", async () => {
    const department = findDepartment("mines")!;
    const base = await runFor("mines");
    const changed = await assessmentService.buildRun({
      ...requestFor("mines"),
      policyText: "A short alternative draft with one measure.",
    });
    expect(renderDocumentText(buildPolicyDraft(changed, department))).not.toBe(
      renderDocumentText(buildPolicyDraft(base, department)),
    );
  });

  it.each(DEPARTMENTS)("drafts a complete instrument for $abbr", async (department) => {
    const draft = buildPolicyDraft(
      await assessmentService.buildRun(requestFor(department.id)),
      department,
    );
    const ids = draft.sections.map((section) => section.id);
    // The backbone of the instrument. The full Zimbabwean structure — every part in order,
    // the length floor, the contents, the acronym list and the matrices — is gated in
    // src/test/policy-document.test.ts.
    [
      "cover",
      "contents",
      "foreword",
      "executive-summary",
      "situation-analysis",
      "measures",
      "legal",
      "implementation",
      "monitoring",
      "citations",
      "annex-e",
      "note",
    ].forEach((id) => expect(ids).toContain(id));
    expect(renderDocumentText(draft).length).toBeGreaterThan(20000);
  });
});

/**
 * GATE — the engine's starting code must never appear in a generated document.
 *
 * That code is built from the whole submitted policy text (department :: the entire draft ::
 * preset :: horizon :: assumptions). It was printed once in Annex D of the drafted policy and
 * once in the report's run-inputs list, which reprinted an officer's own draft as a single long
 * machine string inside a document that could be handed to a Minister. This guard fails if it
 * ever comes back, for every department rather than one sample.
 */
describe("generated documents — the engine's starting code is never printed", () => {
  it("prints neither the seed nor a seed label, for any department", async () => {
    for (const department of DEPARTMENTS) {
      const run = await runFor(department.id);
      // Without this the assertions below could pass on a run that has no seed at all.
      expect(run.seed.length).toBeGreaterThan(20);
      const report = renderDocumentText(buildLongReport(run, department));
      const draft = renderDocumentText(buildPolicyDraft(run, department));
      for (const text of [report, draft]) {
        expect(text).not.toContain(run.seed);
        // The label form (\"Seed:\" / \"Seed —\") is what the documents printed; the bare word
        // \"seed\" is legitimate English in an agriculture draft, so it is not what is checked.
        expect(text).not.toMatch(/seed\s*[:—]/i);
      }
    }
  });
});
