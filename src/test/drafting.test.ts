import { describe, expect, it } from "vitest";
import { DEPARTMENTS, findDepartment, getDepartment, type Department } from "@/config/departments";
import { citedInstrumentLabel } from "@/config/instruments";
import { POLICY_DRAFT_STRUCTURE, draftingPromptFor } from "@/config/draftingPrompts";
import { MODELLED_SHARE_LABEL, getStakeholderSegment } from "@/config/reference";
import { buildPolicyDraft } from "@/services/assessment/documents";
import { assessmentService } from "@/services/assessment/AssessmentService";
import {
  assertCitationsVerified,
  buildDraftingGrounding,
  buildDraftingProvenance,
  citationsSectionFor,
  isCitationVerified,
  provenanceParagraphs,
  verifyDocumentCitations,
} from "@/services/documents/drafting";
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
 * AB-4 — the drafting concern. These are genuine, failable gates: the prompt library
 * must be DERIVED from the department's own configuration (never a hand-written copy
 * that can drift), the grounding must be deterministic and complete, and no drafted
 * policy may name an instrument the department's register does not hold.
 */
describe("AB-4 — the department prompt library", () => {
  it("gives every one of the 16 departments a prompt, derived from its own register", () => {
    expect(DEPARTMENTS).toHaveLength(16);
    DEPARTMENTS.forEach((department) => {
      const prompt = draftingPromptFor(department);
      expect(prompt.departmentId).toBe(department.id);
      // The citation list IS the register, in order — derived, so it cannot drift.
      expect(prompt.citations).toEqual(department.instruments.map((id) => citedInstrumentLabel(id)));
      expect(prompt.structure).toEqual(POLICY_DRAFT_STRUCTURE);
      expect(prompt.instructions).toContain(department.name);
      expect(prompt.instructions).toContain(department.mandate);
      department.priorities.forEach((priority) =>
        expect(prompt.instructions).toContain(priority.label),
      );
    });
  });

  it("states each modelled group's share, and the modelled word where there is none", () => {
    const department = getDepartment("fin");
    const prompt = draftingPromptFor(department);
    department.segments.forEach((id) => {
      const segment = getStakeholderSegment(id);
      expect(prompt.instructions).toContain(segment.label);
      if (segment.share === null) {
        expect(prompt.instructions).toContain(`${segment.label} (share: ${MODELLED_SHARE_LABEL})`);
      } else {
        expect(prompt.instructions).toContain(`${segment.share}% of ${segment.shareBase}`);
      }
    });
  });

  it("asks for exactly the sections the local generator produces", async () => {
    // If these ever diverge, the local generator would be answering a different prompt
    // than a configured service is given — which is the whole point of the seam.
    const department = getDepartment("agri");
    const draft = buildPolicyDraft(await runFor("agri"), department);
    expect(draft.sections.map((section) => section.heading)).toEqual([...POLICY_DRAFT_STRUCTURE]);
  });
});

describe("AB-4 — grounding", () => {
  it("is deterministic and carries every group with its share and source", async () => {
    const department = getDepartment("health");
    const run = await runFor("health");
    const a = buildDraftingGrounding(run, department);
    const b = buildDraftingGrounding(run, department);
    // Deep-equal: same inputs give byte-identical grounding, so mock and service agree.
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));

    expect(a.groups).toHaveLength(department.segments.length);
    a.groups.forEach((group, index) => {
      const segment = getStakeholderSegment(department.segments[index]);
      expect(group.label).toBe(segment.label);
      expect(group.source).toBe(segment.shareSource);
      if (segment.share === null) expect(group.share).toBe(MODELLED_SHARE_LABEL);
      else expect(group.share).toBe(`${segment.share}% of ${segment.shareBase}`);
    });

    // The instruments are exactly the register, read out of the table.
    expect(a.instruments.map((instrument) => instrument.citation)).toEqual(
      department.instruments.map((id) => citedInstrumentLabel(id)),
    );
    expect(a.indicators).toEqual(department.indicators);
    expect(a.reference).toBe(run.reference);
    expect(a.seed).toBe(run.seed);
    expect(a.prompt).toEqual(draftingPromptFor(department));
  });
});

describe("AB-4 — citation verification", () => {
  it("verifies every drafted policy for all 16 departments, and lists exactly the register", async () => {
    for (const department of DEPARTMENTS) {
      const draft = buildPolicyDraft(await runFor(department.id), department);
      const verification = verifyDocumentCitations(draft, department);
      expect(isCitationVerified(verification), department.id).toBe(true);
      expect(verification.citations, department.id).toEqual(
        department.instruments.map((id) => citedInstrumentLabel(id)),
      );
      expect(verification.unknown, department.id).toEqual([]);
      expect(verification.outsideRegister, department.id).toEqual([]);
      expect(verification.strayChapters, department.id).toEqual([]);
    }
  });

  it("rejects a document that names an instrument nothing in the register holds", () => {
    const department = getDepartment("fin");
    const rogue = {
      kind: "policy-draft" as const,
      title: "Rogue",
      subtitle: "Rogue",
      fileStem: "rogue",
      sections: [
        citationsSectionFor(department),
        {
          id: "measures",
          heading: "3. Policy measures",
          paragraphs: ["The department shall act under the Ministry of Magic Act [Chapter 99:99]."],
        },
      ],
    };
    const verification = verifyDocumentCitations(rogue, department);
    expect(verification.strayChapters).toContain("[Chapter 99:99]");
    expect(isCitationVerified(verification)).toBe(false);
    expect(() => assertCitationsVerified(rogue, department)).toThrow(/unverified citations/);
  });

  it("catches an instrument borrowed from another department's register", () => {
    // 'zimra' holds the Value Added Tax Act; 'fin' does not.
    const fin = getDepartment("fin");
    expect(fin.instruments).not.toContain("vat-act");
    const borrowed = {
      kind: "policy-draft" as const,
      title: "Borrowed",
      subtitle: "Borrowed",
      fileStem: "borrowed",
      sections: [
        citationsSectionFor(fin),
        {
          id: "measures",
          heading: "3. Policy measures",
          paragraphs: ["The department shall apply the Value Added Tax Act [Chapter 23:12]."],
        },
      ],
    };
    const verification = verifyDocumentCitations(borrowed, fin);
    expect(verification.outsideRegister).toContain(citedInstrumentLabel("vat-act"));
    expect(isCitationVerified(verification)).toBe(false);
  });

  it("does not mistake a shorter title for one contained inside a longer one", () => {
    // The table holds both the plain Constitution and a longer "…, ss. 202–203" entry, and
    // the plain title is a SUBSTRING of the longer one. A register holding only the longer
    // entry must not have the shorter one reported as borrowed — which is exactly what a
    // naive substring scan does. (No real register hits this today: every department carries
    // the plain Constitution through UNIVERSAL_INSTRUMENTS. This pins the safeguard.)
    const plain = citedInstrumentLabel("constitution-2013");
    const register: Department = {
      ...getDepartment("psc"),
      instruments: ["constitution-s202-203"],
    };
    const longer = citedInstrumentLabel("constitution-s202-203");
    expect(longer).toContain(plain); // the collision is real, not hypothetical

    const verification = verifyDocumentCitations(
      {
        kind: "policy-draft",
        title: "t",
        subtitle: "s",
        fileStem: "f",
        sections: [citationsSectionFor(register)],
      },
      register,
    );
    expect(verification.citations).toEqual([longer]);
    expect(verification.outsideRegister).toEqual([]);
    expect(isCitationVerified(verification)).toBe(true);
  });
});

describe("AB-4 — provenance", () => {
  it("records the local generator honestly, and names the model when a service produced it", async () => {
    const department = getDepartment("mines");
    const run = await runFor("mines");
    const draft = buildPolicyDraft(run, department);
    const verification = verifyDocumentCitations(draft, department);

    const local = buildDraftingProvenance(run, department, verification);
    expect(local.producer).toBe("local-generator");
    expect(local.model).toBeNull();
    expect(local.citationsVerified).toBe(true);
    expect(local.instrumentsCited).toBe(department.instruments.length);
    expect(local.groupsModelled).toBe(department.segments.length);

    const remote = buildDraftingProvenance(run, department, verification, {
      producer: "configured-service",
      model: "model-1",
    });
    expect(remote.producer).toBe("configured-service");
    expect(remote.model).toBe("model-1");
  });

  it("writes the provenance into the draft's own closing note", async () => {
    const department = getDepartment("zida");
    const run = await runFor("zida");
    const draft = buildPolicyDraft(run, department);
    const verification = verifyDocumentCitations(draft, department);
    const note = draft.sections.find((section) => section.id === "note")!;
    provenanceParagraphs(run, department, verification).forEach((paragraph) => {
      expect(note.paragraphs).toContain(paragraph);
    });
    // The note names the run it came from; it must not print the engine's starting code, which
    // contains the whole submitted draft.
    expect(note.paragraphs.join(" ")).toContain(run.reference);
    expect(note.paragraphs.join(" ")).not.toContain(run.seed);
    expect(note.paragraphs.join(" ")).toContain("check");
  });
});
