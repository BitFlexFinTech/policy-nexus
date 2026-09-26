/**
 * DETERMINISTIC SCENARIO ENGINE — the mock implementation of `AssessmentService`.
 *
 * It is a complete, working simulation of the eventual MiroFish backend: the
 * same request always produces a byte-identical `AssessmentRun`, entirely
 * offline. Nothing here reaches the network, reads the clock, or uses
 * `Math.random()`. Every figure is derived from the department's own authored
 * configuration plus a seeded PRNG (`@/lib/prng`).
 *
 * This is the ONLY module that knows how a result is produced. Components reach
 * it exclusively through `AssessmentService` (see the seam rule in
 * PRODUCTION_READINESS.md §3).
 */

import { findDepartment, type Department } from "@/config/departments";
import { REFERENCE_DATE, getStakeholderSegment, getTimeHorizon } from "@/config/reference";
import { VOCABULARY } from "@/config/brand";
import { createRng, type Rng } from "@/lib/prng";
import { runIdFor, seedHexForRequest, seedForRequest } from "./seed";
import type {
  AssessmentMetric,
  AssessmentRecommendation,
  AssessmentRequest,
  AssessmentRisk,
  AssessmentRun,
  ImpactDimension,
  ReactionSentiment,
  RiskSeverity,
  SimulationRound,
  StakeholderReaction,
} from "./types";

/* ------------------------------------------------------------------------- */
/* Authored sentence banks. Deterministic choice from these keeps the copy     */
/* readable and reviewable instead of assembled from random words.             */
/* ------------------------------------------------------------------------- */

const REACTION_NOTES: Record<ReactionSentiment, readonly string[]> = {
  supportive: [
    "The draft is legible to this group and its obligations are proportionate to the capacity it holds.",
    "Early engagement signals acceptance; the main request is a published implementation timetable.",
    "The group reads the draft as reducing an existing burden rather than adding one.",
  ],
  mixed: [
    "Support is conditional on implementation detail that the draft leaves to secondary instruments.",
    "The group accepts the direction but asks for a transition period before obligations begin.",
    "Reaction splits between members who gain from the change and members who must absorb its cost.",
  ],
  resistant: [
    "Resistance centres on compliance cost and the absence of a phased start.",
    "The group expects an administrative burden it is not resourced to carry.",
    "Objection is to sequencing: obligations arrive before the supporting systems are in place.",
  ],
};

const IMPACT_NOTES: Record<ImpactDimension["direction"], string> = {
  positive: "Modelled movement is favourable against this stated priority over the horizon.",
  mixed: "Modelled movement is uneven: the priority advances for some groups and stalls for others.",
  negative: "Modelled movement works against this priority unless the draft is adjusted before adoption.",
};

const RISK_BANK: ReadonlyArray<{ id: string; label: string; note: string }> = [
  {
    id: "risk-sequencing",
    label: "Implementation sequencing",
    note: "Obligations that begin before the supporting registers and systems exist raise early non-compliance.",
  },
  {
    id: "risk-communication",
    label: "Stakeholder communication",
    note: "Groups that learn of the change late model the draft as more disruptive than it is.",
  },
  {
    id: "risk-absorption",
    label: "Administrative absorption",
    note: "Front-line offices absorb the new process without a matching change to establishment or training.",
  },
  {
    id: "risk-transition",
    label: "Transition support",
    note: "No defined transition period leaves affected groups carrying the full adjustment cost in one cycle.",
  },
];

const RECOMMENDATION_BANK: ReadonlyArray<{ id: string; label: string; note: string }> = [
  {
    id: "rec-schedule",
    label: "Publish the implementation schedule with the policy",
    note: "Attaches dates and responsible offices to each obligation so affected groups can prepare.",
  },
  {
    id: "rec-phase",
    label: "Phase obligations by segment readiness",
    note: "Start with the groups the model shows as ready and support the rest through a transition window.",
  },
  {
    id: "rec-review",
    label: "Define the review trigger and its evidence",
    note: "States in advance what would cause the policy to be revisited, and what data would show it.",
  },
  {
    id: "rec-support",
    label: "Pair each new obligation with capacity support",
    note: "Matches the front-line cost of the change with training, staffing or a simplified procedure.",
  },
];

/* ------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* ------------------------------------------------------------------------- */

/** Sentiment bands for the modelled support index. Thresholds are fixed. */
const sentimentFor = (supportIndex: number): ReactionSentiment =>
  supportIndex >= 62 ? "supportive" : supportIndex >= 40 ? "mixed" : "resistant";

/** First meaningful line of the text, used when no preset title exists. */
const titleFromText = (text: string): string => {
  const firstLine = text
    .split("\n")
    .map((line) => line.replace(/^[#*\-\s]+/, "").trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "Untitled policy draft";
  return firstLine.length > 80 ? `${firstLine.slice(0, 77).trimEnd()}…` : firstLine;
};

const severityFor = (roll: number): RiskSeverity =>
  roll < 0.5 ? "low" : roll < 0.85 ? "medium" : "high";

const directionFor = (roll: number): ImpactDimension["direction"] =>
  roll < 0.45 ? "positive" : roll < 0.8 ? "mixed" : "negative";

const pad2 = (value: number) => String(value).padStart(2, "0");

const mean = (values: readonly number[]): number =>
  values.length === 0
    ? 0
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

/* ------------------------------------------------------------------------- */
/* Builders                                                                    */
/* ------------------------------------------------------------------------- */

const buildReactions = (department: Department, rng: Rng): StakeholderReaction[] =>
  department.segments.map((segmentId) => {
    const segment = getStakeholderSegment(segmentId);
    const supportIndex = rng.int(18, 90);
    const sentiment = sentimentFor(supportIndex);
    return {
      segmentId,
      label: segment.label,
      sentiment,
      supportIndex,
      participation: rng.int(32, 96),
      note: rng.pick(REACTION_NOTES[sentiment]),
    };
  });

const buildImpacts = (department: Department, horizonLabel: string, rng: Rng): ImpactDimension[] =>
  department.priorities.map((priority) => {
    const direction = directionFor(rng.next());
    return {
      id: priority.id,
      label: priority.label,
      direction,
      score: rng.int(28, 92),
      note: `${IMPACT_NOTES[direction]} Horizon: ${horizonLabel}.`,
    };
  });

const buildRisks = (rng: Rng): AssessmentRisk[] =>
  RISK_BANK.map((risk) => ({
    id: risk.id,
    label: risk.label,
    severity: severityFor(rng.next()),
    note: risk.note,
  }));

const buildRecommendations = (department: Department): AssessmentRecommendation[] =>
  RECOMMENDATION_BANK.map((recommendation) => ({
    id: recommendation.id,
    label: recommendation.label,
    note: `${recommendation.note} Applied to ${department.shortName}.`,
  }));

const buildRounds = (
  department: Department,
  context: Pick<AssessmentRun, "reference" | "seed" | "policyText" | "horizonLabel">,
  reactions: readonly StakeholderReaction[],
  rng: Rng,
): SimulationRound[] => {
  const rounds: SimulationRound[] = [
    {
      index: 1,
      actor: "System",
      tone: "system",
      message: `Run ${context.reference} accepted for ${department.name}. Policy text ${context.policyText.length} characters. Horizon ${context.horizonLabel}.`,
    },
    {
      index: 2,
      actor: "System",
      tone: "info",
      message: `${VOCABULARY.knowledgeMap} loaded: ${department.indicators.length} reference indicators, ${department.priorities.length} stated priorities, ${department.documents.length} department documents.`,
    },
  ];

  let index = 3;
  reactions.forEach((reaction) => {
    rounds.push({
      index,
      actor: reaction.label,
      tone:
        reaction.sentiment === "supportive"
          ? "result"
          : reaction.sentiment === "resistant"
            ? "warning"
            : "info",
      message: `${VOCABULARY.agentMemory} response modelled — support index ${reaction.supportIndex}/100, participation ${reaction.participation}/100 (${reaction.sentiment}).`,
    });
    index += 1;
    if (rng.bool(0.4)) {
      rounds.push({
        index,
        actor: reaction.label,
        tone: "action",
        message: rng.pick([
          "Requests a published timetable before obligations take effect.",
          "Asks that a single office be named for queries and escalation.",
          "Notes that the change is workable if the supporting register is live first.",
          "Raises the cost of the adjustment relative to the benefit received.",
        ]),
      });
      index += 1;
    }
  });

  rounds.push(
    {
      index,
      actor: VOCABULARY.scenarioEngine,
      tone: "action",
      message: `Interaction rounds reconciled across ${reactions.length} stakeholder groups. Composite indices derived from the seeded run.`,
    },
    {
      index: index + 1,
      actor: "System",
      tone: "system",
      message: `Seed ${context.seed}. Assessment complete — no external request was made.`,
    },
  );

  return rounds;
};

/* ------------------------------------------------------------------------- */
/* The engine                                                                  */
/* ------------------------------------------------------------------------- */

const buildRun = (request: AssessmentRequest): AssessmentRun => {
  const department = findDepartment(request.departmentId);
  if (!department) throw new Error(`Unknown department id: ${request.departmentId}`);

  const template = department.policyTemplates.find((item) => item.id === request.templateId);
  const templateIndex = template ? department.policyTemplates.indexOf(template) : -1;
  const seedHex = seedHexForRequest(request);
  const seed = seedForRequest(request);
  const rng = createRng(seed);

  const timeHorizon = request.timeHorizon ?? template?.timeHorizon ?? "medium";
  const horizonLabel = getTimeHorizon(timeHorizon).label;

  const policyTitle = template?.title ?? titleFromText(request.policyText);
  const reference =
    templateIndex >= 0
      ? `${department.abbr}-${pad2(templateIndex + 1)}`
      : `${department.abbr}-C${seedHex.slice(0, 4).toUpperCase()}`;

  const reactions = buildReactions(department, rng);
  const impacts = buildImpacts(department, horizonLabel, rng);
  const risks = buildRisks(rng);
  const recommendations = buildRecommendations(department);

  const confidence = rng.int(56, 92);
  const participation = mean(reactions.map((reaction) => reaction.participation));
  const support = mean(reactions.map((reaction) => reaction.supportIndex));
  const volatility = rng.int(9, 34);

  const restrictive = reactions.filter((reaction) => reaction.sentiment === "resistant");
  const supportive = reactions.filter((reaction) => reaction.sentiment === "supportive");

  const summary =
    `Modelled over ${horizonLabel.toLowerCase()}, the draft "${policyTitle}" draws a composite support index of ` +
    `${support}/100 across ${reactions.length} stakeholder groups, with ${supportive.length} reading as supportive and ` +
    `${restrictive.length} as resistant. Confidence in the modelled range is ${confidence}% and modelled volatility is ` +
    `${volatility}/100. The clearest pressure point is ${risks[0].label.toLowerCase()}. These are simulated stakeholder ` +
    `responses under stated assumptions, prepared for decision support — not a forecast of public opinion.`;

  const metrics: AssessmentMetric[] = [
    {
      id: "metric-confidence",
      label: "Composite confidence",
      value: `${confidence}%`,
      note: "Strength of the modelled range given the breadth of the draft and the modelled participation.",
    },
    {
      id: "metric-support",
      label: "Modelled support index",
      value: `${support} / 100`,
      note: "Mean of the modelled support index across this department's stakeholder groups.",
    },
    {
      id: "metric-participation",
      label: "Modelled participation",
      value: `${participation} / 100`,
      note: "Mean modelled engagement of the stakeholder groups the department models.",
    },
    {
      id: "metric-volatility",
      label: "Modelled volatility",
      value: `${volatility} / 100`,
      note: "Spread of the modelled responses — higher means the outcome is more sensitive to implementation detail.",
    },
    {
      id: "metric-coverage",
      label: "Stakeholder coverage",
      value: `${reactions.length} groups`,
      note: "Every stakeholder group this department models was included in the run.",
    },
  ];

  return {
    id: runIdFor(request),
    departmentId: department.id,
    departmentName: department.name,
    departmentAbbr: department.abbr,
    reference,
    policyTitle,
    policyText: request.policyText,
    source: request.source,
    fileNames: request.fileNames ?? [],
    createdAt: REFERENCE_DATE,
    seed,
    timeHorizon,
    horizonLabel,
    status: "complete",
    confidence,
    summary,
    rounds: buildRounds(
      department,
      { reference, seed, policyText: request.policyText, horizonLabel },
      reactions,
      rng,
    ),
    reactions,
    impacts,
    risks,
    recommendations,
    metrics,
  };
};

/**
 * Pure builder: the same request always yields an identical run. Exposed on the
 * service interface as `buildRun` so previews and stored runs share one code
 * path without persisting anything.
 */
export const buildScenarioRun = (request: AssessmentRequest): AssessmentRun => buildRun(request);
