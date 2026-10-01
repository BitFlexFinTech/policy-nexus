import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText, sliceDocumentSection } from "@/services/assessment/documents";
import { RECOMMENDATION_IDS } from "@/services/assessment/scenario";
import {
  RECOMMENDATION_TARGETS,
  policyDraftPartPath,
  recommendationTarget,
} from "@/services/assessment/recommendationActions";
import { clearRuns, saveRunRequest } from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

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

/**
 * The owner's recommended-step actions.
 *
 * The research that shaped this found that the platform ALREADY drafts what each step asks for — inside
 * the drafted policy — and that no step said where its answer was. These gates hold the three things
 * that make the buttons honest: every step the engine can produce has a destination, every destination
 * is a real section that exists in the document, and the officer's screen really offers the action.
 */
describe("recommended-step actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("gives every recommendation the engine can produce a destination", () => {
    const missing = RECOMMENDATION_IDS.filter((id) => !(id in RECOMMENDATION_TARGETS));
    expect(missing, "recommendations with no destination (a button that leads nowhere)").toEqual([]);
  });

  it("carries no destination for a recommendation that no longer exists", () => {
    const stale = Object.keys(RECOMMENDATION_TARGETS).filter(
      (id) => !RECOMMENDATION_IDS.includes(id),
    );
    expect(stale, "destinations for recommendations the engine cannot produce").toEqual([]);
  });

  it("points every destination at a section that really exists in the drafted policy", () => {
    const run = buildSimulatedRun(requestFor("fin"));
    const department = findDepartment("fin")!;
    const sectionIds = new Set(buildPolicyDraft(run, department).sections.map((section) => section.id));

    const targets = [...Object.values(RECOMMENDATION_TARGETS), recommendationTarget("unknown-id")];
    const broken = targets
      .map((target) => target.sectionId)
      .filter((sectionId) => !sectionIds.has(sectionId));
    expect(broken, "destinations pointing at a section the document does not have").toEqual([]);
  });

  it("falls back to the annex rather than to nothing, for an unknown step", () => {
    const fallback = recommendationTarget("rec-that-does-not-exist");
    expect(fallback.sectionId).toBe("annex-a");
    expect(fallback.use).not.toBe("");
  });

  it("builds the address that opens the drafted policy at one section", () => {
    expect(policyDraftPartPath("fin-abc123", "implementation")).toBe(
      "/app/assessments/fin-abc123/policy-draft#implementation",
    );
  });

  it("extracts one part as a document of its own, and refuses a part that is not there", () => {
    const run = buildSimulatedRun(requestFor("fin"));
    const department = findDepartment("fin")!;
    const draft = buildPolicyDraft(run, department);

    const part = sliceDocumentSection(draft, "implementation")!;
    expect(part.sections).toHaveLength(1);
    expect(part.sections[0].id).toBe("implementation");
    expect(part.fileStem).toContain("implementation");
    // The exported text carries that part and nothing else.
    const text = renderDocumentText(part);
    expect(text).toContain("Table 4");
    expect(text).not.toContain("Table 6");

    expect(sliceDocumentSection(draft, "no-such-section")).toBeUndefined();
  });

  it("offers the action beside every recommended step on the officer's screen", () => {
    const request = requestFor("fin");
    const run = buildSimulatedRun(request);
    saveRunRequest(request);
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/full`);

    // The panel is found by its own title; `Section` renders that as text, not as a heading, and
    // the title sits directly inside the card, so its parent IS the panel.
    const title = screen.getByText(/^Recommended next steps \(\d+\)$/);
    const card = title.parentElement!;

    const links = within(card).getAllByRole("link", { name: /Open what answers this/ });
    const buttons = within(card).getAllByRole("button", { name: /Download this part \(Word\)/ });

    // One action per step — every step the run produced, none quietly dropped.
    expect(links).toHaveLength(run.recommendations.length);
    expect(buttons).toHaveLength(run.recommendations.length);

    // And each action leads where the mapping says it should, in the run's own order.
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      run.recommendations.map((recommendation) =>
        policyDraftPartPath(run.id, recommendationTarget(recommendation.id).sectionId),
      ),
    );
  });
});
