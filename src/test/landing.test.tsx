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
  it("leads with the initiative as the single level-one heading, the principle above it", () => {
    renderLanding();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(BRAND.initiative);

    // The principle is a LABEL above the heading, not a heading itself, and it appears
    // exactly once — as an eyebrow and again lower down it would read as filler rather
    // than as the service's position.
    const principle = screen.getByText(BRAND.eyebrow);
    expect(principle.tagName).toBe("P");
    expect(
      heading.compareDocumentPosition(principle) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(screen.getAllByText(BRAND.eyebrow)).toHaveLength(1);

    // The programme and the platform are distinguished on the same screen: the
    // initiative is the government capability, Nzwisiso AI is what delivers it.
    // (The credit line's words live in a child node, so match the line and assert
    // its full rendered text rather than the direct text node alone.)
    expect(screen.getByText(/Powered by/)).toHaveTextContent(`Powered by ${BRAND.name}`);
  });

  it("renders the heading in capitals by styling, not by hard-coding capital letters", () => {
    renderLanding();
    const heading = screen.getByRole("heading", { level: 1 });
    const text = heading.textContent?.trim() ?? "";

    // The visible requirement: all caps.
    expect(heading.className).toContain("uppercase");
    // The implementation requirement: the DOM text stays in normal case, so the accessible
    // name, search indexing and copy-paste are normal words and do not depend on how a
    // screen reader treats all-capital strings.
    expect(text).toBe(BRAND.initiative);
    expect(text).not.toBe(text.toUpperCase());
    // Caps lose the ascender/descender word-shape cues, so they need POSITIVE
    // tracking — the negative tracking used for sentence-case display type is wrong here.
    expect(heading.className).toContain("tracking-[0.02em]");
    expect(heading.className).not.toContain("tracking-tight");
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

  it("carries the policy-assessment workflow in the hero, ending at a structured assessment", () => {
    renderLanding();
    // One panel, one name: two identically-named headings on one page read as a mistake.
    expect(
      screen.getAllByRole("heading", { name: "How an assessment is produced" }),
    ).toHaveLength(1);
    const card = screen
      .getByRole("heading", { name: "How an assessment is produced" })
      .closest("aside");
    expect(card).not.toBeNull();

    const steps = within(card as HTMLElement).getAllByRole("listitem");
    expect(steps).toHaveLength(6);
    // The order is the workspace's own order, from entering to taking the instrument away.
    expect(steps[0]).toHaveTextContent("Choose your department");
    expect(steps[5]).toHaveTextContent("Take away the drafted policy");
    // The boundary the page must state: it informs the decision, it does not take it.
    expect(card).toHaveTextContent("It informs the decision; it does not take it.");
  });

  it("does NOT restate the economic reference rates — those belong beside the engine", () => {
    renderLanding();
    // The hero card now carries the workflow. The rates are inputs for the engine and
    // are stated where they are consumed (workspace header, engine vitals, reference
    // page); repeating them here only crowded the proposition.
    REFERENCE_RATES.forEach((rate) => {
      expect(screen.queryByText(rate.label)).toBeNull();
    });
  });

  it("still states the reference frame on the page, read from configuration", () => {
    renderLanding();
    // Removing the rates must not remove the frame: a simulated figure is only
    // meaningful against the reference date and fiscal year it was computed in, and
    // those are still stated in the notice strip above the hero.
    expect(screen.getByText(REFERENCE_DATE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(REFERENCE_FISCAL_YEAR)).toBeInTheDocument();
  });

  it("explains the three steps of a run and anchors the sections", () => {
    renderLanding();
    const how = screen.getByRole("heading", { name: "How it works" }).closest("section");
    expect(how).not.toBeNull();
    // Scoped to this section: the hero's workflow panel is a list of its own, so a
    // page-wide listitem count would be measuring both and guarding neither.
    expect(within(how as HTMLElement).getAllByRole("listitem")).toHaveLength(3);
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
