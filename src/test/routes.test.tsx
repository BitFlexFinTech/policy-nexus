import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearSession, getSessionDepartmentId, signInToDepartment } from "@/session/session";

/**
 * Route smoke + guard test. Every route must render without throwing, and the
 * workspace guard must genuinely refuse entry without a department session.
 * A rules-of-hooks violation or a broken guard passes typecheck/build and only
 * shows up here.
 */
const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const homeGrid = () => screen.getByRole("group", { name: /select a department/i });

describe("routes smoke-render and the workspace guard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("renders the public homepage at /", () => {
    renderAt("/");
    expect(homeGrid()).toBeInTheDocument();
  });

  it("renders NotFound for an unknown route", () => {
    renderAt("/a-route-that-does-not-exist");
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("refuses /app when there is no department session, returning to the selector", () => {
    renderAt("/app");
    expect(homeGrid()).toBeInTheDocument();
    expect(screen.queryByText("Engine Vitals")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
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

  it("signs out back to the selector and clears the stored session", () => {
    signInToDepartment("health");
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(homeGrid()).toBeInTheDocument();
    expect(getSessionDepartmentId()).toBeNull();
  });

  it("switches department while keeping the session until a new choice is made", () => {
    signInToDepartment("zimra");
    renderAt("/app");
    fireEvent.click(screen.getByRole("button", { name: /Change department/ }));
    expect(homeGrid()).toBeInTheDocument();
    expect(getSessionDepartmentId()).toBe("zimra");
    expect(screen.getByRole("button", { name: /Continue to workspace/ })).toBeInTheDocument();
  });
});