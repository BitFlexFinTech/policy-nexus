import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import { DEPARTMENT_COUNT, DEPARTMENTS } from "@/config/departments";
import { STAKEHOLDER_SEGMENTS, REFERENCE_DATE_LABEL, REFERENCE_FISCAL_YEAR, REFERENCE_RATES } from "@/config/reference";
import { BRAND, SOVEREIGNTY_STATEMENT } from "@/config/brand";

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

/**
 * The public landing page. Its defining property is that it is a LANDING page:
 * it introduces the platform and hands off to the chooser, and it must NOT carry
 * the department picker — that is asserted below as a real, failable guard.
 */
describe("Landing — the pure public landing page", () => {
  it("leads with the proposition as the single level-one heading, not the brand tagline", () => {
    renderLanding();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test the policy before the measure is finalised.",
    );
    // The tagline is brand voice, not the page's proposition — it must still be
    // present on the page, or it has been silently dropped rather than moved.
    expect(screen.getByText(BRAND.tagline)).toBeInTheDocument();
  });

  it("does NOT carry the department picker — that belongs to /start", () => {
    renderLanding();
    expect(screen.queryByRole("group", { name: /select a department/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Enter workspace/ })).toBeNull();
    expect(screen.queryByText(/No department selected/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Continue to workspace/ })).toBeNull();
  });

  it("hands off to the chooser through every 'Choose your Department' action", () => {
    renderLanding();
    const actions = screen.getAllByRole("link", { name: "Choose your Department" });
    expect(actions.length).toBeGreaterThanOrEqual(2); // hero + closing panel (+ footer)
    actions.forEach((action) => expect(action).toHaveAttribute("href", "/start"));
  });

  it("states what the platform does, as four named capabilities", () => {
    renderLanding();
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

  it("reports coverage figures read from the configuration, never written by hand", () => {
    renderLanding();
    const expected = [
      String(DEPARTMENT_COUNT),
      String(STAKEHOLDER_SEGMENTS.length),
      String(DEPARTMENTS.reduce((total, d) => total + d.indicators.length, 0)),
      String(DEPARTMENTS.reduce((total, d) => total + d.policyTemplates.length, 0)),
    ];
    const coverage = screen.getByRole("heading", { name: "Platform coverage" }).closest("section");
    expect(coverage).not.toBeNull();
    expect(
      within(coverage as HTMLElement)
        .getAllByRole("definition")
        .map((node) => node.textContent),
    ).toEqual(expected);
  });

  it("states the reference frame from configuration, so no figure on the page is invented", () => {
    renderLanding();
    // The footer column is also called "Reference frame", so this heading must be
    // distinct — two identically-named headings on one page read as a mistake.
    expect(screen.getAllByRole("heading", { name: "Reference date and inputs" })).toHaveLength(1);
    const frame = screen.getByRole("heading", { name: "Reference date and inputs" }).closest("aside");
    expect(frame).not.toBeNull();
    expect(
      within(frame as HTMLElement)
        .getAllByRole("definition")
        .map((node) => node.textContent?.trim()),
    ).toEqual([
      REFERENCE_DATE_LABEL,
      REFERENCE_FISCAL_YEAR,
      ...REFERENCE_RATES.map((rate) => `${rate.value} ${rate.unit}`),
    ]);
  });

  it("explains the three steps of a run and anchors the sections", () => {
    renderLanding();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(document.querySelector("#capabilities")).not.toBeNull();
    expect(document.querySelector("#how-it-works")).not.toBeNull();
  });

  it("keeps the sovereign footer statement", () => {
    renderLanding();
    expect(screen.getByText(SOVEREIGNTY_STATEMENT)).toBeInTheDocument();
  });

  it("carries the required attribution in the footer, with the classification smaller", () => {
    renderLanding();
    const footer = screen.getByRole("contentinfo");
    const attribution = within(footer).getByText("A Project by the Ministry of IT");
    const classification = within(footer).getByText("For Internal Use Only");

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
    renderLanding();
    expect(screen.getAllByText("For Internal Use Only")).toHaveLength(1);
  });
});
