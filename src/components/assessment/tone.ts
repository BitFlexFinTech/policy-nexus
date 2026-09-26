/**
 * Tone maps shared by the assessment sections. Kept in a non-component module so
 * the component file exports only components, and so the maps have one
 * definition (single source of truth). Every class is an existing palette token.
 */

import type { ImpactDirection, ReactionSentiment, RiskSeverity } from "@/services/assessment/types";

export const SENTIMENT_TONE: Record<ReactionSentiment, string> = {
  supportive: "bg-success/15 text-success",
  mixed: "bg-warning/15 text-warning",
  resistant: "bg-destructive/15 text-destructive",
};

export const DIRECTION_TONE: Record<ImpactDirection, string> = {
  positive: "bg-success/15 text-success",
  mixed: "bg-warning/15 text-warning",
  negative: "bg-destructive/15 text-destructive",
};

export const SEVERITY_TONE: Record<RiskSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};
