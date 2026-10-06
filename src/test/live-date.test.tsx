/**
 * The live date, and the run's own date.
 *
 * Two promises the platform now makes:
 *   1. the display shows the CURRENT date and time, moving while the page is open; and
 *   2. every run, and every document it produces, is dated with the moment the run was
 *      RECORDED — not with a date baked into the build, and not with the clock read again
 *      at export time.
 *
 * The first test drives the display clock with fake timers. The second records a run and
 * reads its own date back out of a document that run produced. Both are written so they
 * genuinely fail if the old fixed-date behaviour comes back.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
import App from "@/App";
import { CLOCK_TICK_MS, formatInstant, useNow } from "@/lib/clock";
import { SCENARIO_ANCHOR_DATE } from "@/config/reference";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { clearRuns, getRunRequest, saveRunRequest } from "@/services/assessment/runStore";
import { assessmentService, buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { buildLongReport, renderDocumentText } from "@/services/assessment/documents";

/** Renders the live moment as a number, so a test can watch it move. */
function ClockProbe() {
  return <span data-testid="clock">{useNow().getTime()}</span>;
}

describe("the live clock", () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("advances on its own timer, so the display keeps moving while the page is open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-10-04T09:15:00.000Z"));

    render(<ClockProbe />);
    const first = Number(screen.getByTestId("clock").textContent);
    expect(Number.isFinite(first)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(CLOCK_TICK_MS);
    });

    const second = Number(screen.getByTestId("clock").textContent);
    expect(second - first).toBe(CLOCK_TICK_MS);
  });
});

describe("a run's own date", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
  });

  afterEach(() => cleanup());

  it("dates a run and the documents it produces with the moment the run was recorded", () => {
    const id = saveRunRequest({
      departmentId: "fin",
      policyText: "A single measure for the pilot.",
      source: "paste",
    });
    const stored = getRunRequest(id);
    expect(stored).toBeDefined();

    // The run carries a real recorded moment, not the platform's fixed reference date.
    expect(stored!.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(stored!.recordedAt).not.toBe(SCENARIO_ANCHOR_DATE);

    // The run built from it reads that same moment, so the run and its documents agree.
    const run = buildSimulatedRun(stored!);
    expect(run.createdAt).toBe(stored!.recordedAt);

    const department = findDepartment("fin")!;
    const text = renderDocumentText(buildLongReport(run, department));
    // The document is dated with the run's own recorded moment...
    expect(text).toContain(formatInstant(run.createdAt));
    // ...which is a real moment, never the fixed reference date.
    expect(formatInstant(run.createdAt)).not.toBe(formatInstant(SCENARIO_ANCHOR_DATE));
  });

  it("shows a run's own recorded moment on the workspace history line, not a frozen date", async () => {
    signInToDepartment("fin");
    const run = await assessmentService.run({
      departmentId: "fin",
      policyText: "A second measure for the pilot.",
      source: "paste",
    });
    // The run handed back carries the moment it was recorded, so the value the page renders and
    // the value a caller sees are the same one.
    expect(run.createdAt).not.toBe(SCENARIO_ANCHOR_DATE);

    window.history.pushState({}, "", "/app");
    render(<App />);
    await screen.findByText(/Simulation History/);
    const line = await screen.findByText(
      (_text, element) =>
        element?.tagName === "SPAN" &&
        (element.textContent ?? "").includes(`recorded ${formatInstant(run.createdAt)}`),
    );
    expect(line).toBeInTheDocument();
  });
});
