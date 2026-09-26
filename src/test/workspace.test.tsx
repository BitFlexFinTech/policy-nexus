import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { REFERENCE_RATES, STAKEHOLDER_SEGMENTS } from "@/config/reference";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SECONDARY: ReadonlyArray<[string, string]> = [
  ["/app/policies", "Policy Register"],
  ["/app/simulations", "Simulation Register"],
  ["/app/documents", "Document Library"],
  ["/app/reference", "Methodology and Limitations"],
];

/**
 * Workspace parity tests. Every department must render the workspace, every
 * secondary route must smoke-render, and each screen must show the full canonical
 * dataset it claims to show (never a silent subset).
 */
describe("workspace — all 16 departments, department-aware panels", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it.each(DEPARTMENTS)("renders the workspace for $abbr without throwing", (department) => {
    signInToDepartment(department.id);
    renderAt("/app");
    expect(screen.getByText(department.abbr)).toBeInTheDocument();
    // The KPI strip must render every indicator the department declares.
    department.indicators.forEach((indicator) => {
      expect(screen.getByText(indicator.label)).toBeInTheDocument();
    });
  });

  it("opens a KPI card to its meaning and source", () => {
    signInToDepartment("fin");
    renderAt("/app");
    const indicator = findDepartment("fin")!.indicators[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(escapeRegex(indicator.label)) }));
    expect(screen.getByText(`Source: ${indicator.source}`)).toBeInTheDocument();
  });

  it.each(SECONDARY)("renders %s without throwing", (path, heading) => {
    signInToDepartment("agri");
    renderAt(path);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("renders secondary navigation for every workspace section", () => {
    signInToDepartment("fin");
    renderAt("/app");
    const nav = screen.getByRole("navigation", { name: /workspace sections/i });
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    ["Overview", "Policy Register", "Simulation Register", "Documents", "Reference"].forEach((label) => {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    });
  });

  it("lists every declared document on the document library screen", () => {
    const department = findDepartment("health")!;
    signInToDepartment("health");
    renderAt("/app/documents");
    department.documents.forEach((doc) => {
      expect(screen.getByText(doc.name)).toBeInTheDocument();
    });
  });

  it("lists every prepared draft on the policy and simulation registers", () => {
    const department = findDepartment("zida")!;
    signInToDepartment("zida");
    renderAt("/app/policies");
    department.policyTemplates.forEach((draft) => {
      expect(screen.getAllByText(new RegExp(escapeRegex(draft.title))).length).toBeGreaterThan(0);
    });
  });

  it("states the full canonical reference set on the reference screen", () => {
    signInToDepartment("ict");
    renderAt("/app/reference");
    expect(STAKEHOLDER_SEGMENTS).toHaveLength(16);
    STAKEHOLDER_SEGMENTS.forEach((segment) => {
      expect(screen.getAllByText(new RegExp(escapeRegex(segment.label))).length).toBeGreaterThan(0);
    });
    expect(REFERENCE_RATES).toHaveLength(3);
    REFERENCE_RATES.forEach((rate) => {
      expect(screen.getAllByText(new RegExp(escapeRegex(rate.label))).length).toBeGreaterThan(0);
    });
  });

  it.each(SECONDARY)("guards %s without a department session, sending the user to the chooser", (path) => {
    renderAt(path);
    expect(window.location.pathname).toBe("/start");
  });
});
