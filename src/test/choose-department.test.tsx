import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChooseDepartment from "@/pages/ChooseDepartment";
import { DEPARTMENT_COUNT } from "@/config/departments";
import { clearSession, getSessionDepartmentId } from "@/session/session";

const renderChooser = () =>
  render(
    <MemoryRouter>
      <ChooseDepartment />
    </MemoryRouter>,
  );

const grid = () => screen.getByRole("group", { name: /select a department/i });

/**
 * The department chooser at `/start`. These are the entry-contract tests that
 * used to target `/`: they moved with the picker, and they must keep working
 * exactly as before (16 real departments, selection state, one-click entry).
 */
describe("Choose your Department — the entry contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("names itself and renders every canonical department as a real button", () => {
    renderChooser();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Choose your Department");
    expect(within(grid()).getAllByRole("button")).toHaveLength(DEPARTMENT_COUNT);
    expect(DEPARTMENT_COUNT).toBe(16);
  });

  it("marks a chosen department as selected and keeps focus on a real control", () => {
    renderChooser();
    const finance = within(grid()).getByRole("button", {
      name: /Finance and Economic Development/,
    });
    expect(finance).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(finance);
    expect(finance).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Selected: Ministry of Finance/)).toBeInTheDocument();
  });

  it("enters the workspace for the selected department and stores the session", () => {
    renderChooser();
    fireEvent.click(within(grid()).getByRole("button", { name: /Health and Child Care/ }));
    fireEvent.click(screen.getByRole("button", { name: /Enter Health and Child Care/ }));
    expect(getSessionDepartmentId()).toBe("health");
  });

  it("offers a continue route when a department session already exists", () => {
    renderChooser();
    fireEvent.click(within(grid()).getByRole("button", { name: /Mines and Mining Development/ }));
    fireEvent.click(screen.getByRole("button", { name: /Enter Mines and Mining Development/ }));
    expect(screen.getByRole("button", { name: /Continue to workspace/ })).toBeInTheDocument();
  });

  it("does not enter a workspace before a department is chosen", () => {
    renderChooser();
    expect(screen.getByRole("button", { name: /Enter workspace/ })).toBeDisabled();
    expect(getSessionDepartmentId()).toBeNull();
  });

  it("offers a way back to the landing page", () => {
    renderChooser();
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("href", "/");
  });
});
