import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { CITATIONS_ANNEX } from "@/services/assessment/documentStructure";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun, peekRun } from "@/services/assessment/AssessmentService";
import { clearRuns, listRunRequests, saveRunRequest } from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";
import { formatInstant } from "@/lib/clock";
import { REFERENCE_DATE } from "@/config/reference";
import { RUN_ROUND_TICK_MS } from "@/pages/SimulationRun";
import { DOCUMENT_VIEWS } from "@/components/assessment/documentViews";
import { RERUN_LABEL, rerunPathFor } from "@/services/assessment/rerun";
import { pressRunSimulation } from "@/test/support/runSimulation";

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
 * Record a run and return it, in one synchronous step — exactly what the
 * simulated engine does for the workspace. The demo path is synchronous by
 * design, and this suite drives it with fake timers, so the tests must not await.
 */
const recordRun = (request: AssessmentRequest) => {
  saveRunRequest(request);
  return buildSimulatedRun(request);
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

  it("submits a preset draft and opens the live simulation for it", async () => {
    const preset = findDepartment("fin")!.policyTemplates[0];
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: preset.title }));
    pressRunSimulation();

    // The seam answers in a microtask, so the address changes a moment later.
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));
    expect(listRunRequests()).toHaveLength(1);
    expect(listRunRequests()[0].templateId).toBe(preset.id);
    expect(listRunRequests()[0].source).toBe("preset");
  });

  it("runs every round and reaches Assessment Complete", () => {
    vi.useFakeTimers();
    const run = recordRun(requestFor("fin"));
    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);

    expect(screen.getByText(/Running deterministic rounds/)).toBeInTheDocument();
    // Each round is revealed by its own timer, so the effect must flush between
    // ticks: advance by exactly one round's pacing, let React commit, repeat.
    //
    // Both the step and the count are DERIVED from the pacing constant and the
    // run's own round count rather than hardcoded. The reveal is deliberately
    // slow — the run has to be long enough for the relationship graph to grow
    // with it — so a fixed number of ticks would silently stop short the day the
    // pacing changes.
    for (let tick = 0; tick < run.rounds.length + 1; tick += 1) {
      act(() => {
        vi.advanceTimersByTime(RUN_ROUND_TICK_MS);
      });
    }
    expect(
      screen.getByText(`${run.rounds.length} / ${run.rounds.length} rounds`),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assessment Complete" })).toBeInTheDocument();
    // The run page is dated with the run's OWN recorded moment (the instant Run Simulation was
    // pressed), never a date frozen into the build. `peekRun` re-reads the stored run, so this is
    // exactly the value the page rendered.
    const recorded = peekRun(run.id)!;
    expect(recorded.createdAt).not.toBe(REFERENCE_DATE);
    expect(screen.getByText(`Recorded ${formatInstant(recorded.createdAt)}`)).toBeInTheDocument();
    // The owner's instruction (2026-10-02): the five actions appear at the TOP of the run page
    // as well as at the bottom. Two matches is the proof that both rows render.
    expect(screen.getAllByRole("link", { name: /Open executive summary/ })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Re-run simulation" })).toHaveLength(2);
  });

  it("renders the executive summary with every metric, group, impact and risk", () => {
    const run = recordRun(requestFor("fin"));
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
    const run = recordRun(requestFor("fin"));
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

  it("guards the simulation and assessment routes without a session, sending the user to the chooser", () => {
    const run = recordRun(requestFor("fin"));
    clearSession();
    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);
    expect(window.location.pathname).toBe("/start");
  });

  it("opens the long-form report with every group the run produced", () => {
    const run = recordRun(requestFor("fin"));
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
    const run = recordRun(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);

    expect(screen.getByRole("heading", { name: "Drafted policy" })).toBeInTheDocument();
    [
      "Republic of Zimbabwe",
      "Table of contents",
      "4. Legal and institutional framework",
      "5. Policy measures",
      "10. Monitoring, evaluation and review",
    ].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
    // AB-4: the draft states the instruments it rests on, and where it came from. The
    // citations clause is Annex C now that the document follows the Zimbabwean order.
    expect(
      screen.getByRole("heading", { name: "Annex C — Instruments relied on" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public Finance Management Act \[Chapter 22:19\]/),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Provenance" })).toBeInTheDocument();
    expect(screen.getByText("Produced by")).toBeInTheDocument();
    // The provenance row names the producer exactly; the notice above says it in a sentence.
    expect(screen.getByText(`The ${VOCABULARY.simulationCore} (Mock)`)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`listed in ${CITATIONS_ANNEX} — every one checked against the instrument table`),
      ),
    ).toBeInTheDocument();
    // GATE — the engine's starting code must not appear on an officer's screen either. It is
    // built from the whole submitted policy text, so the provenance "Seed" row used to print the
    // officer's entire draft as one long machine string underneath the run reference that
    // already identifies the run. The raw code stays on the internal "exact inputs" record.
    expect(screen.queryByText("Seed")).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(run.seed);
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

  it("carries the one shared document strip on every screen of a run", () => {
    const run = recordRun(requestFor("fin"));
    const screens: ReadonlyArray<{ path: string; current: string }> = [
      { path: `/app/assessments/${encodeURIComponent(run.id)}`, current: "Executive summary" },
      { path: `/app/assessments/${encodeURIComponent(run.id)}/full`, current: "Full assessment" },
      { path: `/app/assessments/${encodeURIComponent(run.id)}/report`, current: "Full report" },
      {
        path: `/app/assessments/${encodeURIComponent(run.id)}/policy-draft`,
        current: "Drafted policy",
      },
      {
        path: `/app/assessments/${encodeURIComponent(run.id)}/implementation-pack`,
        current: "Implementation pack",
      },
    ];

    screens.forEach(({ path, current }) => {
      cleanup();
      renderAt(path);

      const strip = screen.getByRole("navigation", { name: "Documents in this run" });
      // The destinations are defined once and every screen offers all of them: the document
      // views, the ONE "Re-run simulation" action (which goes back to the policy input rather
      // than to a document), and — since the owner's instruction on 2026-10-02 — the ONE
      // "← Back" control, which always returns to the Overview. A screen that loses the back
      // control fails here.
      expect(within(strip).getAllByRole("link")).toHaveLength(DOCUMENT_VIEWS.length + 2);
      expect(
        within(strip).getByRole("link", { name: "Back" }),
        "every screen of a run carries the back control",
      ).toHaveAttribute("href", "/app");
      expect(within(strip).getByRole("link", { name: RERUN_LABEL })).toHaveAttribute(
        "href",
        rerunPathFor(run.id),
      );
      DOCUMENT_VIEWS.forEach((view) => {
        const link = within(strip).getByRole("link", { name: view.label });
        expect(link).toHaveAttribute("href");
        if (view.label === current) {
          // The screen you are on is announced, not marked by colour alone.
          expect(link).toHaveAttribute("aria-current", "page");
        } else {
          expect(link).not.toHaveAttribute("aria-current");
        }
      });

      // And it is the ONLY copy: no screen repeats these destinations further down.
      expect(screen.getAllByRole("link", { name: "Drafted policy" })).toHaveLength(1);
      expect(screen.getAllByRole("link", { name: "Full report" })).toHaveLength(1);
    });
  });

  it("carries the back control on the run page and the register, and it always goes to the Overview", () => {
    const run = recordRun(requestFor("fin"));
    renderAt(`/app/simulations/${encodeURIComponent(run.id)}`);
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/app");
    cleanup();
    renderAt("/app/simulations");
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/app");
  });

  it("shows the explicit panel for an unknown reference on both new routes", () => {
    renderAt("/app/assessments/no-such-run/report");
    expect(screen.getByRole("heading", { name: "Full report" })).toBeInTheDocument();
    cleanup();
    renderAt("/app/assessments/no-such-run/policy-draft");
    expect(screen.getByText(/No recorded run matches this reference/)).toBeInTheDocument();
  });
});
