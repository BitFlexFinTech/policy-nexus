/**
 * THE SEAM — the only way the interface reaches an assessment engine.
 *
 * No component imports `scenario.ts` (or any future HTTP client) directly; they
 * depend on this interface and this factory alone. That is what makes the
 * eventual backend a configuration swap rather than a UI rewrite
 * (see .clinerules/04-determinism-and-validation.md and
 * PRODUCTION_READINESS.md §3).
 *
 * MOCK-FIRST STATUS: the deterministic scenario engine is the only registered
 * client in this build. The real remote client is selected by
 * `.env → VITE_ASSESSMENT_MODE=service` once its endpoint exists; until then the
 * workspace serves simulated results and labels them as such, rather than
 * failing because a credential is not yet available.
 */

import type { DepartmentId } from "@/config/departments";
import { buildScenarioRun } from "./scenario";
import { getRunRequest, listRunRequestsFor, saveRunRequest } from "./runStore";
import type { AssessmentRequest, AssessmentRun } from "./types";

export interface AssessmentService {
  /**
   * Pure: build a run from a request without recording it. The same request
   * always yields a byte-identical run.
   */
  buildRun(request: AssessmentRequest): AssessmentRun;
  /** Build a run and record it in the department's register. Returns the run. */
  run(request: AssessmentRequest): AssessmentRun;
  /** Look up a recorded run by id. */
  getRun(runId: string): AssessmentRun | undefined;
  /** Every recorded run for a department, newest first. */
  listRuns(departmentId: DepartmentId): AssessmentRun[];
}

/** Which client serves results. `service` requires a remote endpoint. */
export type AssessmentMode = "scenario" | "service";

/**
 * Configured mode. Defaults to `scenario`; set `VITE_ASSESSMENT_MODE=service`
 * in the deployment environment to select the remote client once it is
 * registered below.
 */
export const ASSESSMENT_MODE: AssessmentMode =
  import.meta.env.VITE_ASSESSMENT_MODE === "service" ? "service" : "scenario";

/**
 * The deterministic engine wrapped in the service contract. `run` records the
 * request (not the result) so a stored run is always recomputed from its inputs.
 */
const createScenarioAssessmentService = (): AssessmentService => ({
  buildRun: (request) => buildScenarioRun(request),
  run: (request) => {
    saveRunRequest(request);
    return buildScenarioRun(request);
  },
  getRun: (runId) => {
    const stored = getRunRequest(runId);
    return stored ? buildScenarioRun(stored) : undefined;
  },
  listRuns: (departmentId) =>
    listRunRequestsFor(departmentId).map((stored) => buildScenarioRun(stored)),
});

/**
 * Client registry — the single place a client is registered.
 * `service` is explicitly NOT registered yet: its create function is a
 * documented fallback to the scenario engine so that setting the env var before
 * the endpoint exists degrades to simulated results instead of breaking.
 */
const CLIENTS: Record<AssessmentMode, { create: () => AssessmentService; registered: boolean }> = {
  scenario: { create: createScenarioAssessmentService, registered: true },
  service: { create: createScenarioAssessmentService, registered: false },
};

/** Factory. Selects the registered client for the configured mode. */
export const createAssessmentService = (mode: AssessmentMode = ASSESSMENT_MODE): AssessmentService =>
  CLIENTS[mode].create();

/** The process-wide service instance. Components import only this. */
export const assessmentService: AssessmentService = createAssessmentService();

/**
 * True while the deterministic scenario engine produces results — i.e. while no
 * remote client is registered for the configured mode (mock-first). The UI uses
 * this to label results as simulated.
 */
export const isScenarioMode = (): boolean => !CLIENTS[ASSESSMENT_MODE].registered;
