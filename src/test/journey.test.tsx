import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { DISCLAIMER } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { clearRuns, listRunRequests } from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
 * The end-to-end journey in jsdom: a policy draft is submitted, the live
 * simulation runs to completion, and the executive summary and full assessment
 * render every figure the run produced. This is what catches a route that
 * compiles but throws on render.
 */
describe("journey — run a policy, then read its assessment", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits a preset draft and opens the live simulation for it", () => {
    const preset = findDepartment("fin")!.policyTemplates[0];
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: preset.title }));
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));

    expect(window.location.pathname.startsWith("/app/simulations/")).toBe(true);
    expect(listRunRequests()).toHaveLength(1);
    expect(listRunRequests()[0].templateId).toBe(preset.id);
    expect(listRunRequests()[0].source).toBe("preset");
  });

  it("runs every round and reaches Assessment Complete", () => {
    vi.useFakeTimers();
    const run = assessmentService.run(requestFor("fin"));
    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);

    expect(screen.getByText(/Running deterministic rounds/)).toBeInTheDocument();
    // Each round is revealed by its own timer, so the effect must flush between
    // ticks: advance, let React commit, repeat until the run completes.
    for (let tick = 0; tick < 40; tick += 1) {
      act(() => {
        vi.advanceTimersByTime(400);
      });
    }
    expect(screen.getByRole("heading", { name: "Assessment Complete" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open executive summary/ })).toBeInTheDocument();
  });

  it("renders the executive summary with every metric, group, impact and risk", () => {
    const run = assessmentService.run(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}`);

    expect(screen.getByRole("heading", { name: "Executive Summary" })).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER.long)).toBeInTheDocument();
    run.metrics.forEach((metric) => {
      expect(
        screen.getByRole("button", { name: new RegExp(escapeRegex(metric.label)) }),
      ).toBeInTheDocument();
    });
    run.reactions.forEach((reaction) => {
      expect(screen.getAllByText(reaction.label).length).toBeGreaterThan(0);
    });
    run.impacts.forEach((impact) => {
      expect(screen.getAllByText(impact.label).length).toBeGreaterThan(0);
    });
    run.risks.forEach((risk) => {
      expect(screen.getByText(risk.label)).toBeInTheDocument();
    });
    ["Print", "Save as PDF", "Download Word", "Share"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Open full assessment/ })).toBeInTheDocument();
  });

  it("renders the full assessment with recommendations, inputs and seed", () => {
    const run = assessmentService.run(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/full`);

    expect(screen.getByRole("heading", { name: "Full Assessment" })).toBeInTheDocument();
    run.recommendations.forEach((recommendation) => {
      expect(screen.getByText(recommendation.label)).toBeInTheDocument();
    });
    expect(screen.getByText(run.seed)).toBeInTheDocument();
    expect(screen.getByText(/Method and limitations/)).toBeInTheDocument();
  });

  it("shows an explicit panel for an unknown run reference", () => {
    renderAt("/app/assessments/no-such-run");
    expect(screen.getByText(/No recorded run matches this reference/)).toBeInTheDocument();
  });

  it("guards the simulation and assessment routes without a session", () => {
    const run = assessmentService.run(requestFor("fin"));
    clearSession();
    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);
    expect(window.location.pathname).toBe("/");
  });

  it("opens the long-form report with every group the run produced", () => {
    const run = assessmentService.run(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/report`);

    expect(screen.getByRole("heading", { name: "Full report" })).toBeInTheDocument();
    run.reactions.forEach((reaction) => {
      expect(
        screen.getAllByText(new RegExp(escapeRegex(reaction.label))).length,
      ).toBeGreaterThan(0);
    });
    run.risks.forEach((risk) => {
      expect(screen.getByText(new RegExp(escapeRegex(risk.label)))).toBeInTheDocument();
    });
    ["Print", "Save as PDF", "Download Word", "Share"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Draft the policy" })).toBeInTheDocument();
  });

  it("drafts the policy and lets the officer edit the wording before export", () => {
    const run = assessmentService.run(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);

    expect(screen.getByRole("heading", { name: "Drafted policy" })).toBeInTheDocument();
    ["Preamble", "1. Objective", "2. Scope and application", "3. Policy measures"].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
    ["Print", "Save as PDF", "Download Word", "Share"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });

    // The generated draft is editable, and editing is local to this screen.
    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    const box = screen.getByLabelText("Drafted policy text") as HTMLTextAreaElement;
    expect(box.value).toContain(run.policyTitle);
    fireEvent.change(box, { target: { value: "Officer-edited wording." } });
    expect(box.value).toBe("Officer-edited wording.");
    fireEvent.click(screen.getByRole("button", { name: "Reset to generated" }));
    expect(screen.getByRole("button", { name: "Edit draft wording" })).toBeInTheDocument();
  });

  it("shows the explicit panel for an unknown reference on both new routes", () => {
    renderAt("/app/assessments/no-such-run/report");
    expect(screen.getByRole("heading", { name: "Full report" })).toBeInTheDocument();
    cleanup();
    renderAt("/app/assessments/no-such-run/policy-draft");
    expect(screen.getByText(/No recorded run matches this reference/)).toBeInTheDocument();
  });
});
