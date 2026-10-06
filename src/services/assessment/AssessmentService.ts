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
import { liveService, platformModeOf, type CapabilityConfig } from "@/config/platform";
import { buildScenarioRun } from "./scenario";
import {
  getRunRequest,
  listRunRequests,
  listRunRequestsFor,
  saveRunRequest,
} from "./runStore";
import { createRemoteAssessmentClient } from "./remoteAssessmentClient";
import type { AssessmentRequest, AssessmentRun } from "./types";

/**
 * Every method returns a *promise* — an answer that arrives later.
 *
 * The simulated engine answers immediately, but a real service answers when it is
 * ready, and the two must look the same to every screen. That is why the seam
 * waits in both cases. See `peekRun`/`peekRuns` below for how the workspace still
 * renders instantly while nothing is configured.
 */
export interface AssessmentService {
  /** Build a run from a request without recording it. */
  buildRun(request: AssessmentRequest): Promise<AssessmentRun>;
  /** Build a run and record it in the department's register. Returns the run. */
  run(request: AssessmentRequest): Promise<AssessmentRun>;
  /** Look up a recorded run by id. */
  getRun(runId: string): Promise<AssessmentRun | undefined>;
  /** Every recorded run for a department, newest first. */
  listRuns(departmentId: DepartmentId): Promise<AssessmentRun[]>;
}

/**
 * The deterministic engine behind the same contract. It answers immediately — a
 * promise that is already resolved — so the workspace still renders in one frame,
 * exactly as it always has. `run` records the request, never the result, so a
 * stored run cannot drift from its inputs.
 */
const createScenarioAssessmentService = (): AssessmentService => ({
  buildRun: (request) => Promise.resolve(buildScenarioRun(request)),
  run: (request) => {
    const id = saveRunRequest(request);
    // Rebuild from what was RECORDED, so the run handed back here carries the same recorded
    // moment — and therefore the same date — that the register and every screen will show.
    const stored = getRunRequest(id);
    return Promise.resolve(buildScenarioRun(stored ?? request));
  },
  getRun: (runId) => {
    const stored = getRunRequest(runId);
    return Promise.resolve(stored ? buildScenarioRun(stored) : undefined);
  },
  listRuns: (departmentId) =>
    Promise.resolve(listRunRequestsFor(departmentId).map((stored) => buildScenarioRun(stored))),
});

/**
 * The live service, selected only when a platform administrator has switched the
 * assessment capability on AND supplied its address and key. There is no fallback
 * to simulated numbers here: a failure is reported as a failure.
 */
const createLiveAssessmentService = (config: CapabilityConfig): AssessmentService =>
  createRemoteAssessmentClient(config);

/**
 * Live mode with no assessment service connected: the platform shows NOTHING rather than a
 * simulated result dressed up as real (owner's rule, 2026-10-06). A call reports the missing
 * service as a failure; the registers render their own empty state.
 */
const createNotConnectedAssessmentService = (): AssessmentService => {
  const detail = "Live mode: no assessment service is connected.";
  return {
    buildRun: () => Promise.reject(new Error(detail)),
    run: () => Promise.reject(new Error(detail)),
    getRun: () => Promise.resolve(undefined),
    listRuns: () => Promise.resolve([]),
  };
};

/** Which engine serves this call, decided at the moment of the call. */
const selectClient = (): AssessmentService => {
  if (platformModeOf() === "simulated") return createScenarioAssessmentService();
  const config = liveService("assessment");
  return config ? createLiveAssessmentService(config) : createNotConnectedAssessmentService();
};

/**
 * The process-wide service. Every screen imports only this. It is a dispatcher
 * rather than a fixed choice, so switching a capability in platform
 * administration takes effect without a page reload.
 */
export const assessmentService: AssessmentService = {
  buildRun: (request) => selectClient().buildRun(request),
  run: (request) => selectClient().run(request),
  getRun: (runId) => selectClient().getRun(runId),
  listRuns: (departmentId) => selectClient().listRuns(departmentId),
};

/**
 * Synchronous reads, available ONLY while the simulated engine is configured.
 *
 * They exist so the workspace keeps rendering instantly with nothing configured —
 * no spinner and no flicker. A live service answers later by definition, so these
 * return `undefined` the moment a live assessment service is configured and the
 * caller must wait instead. No screen calls them directly; the run hooks do.
 */
/**
 * The simulated engine, synchronously.
 *
 * Used by the demo path so the workspace can render without waiting, and by tests
 * that need a run value to derive a graph from. It ALWAYS uses the simulated
 * engine — a live service cannot answer in the same breath, by definition.
 */
export const buildSimulatedRun = (request: AssessmentRequest): AssessmentRun =>
  buildScenarioRun(request);

export const peekRun = (runId: string): AssessmentRun | undefined => {
  if (platformModeOf() !== "simulated" || liveService("assessment")) return undefined;
  const stored = getRunRequest(runId);
  return stored ? buildScenarioRun(stored) : undefined;
};

export const peekRuns = (departmentId?: DepartmentId | null): AssessmentRun[] | undefined => {
  if (platformModeOf() !== "simulated" || liveService("assessment")) return undefined;
  return listRunRequests()
    .filter((stored) => !departmentId || stored.departmentId === departmentId)
    .map((stored) => buildScenarioRun(stored));
};

/**
 * True while the simulated engine produces results. The UI uses this to label
 * results as simulated, and it changes the moment an administrator switches the
 * capability on.
 */
export const isScenarioMode = (): boolean => platformModeOf() === "simulated";
