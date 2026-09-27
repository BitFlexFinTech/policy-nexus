import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { clearRuns, saveRunRequest } from "@/services/assessment/runStore";
import { clearSession, signInToDepartment } from "@/session/session";
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
 * THE PROMISE MADE TO THE OWNER: teaching the seams to wait must not change what
 * the demo looks like.
 *
 * While nothing is configured the simulated engine answers in the same render, so
 * the FIRST paint already holds the result and the "waiting" panel is never
 * shown. Every assertion below is synchronous on purpose — no `findBy`, no
 * `await` — because a synchronous read is the only way to prove there was no
 * intermediate frame with a spinner in it.
 */
describe("the simulated platform renders without waiting", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("has the executive summary on the first paint, and no waiting panel", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}`);

    expect(screen.getByRole("heading", { name: "Executive Summary" })).toBeInTheDocument();
    expect(screen.getByText(run.summary)).toBeInTheDocument();
    expect(screen.queryByText(/Asking the configured service/)).toBeNull();
  });

  it("has the full assessment on the first paint", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/full`);

    expect(screen.getByRole("heading", { name: "Full Assessment" })).toBeInTheDocument();
    expect(screen.queryByText(/Asking the configured service/)).toBeNull();
  });

  it("has the simulation run view on the first paint", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);

    expect(screen.getByText(new RegExp(run.reference))).toBeInTheDocument();
    expect(screen.queryByText(/Asking the configured service/)).toBeNull();
  });

  it("has the generated report on the first paint", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/report`);

    expect(screen.getByRole("heading", { name: "Full report" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Purpose and scope of this report" })).toBeInTheDocument();
    expect(screen.queryByText(/Asking the configured service/)).toBeNull();
  });

  it("has the drafted policy on the first paint", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);

    expect(screen.getByRole("heading", { name: "Drafted policy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preamble" })).toBeInTheDocument();
    expect(screen.queryByText(/Asking the configured service/)).toBeNull();
  });

  it("has the workspace register populated on the first paint", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt("/app");

    expect(screen.getAllByText(run.reference).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Run Simulation" })).toBeInTheDocument();
  });
});
