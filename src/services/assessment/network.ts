/**
 * SINGLE SOURCE OF TRUTH — the relationship graph behind a run.
 *
 * A run already produces modelled stakeholder reactions, stated priorities and
 * the department's reference documents. This module states that structure as a
 * graph so the interface can show it: one draft at the centre, the groups the
 * run models around it, the priorities it is assessed against, and the documents
 * it is read against.
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
import { createRng } from "@/lib/prng";
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
}

/** The four node kinds, with the one label each kind is shown under. */
export const RELATIONSHIP_KINDS: ReadonlyArray<{
  kind: RelationshipNodeKind;
  label: string;
  /** Palette token for the legend mark — an existing token, not a new colour. */
  tone: string;
}> = [
  { kind: "policy", label: "Policy draft", tone: "bg-primary" },
  { kind: "stakeholder", label: "Stakeholder group", tone: "bg-gold" },
  { kind: "priority", label: "Stated priority", tone: "bg-success" },
  { kind: "corpus", label: "Reference document", tone: "bg-muted-foreground" },
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
}

/**
 * Stable edge id from an unordered pair plus the relation, so the same
 * relationship cannot enter the graph twice under two different ids.
 */
const edgeIdFor = (source: string, target: string, relation: string): string =>
  `edge:${[source, target].sort().join(":")}:${relation}`;

/** Two decimal places, so an edge weight never carries float noise into a snapshot. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Close the spec: drop duplicate relationships, then date every edge. */
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

  return { nodes: spec.nodes, edges, nodeArrival: { ...spec.arrival }, edgeArrival };
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

  return finalise({ nodes, edges, arrival });
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

  return finalise({ nodes, edges, arrival });
};
