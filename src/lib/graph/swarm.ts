/**
 * SWARM LAYOUT — the deterministic force model behind the relationship graph.
 *
 * It is written by hand rather than pulled in as a dependency (this project adds
 * no runtime dependency without approval), and it is deliberately DOM-free: it
 * works in a virtual coordinate space, so it can be unit-tested without a
 * browser, and the SVG scales it to whatever size the card is.
 *
 * The behaviour is a school of fish rather than a plain force-directed layout:
 * edges hold the structure together, nodes repel each other, and every node also
 * schools with its own neighbours (cohesion toward their centroid, alignment
 * with their mean direction). Something entering the school — a dragged node, or
 * the pointer — pushes the nearby nodes apart through `impulseAt`, and because
 * the springs and the schooling term are still there, the school closes up again
 * once the disturbance stops. That is the whole effect: separate, then recohere.
 *
 * DETERMINISM: no `Math.random`, no `Date.now`, no `new Date`. Initial positions
 * come from the seeded PRNG passed in as `seed`, and motion advances in FIXED
 * steps of `dt` — never by reading a clock — so the same graph always settles to
 * the same coordinates, and the animation is reproducible.
 * (see .clinerules/04-determinism-and-validation.md)
 */

import { createRng } from "@/lib/prng";
import type { RelationshipGraph, RelationshipNodeKind } from "@/services/assessment/network";

/** The virtual space the layout is computed in. The SVG scales it, so the
 *  layout does not depend on the size of the element it is drawn into. */
export const SWARM_WIDTH = 1000;
export const SWARM_HEIGHT = 750;

export interface SwarmOptions {
  width: number;
  height: number;
  /** Pairwise repulsion strength. */
  repulsion: number;
  /** Minimum separation used to keep the repulsion finite. */
  minDistance: number;
  /** How hard an edge pulls its two nodes to its rest length. */
  spring: number;
  /** Pull toward the middle of the space, so the school stays in frame. */
  centring: number;
  /** Velocity kept each step; below 1 the motion decays instead of wobbling. */
  damping: number;
  /** How strongly a node follows its neighbours (cohesion) and their direction
   *  (alignment). This is the schooling term — set it to 0 for a plain layout. */
  schooling: number;
  /** Hard cap on speed, so an impulse cannot fling a node out of frame. */
  maxSpeed: number;
  /** Below this speed the whole school is considered stopped and is rested. A
   *  settled layout must be able to hold perfectly still: a target that creeps
   *  forever is a target nobody can click. */
  restSpeed: number;
  /** Soft wall inset; nodes are eased back inside before they leave the space. */
  padding: number;
}

export const DEFAULT_SWARM: SwarmOptions = {
  width: SWARM_WIDTH,
  height: SWARM_HEIGHT,
  repulsion: 60000,
  minDistance: 71,
  spring: 0.02,
  centring: 0.0022,
  damping: 0.86,
  schooling: 0.012,
  maxSpeed: 46,
  restSpeed: 0.08,
  padding: 30,
};

/** Node radius by kind, in the virtual space. The draft is the hub, so it is the
 *  largest mark; the rank is also how the kinds stay distinguishable without
 *  relying on colour alone. */
export const NODE_RADIUS: Record<RelationshipNodeKind, number> = {
  policy: 26,
  stakeholder: 15,
  priority: 11,
  corpus: 9,
};

export interface SwarmNode {
  id: string;
  kind: RelationshipNodeKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  /** Set while the user is dragging this node: it is driven by the pointer, not
   *  by the forces, but it still pushes its neighbours away. */
  pinned: boolean;
}

export interface SwarmEdge {
  id: string;
  source: string;
  target: string;
  /** Where the spring wants the two ends to sit, by edge weight. */
  restLength: number;
  stiffness: number;
}

export interface SwarmState {
  options: SwarmOptions;
  nodes: SwarmNode[];
  edges: SwarmEdge[];
  /** Neighbour ids per node, derived from the edges once — the schooling term
   *  and the impulse both read it, and neither rebuilds it per frame. */
  neighbours: Record<string, string[]>;
  /** False once the school has stopped moving. A resting model is not stepped,
   *  so the surface animates only while there is something to watch. */
  awake: boolean;
}

/* ------------------------------------------------------------------------- */
/* Building the state                                                          */
/* ------------------------------------------------------------------------- */

/** The ring each kind starts on, as a fraction of the half-space. The draft is
 *  the hub at the centre; the groups sit nearest it, then the priorities, then
 *  the documents. */
const KIND_RING: Record<RelationshipNodeKind, number> = {
  policy: 0,
  stakeholder: 0.28,
  priority: 0.6,
  corpus: 0.78,
};

/** Rest length and pull for an edge, from what it connects. */
const edgeTuning = (sourceKind: RelationshipNodeKind, targetKind: RelationshipNodeKind) => {
  const touchesPolicy = sourceKind === "policy" || targetKind === "policy";
  return touchesPolicy
    ? { restLength: 238, stiffness: 0.02 }
    : { restLength: 174, stiffness: 0.014 };
};

/**
 * Build the swarm for a graph. Positions are placed on rings by kind with a
 * seeded angular offset, so the starting arrangement is a pure function of the
 * seed and the graph — identical on every render, every build and every replay.
 */
export const createSwarm = (
  graph: RelationshipGraph,
  seed: string,
  options: SwarmOptions = DEFAULT_SWARM,
): SwarmState => {
  const rng = createRng(seed);
  const centreX = options.width / 2;
  const centreY = options.height / 2;
  const reach = Math.min(options.width, options.height) / 2;

  const byKind = new Map<RelationshipNodeKind, typeof graph.nodes>();
  graph.nodes.forEach((node) => {
    const list = byKind.get(node.kind) ?? [];
    list.push(node);
    byKind.set(node.kind, list);
  });

  const nodes: SwarmNode[] = [];
  (Object.keys(KIND_RING) as RelationshipNodeKind[]).forEach((kind) => {
    const group = byKind.get(kind) ?? [];
    const radius = KIND_RING[kind] * reach;
    // The offset is seeded, so which group starts where is fixed for the seed.
    const offset = rng.next() * Math.PI * 2;
    group.forEach((node, index) => {
      const angle = offset + (index / Math.max(group.length, 1)) * Math.PI * 2;
      // A small seeded jitter breaks the perfect ring without breaking determinism.
      const jitter = 1 + (rng.next() - 0.5) * 0.16;
      nodes.push({
        id: node.id,
        kind: node.kind,
        x: centreX + Math.cos(angle) * radius * jitter,
        y: centreY + Math.sin(angle) * radius * jitter,
        vx: 0,
        vy: 0,
        radius: NODE_RADIUS[node.kind],
        pinned: false,
      });
    });
  });

  const kindOf = new Map(graph.nodes.map((node) => [node.id, node.kind]));
  const edges: SwarmEdge[] = graph.edges.map((edge) => {
    const sourceKind = kindOf.get(edge.source) ?? "stakeholder";
    const targetKind = kindOf.get(edge.target) ?? "stakeholder";
    const tuning = edgeTuning(sourceKind, targetKind);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      restLength: tuning.restLength,
      stiffness: tuning.stiffness,
    };
  });

  const neighbours: Record<string, string[]> = {};
  nodes.forEach((node) => {
    neighbours[node.id] = [];
  });
  edges.forEach((edge) => {
    neighbours[edge.source]?.push(edge.target);
    neighbours[edge.target]?.push(edge.source);
  });

  return { options, nodes, edges, neighbours, awake: true };
};


/* ------------------------------------------------------------------------- */
/* Advancing the state                                                         */
/* ------------------------------------------------------------------------- */

/**
 * One fixed step of the model. Accelerations come from five places and are then
 * integrated together:
 *
 *   1. repulsion  — every pair pushes apart, capped at `minDistance` so the term
 *                   stays finite when two nodes land on each other;
 *   2. springs    — each edge pulls its two ends to its rest length;
 *   3. centring   — everything is drawn gently toward the middle of the space;
 *   4. schooling  — each node is pulled toward the centroid of its neighbours and
 *                   aligned with their mean direction (this is the school);
 *   5. walls      — a soft push back inside the padded frame.
 *
 * `dt` is fixed by the caller; nothing here reads a clock, so the same number of
 * steps always produces the same coordinates.
 */
export const stepSwarm = (state: SwarmState, dt: number): void => {
  const { options, nodes, edges, neighbours } = state;
  const count = nodes.length;
  // A resting school is not stepped at all: nothing moves, so nothing is
  // recomputed — and the marks hold still, exactly, between interactions.
  const held = nodes.some((node) => node.pinned);
  if (count === 0 || (!state.awake && !held)) return;

  const forceX = new Float64Array(count);
  const forceY = new Float64Array(count);
  const position = new Map<string, number>();
  nodes.forEach((node, index) => position.set(node.id, index));

  // 1 — repulsion between every pair.
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let distance = Math.hypot(dx, dy);
      if (distance < 0.001) {
        // Exactly coincident: separate along a fixed axis instead of dividing by
        // zero. The direction is constant, so this stays deterministic.
        dx = 1;
        dy = 0;
        distance = 0.001;
      }
      const clamped = Math.max(distance, options.minDistance);
      const magnitude = options.repulsion / (clamped * clamped);
      const ux = dx / distance;
      const uy = dy / distance;
      forceX[i] += ux * magnitude;
      forceY[i] += uy * magnitude;
      forceX[j] -= ux * magnitude;
      forceY[j] -= uy * magnitude;
    }
  }

  // 2 — springs along the edges.
  edges.forEach((edge) => {
    const i = position.get(edge.source);
    const j = position.get(edge.target);
    if (i === undefined || j === undefined) return;
    const a = nodes[i];
    const b = nodes[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.max(Math.hypot(dx, dy), 0.001);
    const pull = (distance - edge.restLength) * edge.stiffness;
    const ux = dx / distance;
    const uy = dy / distance;
    forceX[i] += ux * pull;
    forceY[i] += uy * pull;
    forceX[j] -= ux * pull;
    forceY[j] -= uy * pull;
  });

  // 3 — centring, so the school does not drift off the surface.
  const centreX = options.width / 2;
  const centreY = options.height / 2;
  nodes.forEach((node, index) => {
    forceX[index] += (centreX - node.x) * options.centring;
    forceY[index] += (centreY - node.y) * options.centring;
  });

  // 4 — schooling: cohesion toward the neighbours' centroid, alignment with their
  // mean velocity. Together these are what make the movement read as a school.
  if (options.schooling > 0) {
    nodes.forEach((node, index) => {
      const list = neighbours[node.id] ?? [];
      if (list.length === 0) return;
      let sumX = 0;
      let sumY = 0;
      let sumVx = 0;
      let sumVy = 0;
      list.forEach((neighbourId) => {
        const at = position.get(neighbourId);
        if (at === undefined) return;
        sumX += nodes[at].x;
        sumY += nodes[at].y;
        sumVx += nodes[at].vx;
        sumVy += nodes[at].vy;
      });
      forceX[index] += (sumX / list.length - node.x) * options.schooling;
      forceY[index] += (sumY / list.length - node.y) * options.schooling;
      forceX[index] += (sumVx / list.length - node.vx) * options.schooling * 2;
      forceY[index] += (sumVy / list.length - node.vy) * options.schooling * 2;
    });
  }

  // 5 — soft walls inside the padded frame.
  nodes.forEach((node, index) => {
    const inset = options.padding;
    const right = options.width - inset;
    const bottom = options.height - inset;
    if (node.x < inset) forceX[index] += (inset - node.x) * 0.02;
    if (node.x > right) forceX[index] -= (node.x - right) * 0.02;
    if (node.y < inset) forceY[index] += (inset - node.y) * 0.02;
    if (node.y > bottom) forceY[index] -= (node.y - bottom) * 0.02;
  });

  // Integrate. A pinned node is driven by the pointer and holds its position, but
  // it still pushed its neighbours away in the loops above.
  nodes.forEach((node, index) => {
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      return;
    }
    node.vx = (node.vx + forceX[index] * dt) * options.damping;
    node.vy = (node.vy + forceY[index] * dt) * options.damping;
    const speed = Math.hypot(node.vx, node.vy);
    if (speed > options.maxSpeed) {
      node.vx = (node.vx / speed) * options.maxSpeed;
      node.vy = (node.vy / speed) * options.maxSpeed;
    }
    node.x += node.vx * dt * 60;
    node.y += node.vy * dt * 60;
  });

  // Rest the whole school once nothing is moving faster than the rest speed. A
  // pinned mark holds the model awake: it is being driven by the pointer, and
  // the nodes still pulling toward it have to keep moving.
  let fastest = 0;
  nodes.forEach((node) => {
    fastest = Math.max(fastest, Math.hypot(node.vx, node.vy));
  });
  if (!held && fastest <= options.restSpeed) {
    nodes.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });
    state.awake = false;
  }
};

/** Wake the model, for a change that is not an impulse — a node being pinned. */
export const wakeSwarm = (state: SwarmState): void => {
  state.awake = true;
};

/** Whether the school is still moving. The renderer stops stepping when it is not. */
export const isSwarmAwake = (state: SwarmState): boolean => state.awake;



/**
 * Push the nodes near a point away from it. This is what a dragged node and the
 * pointer do to the school: the nearby nodes are shoved out, and because the
 * springs and the schooling term are untouched, they close the gap again as soon
 * as the push stops.
 */
export const impulseAt = (
  state: SwarmState,
  x: number,
  y: number,
  radius: number,
  strength: number,
): void => {
  // A shove wakes a resting school; otherwise the push would be lost.
  state.awake = true;
  state.nodes.forEach((node) => {
    if (node.pinned) return;
    const dx = node.x - x;
    const dy = node.y - y;
    const distance = Math.hypot(dx, dy);
    // Linear falloff: full strength at the centre, nothing at the rim.
    if (distance > radius || distance < 0.001) return;
    const falloff = 1 - distance / radius;
    node.vx += (dx / distance) * strength * falloff;
    node.vy += (dy / distance) * strength * falloff;
  });
};

/**
 * Run the model until the school rests — or until the cap is reached, whichever
 * comes first. This is what the first paint renders: the finished arrangement,
 * computed synchronously, so the graph is complete before a single animation
 * frame exists. It is also why the graph renders unchanged in a test environment
 * that has no animation support at all.
 *
 * The cap is a safety net, not a tuning knob: the model rests well before it for
 * every graph this app draws, so a larger cap would not change the outcome.
 */
export const settleSwarm = (state: SwarmState, maxIterations = 4000): SwarmState => {
  const dt = 1 / 60;
  for (let step = 0; step < maxIterations && state.awake; step += 1) stepSwarm(state, dt);
  return state;
};

/** Flatten the state to id → position, for the renderer and for the tests. */
export const positionsOf = (state: SwarmState): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  state.nodes.forEach((node) => {
    positions[node.id] = { x: node.x, y: node.y };
  });
  return positions;
};

/**
 * The closest two node centres get, and the box the nodes occupy — the two
 * numbers that say whether a layout is readable. Read by the tests only.
 */
export const layoutQuality = (state: SwarmState) => {
  let closest = Number.POSITIVE_INFINITY;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  state.nodes.forEach((node, index) => {
    minX = Math.min(minX, node.x - node.radius);
    minY = Math.min(minY, node.y - node.radius);
    maxX = Math.max(maxX, node.x + node.radius);
    maxY = Math.max(maxY, node.y + node.radius);
    for (let other = index + 1; other < state.nodes.length; other += 1) {
      const neighbour = state.nodes[other];
      const gap =
        Math.hypot(node.x - neighbour.x, node.y - neighbour.y) - (node.radius + neighbour.radius);
      closest = Math.min(closest, gap);
    }
  });

  return { closest, minX, minY, maxX, maxY };
};
