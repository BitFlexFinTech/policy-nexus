import { describe, expect, it } from "vitest";
import { findDepartment } from "@/config/departments";
import { getStakeholderSegment } from "@/config/reference";
import { GRAPH_NODE_SHAPE } from "@/lib/graph/palette";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import {
  AGENT_MARK_CAP,
  AGENT_POPULATION_CEILING,
  AGENT_POPULATION_FLOOR,
  PREVIEW_DEPARTMENT_ID,
  RELATION_BANK,
  RELATIONSHIP_KINDS,
  buildPreviewRelationshipGraph,
  buildRelationshipGraph,
  formatAgentCount,
} from "@/services/assessment/network";
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

const ALL_RELATIONS = new Set<string>([
  ...Object.values(RELATION_BANK.reaction),
  RELATION_BANK.assessedAgainst,
  RELATION_BANK.readAgainst,
  RELATION_BANK.modelledAgainst,
  RELATION_BANK.modelledAlongside,
]);

/**
 * The relationship graph. These are failable guards on the two things that make
 * the graph trustworthy: every mark is a real part of the run or of the
 * department's own configuration, and every arrival round is a round the run
 * actually produced — the graph cannot grow on a timeline of its own.
 */
describe("relationship graph — derived from the run", () => {
  it("holds the draft, the modelled groups, the priorities and the department's documents", () => {
    const run = buildSimulatedRun(requestFor("fin"));
    const department = findDepartment("fin")!;
    const graph = buildRelationshipGraph(run);

    expect(graph.nodes.filter((node) => node.kind === "policy")).toHaveLength(1);
    expect(graph.nodes.filter((node) => node.kind === "stakeholder").map((n) => n.label)).toEqual(
      run.reactions.map((reaction) => reaction.label),
    );
    expect(graph.nodes.filter((node) => node.kind === "priority").map((n) => n.label)).toEqual(
      department.priorities.map((priority) => priority.label),
    );
    expect(graph.nodes.filter((node) => node.kind === "corpus").map((n) => n.label)).toEqual(
      department.documents.map((document) => document.name),
    );
    // Every id is unique — a duplicate would silently collapse two marks.
    expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(graph.nodes.length);
    expect(new Set(graph.edges.map((edge) => edge.id)).size).toBe(graph.edges.length);
  });

  it("dates every arrival to a round the run really produced", () => {
    const run = buildSimulatedRun(requestFor("fin"));
    const graph = buildRelationshipGraph(run);
    const roundIndexes = new Set(run.rounds.map((round) => round.index));

    Object.values(graph.nodeArrival).forEach((index) => {
      expect(roundIndexes.has(index)).toBe(true);
    });

    // The draft arrives with the run; the map's contents arrive on the second
    // system round; each group arrives on the round that speaks for it.
    const systemRounds = run.rounds.filter((round) => round.actor === "System");
    expect(graph.nodeArrival.policy).toBe(systemRounds[0].index);
    expect(
      graph.nodes
        .filter((node) => node.kind === "priority" || node.kind === "corpus")
        .every((node) => graph.nodeArrival[node.id] === systemRounds[1].index),
    ).toBe(true);
    run.reactions.forEach((reaction) => {
      const speaking = run.rounds.find((round) => round.actor === reaction.label)!;
      expect(graph.nodeArrival[`stakeholder:${reaction.segmentId}`]).toBe(speaking.index);
    });

    // An edge can never appear before both of its ends exist.
    graph.edges.forEach((edge) => {
      expect(graph.edgeArrival[edge.id]).toBe(
        Math.max(graph.nodeArrival[edge.source], graph.nodeArrival[edge.target]),
      );
    });
  });

  it("is still incomplete at the halfway point — the graph grows, rather than appearing whole", () => {
    const run = buildSimulatedRun(requestFor("fin"));
    const graph = buildRelationshipGraph(run);
    const halfway = Math.floor(run.rounds.length / 2);

    const drawn = graph.nodes.filter((node) => graph.nodeArrival[node.id] <= halfway);
    expect(drawn.length).toBeGreaterThan(1);
    expect(drawn.length).toBeLessThan(graph.nodes.length);
    expect(drawn.some((node) => node.kind === "stakeholder")).toBe(true);
    // The last mark still arrives late in the run, and on a round that exists.
    const lastArrival = Math.max(...Object.values(graph.nodeArrival));
    expect(lastArrival).toBeGreaterThan(halfway);
    expect(lastArrival).toBeLessThanOrEqual(run.rounds.length);
  });

  it("reproduces byte-identically, and moves when the draft moves", () => {
    const first = buildRelationshipGraph(buildSimulatedRun(requestFor("fin")));
    const second = buildRelationshipGraph(buildSimulatedRun(requestFor("fin")));
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));

    const other = buildRelationshipGraph(
      buildSimulatedRun({
        ...requestFor("fin"),
        policyText: "A different draft, on the same subject, submitted for comparison.",
      }),
    );
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(first));
  });

  it("states every relation from the one bank of phrases, with a weight in range", () => {
    const graph = buildRelationshipGraph(buildSimulatedRun(requestFor("opc")));
    graph.edges.forEach((edge) => {
      expect(ALL_RELATIONS.has(edge.relation)).toBe(true);
      expect(edge.strength).toBeGreaterThanOrEqual(0);
      expect(edge.strength).toBeLessThanOrEqual(1);
    });
  });

  it("carries the run's own modelled sentiment as the group-to-draft relation", () => {
    const run = buildSimulatedRun(requestFor("health"));
    const graph = buildRelationshipGraph(run);
    run.reactions.forEach((reaction) => {
      const toDraft = graph.edges.filter(
        (edge) => edge.source === `stakeholder:${reaction.segmentId}` && edge.target === "policy",
      );
      expect(toDraft).toHaveLength(1);
      expect(toDraft[0].relation).toBe(RELATION_BANK.reaction[reaction.sentiment]);
    });
  });

  it("names all four kinds in the legend, one entry each, with a shape of its own", () => {
    expect(RELATIONSHIP_KINDS.map((entry) => entry.kind).sort()).toEqual([
      "corpus",
      "policy",
      "priority",
      "stakeholder",
    ]);
    // The legend draws each kind AS ITS SHAPE, read from the same map the surface draws
    // with — so this guard is about shapes, not about a colour class. Two kinds drawn as
    // one shape would be indistinguishable on the surface, however they were coloured.
    const shapes = RELATIONSHIP_KINDS.map((entry) => GRAPH_NODE_SHAPE[entry.kind]);
    expect(new Set(shapes).size).toBe(RELATIONSHIP_KINDS.length);
    shapes.forEach((shape) => expect(shape).toBeTruthy());
  });
});

/**
 * The public schematic on the landing page. It holds no run, so it may not claim
 * a modelled result: it draws the structure a run builds, from the one
 * documented representative department.
 */
describe("the public schematic", () => {
  it("is drawn from the representative department, fully grown at once", () => {
    const graph = buildPreviewRelationshipGraph();
    const department = findDepartment(PREVIEW_DEPARTMENT_ID)!;

    expect(graph.nodes.filter((node) => node.kind === "stakeholder").map((n) => n.label)).toEqual(
      department.segments.map((segmentId) => getStakeholderSegment(segmentId).label),
    );
    // There is no run to grow with, so everything arrives at once.
    expect(new Set(Object.values(graph.nodeArrival))).toEqual(new Set([1]));
    expect(new Set(Object.values(graph.edgeArrival))).toEqual(new Set([1]));
  });

  it("is identical on every build — one seed, one picture", () => {
    expect(JSON.stringify(buildPreviewRelationshipGraph())).toBe(
      JSON.stringify(buildPreviewRelationshipGraph()),
    );
  });

  it("claims no modelled sentiment, because it holds no run", () => {
    const reactions = new Set<string>(Object.values(RELATION_BANK.reaction));
    buildPreviewRelationshipGraph().edges.forEach((edge) => {
      expect(reactions.has(edge.relation)).toBe(false);
    });
  });
});

/**
 * The agent field. These guards exist because the platform's own wording promises
 * "thousands of agents" and the picture used to draw a handful of circles: the
 * claim and the drawing have to be derived from one population, or a reader who
 * counts will find them contradicting each other.
 */
describe("the agent field — the population the words promise", () => {
  it("models a population in the thousands, seeded so the same draft always agrees", () => {
    const graph = buildRelationshipGraph(buildSimulatedRun(requestFor("fin")));

    expect(graph.population.total).toBeGreaterThanOrEqual(AGENT_POPULATION_FLOOR);
    expect(graph.population.total).toBeLessThanOrEqual(AGENT_POPULATION_CEILING);
    // The mark count is READ FROM the field, so the caption can never claim a
    // different number of marks from the ones actually drawn.
    expect(graph.population.marks).toBe(graph.agents.length);
    expect(graph.population.marks).toBeGreaterThan(100);
    expect(graph.population.marks).toBeLessThanOrEqual(AGENT_MARK_CAP + 1);
  });

  it("gives every drawn agent to a modelled group, and leaves no group unpopulated", () => {
    const graph = buildRelationshipGraph(buildSimulatedRun(requestFor("fin")));
    const groups = new Set(
      graph.nodes.filter((node) => node.kind === "stakeholder").map((node) => node.id),
    );

    expect(groups.size).toBeGreaterThan(1);
    graph.agents.forEach((agent) => expect(groups.has(agent.groupId)).toBe(true));
    groups.forEach((groupId) =>
      expect(graph.agents.some((agent) => agent.groupId === groupId)).toBe(true),
    );
    // Ids are unique, or two marks would silently collapse into one.
    expect(new Set(graph.agents.map((agent) => agent.id)).size).toBe(graph.agents.length);
  });

  it("states in words what one mark stands for, so the field is never overclaimed", () => {
    const graph = buildRelationshipGraph(buildSimulatedRun(requestFor("opc")));

    if (graph.population.perMark > 1) {
      expect(graph.population.caption).toContain(`about ${graph.population.perMark} agents`);
      expect(graph.population.caption).toContain(formatAgentCount(graph.population.total));
      expect(graph.population.marks).toBeLessThan(graph.population.total);
    } else {
      expect(graph.population.caption).toContain("each drawn as one mark");
    }
  });

  it("reproduces byte-identically, and moves when the draft moves", () => {
    const first = buildRelationshipGraph(buildSimulatedRun(requestFor("opc")));
    const second = buildRelationshipGraph(buildSimulatedRun(requestFor("opc")));
    expect(JSON.stringify(second.agents)).toBe(JSON.stringify(first.agents));
    expect(second.population).toEqual(first.population);

    const other = buildRelationshipGraph(
      buildSimulatedRun({
        ...requestFor("opc"),
        policyText: "A different draft, on the same subject, submitted for comparison.",
      }),
    );
    expect(JSON.stringify(other.agents)).not.toBe(JSON.stringify(first.agents));
  });

  it("draws the public schematic's field from the representative department, identically every build", () => {
    const graph = buildPreviewRelationshipGraph();

    expect(graph.population.total).toBeGreaterThanOrEqual(AGENT_POPULATION_FLOOR);
    expect(graph.population.total).toBeLessThanOrEqual(AGENT_POPULATION_CEILING);
    expect(JSON.stringify(graph.agents)).toBe(
      JSON.stringify(buildPreviewRelationshipGraph().agents),
    );
  });

  it("writes counters by hand, so the same run reads the same on every machine", () => {
    // `toLocaleString` would make the figure machine-dependent; this may not be.
    expect(formatAgentCount(999)).toBe("999");
    expect(formatAgentCount(1000)).toBe("1,000");
    expect(formatAgentCount(2486)).toBe("2,486");
    expect(formatAgentCount(12345)).toBe("12,345");
  });
});
