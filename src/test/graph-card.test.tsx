import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RelationshipGraphCard } from "@/components/relationship/RelationshipGraphCard";
import { findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import {
  RELATION_BANK,
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
  const run = assessmentService.buildRun(requestFor(departmentId));
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
      Number(container.querySelector("g[role='button'] circle")?.getAttribute("r"));

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
