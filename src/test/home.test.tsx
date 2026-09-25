import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/pages/Home";
import { DEPARTMENT_COUNT } from "@/config/departments";
import { clearSession, getSessionDepartmentId } from "@/session/session";

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

const grid = () => screen.getByRole("group", { name: /select a department/i });

/**
 * Home is the public entry point. These are real render tests: they catch the
 * class of failure that typecheck and build cannot (a hook violation or a
 * missing department only shows up when the component actually renders).
 */
describe("Home — department entry", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("renders every canonical department as a real button", () => {
    renderHome();
    expect(within(grid()).getAllByRole("button")).toHaveLength(DEPARTMENT_COUNT);
    expect(DEPARTMENT_COUNT).toBe(16);
  });

  it("shows the brand, tagline and reference date", () => {
    renderHome();
    expect(screen.getByText("Understanding before action.")).toBeInTheDocument();
    expect(screen.getByText("24 September 2026")).toBeInTheDocument();
  });

  it("marks a chosen department as selected and keeps focus on a real control", () => {
    renderHome();
    const finance = within(grid()).getByRole("button", { name: /Finance and Economic Development/ });
    expect(finance).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(finance);
    expect(finance).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Selected: Ministry of Finance/)).toBeInTheDocument();
  });

  it("enters the workspace for the selected department and stores the session", () => {
    renderHome();
    fireEvent.click(within(grid()).getByRole("button", { name: /Health and Child Care/ }));
    fireEvent.click(screen.getByRole("button", { name: /Enter Health and Child Care/ }));
    expect(getSessionDepartmentId()).toBe("health");
  });

  it("offers a continue route when a department session already exists", () => {
    renderHome();
    fireEvent.click(within(grid()).getByRole("button", { name: /Mines and Mining Development/ }));
    fireEvent.click(screen.getByRole("button", { name: /Enter Mines and Mining Development/ }));
    expect(screen.getByRole("button", { name: /Continue to workspace/ })).toBeInTheDocument();
  });

  it("does not enter a workspace before a department is chosen", () => {
    renderHome();
    expect(screen.getByRole("button", { name: /Enter workspace/ })).toBeDisabled();
    expect(getSessionDepartmentId()).toBeNull();
  });
});