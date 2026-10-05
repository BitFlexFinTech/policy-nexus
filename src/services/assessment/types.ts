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
import type { OfficerIdentity } from "@/config/officer";
import type { StakeholderSegmentId, TimeHorizonId } from "@/config/reference";
import type { ScenarioLevers } from "./levers";

/**
 * How the policy text reached the engine. `draft` is the drafted policy itself: the
 * officer took the instrument the platform produced back through the simulation, which
 * is what makes the run a later version of the one it came from.
 */
export type AssessmentSource = "paste" | "preset" | "upload" | "draft";

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
  /**
   * The run this one was re-run from, when the officer took the drafted policy back
   * through the simulation. A first run has none. The version number is DERIVED from
   * this chain (`revisionNumber` in `./revision`) and never stored a second time, so a
   * run and the version it is shown as cannot drift apart.
   */
  revisionOf?: string;
  /**
   * Who prepared the policy, recorded so the run carries a paper trail to the person
   * responsible for it. Optional, so every stored run and every caller written before this
   * existed keeps working; when present it is part of the seed, so two officers running
   * the same text produce two recorded runs rather than one row that quietly replaces the
   * other's work. See `src/config/officer.ts`.
   */
  preparedBy?: OfficerIdentity;
  /**
   * The department's own documents, read into this run (owner's item 3). Optional, so every
   * stored run and every caller written before this existed keeps working; when present a
   * short digest of them joins the seed, so the same draft with more departmental material
   * is a genuinely different run.
   */
  documents?: DepartmentDocumentInput[];
  /**
   * The moment this run was recorded, in ISO form. The run store sets it the instant the
   * officer presses Run Simulation, so the run and every document it produces carry one
   * date. Absent on a request that was built but never recorded — and on every run stored
   * before the platform kept a real date — in which case a run falls back to the platform's
   * reference date, so an older run is never rewritten.
   */
  recordedAt?: string;
}

/**
 * One departmental document supplied to a run: its name, and whatever text was really read
 * from it. `text` is empty when the file could only be recorded by name (a PDF in this
 * build), so a run can state honestly how much departmental material it actually read
 * (owner's item 3).
 */
export interface DepartmentDocumentInput {
  id: string;
  name: string;
  text: string;
}

/** What a run recorded about one departmental document it was given. */
export interface RunDocumentRecord {
  id: string;
  name: string;
  /** Characters of real text read from this document. 0 when it could only be recorded. */
  characters: number;
  /**
   * The real text read from this document, so the drafted policy can rest on the department's
   * own material and not merely on its filename. Empty when the file could only be recorded by
   * name (a PDF in this build), and absent on a run that came from a service rather than from
   * this build — which is why every reader treats it as optional and contributes nothing when
   * it is missing.
   */
  text?: string;
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
  /**
   * The moment the run was recorded, in ISO form. The run's own recorded instant, or the
   * platform's reference date when a run was built but never recorded (which includes every
   * run stored before the platform kept a real date).
   */
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
  /**
   * The run this one was re-run from, copied from the request. Absent on a first run.
   */
  revisionOf?: string;
  /** Who prepared the policy, copied from the request. Absent when none was recorded. */
  preparedBy?: OfficerIdentity;
  /** The departmental documents this run was given, and what was really read from each. */
  documents?: RunDocumentRecord[];
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
  /**
   * Optional table rendered under the list — the Government matrices a policy is read
   * by (implementation, monitoring and evaluation, stakeholder analysis). Every row must
   * carry exactly one cell per column; a gate in `src/test/policy-document.test.ts`
   * fails the build if a row is short, so a malformed matrix cannot reach a reader.
   */
  table?: {
    /** The table's own caption, e.g. "Table 2 — Modelled position of each group". */
    caption: string;
    columns: string[];
    rows: string[][];
  };
}

/**
 * A document generated from one completed run: the long-form narrative report
 * (`report`) or the drafted policy itself (`policy-draft`).
 */
/**
 * EVERY kind of document the platform can generate — ONE list.
 *
 * It was written in three places (the document type, the loading hook and the remote drafting client),
 * which is how a kind ends up accepted in one place and rejected in another. Adding a kind now means
 * adding it once; the remote client's validation and the seam both read this list.
 */
export const DOCUMENT_KINDS = ["report", "policy-draft", "implementation-pack"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface GeneratedDocument {
  kind: DocumentKind;
  title: string;
  /** One line naming the run this document derives from. */
  subtitle: string;
  /** Suggested export filename stem, without an extension. */
  fileStem: string;
  sections: GeneratedSection[];
}
