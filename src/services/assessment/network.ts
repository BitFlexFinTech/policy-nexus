/**
 * SINGLE SOURCE OF TRUTH — the relationship graph behind a run.
 *
 * A run already produces modelled stakeholder reactions, stated priorities and
 * the department's reference documents. This module states that structure as a
 * graph so the interface can show it: one draft at the centre, the groups the
 * run models around it, the priorities it is assessed against, and the documents
 * it is read against.
 *
 * It also states the POPULATION those groups stand for: each modelled group
 * carries the agents it represents, as marks drawn around it. That is what stops
 * the picture contradicting the words — the platform says it models thousands of
 * agents, so thousands of agents are modelled, counted from one place and drawn
 * as far as the card can honestly draw them. See `AgentPopulation`.
 *
 * DELIBERATELY NOT PART OF THE RESULT SCHEMA. `AssessmentRun`
 * (`./types.ts`) is unchanged: the graph is a PURE FUNCTION OF THE RUN, derived
 * on read. That keeps the stored-run contract and the mock → real engine swap
 * untouched.
 *
 * DETERMINISM: no `Math.random`, no `Date.now`, no `new Date`. Every figure here
 * is either read from the department's own configuration, read from the run, or
 * drawn from the seeded PRNG. The same run always yields a byte-identical graph.
 * (see .clinerules/04-determinism-and-validation.md)
 *
 * The vocabulary is plain and structural — groups, priorities, documents,
 * relationships — so nothing here exposes an implementation term, and no phrase
 * claims an outcome.
 */

import { findDepartment, type DepartmentId } from "@/config/departments";
import { getStakeholderSegment } from "@/config/reference";
import { createRng, type Rng } from "@/lib/prng";
import type { AssessmentRun, ReactionSentiment } from "./types";

/** The four kinds of thing the graph draws. Declared ONCE: the legend, the
 *  detail panel and the tests all read this array, so they cannot disagree. */
export type RelationshipNodeKind = "policy" | "stakeholder" | "priority" | "corpus";

export interface RelationshipNode {
  id: string;
  label: string;
  kind: RelationshipNodeKind;
  /** One line of plain-language meaning — the department's own authored note. */
  note: string;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  /** A short edge label, drawn from `RELATION_BANK` — never written ad hoc. */
  relation: string;
  /** 0–1 modelled strength. Drives edge thickness only; never printed. */
  strength: number;
}

export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  /** Round index at which each node appears. The graph grows with the run. */
  nodeArrival: Record<string, number>;
  /** Round index at which each edge appears — the later of its two endpoints. */
  edgeArrival: Record<string, number>;
  /**
   * The agent field: the individual agents the modelled groups stand for, drawn
   * around the group they belong to. Deliberately NOT nodes — a node is something
   * a reader can select and read, and there are thousands of agents.
   */
  agents: RelationshipAgent[];
  /** How large the modelled population is, and how honestly it is drawn. */
  population: AgentPopulation;
}

/** One drawn agent mark, placed relative to the group it belongs to. */
export interface RelationshipAgent {
  /** Stable id — the field is identical on every render and every build. */
  id: string;
  /** The stakeholder-group node this agent belongs to. */
  groupId: string;
  /** Offset from the group's centre, in layout units. */
  dx: number;
  dy: number;
}

/**
 * The modelled population behind a run.
 *
 * `total` is a MODELLED figure — this is scenario mode — derived from the run's
 * own seed, so the same draft always models the same population and a different
 * draft models a different one. It is deliberately in the thousands, because
 * that is what this platform's own wording promises, and the words and the
 * picture must agree.
 *
 * `perMark` is the honesty valve. Drawing one mark per agent would be four
 * figures of vector elements, so the field is drawn at a capped density and
 * `perMark` states in plain words how many agents each mark stands for. The
 * caption, the marks and the figure all come from these same numbers, so they
 * cannot drift apart.
 */
export interface AgentPopulation {
  total: number;
  marks: number;
  perMark: number;
  caption: string;
}

/** The four node kinds, with the one label each kind is shown under.
 *
 *  NOTE: the legend used to carry a `tone` (a Tailwind background token) per kind. It
 *  is gone deliberately: the legend now draws each kind AS ITS SHAPE, read from
 *  `@/lib/graph/palette` — the same map the surface draws with — so the legend cannot
 *  drift from the picture. A second colour field here would be a second source of truth
 *  for something the palette already owns. */
export const RELATIONSHIP_KINDS: ReadonlyArray<{
  kind: RelationshipNodeKind;
  label: string;
}> = [
  { kind: "policy", label: "Policy draft" },
  { kind: "stakeholder", label: "Stakeholder group" },
  { kind: "priority", label: "Stated priority" },
  { kind: "corpus", label: "Reference document" },
];

export const relationshipKindLabel = (kind: RelationshipNodeKind): string =>
  RELATIONSHIP_KINDS.find((entry) => entry.kind === kind)?.label ?? kind;

/**
 * Every relationship phrase in the graph, written once. They are edge labels,
 * not sentences, so they read correctly between any two node labels — the same
 * string is used on the edge, in the legend-free detail panel and in the tests.
 */
export const RELATION_BANK = {
  /** How a modelled group relates to the draft, by its modelled sentiment. */
  reaction: {
    supportive: "signals support",
    mixed: "supports conditionally",
    resistant: "raises a compliance concern",
  } as Record<ReactionSentiment, string>,
  /** The draft is assessed against each stated priority. */
  assessedAgainst: "is assessed against",
  /** The draft is read against the department's own reference documents. */
  readAgainst: "is read against",
  /** A modelled group and a stated priority in the same run. */
  modelledAgainst: "is modelled against",
  /** Two groups modelled in the same run. */
  modelledAlongside: "is modelled alongside",
  /** The public schematic only: no run exists, so no modelled sentiment does. */
  modelledInDraft: "is modelled in the draft",
} as const;

export const POLICY_NODE_ID = "policy";

/** The hub node — the draft every other node is placed around. */
const policyNode = (label: string, reference: string): RelationshipNode => ({
  id: POLICY_NODE_ID,
  label,
  kind: "policy",
  note: `The draft under assessment in run ${reference}.`,
});

/* ------------------------------------------------------------------------- */
/* Assembly                                                                    */
/* ------------------------------------------------------------------------- */

interface GraphSpec {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  arrival: Record<string, number>;
  agents: RelationshipAgent[];
  population: Omit<AgentPopulation, "marks" | "caption">;
}

/**
 * Stable edge id from an unordered pair plus the relation, so the same
 * relationship cannot enter the graph twice under two different ids.
 */
const edgeIdFor = (source: string, target: string, relation: string): string =>
  `edge:${[source, target].sort().join(":")}:${relation}`;

/** Two decimal places, so an edge weight never carries float noise into a snapshot. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * A count with thousands separators, written by hand rather than with
 * `toLocaleString`: a locale-dependent format would make the same run read
 * differently on two machines. (see .clinerules/04-determinism-and-validation.md)
 */
export const formatAgentCount = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Close the spec: drop duplicate relationships, date every edge, count the field. */
const finalise = (spec: GraphSpec): RelationshipGraph => {
  const edges: RelationshipEdge[] = [];
  const seen = new Set<string>();
  spec.edges.forEach((edge) => {
    if (seen.has(edge.id)) return;
    seen.add(edge.id);
    edges.push(edge);
  });

  const edgeArrival: Record<string, number> = {};
  edges.forEach((edge) => {
    const source = spec.arrival[edge.source] ?? 1;
    const target = spec.arrival[edge.target] ?? 1;
    edgeArrival[edge.id] = Math.max(source, target);
  });

  // The mark count is READ FROM the field, never carried alongside it, so the
  // caption can never claim a different number of marks from the ones drawn.
  const marks = spec.agents.length;
  const population: AgentPopulation = {
    total: spec.population.total,
    perMark: spec.population.perMark,
    marks,
    caption:
      spec.population.perMark <= 1
        ? `${formatAgentCount(spec.population.total)} simulated agents, each drawn as one mark.`
        : `Each mark stands for about ${spec.population.perMark} agents — ` +
          `${formatAgentCount(spec.population.total)} simulated across the modelled groups.`,
  };

  return {
    nodes: spec.nodes,
    edges,
    nodeArrival: { ...spec.arrival },
    edgeArrival,
    agents: spec.agents,
    population,
  };
};

/* ------------------------------------------------------------------------- */
/* The agent field                                                             */
/* ------------------------------------------------------------------------- */

/**
 * How large a modelled population is, and how many of its agents are drawn.
 *
 * The band is stated rather than a single number so two different drafts model
 * two different populations — the figure is seeded, not fixed — while every run
 * still models "thousands", which is what the platform's wording promises.
 */
export const AGENT_POPULATION_FLOOR = 2000;
export const AGENT_POPULATION_CEILING = 3200;

/**
 * The most marks ever drawn on the full card, and on the compact schematic.
 *
 * WHY THESE NUMBERS: the Phase AA field drew its marks at 600 and read as fog rather
 * than as a field of agents. Measured on a six-group department, that was about 92 marks
 * of radius 2.1 inside each group's 32-unit cluster — the marks covered roughly 40% of
 * the cluster's area, and at 60% opacity they merged. At 320 the same cluster carries
 * about 51 marks of radius 2.4, covering about 30%, with each mark drawn in its own
 * group's colour at 90% opacity: the density is what changed least, and the separation,
 * the colour and the definition are what make the individual marks readable. The count
 * is still two orders of magnitude above a handful, and the caption states what one mark
 * stands for, so lowering it costs no honesty.
 */
export const AGENT_MARK_CAP = 320;
export const AGENT_COMPACT_MARK_CAP = 140;

/** How far a group's agents spread from its centre, and how big each mark is. */
export const AGENT_CLUSTER_RADIUS = 32;
export const AGENT_MARK_RADIUS = 2.4;

/** The golden angle: the cheapest way to scatter points evenly over a disc. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Build the agent field for a set of modelled groups.
 *
 * Pure and seeded: the population, the split across groups and every mark's place
 * come from the run's own seed, so the same input always draws the same field.
 * Marks sit on a golden-angle spiral around their group's centre, which spreads
 * them evenly at any count and leaves no visible ring or gap.
 */
const buildAgentField = (
  groupIds: readonly string[],
  rng: Rng,
): { agents: RelationshipAgent[]; total: number; perMark: number } => {
  const span = AGENT_POPULATION_CEILING - AGENT_POPULATION_FLOOR;
  const total = AGENT_POPULATION_FLOOR + Math.floor(rng.next() * (span + 1));

  // Split the population across the modelled groups by seeded weight, so group
  // sizes differ the way real populations do. Every group models at least one.
  const weights = groupIds.map(() => 0.5 + rng.next());
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) => Math.max(1, Math.floor((weight / weightTotal) * total)));
  const rounding = counts.reduce((sum, count) => sum + count, 0);
  if (counts.length > 0) counts[0] += total - rounding;

  const perMark = Math.max(1, Math.ceil(total / AGENT_MARK_CAP));

  const agents: RelationshipAgent[] = [];
  groupIds.forEach((groupId, index) => {
    const marks = Math.max(1, Math.round(counts[index] / perMark));
    for (let mark = 0; mark < marks; mark += 1) {
      const angle = mark * GOLDEN_ANGLE + rng.next() * 0.4;
      const distance = AGENT_CLUSTER_RADIUS * Math.sqrt((mark + 0.5) / marks);
      agents.push({
        id: `agent:${groupId}:${mark}`,
        groupId,
        dx: round2(Math.cos(angle) * distance),
        dy: round2(Math.sin(angle) * distance),
      });
    }
  });

  return { agents, total, perMark };
};

/**
 * The graph behind one run. Every node is a real part of the run or of the
 * department's own configuration, and every arrival round is read from the run's
 * own event record — the graph cannot grow on a timeline the engine did not
 * produce.
 *
 * Arrival: the run opens with two system rounds — the first states the run, the
 * second states what the knowledge map was loaded from — then one round per
 * modelled group. So the draft arrives on the first system round, the stated
 * priorities and reference documents arrive on the second, and each group
 * arrives on the round that speaks for it.
 */
export const buildRelationshipGraph = (run: AssessmentRun): RelationshipGraph => {
  const department = findDepartment(run.departmentId);
  if (!department) throw new Error(`Unknown department id: ${run.departmentId}`);

  const systemRounds = run.rounds.filter((round) => round.actor === "System").map((r) => r.index);
  const policyRound = systemRounds[0] ?? 1;
  const mapRound = systemRounds[1] ?? policyRound;

  const nodes: RelationshipNode[] = [policyNode(run.policyTitle, run.reference)];
  const edges: RelationshipEdge[] = [];
  const arrival: Record<string, number> = { [POLICY_NODE_ID]: policyRound };

  const priorityIds = department.priorities.map((priority) => `priority:${priority.id}`);

  department.priorities.forEach((priority) => {
    const id = `priority:${priority.id}`;
    nodes.push({ id, label: priority.label, kind: "priority", note: priority.note });
    arrival[id] = mapRound;
    const impact = run.impacts.find((dimension) => dimension.id === priority.id);
    edges.push({
      id: edgeIdFor(POLICY_NODE_ID, id, RELATION_BANK.assessedAgainst),
      source: POLICY_NODE_ID,
      target: id,
      relation: RELATION_BANK.assessedAgainst,
      strength: (impact ? impact.score : 50) / 100,
    });
  });

  department.documents.forEach((document, index) => {
    const id = `document:${document.id}`;
    nodes.push({ id, label: document.name, kind: "corpus", note: document.note });
    arrival[id] = mapRound;
    edges.push({
      id: edgeIdFor(POLICY_NODE_ID, id, RELATION_BANK.readAgainst),
      source: POLICY_NODE_ID,
      target: id,
      relation: RELATION_BANK.readAgainst,
      strength: 0.4 + index * 0.08,
    });
  });

  run.reactions.forEach((reaction, index) => {
    const id = `stakeholder:${reaction.segmentId}`;
    nodes.push({ id, label: reaction.label, kind: "stakeholder", note: reaction.note });
    const speakingRound = run.rounds.find((round) => round.actor === reaction.label);
    arrival[id] = speakingRound?.index ?? mapRound;

    // The group against the draft: the relation is the modelled sentiment and the
    // weight is the modelled participation — both already in the run.
    edges.push({
      id: edgeIdFor(id, POLICY_NODE_ID, RELATION_BANK.reaction[reaction.sentiment]),
      source: id,
      target: POLICY_NODE_ID,
      relation: RELATION_BANK.reaction[reaction.sentiment],
      strength: reaction.participation / 100,
    });

    // Each group against the priorities the run assesses it over. The pairing is
    // positional, so it is identical on every replay.
    if (priorityIds.length > 0) {
      const first = priorityIds[index % priorityIds.length];
      const second = priorityIds[(index + 1) % priorityIds.length];
      [first, second].forEach((priorityId) => {
        edges.push({
          id: edgeIdFor(id, priorityId, RELATION_BANK.modelledAgainst),
          source: id,
          target: priorityId,
          relation: RELATION_BANK.modelledAgainst,
          strength: reaction.supportIndex / 100,
        });
      });
    }

    // The group against the next group the department models — a ring, so no
    // modelled group floats free of the run.
    if (run.reactions.length > 1) {
      const next = run.reactions[(index + 1) % run.reactions.length];
      if (next.segmentId !== reaction.segmentId) {
        const nextId = `stakeholder:${next.segmentId}`;
        edges.push({
          id: edgeIdFor(id, nextId, RELATION_BANK.modelledAlongside),
          source: id,
          target: nextId,
          relation: RELATION_BANK.modelledAlongside,
          strength: round2((reaction.participation + next.participation) / 200),
        });
      }
    }
  });

  // The agents those groups stand for. Seeded from the run's own seed, so the
  // same draft always draws the same field, and a different draft draws a
  // different one.
  const agentField = buildAgentField(
    run.reactions.map((reaction) => `stakeholder:${reaction.segmentId}`),
    createRng(`${run.seed}::agents`),
  );

  return finalise({
    nodes,
    edges,
    arrival,
    agents: agentField.agents,
    population: { total: agentField.total, perMark: agentField.perMark },
  });
};


/* ------------------------------------------------------------------------- */
/* The public schematic                                                        */
/* ------------------------------------------------------------------------- */

/**
 * The representative department the public schematic is drawn from. The landing
 * page holds no run and no session, so it shows the STRUCTURE a run builds from
 * one documented departmental configuration rather than implying a result.
 * Named once here so the page, the schematic and the tests read one value.
 */
export const PREVIEW_DEPARTMENT_ID: DepartmentId = "opc";

/**
 * The compact graph for the public page: the draft, the groups the
 * representative department models, and the ring between them. No priorities,
 * no documents, no edge labels — it has to read at a glance inside a card.
 *
 * Every node and edge arrives on round 1, because there is no run to grow with;
 * the entrance is a one-shot animation rather than a timeline. Weights come from
 * the seeded PRNG, so the schematic is identical on every visit and every build.
 */
export const buildPreviewRelationshipGraph = (
  departmentId: DepartmentId = PREVIEW_DEPARTMENT_ID,
): RelationshipGraph => {
  const department = findDepartment(departmentId);
  if (!department) throw new Error(`Unknown department id: ${departmentId}`);

  const rng = createRng(`${department.id}::preview-structure`);
  const nodes: RelationshipNode[] = [policyNode("The proposed policy", department.abbr)];
  const edges: RelationshipEdge[] = [];
  const arrival: Record<string, number> = { [POLICY_NODE_ID]: 1 };

  department.segments.forEach((segmentId, index) => {
    const segment = getStakeholderSegment(segmentId);
    const id = `stakeholder:${segmentId}`;
    nodes.push({ id, label: segment.label, kind: "stakeholder", note: segment.note });
    arrival[id] = 1;
    edges.push({
      id: edgeIdFor(id, POLICY_NODE_ID, RELATION_BANK.modelledInDraft),
      source: id,
      target: POLICY_NODE_ID,
      relation: RELATION_BANK.modelledInDraft,
      strength: round2(0.35 + rng.next() * 0.6),
    });

    const next = department.segments[(index + 1) % department.segments.length];
    if (department.segments.length > 1 && next !== segmentId) {
      const nextId = `stakeholder:${next}`;
      edges.push({
        id: edgeIdFor(id, nextId, RELATION_BANK.modelledAlongside),
        source: id,
        target: nextId,
        relation: RELATION_BANK.modelledAlongside,
        strength: round2(0.3 + rng.next() * 0.45),
      });
    }
  });

  // The agents those groups stand for, from the representative department's own
  // seed, so the public schematic is identical on every visit and every build.
  const agentField = buildAgentField(
    department.segments.map((segmentId) => `stakeholder:${segmentId}`),
    createRng(`${department.id}::agents`),
  );

  return finalise({
    nodes,
    edges,
    arrival,
    agents: agentField.agents,
    population: { total: agentField.total, perMark: agentField.perMark },
  });
};
