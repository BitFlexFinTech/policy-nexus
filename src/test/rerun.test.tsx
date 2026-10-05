import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { peekRun } from "@/services/assessment/AssessmentService";
import { DEFAULT_LEVERS } from "@/services/assessment/levers";
import {
  RERUN_LABEL,
  RERUN_QUERY_PARAM,
  rerunInputsFrom,
  rerunPathFor,
} from "@/services/assessment/rerun";
import {
  clearRuns,
  getRunRequest,
  listRunRequestsFor,
  saveRunRequest,
} from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";
import { pressRunSimulation } from "@/test/support/runSimulation";

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
 * Owner's item 6 — "Re-run simulation". The action returns the officer to the policy
 * input with a recorded run's own inputs already in place, so they edit and press Run
 * rather than retyping.
 *
 * These tests pin the two things that make it real rather than a link that points at a
 * screen which ignores it: the inputs come straight from the run register (so they can
 * never drift from what the run was made from), and re-running unchanged inputs records
 * the SAME run rather than adding a duplicate row.
 */
describe("item 6 — a recorded run's inputs load back into the policy input", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("reads a recorded run's own inputs — and fills the neutral assumptions in", () => {
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      levers: {
        funding: "new-appropriation",
        capacity: "needs-support",
        enforcement: "advisory",
        phaseInMonths: 12,
      },
    };
    saveRunRequest(request);
    const stored = getRunRequest(listRunRequestsFor("fin")[0].id)!;

    const inputs = rerunInputsFrom(stored.id)!;
    expect(inputs.policyText).toBe(request.policyText);
    expect(inputs.templateId).toBe(request.templateId);
    expect(inputs.timeHorizon).toBe(request.timeHorizon);
    expect(inputs.fileNames).toEqual([]);
    // The assumptions come back exactly as the run was made with them.
    expect(inputs.levers).toEqual(request.levers);

    // A run stored with no assumptions still loads a complete, neutral setting.
    const plainRequest: AssessmentRequest = {
      departmentId: "fin",
      policyText: "A plain draft with no assumptions recorded.",
      source: "paste",
    };
    saveRunRequest(plainRequest);
    const plainId = listRunRequestsFor("fin")[0].id;
    expect(rerunInputsFrom(plainId)!.levers).toEqual(DEFAULT_LEVERS);

    // A run that is no longer recorded loads nothing rather than pretending.
    expect(rerunInputsFrom("fin-not-recorded")).toBeUndefined();
  });

  it("loads the inputs into the screen when ?rerun names a recorded run", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const runId = listRunRequestsFor("fin")[0].id;
    const reference = peekRun(runId)!.reference;

    renderAt(rerunPathFor(runId));

    expect(screen.getByPlaceholderText(/Draft the policy text/)).toHaveValue(request.policyText);
    const note = screen.getByText(/Loaded the inputs of/);
    expect(note).toBeInTheDocument();
    expect(note.textContent).toContain(reference);
    // The address is cleaned up again, exactly as ?draft is, so a reload cannot clobber edits.
    expect(window.location.search).not.toContain(RERUN_QUERY_PARAM);
  });

  it("running unchanged inputs records the same run — never a second row", async () => {
    const wording = "A draft used to prove a re-run does not duplicate the register.";

    renderAt("/app");
    fireEvent.change(screen.getByPlaceholderText(/Draft the policy text/), {
      target: { value: wording },
    });
    pressRunSimulation();
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));

    const recorded = listRunRequestsFor("fin");
    expect(recorded).toHaveLength(1);
    const runId = recorded[0].id;

    // Go back through the re-run action and run the same wording again.
    cleanup();
    renderAt(rerunPathFor(runId));
    expect(screen.getByPlaceholderText(/Draft the policy text/)).toHaveValue(wording);
    pressRunSimulation();
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));

    const after = listRunRequestsFor("fin");
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(runId);
  });

  it("offers the one action on the finished run, the register row and the documents", () => {
    const run = { ...requestFor("fin") };
    saveRunRequest(run);
    const runId = listRunRequestsFor("fin")[0].id;

    // The four document screens share one strip, so the executive summary proves the strip.
    cleanup();
    renderAt(`/app/assessments/${encodeURIComponent(runId)}`);
    const onDocuments = screen.getByRole("link", { name: RERUN_LABEL });
    expect(onDocuments).toHaveAttribute("href", rerunPathFor(runId));

    // The Simulation Register carries it on the completed run's row.
    cleanup();
    renderAt("/app/simulations");
    expect(screen.getByRole("link", { name: RERUN_LABEL })).toHaveAttribute(
      "href",
      rerunPathFor(runId),
    );
  });
});
