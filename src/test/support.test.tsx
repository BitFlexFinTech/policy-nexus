import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { ADMIN_ROUTE, clearConfig } from "@/config/platform";
import { clearSession, signInToDepartment } from "@/session/session";
import {
  assignSupportCase,
  clearSupportCases,
  listSupportCases,
  openSupportCase,
  setSupportCaseStatus,
} from "@/services/support/supportStore";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

describe("the simulated support desk", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearConfig();
    clearSession();
    clearSupportCases();
  });

  it("opens a case with a readable number, and refuses an empty one", () => {
    expect(
      openSupportCase({ departmentId: "fin", subject: "   ", category: "Other", description: "" }),
    ).toBeNull();

    const first = openSupportCase({
      departmentId: "fin",
      subject: "Report is blank",
      category: "Report",
      description: "x",
    });
    const second = openSupportCase({
      departmentId: "fin",
      subject: "Cannot run a simulation",
      category: "Simulation",
      description: "",
    });

    expect(first?.id).toBe("CASE-0001");
    expect(second?.id).toBe("CASE-0002");
    expect(listSupportCases()).toHaveLength(2);
  });

  it("refuses a case for a department that does not exist", () => {
    expect(
      openSupportCase({ departmentId: "nope", subject: "x", category: "Other", description: "" }),
    ).toBeNull();
  });

  it("sets the state and delegates the case to a representative", () => {
    const created = openSupportCase({
      departmentId: "fin",
      subject: "Cannot run a simulation",
      category: "Simulation",
      description: "",
    });
    expect(created).not.toBeNull();

    setSupportCaseStatus(created!.id, "in-progress");
    assignSupportCase(created!.id, "Tariro M.");

    const stored = listSupportCases()[0];
    expect(stored.status).toBe("in-progress");
    expect(stored.assignee).toBe("Tariro M.");

    assignSupportCase(created!.id, "  ");
    expect(listSupportCases()[0].assignee).toBeNull();
  });

  it("an officer opens a case, and the administrator sees it and delegates it", () => {
    // The officer, inside the workspace.
    signInToDepartment("fin");
    const officerView = renderAt("/app/support");
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Assessment report is blank" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open a case" }));
    expect(screen.getByText("CASE-0001")).toBeInTheDocument();
    expect(screen.getByText(/Opened CASE-0001/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cases opened here (1)" })).toBeInTheDocument();
    officerView.unmount();

    // The administrator, on the administration screen (past the gate).
    window.history.pushState({}, "", ADMIN_ROUTE);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));

    expect(screen.getByRole("heading", { name: "Support inbox (1)" })).toBeInTheDocument();
    expect(screen.getByText("CASE-0001")).toBeInTheDocument();

    const assign = screen.getByLabelText("Assign CASE-0001");
    fireEvent.change(assign, { target: { value: "Rudo Support" } });
    fireEvent.blur(assign);
    expect(listSupportCases()[0].assignee).toBe("Rudo Support");
  });

  it("keeps cases in this browser only, through the shared browser adapter", () => {
    openSupportCase({
      departmentId: "fin",
      subject: "Only here",
      category: "Other",
      description: "",
    });
    const raw = window.localStorage.getItem("nzwisiso.support.cases.v1");
    expect(raw).not.toBeNull();
    expect(raw).toContain("Only here");
  });
});
