import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RelationshipGraphCard } from "@/components/relationship/RelationshipGraphCard";
import { findDepartment } from "@/config/departments";
import {
  GRAPH_EDGE_STROKE,
  GRAPH_EDGE_STROKE_STRENGTH,
  GRAPH_GROUP_COLOURS,
  GRAPH_INK,
  GRAPH_MARK_OUTLINE_STROKE,
  GRAPH_NODE_FILL,
  GRAPH_NODE_SHAPE,
  GRAPH_RING_STROKE,
  graphGroupColour,
  shapePoints,
} from "@/lib/graph/palette";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import {
  AGENT_COMPACT_MARK_CAP,
  RELATION_BANK,
  RELATIONSHIP_KINDS,
  buildPreviewRelationshipGraph,
  buildRelationshipGraph,
  relationshipKindLabel,
} from "@/services/assessment/network";
import type { AssessmentRequest } from "@/services/assessment/types";
import { SWARM_HEIGHT, SWARM_WIDTH } from "@/lib/graph/swarm";

/**
 * jsdom implements no PointerEvent, so a synthetic pointer event arrives without
 * clientX/clientY and every coordinate in a drag test would be NaN. The shim is
 * a MouseEvent under a pointer name, which is exactly what the DOM does in a real
 * browser (a pointer event is a mouse event with extra fields), and it is here
 * rather than in the shared setup because only this file drives a pointer.
 */
if (typeof window.PointerEvent === "undefined") {
  class TestPointerEvent extends MouseEvent {
    constructor(type: string, init?: MouseEventInit) {
      super(type, init);
    }
  }
  Object.defineProperty(window, "PointerEvent", {
    writable: true,
    value: TestPointerEvent,
  });
}

const requestFor = (departmentId: string): AssessmentRequest => {
  const department = findDepartment(departmentId)!;
  const template = department.policyTemplates[0];
  return {
    departmentId: department.id,
    policyText: template.policyText,
    source: "preset",
    templateId: template.id,
    timeHorizon: template.timeHorizon,
  };
};

const scenario = (departmentId: string) => {
  const run = buildSimulatedRun(requestFor(departmentId));
  return { run, graph: buildRelationshipGraph(run), seed: `${run.seed}::swarm` };
};

/** Every node the surface draws, as the user perceives them. */
const nodeButtons = () => screen.getAllByRole("button", { name: /relationships$/ });

const translated = (element: Element) => {
  const transform = element.getAttribute("transform") ?? "";
  const match = transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) throw new Error(`No translate() on node: ${transform}`);
  return { x: Number(match[1]), y: Number(match[2]) };
};

const clickNode = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}, `) });

// The shared matchMedia stub returns `matches: false`; the reduced-motion test
// replaces it, so it is put back between tests rather than left standing.
const originalMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "matchMedia", { writable: true, value: originalMatchMedia });
});

/**
 * The graph surface. jsdom has no animation frame and no layout, so these tests
 * also prove the property the component is built around: the graph is arranged
 * and complete on the FIRST render, with no animation running at all.
 */
describe("relationship graph card", () => {
  it("draws the settled graph on the first render, with no node left unplaced", () => {
    const { graph, seed } = scenario("fin");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);

    const drawn = nodeButtons();
    expect(drawn).toHaveLength(graph.nodes.length);
    drawn.forEach((node) => {
      const { x, y } = translated(node);
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(SWARM_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SWARM_HEIGHT);
    });
  });

  it("draws the same arrangement twice for the same run — the picture is reproducible", () => {
    const first = scenario("fin");
    const { unmount } = render(<RelationshipGraphCard graph={first.graph} seed={first.seed} />);
    const once = nodeButtons().map((node) => node.getAttribute("transform"));
    unmount();

    const second = scenario("fin");
    render(<RelationshipGraphCard graph={second.graph} seed={second.seed} />);
    expect(nodeButtons().map((node) => node.getAttribute("transform"))).toEqual(once);
  });

  it("grows only as far as the run has got, and says how far that is", () => {
    const { graph, seed, run } = scenario("fin");
    const systemRounds = run.rounds.filter((round) => round.actor === "System");
    const { rerender } = render(
      <RelationshipGraphCard graph={graph} seed={seed} revealedRounds={systemRounds[0].index} />,
    );

    expect(nodeButtons()).toHaveLength(1);
    expect(screen.getByText(`1 / ${graph.nodes.length} entities · 0 / ${graph.edges.length} relationships`)).toBeInTheDocument();

    rerender(<RelationshipGraphCard graph={graph} seed={seed} revealedRounds={systemRounds[1].index} />);
    const afterMap = nodeButtons().length;
    expect(afterMap).toBeGreaterThan(1);
    expect(afterMap).toBeLessThan(graph.nodes.length);

    rerender(<RelationshipGraphCard graph={graph} seed={seed} revealedRounds={run.rounds.length} />);
    expect(nodeButtons()).toHaveLength(graph.nodes.length);
  });

  it("keeps a mark's position as the graph grows — the frame does not jump", () => {
    const { graph, seed, run } = scenario("fin");
    const systemRounds = run.rounds.filter((round) => round.actor === "System");
    const { rerender } = render(
      <RelationshipGraphCard graph={graph} seed={seed} revealedRounds={systemRounds[0].index} />,
    );

    // The place of every mark is decided once, from the whole graph, so revealing
    // more of it must not move what is already drawn — otherwise the picture would
    // re-arrange itself under the reader on every round.
    expect(graph.nodes[0].kind).toBe("policy");
    const draftBefore = nodeButtons()[0].getAttribute("transform");

    rerender(
      <RelationshipGraphCard graph={graph} seed={seed} revealedRounds={systemRounds[1].index} />,
    );
    expect(nodeButtons()[0].getAttribute("transform")).toBe(draftBefore);
  });
});

describe("relationship graph card — being read and used", () => {
  const nodeLabel = (graph: ReturnType<typeof scenario>["graph"], kind: "stakeholder") =>
    graph.nodes.find((node) => node.kind === kind)!.label;

  it("states a mark's relationships as text, all of them, when it is chosen", () => {
    const { graph, seed } = scenario("fin");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);

    const chosen = graph.nodes.find((node) => node.kind === "stakeholder")!;
    const expected = graph.edges
      .filter((edge) => edge.source === chosen.id || edge.target === chosen.id)
      .map((edge) => ({
        id: edge.id,
        relation: edge.relation,
        other: graph.nodes.find(
          (node) => node.id === (edge.source === chosen.id ? edge.target : edge.source),
        )!,
      }));

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${chosen.label}, `) }));

    // The panel is the graph's accessible equivalent: every relationship the
    // picture draws for this mark is stated here as text, and nothing else is.
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows).toHaveLength(expected.length);
    expected.forEach((entry) => {
      expect(rows.some((row) => row.textContent?.includes(entry.relation))).toBe(true);
      expect(rows.some((row) => row.textContent?.includes(entry.other.label))).toBe(true);
    });
    // The kinds are named in words beside the labels, not left to the picture.
    const panel = screen.getByRole("list").closest("div") as HTMLElement;
    expect(within(panel).getAllByText(relationshipKindLabel(chosen.kind)).length).toBeGreaterThan(0);
  });

  it("can be chosen from the keyboard", () => {
    const { graph, seed } = scenario("opc");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);
    const label = nodeLabel(graph, "stakeholder");

    const node = screen.getByRole("button", { name: new RegExp(`^${label}, `) });
    node.focus();
    expect(node).toHaveFocus();
    fireEvent.keyDown(node, { key: "Enter" });

    expect(within(screen.getByRole("list")).getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("draws the relations on the edges only when they are asked for", () => {
    const { graph, seed } = scenario("opc");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);
    const texts = () => document.querySelectorAll("svg text").length;
    const labelsOnly = texts();

    // Labels for the relations default off: at this density, edge labels over
    // every relationship are unreadable, which is why they are a choice.
    fireEvent.click(screen.getByRole("switch", { name: /edge labels/i }));
    expect(texts()).toBeGreaterThan(labelsOnly);

    fireEvent.click(screen.getByRole("switch", { name: /edge labels/i }));
    expect(texts()).toBe(labelsOnly);
  });

  it("lets a mark be dragged to where the pointer is", () => {
    const { graph, seed } = scenario("opc");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);
    const label = nodeLabel(graph, "stakeholder");
    const node = screen.getByRole("button", { name: new RegExp(`^${label}, `) });
    const group = node.closest("g") as SVGGElement;
    // The node's own surface, not the first <svg> in the DOM — the Refresh icon
    // is an SVG too, and it carries none of the surface's handlers.
    const surface = group.closest("svg") as SVGSVGElement;

    // jsdom performs no layout, so the surface reports the size the card gives it.
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: SWARM_WIDTH, height: SWARM_HEIGHT }) as DOMRect;

    const start = translated(group);
    fireEvent.pointerDown(node, { pointerId: 1 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 900, clientY: 700 });

    // While the pointer holds it, the mark sits exactly where the pointer is —
    // asserted before the release, because the springs take it back afterwards.
    const held = translated(group);
    expect(held.x).toBeCloseTo(900, 0);
    expect(held.y).toBeCloseTo(700, 0);
    expect(held).not.toEqual(start);

    // Releasing lets the school close around it again.
    fireEvent.pointerUp(surface, { pointerId: 1 });
  });

  it("still draws the whole graph when the surface is never animated", () => {
    const { graph, seed } = scenario("opc");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);
    // No animation frame is guaranteed in this environment, and that is the point:
    // the arrange-then-draw path has to stand on its own.
    expect(nodeButtons()).toHaveLength(graph.nodes.length);
  });

  it("draws the compact form without the controls the full card carries", () => {
    const graph = buildPreviewRelationshipGraph();
    render(<RelationshipGraphCard graph={graph} seed="landing::structure" compact />);

    expect(nodeButtons()).toHaveLength(graph.nodes.length);
    // No legend, no edge-label control, no heading: the compact form sits inside
    // the "Simulated population" block, which already names itself.
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("Reference document")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
    // Resetting is the one control it keeps.
    expect(screen.getByRole("button", { name: "Reset the arrangement" })).toBeInTheDocument();
  });

  it("draws the compact form larger, because it is read in a smaller card", () => {
    const graph = buildPreviewRelationshipGraph();
    const radiusOfFirstMark = (container: HTMLElement) =>
      // The mark is selected by its own class, not by its element name: a mark is a
      // circle only for the draft (a ring) and a group — a priority is a square and a
      // document a diamond. The draft is drawn first, so the first mark is the ring.
      // The agent field sits inside a nested group and carries a different class, so it
      // can never be mistaken for the mark.
      Number(container.querySelector("g[role='button'] > .graph-mark")?.getAttribute("r"));

    const full = render(<RelationshipGraphCard graph={graph} seed="same-seed" />);
    const fullRadius = radiusOfFirstMark(full.container);
    full.unmount();

    const compact = render(<RelationshipGraphCard graph={graph} seed="same-seed" compact />);
    const compactRadius = radiusOfFirstMark(compact.container);

    expect(fullRadius).toBeGreaterThan(0);
    expect(compactRadius).toBeGreaterThan(fullRadius);
  });

  it("holds the graph still, and starts no animation, when motion is not wanted", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true, // prefers-reduced-motion: reduce
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    const { graph, seed } = scenario("opc");
    render(<RelationshipGraphCard graph={graph} seed={seed} />);

    expect(nodeButtons()).toHaveLength(graph.nodes.length);

    // Nothing may drift: with motion not wanted, a passage of the pointer across
    // the surface is not even pushed into the model, so no mark may move at all.
    const marksBefore = nodeButtons().map((node) => node.getAttribute("transform"));
    const surface = nodeButtons()[0].closest("svg") as SVGSVGElement;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: SWARM_WIDTH, height: SWARM_HEIGHT }) as DOMRect;
    fireEvent.pointerMove(surface, { pointerId: 2, clientX: SWARM_WIDTH / 2, clientY: 6 });
    expect(nodeButtons().map((node) => node.getAttribute("transform"))).toEqual(marksBefore);

    // Reduced motion removes the animation, not the interaction: a mark can still
    // be moved by hand, and the graph still answers to the pointer.
    const label = nodeLabel(graph, "stakeholder");
    const node = screen.getByRole("button", { name: new RegExp(`^${label}, `) });
    const group = node.closest("g") as SVGGElement;

    fireEvent.pointerDown(node, { pointerId: 1 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 820, clientY: 640 });
    const held = translated(group);
    expect(held.x).toBeCloseTo(820, 0);
    expect(held.y).toBeCloseTo(640, 0);
    fireEvent.pointerUp(surface, { pointerId: 1 });
  });
});

/**
 * The agent field on the card. The platform says it models thousands of agents;
 * these guards are what stop the drawing contradicting the words, which is the
 * complaint the field was built to answer.
 */
describe("relationship graph card — the agent field", () => {
  it("rings each modelled group with the agents it stands for", () => {
    const { graph, seed } = scenario("fin");
    const { container } = render(<RelationshipGraphCard graph={graph} seed={seed} />);

    // The field is nested INSIDE the group marks, which is exactly what makes it
    // ride the group's transform — so the whole school of agents moves for free
    // rather than costing a calculation per mark per frame.
    const field = container.querySelectorAll("g[role='button'] .graph-agent-mark");
    expect(field.length).toBeGreaterThan(100);
    expect(field.length).toBeLessThanOrEqual(graph.population.marks);

    // Decoration, and declared as such: hidden from assistive technology and from
    // the pointer, so it can never swallow a click meant for the group.
    field.forEach((mark) => {
      const wrapper = mark.closest("g");
      expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
      expect(wrapper?.getAttribute("class")).toContain("pointer-events-none");
    });

    // The counting is never left to the eye alone.
    expect(screen.getByText(graph.population.caption)).toBeInTheDocument();
  });

  it("draws a smaller field in the compact card, and never one mark per agent", () => {
    const graph = buildPreviewRelationshipGraph();
    const { container } = render(
      <RelationshipGraphCard graph={graph} seed="landing::structure" compact />,
    );

    const field = container.querySelectorAll("g[role='button'] .graph-agent-mark");
    expect(field.length).toBeGreaterThan(30);
    expect(field.length).toBeLessThanOrEqual(AGENT_COMPACT_MARK_CAP + 6);
    // The marks are a sample of the population, not the population — which is why
    // the card states what one mark stands for.
    expect(field.length).toBeLessThan(graph.population.total);
  });

  it("draws only the field of the groups the run has actually reached", () => {
    const { graph, seed, run } = scenario("fin");
    const systemRounds = run.rounds.filter((round) => round.actor === "System");
    const { container } = render(
      <RelationshipGraphCard graph={graph} seed={seed} revealedRounds={systemRounds[0].index} />,
    );

    // One mark so far, and it is the draft — not a modelled group, so there is no
    // agent field yet: the population arrives with the groups that stand for it.
    expect(container.querySelectorAll("g[role='button'] .graph-agent-mark").length).toBe(0);
  });
});
/**
 * THE DRAWING ITSELF.
 *
 * These guards exist because the surface was reported as looking poor: outlines were
 * expressed in the 1000×750 virtual space and then scaled down, so a mark's outline
 * became a fraction of a pixel and anti-aliased into grey; every group was drawn in one
 * colour; and the agent field read as a smudge. Each guard below fails if any of that
 * comes back, which is what makes the fix more than a one-off tidy-up.
 */
describe("relationship graph card — the drawing", () => {
  /** The `<g role="button">` that a given node is drawn as, found by its own label. */
  const groupFor = (container: HTMLElement, node: { label: string; kind: string }) => {
    const group = Array.from(container.querySelectorAll("g[role='button']")).find((element) =>
      (element.getAttribute("aria-label") ?? "").startsWith(
        `${node.label}, ${relationshipKindLabel(node.kind as never)},`,
      ),
    );
    expect(group, `no mark drawn for "${node.label}"`).toBeTruthy();
    return group as SVGGElement;
  };

  /** The drawn mark for a node — selected by its class, never by its element name. */
  const markFor = (container: HTMLElement, node: { label: string; kind: string }) => {
    const mark = groupFor(container, node).querySelector(":scope > .graph-mark");
    expect(mark, `no mark element for "${node.label}"`).toBeTruthy();
    return mark as SVGElement;
  };

  it("gives every kind its own shape, so shape carries the kind and colour the group", () => {
    const { graph, seed } = scenario("fin");
    const { container } = render(<RelationshipGraphCard graph={graph} seed={seed} />);

    graph.nodes.forEach((node) => {
      const mark = markFor(container, node);
      // A round kind is a circle, a pointed kind a polygon — taken from the palette's
      // own map, so the surface and the legend cannot drift apart.
      const expected = shapePoints(GRAPH_NODE_SHAPE[node.kind], 1) ? "polygon" : "circle";
      expect(mark.tagName.toLowerCase(), `${node.kind} drawn`).toBe(expected);
    });

    // The draft is the RING: no fill at all, the heaviest line on the surface.
    const draft = markFor(container, graph.nodes.find((node) => node.kind === "policy")!);
    expect(draft.getAttribute("fill")).toBe("none");
    expect(Number(draft.getAttribute("stroke-width"))).toBe(GRAPH_RING_STROKE);
  });
it("colours each group with its own palette colour, outlined in ink", () => {
    const { graph, seed } = scenario("fin");
    const { container } = render(<RelationshipGraphCard graph={graph} seed={seed} />);

    const groups = graph.nodes.filter((node) => node.kind === "stakeholder");
    const fills = groups.map((node, position) => {
      const mark = markFor(container, node);
      const fill = mark.getAttribute("fill");
      expect(fill, `${node.label} is drawn in its own group colour`).toBe(
        graphGroupColour(position),
      );
      // The ink outline is what defines the shape: the palest group fill measures
      // 1.32:1 against the white card, so colour alone could never carry it.
      expect(mark.getAttribute("stroke")).toBe(GRAPH_INK);
      expect(Number(mark.getAttribute("stroke-width"))).toBe(GRAPH_MARK_OUTLINE_STROKE);
      return fill;
    });

    // `fin` models six groups, so the whole five-colour palette is really reached —
    // including the fifth colour, which only a fifth group can produce.
    expect(new Set(fills).size).toBe(GRAPH_GROUP_COLOURS.length);

    // And the field of agents standing for a group is drawn in that group's colour,
    // so the picture and the field say the same thing.
    groups.forEach((node, position) => {
      const field = groupFor(container, node).querySelectorAll(".graph-agent-mark");
      expect(field.length, `${node.label} has an agent field`).toBeGreaterThan(0);
      field.forEach((mark) => {
        expect(mark.getAttribute("fill")).toBe(graphGroupColour(position));
      });
    });

    // The two reserved kinds keep their own fills, so a priority or a document is
    // never mistaken for a modelled group.
    const priority = markFor(container, graph.nodes.find((node) => node.kind === "priority")!);
    expect(priority.getAttribute("fill")).toBe(GRAPH_NODE_FILL.priority);
    const corpus = markFor(container, graph.nodes.find((node) => node.kind === "corpus")!);
    expect(corpus.getAttribute("fill")).toBe(GRAPH_NODE_FILL.corpus);
  });
it("pins every stroke to real pixels, so nothing thins into a grey smear", () => {
    const { graph, seed } = scenario("fin");
    const { container } = render(<RelationshipGraphCard graph={graph} seed={seed} />);

    // Edges: a pixel weight, pinned, so the line does not shrink with the card.
    const edges = container.querySelectorAll("svg line");
    expect(edges.length).toBeGreaterThan(0);
    edges.forEach((edge) => {
      expect(edge.getAttribute("vector-effect")).toBe("non-scaling-stroke");
      const width = Number(edge.getAttribute("stroke-width"));
      expect(width).toBeGreaterThanOrEqual(GRAPH_EDGE_STROKE);
      expect(width).toBeLessThanOrEqual(GRAPH_EDGE_STROKE + GRAPH_EDGE_STROKE_STRENGTH);
    });

    // Marks: one outline each, pinned, and never thinner than the outline weight.
    const marks = container.querySelectorAll("svg .graph-mark");
    expect(marks).toHaveLength(graph.nodes.length);
    marks.forEach((mark) => {
      expect(mark.getAttribute("vector-effect")).toBe("non-scaling-stroke");
      const width = Number(mark.getAttribute("stroke-width"));
      expect(width).toBeGreaterThanOrEqual(GRAPH_MARK_OUTLINE_STROKE);
      expect(width).toBeLessThanOrEqual(GRAPH_RING_STROKE);
    });
  });

  it("draws the legend as four shapes, one per kind — not four colour dots", () => {
    const graph = buildPreviewRelationshipGraph();
    const { container } = render(<RelationshipGraphCard graph={graph} seed="legend::seed" />);

    const swatches = container.querySelectorAll(".graph-legend-swatch");
    expect(swatches).toHaveLength(RELATIONSHIP_KINDS.length);
    swatches.forEach((swatch) => {
      const drawn = swatch.querySelector("circle, polygon");
      expect(drawn, "a legend swatch with no shape in it").not.toBeNull();
      expect(drawn!.getAttribute("stroke")).toBe(GRAPH_INK);
    });

    // And the legend states which channel carries what, so it is not left to inference.
    expect(screen.getByText(/Shape is the kind/)).toBeInTheDocument();
  });
});
