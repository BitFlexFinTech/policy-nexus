import { describe, expect, it } from "vitest";
import { findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import {
  SWARM_HEIGHT,
  SWARM_WIDTH,
  createSwarm,
  impulseAt,
  isSwarmAwake,
  layoutQuality,
  positionsOf,
  settleSwarm,
  stepSwarm,
} from "@/lib/graph/swarm";
import { buildRelationshipGraph } from "@/services/assessment/network";
import type { AssessmentRequest } from "@/services/assessment/types";

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

const swarmFor = (departmentId: string) => {
  const run = assessmentService.buildRun(requestFor(departmentId));
  return { run, swarm: createSwarm(buildRelationshipGraph(run), `${run.seed}::swarm`) };
};

/** Mean distance of the marks from their own centroid — how spread the school is. */
const spread = (state: ReturnType<typeof createSwarm>): number => {
  const centreX = state.nodes.reduce((total, node) => total + node.x, 0) / state.nodes.length;
  const centreY = state.nodes.reduce((total, node) => total + node.y, 0) / state.nodes.length;
  return (
    state.nodes.reduce((total, node) => total + Math.hypot(node.x - centreX, node.y - centreY), 0) /
    state.nodes.length
  );
};

/**
 * The force model behind the graph. It is hand-written, so it has to earn its
 * keep the same way any other code does: these are the properties the interface
 * depends on — the same graph always settles the same way, the marks stay
 * readable and inside the frame, and a shove separates the school without ever
 * throwing it away.
 */
describe("swarm layout", () => {
  it("settles to identical coordinates for the same graph and seed", () => {
    const first = settleSwarm(swarmFor("fin").swarm);
    const second = settleSwarm(swarmFor("fin").swarm);
    expect(positionsOf(second)).toEqual(positionsOf(first));
  });

  it("orders the same graph differently under a different seed — the seed is really read", () => {
    const run = assessmentService.buildRun(requestFor("fin"));
    const graph = buildRelationshipGraph(run);
    const a = positionsOf(settleSwarm(createSwarm(graph, "seed-a")));
    const b = positionsOf(settleSwarm(createSwarm(graph, "seed-b")));
    expect(a).not.toEqual(b);
  });

  it("keeps the marks apart and inside the frame for every department", () => {
    const departments = ["opc", "fin", "agri", "def", "health"] as const;
    departments.forEach((id) => {
      const state = settleSwarm(swarmFor(id).swarm);
      const quality = layoutQuality(state);
      // No two marks may overlap: a layout that collides hides relationships
      // rather than showing them.
      expect(quality.closest).toBeGreaterThan(20);
      expect(quality.minX).toBeGreaterThanOrEqual(0);
      expect(quality.minY).toBeGreaterThanOrEqual(0);
      expect(quality.maxX).toBeLessThanOrEqual(SWARM_WIDTH);
      expect(quality.maxY).toBeLessThanOrEqual(SWARM_HEIGHT);
    });
  });

  it("settles to a true rest — the marks stop moving entirely", () => {
    // This is not cosmetic. A force layout relaxes asymptotically, so without an
    // explicit rest state the school would creep by a fraction of a pixel per
    // second forever — imperceptible, and enough that no mark could ever hold
    // still for a pointer to click it.
    const state = settleSwarm(swarmFor("fin").swarm);
    expect(isSwarmAwake(state)).toBe(false);

    const before = positionsOf(state);
    for (let step = 0; step < 600; step += 1) stepSwarm(state, 1 / 60);
    expect(positionsOf(state)).toEqual(before);
  });

  it("rests at the same arrangement whichever cap it is settled under", () => {
    // The iteration cap is a safety net, not a tuning knob: stopping early and
    // carrying on later walks the same sequence of steps to the same rest state.
    const capped = settleSwarm(swarmFor("fin").swarm, 200);
    expect(isSwarmAwake(capped)).toBe(true);
    settleSwarm(capped);
    expect(positionsOf(capped)).toEqual(positionsOf(settleSwarm(swarmFor("fin").swarm)));
  });

  it("separates the school on an impulse, then closes the gap again", () => {
    const state = settleSwarm(swarmFor("fin").swarm);
    const restSpread = spread(state);
    const hub = state.nodes[0];

    impulseAt(state, hub.x, hub.y, 260, 60);
    for (let step = 0; step < 30; step += 1) stepSwarm(state, 1 / 60);
    expect(spread(state)).toBeGreaterThan(restSpread * 1.05);

    for (let step = 0; step < 600; step += 1) stepSwarm(state, 1 / 60);
    // It must recohere — back to the same spread as before, within a tolerance.
    expect(spread(state)).toBeLessThan(restSpread * 1.05);
    expect(spread(state)).toBeGreaterThan(restSpread * 0.95);
  });

  it("cannot throw a mark out of the frame, however hard it is shoved", () => {
    const state = settleSwarm(swarmFor("fin").swarm);
    const hub = state.nodes[0];
    for (let shove = 0; shove < 12; shove += 1) {
      impulseAt(state, hub.x, hub.y, 400, 120);
      for (let step = 0; step < 10; step += 1) stepSwarm(state, 1 / 60);
    }
    for (let step = 0; step < 900; step += 1) stepSwarm(state, 1 / 60);

    const quality = layoutQuality(state);
    expect(quality.closest).toBeGreaterThan(0);
    expect(quality.minX).toBeGreaterThanOrEqual(0);
    expect(quality.minY).toBeGreaterThanOrEqual(0);
    expect(quality.maxX).toBeLessThanOrEqual(SWARM_WIDTH);
    expect(quality.maxY).toBeLessThanOrEqual(SWARM_HEIGHT);
  });

  it("wakes on a shove, and rests again once the school has closed", () => {
    const state = settleSwarm(swarmFor("opc").swarm);
    expect(isSwarmAwake(state)).toBe(false);

    impulseAt(state, 500, 375, 300, 60);
    expect(isSwarmAwake(state)).toBe(true);

    settleSwarm(state);
    expect(isSwarmAwake(state)).toBe(false);
    expect(layoutQuality(state).closest).toBeGreaterThan(20);
  });

  it("holds a dragged mark where the pointer put it, and still pushes its neighbours", () => {
    const state = settleSwarm(swarmFor("opc").swarm);
    const dragged = state.nodes[1];
    const neighbour = state.nodes[2];
    dragged.pinned = true;
    dragged.x = 60;
    dragged.y = 60;
    const before = { x: neighbour.x, y: neighbour.y };
    for (let step = 0; step < 30; step += 1) stepSwarm(state, 1 / 60);

    expect(dragged.x).toBe(60);
    expect(dragged.y).toBe(60);
    expect(Math.hypot(neighbour.x - before.x, neighbour.y - before.y)).toBeGreaterThan(1);
  });

  it("survives a graph holding a single mark", () => {
    const graph = buildRelationshipGraph(assessmentService.buildRun(requestFor("opc")));
    const lone = { nodes: [graph.nodes[0]], edges: [], nodeArrival: {}, edgeArrival: {} };
    const state = settleSwarm(createSwarm(lone, "lone"));
    expect(state.nodes).toHaveLength(1);
    expect(Number.isFinite(state.nodes[0].x)).toBe(true);
  });
});
