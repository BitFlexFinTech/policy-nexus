import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import { DEPARTMENT_COUNT, DEPARTMENTS } from "@/config/departments";
import { STAKEHOLDER_SEGMENTS, REFERENCE_DATE_LABEL, REFERENCE_FISCAL_YEAR, REFERENCE_RATES } from "@/config/reference";
import { BRAND, GOVERNANCE, SOVEREIGNTY_STATEMENT } from "@/config/brand";

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
    // §15 places the credit twice — under the hero heading and in the positioning
    // panel — and both must read from the one config string.
    const credits = screen.getAllByText(/Powered by/);
    expect(credits).toHaveLength(2);
    credits.forEach((credit) => expect(credit).toHaveTextContent(BRAND.poweredBy));
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

  it("states what the platform does, as three named capabilities", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { name: "A new capability for policy assessment" }),
    ).toBeInTheDocument();
    ["Policy input", "Stakeholder simulation", "Policy assessment"].forEach((title) => {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    });
    // The capability labels render in capitals by styling, so the DOM keeps normal
    // case and the accessible name stays a readable phrase.
    const label = screen.getByRole("heading", { name: "Policy input" });
    expect(label.className).toContain("uppercase");
    expect(label.textContent?.trim()).toBe("Policy input");
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

  it("states the three assessment steps in the hero card, and closes on the principle", () => {
    renderLanding();
    // One panel, one name: two identically-named headings on one page read as a mistake.
    expect(
      screen.getAllByRole("heading", { name: "From policy draft to structured assessment" }),
    ).toHaveLength(1);
    const card = screen
      .getByRole("heading", { name: "From policy draft to structured assessment" })
      .closest("aside");
    expect(card).not.toBeNull();

    const steps = within(card as HTMLElement).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("Add your policy");
    expect(steps[1]).toHaveTextContent("Run simulation");
    expect(steps[2]).toHaveTextContent("Review assessment");
    // The card closes on the principle as a sentence — the eyebrow above the heading
    // states the same words as a label, and the full stop keeps the two distinct.
    expect(card).toHaveTextContent(BRAND.tagline);
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

  it("offers ONE primary action — the secondary link is gone", () => {
    renderLanding();
    // The footer nav still links to the capabilities section; what was removed is the
    // second, competing action beside the hero CTA.
    expect(screen.queryByText("See what the platform does")).toBeNull();
  });

  it("states the governance position verbatim — the platform does not decide", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { name: "From policy draft to policy intelligence" }),
    ).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE.lens)).toBeInTheDocument();
    // The wording of this sentence is the point of the section, so it is asserted word
    // for word: nothing may imply that AI makes policy decisions.
    expect(screen.getByText(GOVERNANCE.humanJudgement)).toBeInTheDocument();
  });

  it("presents the proposal with its ministerial champion, without a second <h1>", () => {
    renderLanding();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const panel = screen.getByRole("heading", { name: BRAND.proposalLabel }).closest("section");
    expect(panel).not.toBeNull();
    // Scoped deliberately: the ministry also appears in the footer, so an unscoped
    // query would pass while the panel said nothing at all.
    expect(within(panel as HTMLElement).getByText(BRAND.ministerialChampion)).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText(BRAND.entityCustodian)).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText(BRAND.poweredBy)).toBeInTheDocument();
    expect(
      within(panel as HTMLElement).getByRole("heading", { name: "Ministerial champion" }),
    ).toBeInTheDocument();

    // The initiative name appears once as the h1 and once here as plain text — never as
    // a second heading, which would let the page name itself twice.
    const nameMatches = screen.getAllByText(BRAND.initiative);
    expect(nameMatches).toHaveLength(2);
    expect(nameMatches.filter((node) => node.tagName === "H1")).toHaveLength(1);
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
