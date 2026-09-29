import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import {
  RUNS_STORAGE_KEY,
  clearRuns,
  getRunRequest,
  listRunRequests,
  saveRunRequest,
} from "@/services/assessment/runStore";
import { runIdFor, seedForRequest } from "@/services/assessment/seed";
import {
  MAX_REVISION_DEPTH,
  revisionNumber,
  revisionParent,
  revisionRequestFromRun,
} from "@/services/assessment/revision";
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
 * Batch A item 6 — the drafting stage. The drafted policy can be taken back through the
 * simulation, and the run that comes out is the department's NEXT VERSION of that policy.
 *
 * The version number is derived from the run's own lineage (`revisionOf`), never stored
 * beside the run, so a screen cannot claim a version the register disagrees with. These
 * tests gate the derivation, the request that creates the next version, and the labels
 * the officer sees — and they pin a first run's identity, so the lineage segment added to
 * the seed cannot quietly renumber every run already recorded in a browser.
 */
describe("versions of a department's policy", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("calls a first run version 1 and every re-run one higher", () => {
    const first = recordRun(requestFor("fin"));
    expect(revisionNumber(first.id)).toBe(1);
    expect(revisionParent(first.id)).toBeUndefined();

    const secondRequest = revisionRequestFromRun(first.id, "Wording for the second version.")!;
    saveRunRequest(secondRequest);
    const secondId = runIdFor(secondRequest);
    expect(revisionNumber(secondId)).toBe(2);
    expect(revisionParent(secondId)).toBe(first.id);

    const thirdRequest = revisionRequestFromRun(secondId, "Wording for the third version.")!;
    saveRunRequest(thirdRequest);
    expect(revisionNumber(runIdFor(thirdRequest))).toBe(3);

    // An unknown run is version 1 rather than a crash.
    expect(revisionNumber("fin-not-recorded")).toBe(1);
  });

  it("carries the wording, the horizon and the assumptions into the next version", () => {
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      fileNames: ["submitted-policy.txt"],
      levers: {
        funding: "new-appropriation",
        capacity: "needs-support",
        enforcement: "strict",
        phaseInMonths: 12,
      },
    };
    const first = recordRun(request);
    const stored = getRunRequest(first.id)!;

    const next = revisionRequestFromRun(first.id, "The officer's own wording.")!;

    expect(next.policyText).toBe("The officer's own wording.");
    expect(next.source).toBe("draft");
    expect(next.revisionOf).toBe(first.id);
    expect(next.timeHorizon).toBe(stored.timeHorizon);
    expect(next.levers).toEqual(stored.levers);
    // The next version's input is the drafted policy itself, so an uploaded file name is
    // not carried over as if that file had been read again.
    expect(next.fileNames).toBeUndefined();
    expect(next.templateId).toBeUndefined();
  });

  it("reproduces the same next version from the same wording, and never replaces the run it came from", () => {
    const first = recordRun(requestFor("fin"));
    const a = revisionRequestFromRun(first.id, "Identical wording.")!;
    const b = revisionRequestFromRun(first.id, "Identical wording.")!;

    // Same inputs, same result — the platform's determinism promise, kept across versions.
    expect(runIdFor(a)).toBe(runIdFor(b));
    // And a re-run is a different run from the one it came from.
    expect(runIdFor(a)).not.toBe(first.id);
    // The lineage is a real input, so it is in the seed; a first run has none.
    expect(seedForRequest(a)).toContain(`revision-of:${first.id}`);
    expect(seedForRequest(requestFor("fin"))).not.toContain("revision-of");
  });

  it("leaves a first run's identity exactly as it was before versions existed", () => {
    // Pinned on purpose: every run already recorded in an officer's browser must keep
    // resolving to the same run, so the lineage segment may only appear on a re-run.
    const request: AssessmentRequest = {
      departmentId: "fin",
      policyText: "Pinned draft text for the register.",
      source: "paste",
    };
    // Pinned on purpose. The seed below is the 5-part string every run used before
    // versions existed (department :: normalised text :: template :: horizon :: levers),
    // and the identifier is the one hashed from exactly that string — checked against the
    // composition in the previous revision of `seed.ts`, not merely against today's code.
    // So a run already recorded in an officer's browser keeps resolving to itself.
    expect(seedForRequest(request)).toBe(
      "fin::pinned draft text for the register.::custom::medium::unstated,unstated,standard,0",
    );
    expect(runIdFor(request)).toBe("fin-07d7371e");
  });

  it("stops walking a corrupted chain instead of hanging a screen", () => {
    // Two records pointing at each other. Nothing can write this through the app, but a
    // hand-edited browser store must not freeze the register.
    window.localStorage.setItem(
      RUNS_STORAGE_KEY,
      JSON.stringify([
        { id: "fin-a", departmentId: "fin", policyText: "A", source: "paste", revisionOf: "fin-b" },
        { id: "fin-b", departmentId: "fin", policyText: "B", source: "paste", revisionOf: "fin-a" },
      ]),
    );
    expect(revisionNumber("fin-a")).toBeLessThanOrEqual(MAX_REVISION_DEPTH);
    expect(revisionNumber("fin-a")).toBeGreaterThan(1);
  });
});

describe("the drafting stage — a drafted policy becomes the next version", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("runs the officer's wording, records it as the next version, and labels it", async () => {
    const first = recordRun(requestFor("fin"));
    renderAt(`/app/assessments/${encodeURIComponent(first.id)}/policy-draft`);

    // The screen states which version this is and what running it will record.
    expect(
      screen.getByText(
        "This is version 1 of the department's policy. Running this wording records version 2.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    fireEvent.change(screen.getByLabelText("Drafted policy text"), {
      target: { value: "The officer's own instrument for version two." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run the simulation on this wording" }));
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));

    const recorded = listRunRequests();
    expect(recorded).toHaveLength(2);
    const next = recorded[0];
    expect(next.revisionOf).toBe(first.id);
    expect(next.source).toBe("draft");
    expect(next.policyText).toBe("The officer's own instrument for version two.");
    expect(revisionNumber(next.id)).toBe(2);

    // The label is on the documents of the new run and beside its register row.
    cleanup();
    renderAt(`/app/assessments/${encodeURIComponent(next.id)}`);
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    cleanup();
    renderAt("/app/simulations");
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    // A first run carries no version label — "Version 1" on every screen would be noise.
    expect(screen.getAllByText("Version 2")).toHaveLength(1);
  });
});

