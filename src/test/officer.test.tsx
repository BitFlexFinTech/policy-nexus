import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { DEMO_OFFICER, OFFICER_SELF_DECLARED_NOTE, officerDisplayName, officerRecordLine } from "@/config/officer";
import { findDepartment } from "@/config/departments";
import { getSession, clearSession, setOfficer, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { clearRuns, listRunRequests, saveRunRequest } from "@/services/assessment/runStore";
import { runIdFor, seedForRequest } from "@/services/assessment/seed";
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

const MOYO = { firstName: "Tendai", surname: "Moyo", position: "Director, Policy Development" };

/**
 * Item 1 — the paper trail. The owner asked that a drafted policy show who it was done by:
 * first name, surname, department and position, so there is a record per user.
 *
 * The platform cannot VERIFY a name while there is no Government sign-in, so it records the
 * name and says plainly where it came from. These tests gate all of it: the identity travels
 * from the entry screen into the run, two officers running the same text stay two records,
 * the drafted policy names the preparer, and the honest sentence is present — and absent
 * when nobody was recorded.
 */
describe("who prepared a policy (item 1 — the paper trail)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
  });

  it("keeps the name and post in the session, and forgets them completely when cleared", () => {
    signInToDepartment("fin");
    const recorded = setOfficer(MOYO);
    expect(recorded?.officer).toEqual({ ...MOYO, source: "self-declared" });
    expect(getSession()?.officer).toEqual({ ...MOYO, source: "self-declared" });

    // A partly filled form is still a usable record.
    setOfficer({ firstName: "Tendai" });
    expect(getSession()?.officer).toEqual({
      firstName: "Tendai",
      surname: "",
      position: "",
      source: "self-declared",
    });

    // A wholly blank form stores NOTHING — no nameless record that looks like a real one.
    setOfficer({});
    expect(getSession()?.officer).toBeUndefined();
  });

  it("composes the name in one place, and never invents one", () => {
    expect(officerDisplayName({ ...MOYO, source: "self-declared" })).toBe("Tendai Moyo");
    expect(officerRecordLine({ ...MOYO, source: "self-declared" })).toBe(
      "Tendai Moyo — Director, Policy Development",
    );
    expect(officerRecordLine(undefined)).toBeNull();
    // A surname-only record still reads as a name rather than an empty line.
    expect(
      officerDisplayName({ firstName: "", surname: "Moyo", position: "", source: "self-declared" }),
    ).toBe("Moyo");
  });

  it("travels with the request, the run and the seed — and keeps two officers' work apart", () => {
    signInToDepartment("fin");
    setOfficer(MOYO);
    const base = requestFor("fin");
    const withOfficer: AssessmentRequest = { ...base, preparedBy: getSession()!.officer };
    const run = buildSimulatedRun(withOfficer);

    expect(run.preparedBy).toEqual({ ...MOYO, source: "self-declared" });
    expect(seedForRequest(withOfficer)).toContain(
      "prepared-by:Tendai Moyo|Director, Policy Development|self-declared",
    );
    // A run with nobody recorded carries nothing — and its seed is untouched.
    expect(seedForRequest(base)).not.toContain("prepared-by:");

    // The same policy text by two different officers is two runs, so one officer's work can
    // never quietly replace another's in the register.
    saveRunRequest(withOfficer);
    const other: AssessmentRequest = {
      ...withOfficer,
      preparedBy: {
        firstName: "Rudo",
        surname: "Chikafu",
        position: "Economist",
        source: "self-declared",
      },
    };
    saveRunRequest(other);
    expect(listRunRequests()).toHaveLength(2);
    expect(runIdFor(withOfficer)).not.toBe(runIdFor(other));
  });

  it("records the fixed demo name on the way in — no typing required", () => {
    renderAt("/start");
    const group = screen.getByRole("group", { name: /Select a department/ });
    fireEvent.click(within(group).getAllByRole("button")[0]);
    // Selecting a department then entering the workspace is the two-step entry the chooser
    // has always used; the demo name must be recorded by then, without anyone typing anything.
    fireEvent.click(screen.getByRole("button", { name: /^Enter / }));

    expect(getSession()?.departmentId).toBe("opc");
    expect(getSession()?.officer).toEqual({ ...DEMO_OFFICER });
  });

  it("names the preparer on the drafted policy, and says how honest the name is", () => {
    signInToDepartment("fin");
    setOfficer(MOYO);
    const request: AssessmentRequest = { ...requestFor("fin"), preparedBy: getSession()!.officer };
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);

    // The instrument's own title block names the preparer; the page then shows the same
    // person in the provenance panel and states how honest the name is.
    expect(document.body.textContent ?? "").toContain(
      `Prepared by: Tendai Moyo, Director, Policy Development, ${
        findDepartment("fin")!.shortName
      } (self-declared at entry)`,
    );
    expect(screen.getByText("Tendai Moyo — Director, Policy Development")).toBeInTheDocument();
    // The honest sentence, on the officer's screen.
    expect(screen.getByText(OFFICER_SELF_DECLARED_NOTE)).toBeInTheDocument();
  });

  it("says plainly when no preparer was recorded, rather than naming nobody", () => {
    signInToDepartment("fin");
    const request = requestFor("fin");
    saveRunRequest(request);
    const run = buildSimulatedRun(request);

    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`);
    expect(screen.getByText(/no individual preparer recorded/)).toBeInTheDocument();
    expect(screen.getByText(/Not recorded — attributed to Ministry of Finance/)).toBeInTheDocument();
    expect(screen.queryByText(OFFICER_SELF_DECLARED_NOTE)).not.toBeInTheDocument();

    // And the same on the run's own record, on the full assessment.
    cleanup();
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/full`);
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
  });
});
