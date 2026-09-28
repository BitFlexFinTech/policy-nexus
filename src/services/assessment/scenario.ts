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
import {
  REFERENCE_DATE,
  getStakeholderSegment,
  getTimeHorizon,
  segmentWeight,
} from "@/config/reference";
import { VOCABULARY } from "@/config/brand";
import { createRng, type Rng } from "@/lib/prng";
import { readPolicy, type PolicyClauses, type PolicyReading } from "./policyReading";
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

/**
 * BATCH C — RISKS ARE DERIVED, NOT A FIXED BANK.
 *
 * Each rule states the condition in the run that raises it, and a severity that
 * answers to the run. A risk whose condition is not met is not printed, so a run
 * never carries advice for a problem it did not find. Every condition reads the
 * policy's own words through `PolicyReading`, the modelled reactions, or the
 * modelled priority movements — nothing here is a bare coin toss.
 */
interface RiskContext {
  reading: PolicyReading;
  reactions: readonly StakeholderReaction[];
  impacts: readonly ImpactDimension[];
  department: Department;
}

interface RiskRule {
  id: string;
  label: string;
  /** The stated condition that raises this risk. */
  when: (context: RiskContext) => boolean;
  severity: (context: RiskContext) => RiskSeverity;
  /** One line saying what the risk is, in plain language. */
  note: string;
}

const RISK_RULES: readonly RiskRule[] = [
  {
    id: "risk-intent-only",
    label: "Intent without an action",
    note: "The draft states what it wants to achieve but assigns no action to anyone, so nothing names who must do what.",
    when: (context) => context.reading.actionSentences.length === 0,
    severity: () => "high",
  },
  {
    id: "risk-sequencing",
    label: "Implementation sequencing",
    note: "Actions that begin before the supporting registers and systems exist raise early non-compliance.",
    when: (context) => context.reading.actionSentences.length > 0,
    severity: (context) =>
      context.reading.actionSentences.length >= 6 || !context.reading.clauses.transition
        ? "high"
        : context.reading.clauses.monitoring
          ? "low"
          : "medium",
  },
  {
    id: "risk-transition",
    label: "Transition support",
    note: "No defined transition period leaves affected groups carrying the full adjustment cost in one cycle.",
    when: (context) =>
      context.reading.actionSentences.length >= 2 && !context.reading.clauses.transition,
    severity: (context) => (context.reading.clauses.funding ? "medium" : "high"),
  },
  {
    id: "risk-funding",
    label: "Unfunded actions",
    note: "The draft assigns actions without naming how they are paid for, so the cost lands on front-line budgets.",
    when: (context) =>
      context.reading.actionSentences.length >= 2 && !context.reading.clauses.funding,
    severity: (context) => (context.reading.actionSentences.length >= 5 ? "high" : "medium"),
  },
  {
    id: "risk-absorption",
    label: "Administrative absorption",
    note: "Front-line offices absorb the new process without a matching change to establishment or training.",
    when: (context) => context.reading.actionSentences.length >= 4,
    severity: (context) => (context.reading.actionSentences.length >= 7 ? "high" : "medium"),
  },
  {
    id: "risk-communication",
    label: "Stakeholder communication",
    note: "Groups that the draft does not address directly model the change as more disruptive than it is.",
    when: (context) => context.reactions.some((reaction) => reaction.sentiment !== "supportive"),
    severity: (context) => {
      const resistant = context.reactions.filter((reaction) => reaction.sentiment === "resistant");
      const share = resistant.length / Math.max(1, context.reactions.length);
      return share >= 0.5 ? "high" : resistant.length > 0 ? "medium" : "low";
    },
  },
  {
    id: "risk-scope",
    label: "Scope left unnamed",
    note: "The draft's own words name none of the groups it will affect, so each group reads its own position into it.",
    when: (context) => context.reading.concernedSegmentIds.length === 0,
    severity: () => "medium",
  },
  {
    id: "risk-outside-instrument",
    label: "Reliance outside the register",
    note: "The draft rests on an instrument this department's own register does not hold, which is worth checking before adoption.",
    when: (context) => context.reading.outsideInstrumentTitles.length > 0,
    severity: () => "medium",
  },
  {
    id: "risk-enforcement",
    label: "Penalty without machinery",
    note: "The draft attaches a penalty but names no enforcement, inspection or audit, so the penalty has nothing to carry it.",
    when: (context) => context.reading.clauses.penalty && !context.reading.clauses.enforcement,
    severity: () => "medium",
  },
  {
    id: "risk-priority-setback",
    label: "Priority moving against the draft",
    note: "At least one of the department's stated priorities is modelled as moving against the draft as written.",
    when: (context) => context.impacts.some((impact) => impact.direction === "negative"),
    severity: (context) => {
      const negative = context.impacts.filter((impact) => impact.direction === "negative").length;
      return negative >= 2 ? "high" : "medium";
    },
  },
];

/**
 * One remedy per risk. A recommendation is never printed unless the risk it answers
 * was actually raised, so the advice list is as short as the problem list.
 */
const REMEDIES: Record<string, { id: string; label: string; note: string }> = {
  "risk-intent-only": {
    id: "rec-assign",
    label: "Name who does what, and by when",
    note: "Turns each stated aim into an action with a responsible office and a date, so the draft can be implemented as written.",
  },
  "risk-sequencing": {
    id: "rec-schedule",
    label: "Publish the implementation schedule with the policy",
    note: "Attaches dates and responsible offices to each action so affected groups can prepare.",
  },
  "risk-transition": {
    id: "rec-phase",
    label: "Phase the actions by readiness",
    note: "Start with the groups the model shows as ready and support the rest through a transition window.",
  },
  "risk-funding": {
    id: "rec-fund",
    label: "State the funding source for every new action",
    note: "Names the budget line or the levy that pays for each action, so the cost is visible before adoption.",
  },
  "risk-absorption": {
    id: "rec-support",
    label: "Pair each new action with capacity support",
    note: "Matches the front-line cost of the change with training, staffing or a simplified procedure.",
  },
  "risk-communication": {
    id: "rec-engage",
    label: "Brief the groups the draft does not address",
    note: "Tells every modelled group what changes for it, so late learning does not become objection.",
  },
  "risk-scope": {
    id: "rec-scope",
    label: "State who the policy applies to",
    note: "Names the groups and the activities in scope, so every group reads the same instrument.",
  },
  "risk-outside-instrument": {
    id: "rec-instrument",
    label: "Confirm the instrument the draft relies on",
    note: "Checks the cited Act against the department's own register and adds it if it belongs there.",
  },
  "risk-enforcement": {
    id: "rec-enforce",
    label: "Name the office that enforces the penalty",
    note: "Attaches the penalty to an inspection or audit duty, so it has machinery behind it.",
  },
  "risk-priority-setback": {
    id: "rec-adjust",
    label: "Adjust the draft where a priority moves the wrong way",
    note: "Revisits the measures that carry the negative movement before the draft is adopted.",
  },
};

/**
 * Recommendations that answer a clause the draft LACKS rather than a risk it raises.
 * Kept separate from `REMEDIES` because their cause is an absence, and a missing
 * clause is a gap in the draft rather than a risk in the run.
 */
const CLAUSE_GAP_REMEDIES: Record<string, { id: string; label: string; note: string }> = {
  reviewTrigger: {
    id: "rec-review",
    label: "Define the review trigger and its evidence",
    note: "States in advance what would cause the policy to be revisited, and what data would show it.",
  },
  monitoring: {
    id: "rec-monitor",
    label: "Name the measure that will show whether it worked",
    note: "Attaches one indicator and one collecting office to the policy, so its effect can be seen.",
  },
};

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

/**
 * A mean that respects what each group stands for. `segmentWeight` is the group's
 * published population share where one exists, and a neutral weight where none does
 * — so the composite figures reflect the country rather than the length of the list.
 */
const weightedMean = (values: readonly number[], weights: readonly number[]): number => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (values.length === 0 || totalWeight === 0) return 0;
  const total = values.reduce((sum, value, index) => sum + value * (weights[index] ?? 0), 0);
  return Math.round(total / totalWeight);
};

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

/**
 * One modelled group's reaction.
 *
 * BATCH A — the draft's own reading decides how much each group engages. A group
 * the draft's words concern engages more and its modelled position spreads further;
 * a group the draft never speaks to engages less and its position is pulled towards
 * the middle, because a draft that does not mention a group gives that group little
 * to react to. Both adjustments are stated in the reaction's note, so the officer can
 * see WHY a figure moved rather than being told to trust it.
 */
const buildReactions = (
  department: Department,
  rng: Rng,
  reading: PolicyReading,
): StakeholderReaction[] =>
  department.segments.map((segmentId) => {
    const segment = getStakeholderSegment(segmentId);
    const addressed = reading.concernedSegmentIds.includes(segmentId);
    const supportIndex = rng.int(18, 90);
    const rawParticipation = rng.int(32, 96);

    // A draft that speaks to a group draws it out; one that ignores it does not.
    const participation = addressed
      ? Math.min(96, rawParticipation + 12)
      : Math.max(24, rawParticipation - 8);
    // An unaddressed group's modelled position sits nearer the middle, because there
    // is less in the draft for it to react to.
    const adjustedSupport = addressed
      ? supportIndex
      : Math.round(supportIndex * 0.6 + NEUTRAL_SUPPORT * 0.4);
    const sentiment = sentimentFor(adjustedSupport);

    return {
      segmentId,
      label: segment.label,
      sentiment,
      supportIndex: adjustedSupport,
      participation,
      note: addressed
        ? `${rng.pick(REACTION_NOTES[sentiment])} The draft's own words address this group.`
        : `${rng.pick(REACTION_NOTES[sentiment])} The draft's own words do not address this group, so its modelled position sits nearer the middle.`,
    };
  });

/** The middle of the modelled support scale. Named once, so the pull above cannot drift. */
const NEUTRAL_SUPPORT = 54;

/**
 * One stated priority's modelled movement.
 *
 * BATCH A — how far a priority moves answers to how far the draft's own words reach
 * (`reading.breadth`): a narrow draft that names no group and carries no clause moves
 * the modelled position less, and a broad draft moves it more. The figure is still
 * seeded, so the same draft always gives the same answer.
 */
const buildImpacts = (
  department: Department,
  horizonLabel: string,
  rng: Rng,
  reading: PolicyReading,
): ImpactDimension[] => {
  // 0.6 at breadth 0 (a draft that asks for nothing moves little) rising to 1.0 at breadth 100.
  const reach = 0.6 + reading.breadth / 250;
  return department.priorities.map((priority) => {
    const direction = directionFor(rng.next());
    const base = rng.int(28, 92);
    const score = Math.max(10, Math.min(96, Math.round(50 + (base - 50) * reach)));
    return {
      id: priority.id,
      label: priority.label,
      direction,
      score,
      note: `${IMPACT_NOTES[direction]} Horizon: ${horizonLabel}. Modelled against a draft whose own words reach ${reading.breadth}/100.`,
    };
  });
};

/**
 * The risks this run actually raises, in the order the rules are declared. A rule
 * whose condition is not met is simply absent, so the list answers to the draft
 * rather than to a template.
 */
const buildRisks = (context: RiskContext): AssessmentRisk[] =>
  RISK_RULES.filter((rule) => rule.when(context)).map((rule) => ({
    id: rule.id,
    label: rule.label,
    severity: rule.severity(context),
    note: rule.note,
  }));

/**
 * One recommendation per risk raised, plus one for each clause the draft lacks —
 * deduplicated by id, so two risks that share a remedy print it once.
 */
const buildRecommendations = (
  context: RiskContext,
  risks: readonly AssessmentRisk[],
): AssessmentRecommendation[] => {
  const chosen: Array<{ id: string; label: string; note: string }> = [];
  const seen = new Set<string>();
  const add = (item: { id: string; label: string; note: string }) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    chosen.push(item);
  };

  risks.forEach((risk) => {
    const remedy = REMEDIES[risk.id];
    if (remedy) add(remedy);
  });
  (Object.keys(CLAUSE_GAP_REMEDIES) as Array<keyof PolicyClauses>).forEach((clause) => {
    if (!context.reading.clauses[clause]) add(CLAUSE_GAP_REMEDIES[clause]);
  });

  return chosen.map((item) => ({
    id: item.id,
    label: item.label,
    note: `${item.note} Applied to ${context.department.shortName}.`,
  }));
};

const buildRounds = (
  department: Department,
  context: Pick<AssessmentRun, "reference" | "seed" | "policyText" | "horizonLabel">,
  reactions: readonly StakeholderReaction[],
  reading: PolicyReading,
  rng: Rng,
): SimulationRound[] => {
  const rounds: SimulationRound[] = [
    {
      index: 1,
      actor: "System",
      tone: "system",
      message: `Run ${context.reference} accepted for ${department.name}. Policy text ${context.policyText.length} characters, ${reading.wordCount} words. Horizon ${context.horizonLabel}.`,
    },
    {
      // BATCH A — the reading is stated as its own round, so the officer can see what
      // the engine took from the draft before any figure is shown.
      index: 2,
      actor: VOCABULARY.scenarioEngine,
      tone: "info",
      message: `Draft read: ${reading.actionSentences.length} ${reading.actionSentences.length === 1 ? "sentence assigns an action" : "sentences assign actions"}, ${reading.concernedSegmentIds.length} of ${department.segments.length} modelled groups named, ${reading.citedInstrumentIds.length} register ${reading.citedInstrumentIds.length === 1 ? "instrument" : "instruments"} named, own reach ${reading.breadth}/100.`,
    },
    {
      index: 3,
      actor: "System",
      tone: "info",
      message: `${VOCABULARY.knowledgeMap} loaded: ${department.indicators.length} reference indicators, ${department.priorities.length} stated priorities, ${department.documents.length} department documents.`,
    },
  ];

  if (reading.outsideInstrumentTitles.length > 0) {
    rounds.push({
      index: 4,
      actor: "System",
      tone: "warning",
      message: `The draft names ${reading.outsideInstrumentTitles.length} instrument ${reading.outsideInstrumentTitles.length === 1 ? "that sits" : "that sit"} outside this department's register: ${reading.outsideInstrumentTitles.join("; ")}. Worth confirming before adoption.`,
    });
  }

  let index = rounds.length + 1;
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
          "Requests a published timetable before the actions take effect.",
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

  // BATCH A — the draft is read once, before anything is modelled, and every figure
  // below answers to it. Pure: the same text always yields the same reading.
  const reading = readPolicy(request.policyText, department);

  const reactions = buildReactions(department, rng, reading);
  const impacts = buildImpacts(department, horizonLabel, rng, reading);
  const riskContext: RiskContext = { reading, reactions, impacts, department };
  const risks = buildRisks(riskContext);
  const recommendations = buildRecommendations(riskContext, risks);

  // BATCH B — the composite figures are weighted by what each group stands for.
  // `segmentWeight` is the group's published population share where one exists, and a
  // neutral weight where none does, so a group of 51,478 people no longer counts for
  // as much as a group of 7,891,035. The equal-weight figures are kept beside them,
  // because the gap between the two is itself worth seeing.
  const weights = reactions.map((reaction) => segmentWeight(reaction.segmentId));
  const support = weightedMean(reactions.map((reaction) => reaction.supportIndex), weights);
  const supportEqual = mean(reactions.map((reaction) => reaction.supportIndex));
  const participation = weightedMean(reactions.map((reaction) => reaction.participation), weights);

  // Confidence answers to the reading instead of a bare roll: a draft that names its
  // groups, names its instruments and carries more of the seven clauses gives a firmer
  // modelled range. Kept inside the stated 56–92 band, so the figure never claims more
  // certainty than the model has.
  const participationMean = mean(reactions.map((reaction) => reaction.participation));
  const confidence = Math.max(
    56,
    Math.min(
      92,
      Math.round(
        56 +
          reading.breadth * 0.2 +
          (participationMean - 54) * 0.2 +
          (reading.citedInstrumentIds.length > 0 ? 6 : 0),
      ),
    ),
  );
  const volatility = rng.int(9, 34);

  const restrictive = reactions.filter((reaction) => reaction.sentiment === "resistant");
  const supportive = reactions.filter((reaction) => reaction.sentiment === "supportive");
  const addressed = reactions.filter((reaction) =>
    reading.concernedSegmentIds.includes(reaction.segmentId),
  ).length;
  const weightedGap = Math.abs(support - supportEqual);

  const summary =
    `Modelled over ${horizonLabel.toLowerCase()}, the draft "${policyTitle}" draws a population-weighted support index of ` +
    `${support}/100 across ${reactions.length} stakeholder groups (${supportEqual}/100 if every group is counted equally), ` +
    `with ${supportive.length} reading as supportive and ${restrictive.length} as resistant. ` +
    `The draft's own words assign ${reading.actionSentences.length} ${reading.actionSentences.length === 1 ? "action" : "actions"} ` +
    `and name ${addressed} of the ${reactions.length} modelled groups; its own reach is ${reading.breadth}/100. ` +
    `Confidence in the modelled range is ${confidence}% and modelled volatility is ${volatility}/100. ` +
    `${risks.length} ${risks.length === 1 ? "risk is" : "risks are"} raised, the first being ${risks[0].label.toLowerCase()}. ` +
    `These are simulated stakeholder responses under stated assumptions, prepared for decision support — not a forecast of public opinion.`;

  const metrics: AssessmentMetric[] = [
    {
      id: "metric-confidence",
      label: "Composite confidence",
      value: `${confidence}%`,
      note: "Strength of the modelled range. It answers to how far the draft's own words reach, whether it names the instruments it relies on, and how far the modelled groups engage.",
    },
    {
      id: "metric-support",
      label: "Modelled support index",
      value: `${support} / 100`,
      note: `Weighted by what each group stands for, using its published population share where one exists. Counting every group equally instead gives ${supportEqual}/100 — a difference of ${weightedGap} points, shown so the weighting is never hidden.`,
    },
    {
      id: "metric-participation",
      label: "Modelled participation",
      value: `${participation} / 100`,
      note: "Weighted modelled engagement of the groups this department models — weighted the same way as the support index, by what each group stands for.",
    },
    {
      id: "metric-volatility",
      label: "Modelled volatility",
      value: `${volatility} / 100`,
      note: "Spread of the modelled responses — higher means the outcome is more sensitive to implementation detail.",
    },
    {
      // BATCH A — the replacement for the old "stakeholder coverage" card. Coverage is
      // still stated (every group is modelled), and the draft's own reach is added, so
      // the officer can see at a glance whether the instrument speaks to the groups it
      // will affect.
      id: "metric-draft-reach",
      label: "Draft's own reach",
      value: `${addressed} of ${reactions.length} groups`,
      note: `All ${reactions.length} groups this department models are in the run; the draft's own words address ${addressed} of them. It assigns ${reading.actionSentences.length} ${reading.actionSentences.length === 1 ? "action" : "actions"}, names ${reading.citedInstrumentIds.length} register ${reading.citedInstrumentIds.length === 1 ? "instrument" : "instruments"}${reading.outsideInstrumentTitles.length > 0 ? `, and also names ${reading.outsideInstrumentTitles.length} outside the register` : ""}, and carries ${Object.values(reading.clauses).filter(Boolean).length} of the 7 clause kinds the reader looks for.`,
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
      reading,
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
