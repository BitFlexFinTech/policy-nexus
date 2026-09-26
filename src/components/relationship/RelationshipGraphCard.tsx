import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  RELATIONSHIP_KINDS,
  relationshipKindLabel,
  type RelationshipGraph,
  type RelationshipNode,
  type RelationshipNodeKind,
} from "@/services/assessment/network";
import {
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
 * HOW IT MOVES: a hand-written force model (`@/lib/graph/swarm`) holds the
 * structure together and makes the nodes school together; a node that is dragged
 * — or the pointer, as it crosses the surface — pushes its neighbours apart, and
 * the school closes up again when the push stops.
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

/** How hard the pointer and a dragged node shove the surrounding nodes, and how
 *  far that reach extends, in virtual units. */
const DRAG_REACH = 300;
const DRAG_PUSH = 9;
const POINTER_REACH = 190;
const POINTER_PUSH = 1.6;

/** Labels are shortened rather than wrapped: a graph is not a paragraph. */
const shortLabel = (label: string, limit = 26): string =>
  label.length > limit ? `${label.slice(0, limit - 1).trimEnd()}\u2026` : label;

/** Node radius by kind, read from the same ranking the physics uses. */
const radiusOf = (node: RelationshipNode): number => {
  if (node.kind === "policy") return 26;
  if (node.kind === "stakeholder") return 15;
  if (node.kind === "priority") return 11;
  return 9;
};

/** Node fill by kind — existing palette tokens only, no new colour literal.
 *  Four visually distinct marks: the hub is the institutional green, the groups
 *  the gold, the priorities the success green, and the documents the neutral
 *  grey they are drawn from. Note the corpus mark is NOT `warning`: `--warning`
 *  and `--gold` are the same colour in this palette, so a document drawn in
 *  `warning` would be indistinguishable from a stakeholder group. */
const NODE_FILL: Record<RelationshipNodeKind, string> = {
  policy: "fill-primary",
  stakeholder: "fill-gold",
  priority: "fill-success",
  corpus: "fill-muted-foreground",
};

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

  const index = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout]);
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
   * Write the current positions straight to the DOM. The animation loop calls
   * this every frame instead of setting state, so no frame costs a render.
   */
  const paint = useCallback(() => {
    layout.nodes.forEach((node) => {
      const element = nodeEls.current.get(node.id);
      if (element) element.setAttribute("transform", `translate(${node.x.toFixed(2)} ${node.y.toFixed(2)})`);
    });
    layout.edges.forEach((edge) => {
      const element = edgeEls.current.get(edge.id);
      if (!element) return;
      const source = index.get(edge.source);
      const target = index.get(edge.target);
      if (!source || !target) return;
      element.setAttribute("x1", source.x.toFixed(2));
      element.setAttribute("y1", source.y.toFixed(2));
      element.setAttribute("x2", target.x.toFixed(2));
      element.setAttribute("y2", target.y.toFixed(2));
    });
    edgeLabelEls.current.forEach((element, edgeId) => {
      const edge = edgeById.get(edgeId);
      if (!edge) return;
      const source = index.get(edge.source);
      const target = index.get(edge.target);
      if (!source || !target) return;
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      element.setAttribute("transform", `translate(${midX.toFixed(2)} ${(midY - 9 * visualScale).toFixed(2)})`);
    });
  }, [edgeById, index, layout, visualScale]);

  // The loop is an enhancement: without requestAnimationFrame (or with reduced
  // motion) the settled layout simply stands, and the graph stays usable.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;
    if (reducedMotion) return;

    let running = true;
    let frame = 0;

    const tick = () => {
      if (!running) return;
      // Step only while the school is moving. When it rests the model stops
      // itself, the surface holds perfectly still, and the loop costs nothing
      // until the next touch wakes it.
      if (isSwarmAwake(layout)) {
        stepSwarm(layout, 1 / 60);
        paint();
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [layout, paint, reducedMotion]);

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

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = toVirtual(event.clientX, event.clientY);
    const drag = dragRef.current;
    if (drag) {
      const node = index.get(drag.id);
      if (node) {
        node.x = point.x;
        node.y = point.y;
        drag.moved = true;
        push(point, DRAG_REACH, DRAG_PUSH);
        paint();
      }
      return;
    }
    // The pointer itself parts the school as it crosses the surface — but not
    // when it is already over a node. Aiming at a node is not passing through
    // it, and a target that dodges the cursor is a target nobody can click.
    if (reducedMotion) return;
    const aimingAtNode = layout.nodes.some(
      (node) => Math.hypot(node.x - point.x, node.y - point.y) < node.radius + 30,
    );
    if (aimingAtNode) return;
    push(point, POINTER_REACH, POINTER_PUSH);
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

      <div className={cn("relative", compact ? "" : "p-3")}>
        <div className="aspect-[4/3] w-full">
          <svg
            ref={svgRef}
            viewBox={VIEW_BOX}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full select-none"
            role="group"
            aria-label={`Relationship network: ${visibleNodes.length} of ${graph.nodes.length} entities, ${visibleEdges.length} of ${graph.edges.length} relationships`}
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
                    strokeWidth={(1.5 + edge.strength * 2.5) * visualScale}
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
                    onPointerEnter={() => setHoveredId(node.id)}
                    onPointerLeave={() => setHoveredId(null)}
                    onFocus={() => setFocusedId(node.id)}
                    onBlur={() => setFocusedId(null)}
                  >
                    {/* The ring is the focus, selection and hover indicator — a shape,
                        not a colour change, so it survives any colour perception. */}
                    {isRinged && (
                      <circle
                        r={radius + 5 * visualScale}
                        fill="none"
                        strokeWidth={2.5 * visualScale}
                        className="stroke-primary"
                      />
                    )}
                    {/* Every mark carries a dark outline, so a mark drawn in the gold
                        token stays defined against the card. */}
                    <circle
                      r={radius}
                      strokeWidth={1.5 * visualScale}
                      className={cn(NODE_FILL[node.kind], "stroke-foreground/40")}
                    />
                    <text
                      y={radius + 18 * visualScale}
                      textAnchor="middle"
                      fontSize={15 * visualScale}
                      className={cn("fill-foreground", node.kind === "policy" && "font-semibold")}
                      // A card-coloured halo under the glyphs, so an edge crossing a
                      // label does not run through the text.
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

      {/* The legend names the four kinds, so a mark is never read by colour alone. */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5">
          {RELATIONSHIP_KINDS.map((kind) => (
            <span
              key={kind.kind}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", kind.tone)} />
              {kind.label}
            </span>
          ))}
        </div>
      )}

      {/* Selecting a node states its relationships as text — the same information
          the picture carries, so the graph is never the only way to read it. */}
      {!compact && (
        <div className="border-t px-4 py-3">
          {selectedNode ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-xs font-semibold text-foreground">{selectedNode.label}</p>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {relationshipKindLabel(selectedNode.kind)}
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
            </>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Select a node to read how it relates to the rest of the run. Drag any node to move it
              through the network — the nodes around it part, then close again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}



