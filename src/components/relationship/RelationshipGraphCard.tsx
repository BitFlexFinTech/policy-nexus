import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AGENT_COMPACT_MARK_CAP,
  AGENT_MARK_CAP,
  AGENT_MARK_RADIUS,
  RELATIONSHIP_KINDS,
  relationshipKindLabel,
  type RelationshipAgent,
  type RelationshipGraph,
  type RelationshipNode,
  type RelationshipNodeKind,
} from "@/services/assessment/network";
import {
  GRAPH_EDGE_STROKE,
  GRAPH_EDGE_STROKE_STRENGTH,
  GRAPH_FOCUS_STROKE,
  GRAPH_GROUP_COLOURS,
  GRAPH_INK,
  GRAPH_MARK_OUTLINE_STROKE,
  GRAPH_NODE_FILL,
  GRAPH_NODE_SHAPE,
  GRAPH_RING_STROKE,
  graphGroupColour,
  shapePoints,
} from "@/lib/graph/palette";
import {
  NODE_RADIUS,
  SWARM_HEIGHT,
  SWARM_WIDTH,
  createSwarm,
  impulseAt,
  isSwarmAwake,
  settleSwarm,
  stepSwarm,
  wakeSwarm,
} from "@/lib/graph/swarm";
import { cn } from "@/lib/utils";

/**
 * The relationship graph behind a run, drawn as a school.
 *
 * WHAT IT SHOWS: the draft at the centre, the stakeholder groups the run models,
 * the priorities it is assessed against and the department's own reference
 * documents — every node is a real part of the run or of the department's
 * configuration, and which round each one appears on is read from the run's own
 * event record, so the graph grows only as far as the simulation has actually
 * got. Selecting a node states its relationships as text, so the information is
 * never carried by the picture alone.
 *
 * AND THE AGENTS THOSE GROUPS STAND FOR: every modelled group is ringed by the
 * agents it represents, so a page that says it models thousands of agents shows
 * thousands of agents' worth of marks rather than a handful of circles. The field
 * is drawn at a capped density — the cap is stated in words on the card, so the
 * drawing never claims to be larger than it is — and each mark is drawn INSIDE
 * its group's element, which means the whole field rides the group's transform
 * and the animation costs nothing extra per mark.
 *
 * HOW IT MOVES: a hand-written force model (`@/lib/graph/swarm`) holds the
 * structure together and makes the nodes school together; a node that is DRAGGED
 * pushes its neighbours apart, and the school closes up again when the push
 * stops. A pointer that merely passes over the surface never moves a node — a
 * target that dodges the cursor is a target nobody can click.
 *
 * WHY THE FIRST PAINT IS ALREADY ARRANGED: the settled layout is computed
 * synchronously, so the graph renders complete without an animation frame. The
 * animation loop is an enhancement layered over it, which is also why the
 * component renders unchanged in a test environment with no animation support.
 * (see .clinerules/04-determinism-and-validation.md)
 *
 * Determinism: the arrangement comes from the seeded PRNG through the graph's
 * seed — no `Math.random`, no clock. Motion advances in fixed steps, never by
 * reading the time, so the same run draws the same graph twice.
 */

/** The virtual space the layout is computed in; the SVG scales it to the card. */
const VIEW_BOX = `0 0 ${SWARM_WIDTH} ${SWARM_HEIGHT}`;

/** How hard a DRAGGED node shoves the surrounding nodes, and how far that reach
 *  extends, in virtual units. A pointer that merely hovers never moves a node: a
 *  target that dodges the cursor is a target nobody can click. */
const DRAG_REACH = 300;
const DRAG_PUSH = 9;

/**
 * The ALWAYS-ON AMBIENT DRIFT (owner's instruction, demo): the school is never perfectly still —
 * the nodes stay quietly alive, moving EXTREMELY slowly. It is a handful of virtual units over
 * roughly half a minute, applied ONLY in the drawing step (never in the physics), so the settled
 * layout and every test of it are untouched. It is frame-based (no clock is read), so the same run
 * draws the same motion. Reduced motion stops it entirely, and a dragged or hovered node is exempt,
 * so a target the reader is touching never drifts out from under the pointer.
 */
const DRIFT_X = 6;
const DRIFT_Y = 5;
const DRIFT_SPEED = 0.004;

/** How far beyond its drawn mark a node still counts as the target, so a small
 *  mark is an easy thing to aim at and choose. */
const HIT_PADDING = 16;

/** Labels are shortened rather than wrapped: a graph is not a paragraph. */
const shortLabel = (label: string, limit = 26): string =>
  label.length > limit ? `${label.slice(0, limit - 1).trimEnd()}\u2026` : label;

/** Node radius by kind, read from the ONE ranking (`@/lib/graph/swarm`), so the mark
 *  that is drawn and the space the physics keeps for it can never disagree. */
const radiusOf = (node: RelationshipNode): number => NODE_RADIUS[node.kind];

/**
 * What a mark is filled with.
 *
 * Colour answers "which group", so a stakeholder group is filled with ITS OWN colour
 * from `@/lib/graph/palette`. A stated priority and a reference document take the two
 * reserved fills. The draft takes no fill at all — it is drawn as a ring, the one mark
 * that never competes for a colour, because it is unique on the surface already.
 */
const fillOf = (kind: RelationshipNodeKind, groupColour: string | undefined): string => {
  if (kind === "stakeholder") return groupColour ?? GRAPH_INK;
  if (kind === "priority") return GRAPH_NODE_FILL.priority;
  if (kind === "corpus") return GRAPH_NODE_FILL.corpus;
  return "none";
};

/**
 * One legend swatch, drawn as the SAME SHAPE the surface draws for that kind — so the
 * legend answers "what does a square mean" rather than "what does green mean". The
 * swatch is decorative (the written label beside it says the kind), and it is not
 * scaled by the card, so its strokes are plain pixels.
 */
function MarkSwatch({ kind }: { kind: RelationshipNodeKind }) {
  const shape = GRAPH_NODE_SHAPE[kind];
  const points = shapePoints(shape, 5);
  const fill = fillOf(kind, GRAPH_GROUP_COLOURS[0]);
  return (
    <svg
        width={14}
        height={14}
        viewBox="-7 -7 14 14"
        aria-hidden="true"
        className="graph-legend-swatch shrink-0"
      >
      {points ? (
        <polygon
          points={points}
          fill={fill}
          stroke={GRAPH_INK}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      ) : (
        <circle
          r={5}
          fill={shape === "ring" ? "none" : fill}
          stroke={GRAPH_INK}
          strokeWidth={shape === "ring" ? 2 : 1.2}
        />
      )}
    </svg>
  );
}

export interface RelationshipGraphCardProps {
  graph: RelationshipGraph;
  /** The seed the resting arrangement is derived from — the run's own seed, so
   *  the same run always draws the same layout. */
  seed: string;
  /** How many rounds of the run have been revealed. Nodes and edges whose
   *  arrival round is beyond this have not been drawn yet. Omit for a graph that
   *  is already fully grown (the public schematic). */
  revealedRounds?: number;
  /** The compact form used on the public page: the surface and a reset only. */
  compact?: boolean;
  className?: string;
}

export function RelationshipGraphCard({
  graph,
  seed,
  revealedRounds,
  compact = false,
  className,
}: RelationshipGraphCardProps) {
  /**
   * The settled arrangement. Created SYNCHRONOUSLY, so the graph is fully
   * arranged on the first render — before any animation frame exists.
   */
  const [layout, setLayout] = useState(() => settleSwarm(createSwarm(graph, `${seed}::swarm`)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const edgeLabelId = useId();
  const headingId = useId();

  const nodeEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef(new Map<string, SVGLineElement>());
  const edgeLabelEls = useRef(new Map<string, SVGTextElement>());
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  /** The node under the pointer — it is exempt from the ambient drift, so a target the reader is
   *  aiming at holds still. A ref, not state, so hover never restarts the drift loop. */
  const hoveredRef = useRef<string | null>(null);
  /** A frame counter for the ambient drift. Frame-based, so no clock is read (determinism). */
  const driftPhase = useRef(0);

  const index = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout]);
  /** A stable per-node number, so each node drifts on its own slow phase. */
  const driftOrder = useMemo(
    () => new Map(layout.nodes.map((node, position) => [node.id, position])),
    [layout],
  );
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const edgeById = useMemo(() => new Map(graph.edges.map((edge) => [edge.id, edge])), [graph]);

  // A new run (or an explicit reset) rebuilds the arrangement from the seed.
  const rebuild = useCallback(() => {
    setLayout(settleSwarm(createSwarm(graph, `${seed}::swarm`)));
  }, [graph, seed]);

  useEffect(() => {
    rebuild();
    setSelectedId(null);
  }, [rebuild]);

  // Reduced motion is respected in the model, not only in CSS: no loop starts.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  // Escape closes the selected node's detail panel — the standard way out of a panel that
  // pops open on the right of the graph. Home/End are left to the page.
  useEffect(() => {
    if (!selectedId || typeof window === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const visibleRounds = revealedRounds ?? Number.POSITIVE_INFINITY;
  /**
   * The compact schematic is drawn into a smaller card, so the same structure is
   * drawn larger inside it — marks, labels and strokes scale together. Without
   * it the compact labels fall to about 7px, which is not a size anybody reads.
   */
  const visualScale = compact ? 1.6 : 1;
  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => (graph.nodeArrival[node.id] ?? 1) <= visibleRounds),
    [graph, visibleRounds],
  );
  const visibleEdges = useMemo(
    () => graph.edges.filter((edge) => (graph.edgeArrival[edge.id] ?? 1) <= visibleRounds),
    [graph, visibleRounds],
  );

  /**
   * The agent marks, grouped by the node they belong to and thinned to what the
   * card can draw. The compact schematic gets a smaller budget because it is read
   * in a much smaller card, where a full field would read as a smudge.
   */
  const agentMarks = useMemo(() => {
    const budget = compact ? AGENT_COMPACT_MARK_CAP : AGENT_MARK_CAP;
    const grouped = new Map<string, RelationshipAgent[]>();
    graph.agents.forEach((agent) => {
      const list = grouped.get(agent.groupId) ?? [];
      list.push(agent);
      grouped.set(agent.groupId, list);
    });
    const perGroup = Math.max(6, Math.floor(budget / Math.max(grouped.size, 1)));
    grouped.forEach((list, groupId) => grouped.set(groupId, list.slice(0, perGroup)));
    return grouped;
  }, [graph, compact]);

  /**
   * Write the current positions straight to the DOM. The animation loop calls
   * this every frame instead of setting state, so no frame costs a render.
   */
  const paint = useCallback(() => {
    const phase = driftPhase.current;
    // The drawn position of each node: its settled position, plus a tiny, slow ambient drift —
    // unless it is being dragged or is under the pointer, in which case it stays exactly put.
    const drawn = new Map<string, { x: number; y: number }>();
    layout.nodes.forEach((node) => {
      let x = node.x;
      let y = node.y;
      if (!node.pinned && node.id !== hoveredRef.current) {
        const order = driftOrder.get(node.id) ?? 0;
        x += DRIFT_X * Math.sin(phase * DRIFT_SPEED + order * 1.7);
        y += DRIFT_Y * Math.sin(phase * DRIFT_SPEED * 0.8 + order * 2.3);
      }
      drawn.set(node.id, { x, y });
      const element = nodeEls.current.get(node.id);
      if (element) element.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });
    layout.edges.forEach((edge) => {
      const element = edgeEls.current.get(edge.id);
      if (!element) return;
      const source = drawn.get(edge.source);
      const target = drawn.get(edge.target);
      if (!source || !target) return;
      element.setAttribute("x1", source.x.toFixed(2));
      element.setAttribute("y1", source.y.toFixed(2));
      element.setAttribute("x2", target.x.toFixed(2));
      element.setAttribute("y2", target.y.toFixed(2));
    });
    edgeLabelEls.current.forEach((element, edgeId) => {
      const edge = edgeById.get(edgeId);
      if (!edge) return;
      const source = drawn.get(edge.source);
      const target = drawn.get(edge.target);
      if (!source || !target) return;
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      element.setAttribute("transform", `translate(${midX.toFixed(2)} ${(midY - 9 * visualScale).toFixed(2)})`);
    });
  }, [edgeById, layout, visualScale, driftOrder]);

  // The ambient drift is ALWAYS ON (owner's instruction): the loop runs for as long as the card
  // is on screen, so the nodes stay quietly alive. The physics is stepped only while the school is
  // moving; the drift itself is a few units over roughly half a minute, applied at the drawing
  // step. Without requestAnimationFrame, or under reduced motion, the settled layout simply
  // stands — still readable, just perfectly still.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;
    if (reducedMotion) return;

    let running = true;
    let frame = 0;

    const tick = () => {
      if (!running) return;
      if (isSwarmAwake(layout)) stepSwarm(layout, 1 / 60);
      driftPhase.current += 1;
      paint();
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [layout, paint, reducedMotion]);

  /**
   * The colour each modelled group is drawn in. A group's place among the groups fixes
   * its colour, and the field of agents that stand for it is drawn in the same colour —
   * so the picture, the field and the mark all say the same thing. Past the fifth group
   * the palette repeats, which is why every mark also carries its written label.
   */
  const groupColourById = useMemo(() => {
    const colours = new Map<string, string>();
    graph.nodes
      .filter((node) => node.kind === "stakeholder")
      .forEach((node, position) => colours.set(node.id, graphGroupColour(position)));
    return colours;
  }, [graph]);

  /** How many relationships touch each node — read once, not per row. */
  const degreeOf = useMemo(() => {
    const degree: Record<string, number> = {};
    graph.nodes.forEach((node) => {
      degree[node.id] = 0;
    });
    graph.edges.forEach((edge) => {
      degree[edge.source] = (degree[edge.source] ?? 0) + 1;
      degree[edge.target] = (degree[edge.target] ?? 0) + 1;
    });
    return degree;
  }, [graph]);

  /** The nodes the selection is joined to; everything else dims. */
  const connectedToSelection = useMemo(() => {
    const connected = new Set<string>();
    if (!selectedId) return connected;
    graph.edges.forEach((edge) => {
      if (edge.source === selectedId) connected.add(edge.target);
      if (edge.target === selectedId) connected.add(edge.source);
    });
    return connected;
  }, [graph, selectedId]);

  /** The selected node's relationships, as text: counterpart, kind and relation. */
  const relationships = useMemo(() => {
    if (!selectedId) return [];
    return graph.edges
      .filter((edge) => edge.source === selectedId || edge.target === selectedId)
      .map((edge) => ({
        id: edge.id,
        relation: edge.relation,
        other: nodeById.get(edge.source === selectedId ? edge.target : edge.source),
      }))
      .filter(
        (entry): entry is { id: string; relation: string; other: RelationshipNode } =>
          Boolean(entry.other),
      );
  }, [graph, nodeById, selectedId]);

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null;

  /** Client coordinates → the virtual space the layout lives in. */
  const toVirtual = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: SWARM_WIDTH / 2, y: SWARM_HEIGHT / 2 };
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: SWARM_WIDTH / 2, y: SWARM_HEIGHT / 2 };
    // `preserveAspectRatio: meet` may letterbox, so the offset is taken out here.
    const scale = Math.min(rect.width / SWARM_WIDTH, rect.height / SWARM_HEIGHT);
    const offsetX = (rect.width - SWARM_WIDTH * scale) / 2;
    const offsetY = (rect.height - SWARM_HEIGHT * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }, []);

  /** Shove the school at a point. The impulse itself wakes the model. */
  const push = useCallback(
    (point: { x: number; y: number }, reach: number, strength: number) => {
      impulseAt(layout, point.x, point.y, reach, strength);
    },
    [layout],
  );

  const handlePointerDown = (event: React.PointerEvent<SVGGElement>, nodeId: string) => {
    const node = index.get(nodeId);
    if (!node) return;
    // Capture on the surface, so the drag survives leaving the card.
    svgRef.current?.setPointerCapture?.(event.pointerId);
    node.pinned = true;
    node.vx = 0;
    node.vy = 0;
    dragRef.current = { id: nodeId, moved: false };
    // The model has to be awake to carry the drag, even from a settled state.
    wakeSwarm(layout);
    setSelectedId(nodeId);
  };

  // Moving the pointer now does exactly one thing: carry a DRAGGED node. A pointer
  // that is merely passing over the surface never pushes the school — a node that
  // flees the cursor is a node nobody can click, and clickability wins over the effect.
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const point = toVirtual(event.clientX, event.clientY);
    const node = index.get(drag.id);
    if (!node) return;
    node.x = point.x;
    node.y = point.y;
    drag.moved = true;
    push(point, DRAG_REACH, DRAG_PUSH);
    paint();
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    const node = index.get(drag.id);
    if (node) node.pinned = false;
    dragRef.current = null;
    // Released: the school closes up around the mark that was held.
    wakeSwarm(layout);
  };

  return (
    <section
      aria-labelledby={compact ? undefined : headingId}
      aria-label={compact ? "The relationship structure a simulation builds" : undefined}
      className={cn(!compact && "flex flex-col rounded-lg border bg-card", className)}
    >
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2.5">
          <div>
            <h3
              id={headingId}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Graph Relationship Visualization
            </h3>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {visibleNodes.length} / {graph.nodes.length} entities · {visibleEdges.length} /{" "}
              {graph.edges.length} relationships
            </p>
            {/* What the marks in the field stand for. Read from the graph's own
                population, so the number here and the number drawn cannot differ. */}
            <p className="mt-1 max-w-md text-[10px] leading-relaxed text-muted-foreground">
              {graph.population.caption}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor={edgeLabelId}
              className="flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              <Switch
                id={edgeLabelId}
                checked={showEdgeLabels}
                onCheckedChange={setShowEdgeLabels}
                className="h-4 w-7"
              />
              Show edge labels
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={rebuild}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* The graph and the selected node's detail panel sit side by side. The panel is on the
          RIGHT of the graph (the owner's instruction), and stacks under it on narrow screens. */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
      <div className={cn("relative min-w-0 flex-1", compact ? "" : "p-3")}>
        <div className="aspect-[4/3] w-full">
          <svg
            ref={svgRef}
            viewBox={VIEW_BOX}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full select-none"
            role="group"
            aria-label={`Relationship network: ${visibleNodes.length} of ${graph.nodes.length} entities, ${visibleEdges.length} of ${graph.edges.length} relationships, ${graph.population.total} simulated agents`}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
          >
            <g>
              {visibleEdges.map((edge) => {
                const source = index.get(edge.source);
                const target = index.get(edge.target);
                if (!source || !target) return null;
                const focusId = selectedId ?? hoveredId;
                const emphasised = focusId
                  ? edge.source === focusId || edge.target === focusId
                  : true;
                return (
                  <line
                    key={edge.id}
                    ref={(element) => {
                      if (element) edgeEls.current.set(edge.id, element);
                      else edgeEls.current.delete(edge.id);
                    }}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    // A real pixel weight, pinned with `non-scaling-stroke`: the line
                    // keeps its weight however far the card is scaled down, instead of
                    // thinning into a grey smear in a small card.
                    strokeWidth={GRAPH_EDGE_STROKE + edge.strength * GRAPH_EDGE_STROKE_STRENGTH}
                    vectorEffect="non-scaling-stroke"
                    className={cn(
                      emphasised ? "stroke-primary/45" : "stroke-foreground/15",
                      !emphasised && "opacity-40",
                    )}
                  />
                );
              })}
            </g>

            {/* Edge labels are decoration for the eye: the same relations are
                stated as text in the detail panel below, so this layer is hidden
                from assistive technology rather than read twice. */}
            <g aria-hidden="true">
              {showEdgeLabels &&
                visibleEdges.map((edge) => {
                  const source = index.get(edge.source);
                  const target = index.get(edge.target);
                  if (!source || !target) return null;
                  const focusId = selectedId ?? hoveredId;
                  if (focusId && edge.source !== focusId && edge.target !== focusId) return null;
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2 - 9 * visualScale;
                  return (
                    <text
                      key={`label-${edge.id}`}
                      ref={(element) => {
                        if (element) edgeLabelEls.current.set(edge.id, element);
                        else edgeLabelEls.current.delete(edge.id);
                      }}
                      transform={`translate(${midX.toFixed(2)} ${midY.toFixed(2)})`}
                      textAnchor="middle"
                      fontSize={14 * visualScale}
                      className="fill-muted-foreground font-mono"
                      style={{ paintOrder: "stroke" }}
                      stroke="hsl(var(--card))"
                      strokeWidth={5 * visualScale}
                    >
                      {edge.relation}
                    </text>
                  );
                })}
            </g>

            <g>
              {visibleNodes.map((node) => {
                const at = index.get(node.id);
                const isSelected = selectedId === node.id;
                const isRinged = isSelected || focusedId === node.id || hoveredId === node.id;
                const dimmed =
                  Boolean(selectedId) && !isSelected && !connectedToSelection.has(node.id);
                const radius = radiusOf(node) * visualScale;
                const groupColour = groupColourById.get(node.id);
                const shape = GRAPH_NODE_SHAPE[node.kind];
                const markPoints = shapePoints(shape, radius);
                return (
                  <g
                    key={node.id}
                    ref={(element) => {
                      if (element) nodeEls.current.set(node.id, element);
                      else nodeEls.current.delete(node.id);
                    }}
                    transform={`translate(${(at?.x ?? SWARM_WIDTH / 2).toFixed(2)} ${(at?.y ?? SWARM_HEIGHT / 2).toFixed(2)})`}
                    className={cn(
                      "animate-graph-node-in cursor-grab motion-reduce:animate-none",
                      dimmed && "opacity-30",
                    )}
                    // Only the node swallows touch gestures, never the surface, so a
                    // finger drag on a node moves it while the page still scrolls.
                    style={{ touchAction: "none" }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${node.label}, ${relationshipKindLabel(node.kind)}, ${degreeOf[node.id] ?? 0} relationships`}
                    onClick={() => setSelectedId(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(node.id);
                      }
                    }}
                    onPointerDown={(event) => handlePointerDown(event, node.id)}
                    onPointerEnter={() => {
                      setHoveredId(node.id);
                      hoveredRef.current = node.id;
                    }}
                    onPointerLeave={() => {
                      setHoveredId(null);
                      hoveredRef.current = null;
                    }}
                    onFocus={() => setFocusedId(node.id)}
                    onBlur={() => setFocusedId(null)}
                  >
                    {/* A generous invisible hit area, so a small mark is still an easy
                        thing to aim at and choose. It is drawn FIRST — behind the mark
                        and its label — so it never hides what the eye reads, yet the
                        whole disc is the click target for that node. */}
                    <circle
                      r={radius + HIT_PADDING * visualScale}
                      fill="transparent"
                      className="graph-hit"
                      aria-hidden="true"
                    />
                    {/* The agents this group stands for, drawn AROUND it and BEHIND
                        it: the group's own mark and its label stay on top, so the
                        field thickens the picture without ever obscuring what the
                        picture is for. Hidden from assistive technology and from the
                        pointer — the caption states what each mark stands for.
                        Scaled with the node, so the field stays proportional to its
                        group in the compact card as well. */}
                    {node.kind === "stakeholder" && (agentMarks.get(node.id)?.length ?? 0) > 0 && (
                      <g aria-hidden="true" className="pointer-events-none">
                        {agentMarks.get(node.id)?.map((agent) => (
                          <circle
                            key={agent.id}
                            cx={agent.dx * visualScale}
                            cy={agent.dy * visualScale}
                            r={AGENT_MARK_RADIUS * visualScale}
                            // The agents are drawn in THEIR OWN GROUP'S colour, so the
                            // field says which group it belongs to instead of every
                            // group's marks reading as one grey-gold fog.
                            fill={groupColour}
                            fillOpacity={0.9}
                            // A pinned hairline of the same colour: it keeps each mark's
                            // edge crisp when the card is small, so the field reads as
                            // marks rather than as a smudge.
                            stroke={groupColour}
                            strokeWidth={0.6}
                            vectorEffect="non-scaling-stroke"
                            className="graph-agent-mark"
                          />
                        ))}
                      </g>
                    )}
                    {/* The focus, selection and hover indicator. It is drawn DASHED and
                        in the platform's own primary, so it is never mistaken for the
                        mark's solid ink outline — a shape difference, not a colour one,
                        which is what makes it survive any colour perception. */}
                    {isRinged && (
                      <circle
                        r={radius + 5 * visualScale}
                        fill="none"
                        strokeWidth={GRAPH_FOCUS_STROKE}
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
                        className="stroke-primary graph-focus-ring"
                      />
                    )}
                    {/* The mark itself. SHAPE answers "what kind is this", COLOUR answers
                        "which group", and both are backed up by the written label below
                        — so nothing on this surface is carried by colour alone. The
                        draft is a ring (no fill); a group is a circle, a priority a
                        square, a document a diamond. Every filled mark is outlined in
                        ink, because the fills measure as little as 1.32:1 against the
                        white card (the yellow) and the outline is what defines the shape. */}
                    {markPoints ? (
                      <polygon
                        points={markPoints}
                        fill={fillOf(node.kind, groupColour)}
                        stroke={GRAPH_INK}
                        strokeWidth={GRAPH_MARK_OUTLINE_STROKE}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className="graph-mark"
                      />
                    ) : (
                      <circle
                        r={radius}
                        fill={shape === "ring" ? "none" : fillOf(node.kind, groupColour)}
                        stroke={GRAPH_INK}
                        strokeWidth={shape === "ring" ? GRAPH_RING_STROKE : GRAPH_MARK_OUTLINE_STROKE}
                        vectorEffect="non-scaling-stroke"
                        className="graph-mark"
                      />
                    )}
                    <text
                      y={radius + 18 * visualScale}
                      textAnchor="middle"
                      fontSize={15 * visualScale}
                      className={cn("fill-foreground", node.kind === "policy" && "font-semibold")}
                      // A card-coloured halo under the glyphs, so an edge crossing a
                      // label does not run through the text. Unlike the marks' outlines
                      // this is NOT pinned to pixels: a halo has to stay proportional to
                      // the text it backs, so it scales with the glyph.
                      style={{ paintOrder: "stroke" }}
                      stroke="hsl(var(--card))"
                      strokeWidth={4 * visualScale}
                    >
                      {shortLabel(node.label)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {compact && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={rebuild}
            aria-label="Reset the arrangement"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>

      {!compact && selectedNode && (
        <aside
          aria-label="Selected node"
          className="min-w-0 border-t px-4 py-3 lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0"
        >
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-xs font-semibold text-foreground">{selectedNode.label}</p>
              <span className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {relationshipKindLabel(selectedNode.kind)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {selectedNode.note}
            </p>
            <ul className="mt-2.5 space-y-1">
              {relationships.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-2 text-[11px] leading-relaxed"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                    {entry.relation}
                  </span>
                  <span className="text-foreground">{entry.other.label}</span>
                  <span className="text-muted-foreground">
                    · {relationshipKindLabel(entry.other.kind)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
      </div>

      {/* The legend names the four kinds and draws each one AS ITS SHAPE, so the legend
          answers "what does a square mean" rather than "what does green mean" — colour
          alone is never the only channel. The trailing line states the division of labour
          the whole surface follows. */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5">
          {RELATIONSHIP_KINDS.map((kind) => (
            <span
              key={kind.kind}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              <MarkSwatch kind={kind.kind} />
              {kind.label}
            </span>
          ))}
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Shape is the kind · colour is the group
          </span>
        </div>
      )}

      {/* When nothing is selected, the hint sits under the graph. When a node IS selected its
          relationships are stated in the right-hand panel above — the same information the
          picture carries, so the graph is never the only way to read it. */}
      {!compact && !selectedNode && (
        <div className="border-t px-4 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Select a node to read how it relates to the rest of the run. Drag any node to move it
            through the network — the nodes around it part, then close again.
          </p>
        </div>
      )}
    </section>
  );
}



