import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearSession, getSessionDepartmentId } from "@/session/session";
import {
  clearResearchSession,
  getResearchSession,
} from "@/session/researchSession";
import { RESEARCHERS, RESEARCH_CONFIDENTIALITY, RESEARCH_NAME } from "@/config/research";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/**
 * The ZEPARI research assistant — the second product in the platform (owner's decision, 2026-10-06).
 * These gates prove the entry exists, the two one-click entries work, the two products keep separate
 * sessions, and the research workspace refuses entry without a research session.
 */
describe("the ZEPARI research assistant", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearSession();
    clearResearchSession();
  });

  it("offers the choice at the door on the opening page", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: "Choose a service" })).toBeInTheDocument();
    const researchLink = screen.getByRole("link", { name: /enter the research assistant/i });
    expect(researchLink).toHaveAttribute("href", "/research");
  });

  it("names itself and carries the two one-click entries", () => {
    renderAt("/research");
    expect(screen.getByRole("heading", { level: 1, name: RESEARCH_NAME })).toBeInTheDocument();
    RESEARCHERS.forEach((researcher) => {
      expect(screen.getByText(researcher.name)).toBeInTheDocument();
      expect(screen.getByText(researcher.role)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `Enter as ${researcher.name}` }),
      ).toBeInTheDocument();
    });
  });

  it("states the confidentiality promise plainly", () => {
    renderAt("/research");
    expect(screen.getByText(RESEARCH_CONFIDENTIALITY.body)).toBeInTheDocument();
    expect(screen.getByText(/cannot read any research/i)).toBeInTheDocument();
  });

  it("signs a researcher in and opens the research workspace", () => {
    renderAt("/research");
    fireEvent.click(screen.getByRole("button", { name: `Enter as ${RESEARCHERS[0].name}` }));
    // The research workspace opens: its section navigation is shown and the header names the
    // researcher who entered.
    expect(
      screen.getByRole("navigation", { name: "Research assistant sections" }),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(RESEARCHERS[0].name))).toBeInTheDocument();
    // The research session exists; the DEPARTMENT session does not — the two are kept apart.
    expect(getResearchSession()?.researcherId).toBe(RESEARCHERS[0].id);
    expect(getSessionDepartmentId()).toBeNull();
  });

  it("refuses the research workspace without a research session", () => {
    renderAt("/research/app");
    expect(window.location.pathname).toBe("/research");
    expect(screen.getByRole("heading", { level: 1, name: RESEARCH_NAME })).toBeInTheDocument();
  });

  it("carries a way back to the platform home", () => {
    renderAt("/research");
    const back = screen.getByRole("link", { name: /back to home/i });
    expect(back).toHaveAttribute("href", "/");
  });
});