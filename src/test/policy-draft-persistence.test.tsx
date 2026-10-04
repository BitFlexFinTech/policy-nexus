import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { REFERENCE_DATE } from "@/config/reference";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { clearRuns, saveRunRequest } from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";
import {
  DRAFTS_STORAGE_KEY,
  getDraftText,
  listDrafts,
  saveDraftText,
} from "@/services/documents/draftStore";

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
 * The drafted policy is a starting text the officer edits before circulating it. Those
 * edits used to live only in the screen, so opening the full report — or reloading —
 * silently threw them away. They are now kept in this browser, per run. These tests are
 * the gate on that promise: they would fail if the store were removed, if the wording
 * were shared between runs, or if an empty box were treated as a working copy.
 */
describe("the officer's working copy of a drafted policy survives leaving the screen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("still holds the officer's wording after the screen is closed and reopened", () => {
    const run = recordRun(requestFor("fin"));
    const path = `/app/assessments/${encodeURIComponent(run.id)}/policy-draft`;

    renderAt(path);
    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    const box = screen.getByLabelText("Drafted policy text") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "Officer wording that must not be lost." } });
    expect(box.value).toBe("Officer wording that must not be lost.");

    // Leaving the screen, and coming back to it later.
    cleanup();
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}`);
    cleanup();
    renderAt(path);

    // The screen states plainly where the wording is kept.
    expect(
      screen.getByText(/Your wording is kept in this browser, for this run/),
    ).toBeInTheDocument();
    // The screen also says the working copy exists before the box is opened.
    expect(
      screen.getByText("Edited — the export buttons above use your wording."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    expect((screen.getByLabelText("Drafted policy text") as HTMLTextAreaElement).value).toBe(
      "Officer wording that must not be lost.",
    );
  });

  it("keeps each run's wording to itself, in one store keyed by the run", () => {
    const first = recordRun(requestFor("fin"));
    const second = recordRun({ ...requestFor("fin"), policyText: "A different submitted draft." });
    expect(second.id).not.toBe(first.id);

    renderAt(`/app/assessments/${encodeURIComponent(first.id)}/policy-draft`);
    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    fireEvent.change(screen.getByLabelText("Drafted policy text"), {
      target: { value: "Wording for the first run only." },
    });

    // One store, keyed by run id — the second run has no working copy of its own.
    const stored = listDrafts();
    expect(Object.keys(stored)).toEqual([first.id]);
    expect(getDraftText(second.id)).toBeNull();

    cleanup();
    renderAt(`/app/assessments/${encodeURIComponent(second.id)}/policy-draft`);
    expect(
      screen.queryByText("Edited — the export buttons above use your wording."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit draft wording" }));
    expect((screen.getByLabelText("Drafted policy text") as HTMLTextAreaElement).value).not.toBe(
      "Wording for the first run only.",
    );
  });

  it("treats an empty box as no working copy, and writes only to its own key", () => {
    saveDraftText("fin-abc", "Written by the officer.");
    expect(getDraftText("fin-abc")).toBe("Written by the officer.");
    expect(Object.keys(JSON.parse(window.localStorage.getItem(DRAFTS_STORAGE_KEY)!))).toEqual([
      "fin-abc",
    ]);

    // Blank text is the same as having no working copy: the generated draft comes back
    // rather than an empty instrument being exported.
    saveDraftText("fin-abc", "   \n  ");
    expect(getDraftText("fin-abc")).toBeNull();
    expect(Object.keys(listDrafts())).toEqual([]);

    // "Reset to generated" is the same call, and it is safe on a run that has none.
    saveDraftText("fin-abc", "Second attempt.");
    saveDraftText("", "Never stored — no run to attach it to.");
    // The working copy is keyed by its run only, and carries the real moment it was written —
    // never the platform's fixed reference date, which would mean the wording was never dated.
    const stored = listDrafts()["fin-abc"];
    expect(Object.keys(listDrafts())).toEqual(["fin-abc"]);
    expect(stored.text).toBe("Second attempt.");
    expect(stored.savedAt).not.toBe(REFERENCE_DATE);
    expect(stored.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
