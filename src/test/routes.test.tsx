import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearSession, getSessionDepartmentId, signInToDepartment } from "@/session/session";

/**
 * Route smoke + guard test. Every route must render without throwing, and the
 * workspace guard must genuinely refuse entry without a department session.
 * A rules-of-hooks violation or a broken guard passes typecheck/build and only
 * shows up here.
 *
 * Phase M: `/` is the pure landing page and `/start` is the department chooser,
 * so the guard now sends a signed-out visit to `/start`, not `/`.
 */
const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const chooserGrid = () => screen.getByRole("group", { name: /select a department/i });
const landingHeading = () => screen.getByRole("heading", { level: 1 });

describe("routes smoke-render and the workspace guard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("renders the public landing page at / — and it holds no department picker", () => {
    renderAt("/");
    expect(landingHeading()).toHaveTextContent("National policy simulation workspace");
    expect(screen.queryByRole("group", { name: /select a department/i })).toBeNull();
  });

  it("renders the department chooser at /start", () => {
    renderAt("/start");
    expect(landingHeading()).toHaveTextContent("Choose your Department");
    expect(chooserGrid()).toBeInTheDocument();
  });

  it("renders NotFound for an unknown route", () => {
    renderAt("/a-route-that-does-not-exist");
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("refuses /app without a department session, sending the user to the chooser", () => {
    renderAt("/app");
    expect(chooserGrid()).toBeInTheDocument();
    expect(screen.queryByText("Engine Vitals")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/start");
  });

  it("renders the workspace at /app for the signed-in department, labelled with it", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.getByText("Engine Vitals")).toBeInTheDocument();
    expect(screen.getByText("Simulation History")).toBeInTheDocument();
    expect(screen.getByText("Document Library")).toBeInTheDocument();
    expect(screen.getByText("MoF")).toBeInTheDocument();
    expect(screen.queryByText("MoA")).not.toBeInTheDocument();
  });

  it("does not hardcode one department — a different session shows a different department", () => {
    signInToDepartment("agri");
    renderAt("/app");
    expect(screen.getByText("MoA")).toBeInTheDocument();
    expect(screen.queryByText("MoF")).not.toBeInTheDocument();
  });

  it("visibly marks the one-click entry mode as a mock (mock-first rule)", () => {
    signInToDepartment("zida");
    renderAt("/app");
    expect(screen.getByText("Entry: one-click (Mock)")).toBeInTheDocument();
  });

  it("signs out to the landing page and clears the stored session", () => {
    signInToDepartment("health");
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(landingHeading()).toHaveTextContent("National policy simulation workspace");
    expect(getSessionDepartmentId()).toBeNull();
  });

  it("sends 'Change department' to the chooser, keeping the session until a new choice is made", () => {
    signInToDepartment("zimra");
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: /Change department/ }));
    expect(chooserGrid()).toBeInTheDocument();
    expect(getSessionDepartmentId()).toBe("zimra");
    expect(screen.getByRole("button", { name: /Continue to workspace/ })).toBeInTheDocument();
  });
});