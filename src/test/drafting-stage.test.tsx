import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import {
  DRAFTING_QUERY_PARAM,
  DRAFTING_STEP_MS,
  draftingPathFor,
  draftingStepsFor,
} from "@/components/assessment/draftingStageConfig";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
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

const recordRun = (request: AssessmentRequest) => {
  saveRunRequest(request);
  return buildSimulatedRun(request);
};

/**
 * Owner's item 6, second half — "is there not supposed to be some sort of animation that
 * shows that the AI is drafting the policy based on the assessment?"
 *
 * These tests gate three things: the stage is shown when the officer ARRIVES from "Draft the
 * policy" (and only then), its steps state the run's own real figures, and it is skippable —
 * including automatically for a reader who asked their system for reduced motion.
 */
describe("item 6 — the drafting stage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("states the run's own figures — derived from the run, not invented", () => {
    const run = recordRun(requestFor("fin"));
    const steps = draftingStepsFor(run);

    expect(steps).toHaveLength(4);
    expect(steps[0]).toContain(String(run.reactions.length));
    expect(steps[1]).toContain(String(run.risks.length));
    expect(steps[2]).toContain(String(run.recommendations.length));
    // The same run always produces the same steps — this is content, not decoration.
    expect(draftingStepsFor(run)).toEqual(steps);
  });

  it("shows the stage when the officer arrives from Draft the policy, and the skip reveals it", () => {
    const run = recordRun(requestFor("fin"));
    renderAt(draftingPathFor(run.id));

    expect(screen.getByRole("region", { name: "Drafting the policy" })).toBeInTheDocument();
    // The document is NOT already on screen — that was the owner's complaint.
    expect(screen.queryByRole("button", { name: "Edit draft wording" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show the policy now" }));

    expect(screen.getByRole("button", { name: "Edit draft wording" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Drafting the policy" })).toBeNull();
    // The address is cleaned, so a reload does not replay the stage.
    expect(window.location.search).not.toContain(DRAFTING_QUERY_PARAM);
  });

  it("advances by itself and then hands over to the document", () => {
    vi.useFakeTimers();
    const run = recordRun(requestFor("fin"));
    renderAt(draftingPathFor(run.id));

    const steps = draftingStepsFor(run);
    // One act() flush per tick, the same rule the simulation's own reveal test follows: a
    // single advance only fires the first timer, because the next one is scheduled by the
    // re-render that the first tick causes.
    for (let tick = 0; tick <= steps.length; tick += 1) {
      act(() => {
        vi.advanceTimersByTime(DRAFTING_STEP_MS);
      });
    }

    expect(screen.getByRole("button", { name: "Edit draft wording" })).toBeInTheDocument();
  });

  it("does not show the stage on any other way of reaching the screen", () => {
    const run = recordRun(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);

    expect(screen.queryByRole("region", { name: "Drafting the policy" })).toBeNull();
    expect(screen.getByRole("button", { name: "Edit draft wording" })).toBeInTheDocument();
  });

  it("skips the stage entirely for a reader who asked for reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    try {
      const run = recordRun(requestFor("fin"));
      renderAt(draftingPathFor(run.id));
      expect(screen.queryByRole("region", { name: "Drafting the policy" })).toBeNull();
      expect(screen.getByRole("button", { name: "Edit draft wording" })).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
      cleanup();
    }
  });
});
