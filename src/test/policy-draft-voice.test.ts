import { describe, expect, it } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { DISCLAIMER } from "@/config/brand";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft } from "@/services/assessment/documents";
import type { AssessmentRequest, GeneratedSection } from "@/services/assessment/types";

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

/** The instrument's NARRATIVE voice — its heading, its prose and its bullets. Table cells are
 *  DATA, not narration, and are deliberately not scanned here: a table cell may carry the
 *  platform's own honest data label (for example the AB-5 source label "Modelled — no published
 *  figure, so this is the platform's own modelled figure"), which is a sourcing fact, not the
 *  reporter prose this gate exists to keep out. */
const narrativeText = (section: GeneratedSection): string =>
  [section.heading, ...section.paragraphs, ...(section.bullets ?? [])].join("\n");

/**
 * THE INSTRUMENT'S VOICE — IT READS AS A POLICY, NOT AS A REPORT ABOUT THE ASSESSMENT.
 *
 * The owner raised this twice: the drafted policy read "more like a report that just cites the
 * modelled indicators and stakeholder groups than an actual draft policy". The fix (the real
 * Zimbabwean format, `docs/ZIMBABWE_POLICY_STRUCTURE.md`) has one rule at its centre — the
 * instrument never talks about the examination, the platform or the indicator table; it states
 * what the Department shall do. This gate fails the build if any of those reporter phrases comes
 * back into the instrument's own voice.
 *
 * SCOPE — deliberate and narrow. Two sections are the platform's OWN honesty disclosure, not the
 * instrument's voice, and are correctly allowed to name the platform and the simulated basis:
 *   • `annex-method` (Method and limitations) — it must carry `DISCLAIMER.long` (required by
 *     `npm run validate` check 8) and the sovereignty statement;
 *   • `note` (Note on this draft) — the provenance note, which names the run it came from.
 * The test asserts those two DO carry the disclosure, so the exclusion can never be abused to
 * quietly delete the honesty statements. Every other section is held to the policy voice.
 */
const PLATFORM_DISCLOSURE_SECTIONS = new Set(["annex-method", "note"]);

/** The reporter phrases that must never appear in the instrument's own voice. */
const REPORTER_PHRASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bthe examination\b/i, "the examination"],
  [/\bexamination\b/i, "examination"],
  [/\bthe platform\b/i, "the platform"],
  [/\bsimulation\b/i, "simulation"],
  [/\bthe indicators below are\b/i, "the indicators below are"],
  [/\bsubmitted for examination\b/i, "submitted for examination"],
];

describe("the drafted policy speaks as a policy, not as a report about the assessment", () => {
  it.each(DEPARTMENTS)(
    "keeps every reporter phrase out of the instrument's own voice for $abbr",
    async (department) => {
      const draft = buildPolicyDraft(await runFor(department.id), department);

      draft.sections
        .filter((section) => !PLATFORM_DISCLOSURE_SECTIONS.has(section.id))
        .forEach((section) => {
          const text = narrativeText(section);
          REPORTER_PHRASES.forEach(([pattern, label]) => {
            expect(
              pattern.test(text),
              `${department.abbr} · section "${section.heading}" still carries the reporter phrase "${label}"`,
            ).toBe(false);
          });
        });
    },
  );

  it("still carries the platform's honesty disclosure where it belongs", async () => {
    // The exclusion above is only honest while the disclosure is really present. If it were
    // dropped, these two asserts would fail and the exclusion would no longer be justified.
    const department = findDepartment("energy");
    const draft = buildPolicyDraft(await runFor("energy"), department);
    const method = draft.sections.find((section) => section.id === "annex-method")!;
    const note = draft.sections.find((section) => section.id === "note")!;
    expect(method.paragraphs.join(" ")).toContain(DISCLAIMER.long);
    expect(note.paragraphs.join(" ")).toContain(DISCLAIMER.long);
  });

  it("writes the operative measures as obligations on the Department", async () => {
    // The positive face of the rule: the heart of the instrument is what the Department shall do.
    const department = findDepartment("mines");
    const draft = buildPolicyDraft(await runFor("mines"), department);
    const measures = draft.sections.find((section) => section.id === "measures")!;
    expect(measures.bullets!.some((clause) => clause.startsWith("The Department shall"))).toBe(true);
  });
});
