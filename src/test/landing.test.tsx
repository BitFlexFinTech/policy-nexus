import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import { DEPARTMENT_COUNT, DEPARTMENTS } from "@/config/departments";
import { STAKEHOLDER_SEGMENTS, REFERENCE_DATE_LABEL, REFERENCE_FISCAL_YEAR, REFERENCE_RATES } from "@/config/reference";
import { BRAND, ENGINE_EXPLANATION, GOVERNANCE, SOVEREIGNTY_STATEMENT } from "@/config/brand";
import {
  KNOWLEDGE_MAP_LINE,
  SIMULATED_AGENT_FIGURE,
  SIMULATION_PIPELINE,
  SIMULATION_SCALE,
} from "@/components/public/SimulationVisuals";

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

  /**
   * The engine explanation. The whole point of this section is that one policy
   * draft does NOT produce a single answer: it produces a knowledge map, a
   * population of thousands of interacting agents, and then an assessment. The
   * guards below fail if the section is quietly reduced back to "upload a
   * document, read the answer".
   */
  describe("What happens behind the assessment", () => {
    const section = () => {
      const heading = screen.getByRole("heading", { name: ENGINE_EXPLANATION.heading });
      const node = heading.closest("section");
      expect(node).not.toBeNull();
      return node as HTMLElement;
    };

    it("is named once, and sits between the capability cards and How it works", () => {
      renderLanding();
      const headings = screen.getAllByRole("heading", { name: ENGINE_EXPLANATION.heading });
      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe("H2");

      // §2 is a structural requirement, so it is asserted structurally rather than
      // by eyeballing the file: capabilities → behind the assessment → how it works.
      const follows = (first: Node, second: Node) =>
        Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
      const capabilities = screen.getByRole("heading", {
        name: "A new capability for policy assessment",
      });
      const how = screen.getByRole("heading", { name: "How it works" });
      expect(follows(capabilities, headings[0])).toBe(true);
      expect(follows(headings[0], how)).toBe(true);

      // §14 — the transition line belongs to this section and hands over to How it
      // works, so the reader meets the complexity before the simple journey.
      expect(follows(screen.getByText(ENGINE_EXPLANATION.transition), how)).toBe(true);
    });

    it("states the brief's explanation word for word", () => {
      renderLanding();
      expect(screen.getByText(ENGINE_EXPLANATION.statement)).toBeInTheDocument();
      expect(screen.getByText(ENGINE_EXPLANATION.body)).toBeInTheDocument();
      expect(screen.getByText(ENGINE_EXPLANATION.transition)).toBeInTheDocument();
    });

    it("shows exactly the five approved indicators, and reads one figure from one place", () => {
      renderLanding();
      const panel = section();
      expect(within(panel).getAllByRole("term")).toHaveLength(5);
      expect(
        within(panel)
          .getAllByRole("term")
          .map((node) => node.textContent),
      ).toEqual(SIMULATION_SCALE.map((indicator) => indicator.figure));
      expect(
        within(panel)
          .getAllByRole("definition")
          .map((node) => node.textContent),
      ).toEqual(SIMULATION_SCALE.map((indicator) => indicator.label));

      // The population figure is written once and read by both the indicator strip
      // and the diagram, so the two cannot disagree — asserted as a count, which
      // fails if either rendering stops reading the shared constant.
      expect(within(panel).getAllByText(SIMULATED_AGENT_FIGURE)).toHaveLength(2);
    });

    it("walks the eight stages in order, with the brief's supporting lines", () => {
      renderLanding();
      // Read from the named pipeline list. The section holds a second list — the
      // diagram's knowledge-map rows — so an unscoped listitem count would measure
      // both and guard neither.
      const stages = within(
        screen.getByRole("list", { name: "The Nzwisiso process, stage by stage" }),
      ).getAllByRole("listitem");
      expect(stages).toHaveLength(SIMULATION_PIPELINE.length);
      expect(stages).toHaveLength(8);

      SIMULATION_PIPELINE.forEach((stage, index) => {
        expect(stages[index]).toHaveTextContent(stage.title);
        expect(stages[index]).toHaveTextContent(stage.body);
        // Structured markers, in sequence: 01 … 08. Scoped to the stage, because the
        // same two-digit markers are used by the hero card and the steps below.
        expect(
          within(stages[index]).getByText(String(index + 1).padStart(2, "0")),
        ).toBeInTheDocument();
      });

      expect(stages[2]).toHaveTextContent(KNOWLEDGE_MAP_LINE);
      expect(stages[2]).toHaveTextContent("Entities • relationships • institutions • interests");
      expect(stages[3]).toHaveTextContent("Thousands of individual agents");
      expect(stages[5]).toHaveTextContent("Interactions evolve across the simulated environment");
      expect(stages[6]).toHaveTextContent("Patterns • tensions • risks • areas of support");
      expect(stages[7]).toHaveTextContent("Structured findings for human review");
    });

    it("draws the simulated environment as real text, not as decoration", () => {
      renderLanding();
      const panel = section();
      // The three registers in this section — the scale strip, the eight-stage
      // pipeline and the schematic — deliberately share their vocabulary, which is
      // what lets a reader map one onto the other. So the counts below are exact:
      // a name appears once per register it belongs to, and the assertion fails if a
      // register drops it or an unrelated block starts borrowing the name.
      expect(within(panel).getAllByText("Policy")).toHaveLength(1); // schematic only
      expect(within(panel).getAllByText("Knowledge map")).toHaveLength(2); // stage 03 + diagram
      expect(within(panel).getAllByText("Simulated population")).toHaveLength(2); // stage 04 + diagram
      expect(within(panel).getAllByText("Interactions")).toHaveLength(2); // indicator + diagram
      expect(within(panel).getAllByText("Policy assessment")).toHaveLength(3); // indicator + stage 08 + diagram
      // The diagram's knowledge-map rows read from the same array as the pipeline
      // line, so "Entities" is present in both registers.
      expect(within(panel).getAllByText("Entities")).toHaveLength(1);
      expect(within(panel).getByText("agents")).toBeInTheDocument();
    });

    it("keeps to plain language — no implementation vocabulary, no prediction", () => {
      renderLanding();
      const text = section().textContent ?? "";

      // The concepts a Government official is not expected to know (§8). Vendor and
      // product names are deliberately NOT listed here: `scripts/validate.mjs` bans
      // them across the whole app already, and repeating them would trip that check
      // from this file.
      [
        /\bAPI\b/i,
        /\bLLMs?\b/i,
        /agent-based/i,
        /knowledge graph/i,
        /graph database/i,
        /embeddings?/i,
        /vector database/i,
        /\binference\b/i,
        /PRNG/i,
        /random seed/i,
        /orchestration/i,
      ].forEach((pattern) => expect(text).not.toMatch(pattern));

      // And it must not claim to know what will happen (§24). The certainty phrases
      // the validator bans app-wide are not repeated verbatim here for the same
      // reason as the vendor names above.
      [/predict/i, /guarantee/i, /knows how/i, /simulates reality/i].forEach((pattern) =>
        expect(text).not.toMatch(pattern),
      );
    });

    it("names the process as structured and repeatable, without the old engine copy", () => {
      renderLanding();
      const heading = screen.getByRole("heading", { name: "Structured and repeatable" });
      const panel = heading.closest("section");
      expect(panel).not.toBeNull();
      expect(panel).toHaveTextContent(
        "The same defined assessment process is applied consistently to each policy scenario, providing a controlled environment for examining potential stakeholder responses.",
      );
      expect(panel).toHaveTextContent(
        "Scenario results are generated locally from the defined policy scenario and reference configuration.",
      );
      // The previous heading and sentence are gone, not merely joined by a new one.
      expect(screen.queryByText("Deterministic, local, and reproducible")).toBeNull();
      expect(document.body.textContent ?? "").not.toMatch(/scenario mode/i);
    });

    it("carries the revised policy-input and stakeholder-simulation card copy", () => {
      renderLanding();
      expect(screen.getByText("Upload or enter the proposed policy.")).toBeInTheDocument();

      const card = screen
        .getByRole("heading", { name: "Stakeholder simulation" })
        .closest("article");
      expect(card).not.toBeNull();
      expect(
        within(card as HTMLElement).getByText("Thousands of simulated agents."),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent(
        "Nzwisiso creates a simulated population representing relevant stakeholder perspectives and examines how those agents interact within the policy scenario.",
      );
    });
  });
});
