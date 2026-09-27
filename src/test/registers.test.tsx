import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The registers used to be lists that could not be acted on: the document rail
 * advertised a click with no handler, and the policy register had no controls at
 * all. These tests hold the fixes in place.
 */
describe("registers are actionable", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("opens a department document from the workspace rail", async () => {
    const department = findDepartment("fin")!;
    const document = department.documents[0];
    signInToDepartment("fin");
    renderAt("/app");

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(escapeRegex(document.name)) }),
    );

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(document.note)).toBeInTheDocument();
    expect(dialog.getByText(/document register, not the files themselves/)).toBeInTheDocument();
  });

  it("opens a department document from the document library screen", async () => {
    const department = findDepartment("agri")!;
    const document = department.documents[1];
    signInToDepartment("agri");
    renderAt("/app/documents");

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(escapeRegex(document.name)) }),
    );

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(document.name)).toBeInTheDocument();
    expect(dialog.getByText(document.note)).toBeInTheDocument();
    expect(dialog.getByText(document.sizeLabel)).toBeInTheDocument();
  });

  it("links every prepared draft in the policy register to the workspace", () => {
    const department = findDepartment("fin")!;
    signInToDepartment("fin");
    renderAt("/app/policies");

    const links = screen.getAllByRole("link", { name: /Use this draft/ });
    expect(links).toHaveLength(department.policyTemplates.length);
    expect(links[0]).toHaveAttribute(
      "href",
      `/app?draft=${encodeURIComponent(department.policyTemplates[0].id)}`,
    );
  });

  it("loads the chosen draft into the workspace policy input, and clears the parameter", async () => {
    const department = findDepartment("fin")!;
    const draft = department.policyTemplates[0];
    signInToDepartment("fin");
    renderAt("/app/policies");

    fireEvent.click(screen.getAllByRole("link", { name: /Use this draft/ })[0]);

    expect(await screen.findByDisplayValue(draft.policyText)).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("offers the same action on the simulation history's prepared drafts", () => {
    const department = findDepartment("fin")!;
    signInToDepartment("fin");
    renderAt("/app");

    const links = screen.getAllByRole("link", { name: /Draft — use/ });
    expect(links).toHaveLength(department.policyTemplates.length);
    expect(links[0]).toHaveAttribute(
      "href",
      `/app?draft=${encodeURIComponent(department.policyTemplates[0].id)}`,
    );
  });

  it("ignores an unknown draft parameter instead of throwing", async () => {
    signInToDepartment("fin");
    renderAt("/app?draft=no-such-template");
    expect(await screen.findByRole("button", { name: "Run Simulation" })).toBeInTheDocument();
  });
});
