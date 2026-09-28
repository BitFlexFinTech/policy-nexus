/**
 * SINGLE SOURCE OF TRUTH — the assessment result schema.
 *
 * This is the ONLY place the shape of a simulation result is defined. The UI
 * renders these types and never invents its own shape; the scenario engine and
 * the future MiroFish HTTP client both return exactly this. (see
 * .clinerules/03-single-source-of-truth.md)
 *
 * Every figure below is simulated and must be read with DISCLAIMER.long. No
 * type here implies real public opinion, market outcomes or administrative
 * results — the wording is deliberately "modelled" / "support index".
 */

import type { DepartmentId } from "@/config/departments";
import type { StakeholderSegmentId, TimeHorizonId } from "@/config/reference";
import type { ScenarioLevers } from "./levers";

/** How the policy text reached the engine. */
export type AssessmentSource = "paste" | "preset" | "upload";

/**
 * The inputs of a run. This is what gets persisted between visits; the result is
 * recomputed from it, so storage stays small and the result can never drift from
 * its inputs.
 */
export interface AssessmentRequest {
  departmentId: DepartmentId;
  /** The policy text that seeds the run. */
  policyText: string;
  source: AssessmentSource;
  /** Preset template id when the draft was seeded from a preset chip. */
  templateId?: string;
  /** Horizon the department prepared the draft for. */
  timeHorizon?: TimeHorizonId;
  /**
   * Names of uploaded files, recorded for provenance. A `.txt` upload also
   * supplies the policy text itself (read in the browser), and a `.docx` upload
   * supplies its own paragraphs (unpacked in the browser); `.pdf` uploads are
   * recorded by name only — their text is not read in this build.
   */
  fileNames?: string[];
  /**
   * The assumptions the officer set for this run. Optional, so every stored run and
   * every caller written before the levers existed keeps working; `resolveLevers`
   * fills in the neutral setting.
   */
  levers?: ScenarioLevers;
}

export interface SimulationRound {
  index: number;
  /** Who the round is attributed to, e.g. a stakeholder segment label. */
  actor: string;
  /** Feed tone, mapped to the existing feed row colours. */
  tone: "info" | "action" | "result" | "warning" | "system";
  message: string;
}

export type ReactionSentiment = "supportive" | "mixed" | "resistant";

export interface StakeholderReaction {
  segmentId: StakeholderSegmentId;
  label: string;
  sentiment: ReactionSentiment;
  /** 0–100 modelled support index — NOT a vote share or a poll result. */
  supportIndex: number;
  /** 0–100 modelled participation. */
  participation: number;
  note: string;
}

export type ImpactDirection = "positive" | "mixed" | "negative";

export interface ImpactDimension {
  id: string;
  label: string;
  direction: ImpactDirection;
  /** 0–100 modelled strength of movement. */
  score: number;
  note: string;
}

export type RiskSeverity = "low" | "medium" | "high";

export interface AssessmentRisk {
  id: string;
  label: string;
  severity: RiskSeverity;
  note: string;
}

export interface AssessmentRecommendation {
  id: string;
  label: string;
  note: string;
}

/** A headline figure on the executive summary. Always labelled simulated. */
export interface AssessmentMetric {
  id: string;
  label: string;
  value: string;
  note: string;
}

/**
 * One completed deterministic run. `id` is a pure function of the request, so
 * re-running identical inputs yields the same id and the same body.
 */
export interface AssessmentRun {
  id: string;
  departmentId: DepartmentId;
  departmentName: string;
  departmentAbbr: string;
  /** Human reference, e.g. `FIN-02`. */
  reference: string;
  policyTitle: string;
  policyText: string;
  source: AssessmentSource;
  fileNames: string[];
  /** ISO date of the run. Always REFERENCE_DATE in scenario mode. */
  createdAt: string;
  /** The exact seed string the engine was initialised with. */
  seed: string;
  timeHorizon: TimeHorizonId;
  horizonLabel: string;
  /** The horizon in months, so the run can state the length it was modelled over. */
  horizonMonths: number;
  /** The assumptions this run was modelled under, with the neutral setting filled in. */
  levers: ScenarioLevers;
  /** One plain-language line per assumption, for the screen and every export. */
  leverNotes: string[];
  status: "complete";
  confidence: number;
  summary: string;
  rounds: SimulationRound[];
  reactions: StakeholderReaction[];
  impacts: ImpactDimension[];
  risks: AssessmentRisk[];
  recommendations: AssessmentRecommendation[];
  metrics: AssessmentMetric[];
}

/* ------------------------------------------------------------------------- */
/* Generated documents derived from a run                                      */
/* ------------------------------------------------------------------------- */

/**
 * One section of a generated document. Documents are derived from a completed
 * run and are deterministic — the same run always renders the same document.
 */
export interface GeneratedSection {
  id: string;
  heading: string;
  /** Narrative paragraphs, in reading order. */
  paragraphs: string[];
  /** Optional list rendered under the paragraphs (numbered clauses, bullets). */
  bullets?: string[];
  /** How the optional list is rendered. Defaults to bullets. */
  listStyle?: "bullets" | "clauses";
}

/**
 * A document generated from one completed run: the long-form narrative report
 * (`report`) or the drafted policy itself (`policy-draft`).
 */
export interface GeneratedDocument {
  kind: "report" | "policy-draft";
  title: string;
  /** One line naming the run this document derives from. */
  subtitle: string;
  /** Suggested export filename stem, without an extension. */
  fileStem: string;
  sections: GeneratedSection[];
}
