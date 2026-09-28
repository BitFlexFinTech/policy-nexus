/**
 * COMPARE TWO RUNS — what changed between two drafts of the same policy question.
 *
 * The strongest question a policy office asks is "what changed, and did it help?".
 * This module answers it from two completed runs of the same department: the headline
 * figures, every modelled group, every stated priority, and which risks were raised or
 * cleared.
 *
 * PURE: a function of the two runs alone. No clock, no randomness, no network. It
 * REFUSES to compare across two departments, because a comparison between two different
 * mandates would be a false comparison — a stated refusal, not a silent one.
 */

import type { AssessmentRun } from "./types";

export interface MetricDifference {
  label: string;
  a: string;
  b: string;
  changed: boolean;
}

export interface GroupDifference {
  segmentId: string;
  label: string;
  supportA: number;
  supportB: number;
  delta: number;
  sentimentA: string;
  sentimentB: string;
  changedSentiment: boolean;
}

export interface PriorityDifference {
  id: string;
  label: string;
  directionA: string;
  directionB: string;
  scoreA: number;
  scoreB: number;
  delta: number;
  changed: boolean;
}

export interface RunComparison {
  departmentId: string;
  departmentName: string;
  referenceA: string;
  referenceB: string;
  titleA: string;
  titleB: string;
  /** True when the two runs were modelled over the same horizon length. */
  sameHorizon: boolean;
  horizonMonthsA: number;
  horizonMonthsB: number;
  metrics: MetricDifference[];
  groups: GroupDifference[];
  priorities: PriorityDifference[];
  /** Risks raised in the second run that the first did not raise. */
  risksRaised: string[];
  /** Risks the first run raised that the second does not. */
  risksCleared: string[];
  /** Assumptions that differ between the two runs, stated one line each. */
  assumptionChanges: string[];
  /** One plain-language paragraph describing the change. */
  verdict: string;
}

export type ComparisonResult =
  | { status: "compared"; comparison: RunComparison }
  | { status: "refused"; reason: string };

const metricValue = (run: AssessmentRun, id: string): string =>
  run.metrics.find((metric) => metric.id === id)?.value ?? "—";

const numeric = (value: string): number => {
  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

/** The assumptions that differ, in the same words the run screens use. */
const assumptionChanges = (a: AssessmentRun, b: AssessmentRun): string[] => {
  const changes: string[] = [];
  (["funding", "capacity", "enforcement"] as const).forEach((key) => {
    if (a.levers[key] !== b.levers[key]) {
      changes.push(`${key}: ${a.levers[key]} → ${b.levers[key]}`);
    }
  });
  if (a.levers.phaseInMonths !== b.levers.phaseInMonths) {
    changes.push(`phasing: ${a.levers.phaseInMonths} → ${b.levers.phaseInMonths} months`);
  }
  if (a.horizonMonths !== b.horizonMonths) {
    changes.push(`horizon: ${a.horizonMonths} → ${b.horizonMonths} months`);
  }
  return changes;
};

/**
 * Compare two completed runs. Returns a refusal — never a comparison — when the two do
 * not share a department, because the two mandates are not interchangeable.
 */
export const compareRuns = (a: AssessmentRun, b: AssessmentRun): ComparisonResult => {
  if (a.departmentId !== b.departmentId) {
    return {
      status: "refused",
      reason:
        "These two runs belong to different departments, so their modelled groups and priorities are not the same question. Compare two drafts of the same department.",
    };
  }

  const supportA = numeric(metricValue(a, "metric-support"));
  const supportB = numeric(metricValue(b, "metric-support"));
  const confidenceA = numeric(metricValue(a, "metric-confidence"));
  const confidenceB = numeric(metricValue(b, "metric-confidence"));

  const metrics: MetricDifference[] = a.metrics.map((metric, index) => ({
    label: metric.label,
    a: metric.value,
    b: b.metrics[index]?.value ?? "—",
    changed: metric.value !== (b.metrics[index]?.value ?? ""),
  }));

  const bReactions = new Map(b.reactions.map((reaction) => [reaction.segmentId, reaction]));
  const groups: GroupDifference[] = a.reactions.map((reaction) => {
    const other = bReactions.get(reaction.segmentId);
    return {
      segmentId: reaction.segmentId,
      label: reaction.label,
      supportA: reaction.supportIndex,
      supportB: other?.supportIndex ?? 0,
      delta: (other?.supportIndex ?? 0) - reaction.supportIndex,
      sentimentA: reaction.sentiment,
      sentimentB: other?.sentiment ?? "—",
      changedSentiment: reaction.sentiment !== (other?.sentiment ?? ""),
    };
  });

  const bImpacts = new Map(b.impacts.map((impact) => [impact.id, impact]));
  const priorities: PriorityDifference[] = a.impacts.map((impact) => {
    const other = bImpacts.get(impact.id);
    return {
      id: impact.id,
      label: impact.label,
      directionA: impact.direction,
      directionB: other?.direction ?? "—",
      scoreA: impact.score,
      scoreB: other?.score ?? 0,
      delta: (other?.score ?? 0) - impact.score,
      changed: impact.direction !== (other?.direction ?? ""),
    };
  });

  const riskSetA = new Set(a.risks.map((risk) => risk.label));
  const riskSetB = new Set(b.risks.map((risk) => risk.label));
  const risksRaised = b.risks.map((risk) => risk.label).filter((label) => !riskSetA.has(label));
  const risksCleared = a.risks.map((risk) => risk.label).filter((label) => !riskSetB.has(label));

  const delta = supportB - supportA;
  const word = delta > 0 ? "higher" : delta < 0 ? "lower" : "level with";
  const verdict =
    delta === 0 && risksRaised.length === 0 && risksCleared.length === 0
      ? `Run ${b.reference} models the same result as ${a.reference}: the population-weighted support index is unchanged at ${supportB}/100 and no risk was raised or cleared. If the wording changed, the change was not material to the model.`
      : `Run ${b.reference} draws a population-weighted support index of ${supportB}/100, ${word} run ${a.reference} at ${supportA}/100 (${delta >= 0 ? "+" : ""}${delta} points, against ${confidenceA}% and ${confidenceB}% confidence). ${risksRaised.length} risk ${risksRaised.length === 1 ? "was" : "were"} raised and ${risksCleared.length} cleared. These are simulated stakeholder responses under stated assumptions, prepared for decision support — not a forecast of public opinion.`;

  return {
    status: "compared",
    comparison: {
      departmentId: a.departmentId,
      departmentName: a.departmentName,
      referenceA: a.reference,
      referenceB: b.reference,
      titleA: a.policyTitle,
      titleB: b.policyTitle,
      sameHorizon: a.horizonMonths === b.horizonMonths,
      horizonMonthsA: a.horizonMonths,
      horizonMonthsB: b.horizonMonths,
      metrics,
      groups,
      priorities,
      risksRaised,
      risksCleared,
      assumptionChanges: assumptionChanges(a, b),
      verdict,
    },
  };
};
