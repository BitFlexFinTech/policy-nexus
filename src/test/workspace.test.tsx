import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { DEPARTMENTS, findDepartment, indicatorBasisLabel } from "@/config/departments";
import {
  MODELLED_SHARE_LABEL,
  REFERENCE_RATES,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
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
  });

  /**
   * The owner's instruction, 2026-10-02: the indicator cards came off the Overview. The
   * figures moved to the Reference screen, and this gate follows them there — every one the
   * department declares, never a subset, each with the source line the cards used to print.
   */
  it.each(DEPARTMENTS)("states every one of $abbr's indicators on the Reference screen", (department) => {
    signInToDepartment(department.id);
    renderAt("/app/reference");
    department.indicators.forEach((indicator) => {
      expect(
        screen.getAllByText(indicator.label).length,
        `${department.id}/${indicator.id} label`,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(`Source: ${indicatorBasisLabel(indicator.basis)}`).length,
        `${department.id}/${indicator.id} source line`,
      ).toBeGreaterThan(0);
    });
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
    expect(within(nav).getAllByRole("link")).toHaveLength(6);
    ["Overview", "Policy Register", "Simulation Register", "Documents", "Support", "Reference"].forEach((label) => {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    });
  });

  it("lists every declared document on the document library screen", () => {
    const department = findDepartment("health")!;
    signInToDepartment("health");
    renderAt("/app/documents");
    department.documents.forEach((doc) => {
      expect(screen.getByText(doc.title)).toBeInTheDocument();
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
    expect(STAKEHOLDER_SEGMENTS).toHaveLength(150);
    STAKEHOLDER_SEGMENTS.forEach((segment) => {
      expect(screen.getAllByText(new RegExp(escapeRegex(segment.label))).length).toBeGreaterThan(0);
    });
    expect(REFERENCE_RATES).toHaveLength(3);
    REFERENCE_RATES.forEach((rate) => {
      expect(screen.getAllByText(new RegExp(escapeRegex(rate.label))).length).toBeGreaterThan(0);
    });
  });

  it("names the body that published each document, in the rail and in the detail", async () => {
    const department = findDepartment("fin")!;
    signInToDepartment("fin");
    renderAt("/app");

    // BATCH B4 — the rail used to name an invented instrument each document was "prepared under".
    // The register now holds the department's real, published documents, so what the rail shows is
    // the citation a reader can check: the body that published it.
    department.documents.forEach((doc) => {
      expect(doc.publisher, `${doc.id} names the body that published it`).toBeTruthy();
      expect(
        screen.getAllByText(new RegExp(escapeRegex(doc.publisher))).length,
        `${doc.title} shows ${doc.publisher} in the rail`,
      ).toBeGreaterThan(0);
    });

    // Opening a document names the same body in the dialog.
    const first = department.documents[0];
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(escapeRegex(first.title)) }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Published by")).toBeInTheDocument();
    expect(dialog.getByText(first.publisher)).toBeInTheDocument();
  });

  it("shows each document's publishing body and length on the document library screen", () => {
    const department = findDepartment("health")!;
    signInToDepartment("health");
    renderAt("/app/documents");

    department.documents.forEach((doc) => {
      expect(
        screen.getAllByText(new RegExp(escapeRegex(doc.publisher))).length,
        `${doc.title} shows ${doc.publisher}`,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(new RegExp(`PDF · ${doc.pages} pages`)).length,
        `${doc.title} shows its length`,
      ).toBeGreaterThan(0);
    });
  });

  it("states every modelled group's share and source, labelling the modelled ones", () => {
    signInToDepartment("ict");
    renderAt("/app/reference");

    const published = STAKEHOLDER_SEGMENTS.filter((segment) => segment.share !== null);
    const modelled = STAKEHOLDER_SEGMENTS.filter((segment) => segment.share === null);
    // Both kinds must exist, or the assertions below would prove nothing.
    expect(published.length).toBeGreaterThan(0);
    expect(modelled.length).toBeGreaterThan(0);

    published.forEach((segment) => {
      const line = `Share: ${segment.share}% of ${segment.shareBase} · ${segment.shareSource}`;
      expect(screen.getAllByText(line).length, `${segment.label}: ${line}`).toBeGreaterThan(0);
    });
    modelled.forEach((segment) => {
      const line = `Share: ${MODELLED_SHARE_LABEL} — no official figure, so the modelling weight is not a published share`;
      expect(screen.getAllByText(line).length, `${segment.label}: ${line}`).toBeGreaterThan(0);
    });
  });

  it.each(SECONDARY)("guards %s without a department session, sending the user to the chooser", (path) => {
    renderAt(path);
    expect(window.location.pathname).toBe("/start");
  });
});
