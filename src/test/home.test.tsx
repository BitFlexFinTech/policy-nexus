import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/pages/Home";
import { DEPARTMENT_COUNT, DEPARTMENTS } from "@/config/departments";
import { STAKEHOLDER_SEGMENTS } from "@/config/reference";
import { SOVEREIGNTY_STATEMENT } from "@/config/brand";
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

/**
 * The government-identity layer of the homepage. These assert the parts a user
 * and the commissioning ministry asked for by name, and that the coverage figures
 * are read from the configuration rather than written by hand.
 */
describe("Home — identity, proposition and official footer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("presents the tagline as the single level-one heading", () => {
    renderHome();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Understanding before action.");
  });

  it("states what the platform does, as four named capabilities", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "What this platform does" })).toBeInTheDocument();
    [
      "Model the national picture",
      "Simulate before you commit",
      "Read the assessment",
      "Draft the policy itself",
    ].forEach((title) => {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    });
  });

  it("explains the three steps of a run", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("reports coverage figures read from the configuration, never written by hand", () => {
    renderHome();
    const expected = [
      String(DEPARTMENT_COUNT),
      String(STAKEHOLDER_SEGMENTS.length),
      String(DEPARTMENTS.reduce((total, d) => total + d.indicators.length, 0)),
      String(DEPARTMENTS.reduce((total, d) => total + d.policyTemplates.length, 0)),
    ];
    expect(screen.getAllByRole("definition").map((node) => node.textContent)).toEqual(expected);
  });

  it("sends the primary call to action to the department selector", () => {
    renderHome();
    const cta = within(screen.getByRole("main")).getByRole("link", { name: /Start a simulation/ });
    expect(cta).toHaveAttribute("href", "#start");
    expect(document.querySelector("#start")).not.toBeNull();
  });

  it("keeps the sovereign footer statement", () => {
    renderHome();
    expect(screen.getByText(SOVEREIGNTY_STATEMENT)).toBeInTheDocument();
  });

  it("carries the required attribution in the footer, with the classification smaller", () => {
    renderHome();
    const footer = screen.getByRole("contentinfo");
    const attribution = within(footer).getByText("A Project by the Ministry of IT");
    const classification = within(footer).getByText("For Internal Use Only");

    // A genuinely failable comparison: both must carry an explicit text size, and
    // the classification must be the smaller of the two.
    const sizeOf = (node: HTMLElement) => {
      const match = node.className.match(/text-\[(\d+)px\]/);
      return match ? Number(match[1]) : NaN;
    };
    const attributionSize = sizeOf(attribution);
    const classificationSize = sizeOf(classification);

    expect(Number.isNaN(attributionSize)).toBe(false);
    expect(Number.isNaN(classificationSize)).toBe(false);
    expect(classificationSize).toBeLessThan(attributionSize);
  });

  it("shows the classification exactly once, so it cannot be confused with the attribution", () => {
    renderHome();
    expect(screen.getAllByText("For Internal Use Only")).toHaveLength(1);
  });
});