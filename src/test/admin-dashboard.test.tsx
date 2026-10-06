import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { ADMIN_ROUTE, clearConfig } from "@/config/platform";
import { clearSession } from "@/session/session";
import { RUNS_STORAGE_KEY, clearRuns } from "@/services/assessment/runStore";
import { clearSupportCases, openSupportCase } from "@/services/support/supportStore";

const renderAdmin = () => {
  window.history.pushState({}, "", ADMIN_ROUTE);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));
};

describe("the platform administration dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearConfig();
    clearSession();
    clearRuns();
    clearSupportCases();
  });

  it("shows the overview figures and the honest gaps", () => {
    renderAdmin();
    expect(screen.getByRole("heading", { name: "Platform overview" })).toBeInTheDocument();
    ["Simulation runs recorded", "Department documents added", "Support cases"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    // The charts and tables are present.
    [
      "Simulation runs by department",
      "Activity over time",
      "Department documents by department",
      "Support cases by state",
      "Support cases by category",
      "Reference figures: published vs modelled",
      "Recent runs",
      "Recent support cases",
    ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
    expect(screen.getByText("What still needs the server")).toBeInTheDocument();
  });

  it("reflects this browser's support cases on the dashboard", () => {
    openSupportCase({ departmentId: "fin", subject: "One", category: "Other", description: "" });
    openSupportCase({ departmentId: "agri", subject: "Two", category: "Data", description: "" });
    renderAdmin();
    expect(screen.getByRole("heading", { name: "Support inbox (2)" })).toBeInTheDocument();
  });

  it("does not blank when an older stored run carries no recorded date (regression)", () => {
    window.localStorage.setItem(
      RUNS_STORAGE_KEY,
      JSON.stringify([
        { id: "OLD-1", departmentId: "fin", policyText: "An older stored run", source: "paste" },
      ]),
    );
    renderAdmin();
    expect(screen.getByRole("heading", { name: "Platform overview" })).toBeInTheDocument();
    expect(screen.getByText("Recent runs")).toBeInTheDocument();
    expect(screen.getByText(/An older stored run/)).toBeInTheDocument();
  });
});
