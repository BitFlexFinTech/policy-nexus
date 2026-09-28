/**
 * The remote assessment client (HTTP).
 *
 * NOT WIRED INTO THE SCREENS YET, deliberately. This is the real half of the
 * assessment seam: it sends a run request to the configured service and maps the
 * answer onto the canonical `AssessmentRun` schema.
 *
 * WHY IT IS NOT WIRED: no endpoint exists yet. `AssessmentService` — the interface
 * every screen uses — became ASYNCHRONOUS in Phase Z (`buildRun`/`run`/`getRun`/
 * `listRuns` all return promises), so this client already satisfies it and needs no
 * refactor; the only missing piece is an endpoint and a credential. Until one is
 * configured, the factory selects the deterministic engine and the workspace serves
 * simulated results, labelled as such.
 *
 * (An earlier version of this comment said the seam was still synchronous and that
 * wiring this client would require an asynchronous refactor. That stopped being true
 * when Phase Z landed, and it is corrected here rather than left to mislead.)
 *
 * It never trusts the payload: an incomplete answer is rejected rather than
 * rendered as if it were a result.
 */

import { liveService, type CapabilityConfig } from "@/config/platform";
import type { AssessmentRequest, AssessmentRun } from "./types";

const REQUIRED_STRINGS = [
  "id",
  "departmentId",
  "departmentName",
  "departmentAbbr",
  "reference",
  "policyTitle",
  "policyText",
  "source",
  "createdAt",
  "seed",
  "timeHorizon",
  "horizonLabel",
  "status",
  "summary",
] as const;

const REQUIRED_ARRAYS = [
  "fileNames",
  "rounds",
  "reactions",
  "impacts",
  "risks",
  "recommendations",
  "metrics",
] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * True only for a payload that carries every field the screens render. A partial
 * answer fails this check, so it can never be shown as a result.
 */
export const isAssessmentRun = (value: unknown): value is AssessmentRun => {
  if (!isObject(value)) return false;
  for (const key of REQUIRED_STRINGS) {
    if (typeof value[key] !== "string") return false;
  }
  if (typeof value.confidence !== "number" || Number.isNaN(value.confidence)) return false;
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(value[key])) return false;
  }
  // BATCH E — the assumptions and the horizon are part of what the screens state, so an
  // answer that omits them is incomplete rather than renderable.
  if (typeof value.horizonMonths !== "number" || Number.isNaN(value.horizonMonths)) return false;
  if (!Array.isArray(value.leverNotes)) return false;
  if (!isObject(value.levers)) return false;
  for (const key of ["funding", "capacity", "enforcement"] as const) {
    if (typeof value.levers[key] !== "string") return false;
  }
  if (typeof value.levers.phaseInMonths !== "number") return false;
  return true;
};

export interface RemoteAssessmentClient {
  buildRun(request: AssessmentRequest): Promise<AssessmentRun>;
  run(request: AssessmentRequest): Promise<AssessmentRun>;
  getRun(runId: string): Promise<AssessmentRun | undefined>;
  listRuns(departmentId: string): Promise<AssessmentRun[]>;
}

const authHeaders = (config: CapabilityConfig) => ({
  Authorization: `Bearer ${config.key.trim()}`,
});

const base = (endpoint: string) => endpoint.trim().replace(/\/+$/, "");

const postRun = async (
  config: CapabilityConfig,
  request: AssessmentRequest,
): Promise<AssessmentRun> => {
  const response = await fetch(base(config.endpoint), {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(config) },
    body: JSON.stringify({ request }),
  });
  if (!response.ok) {
    throw new Error(`The assessment service answered ${response.status}.`);
  }
  const payload: unknown = await response.json();
  if (!isAssessmentRun(payload)) {
    throw new Error("The assessment service did not return a complete run.");
  }
  return payload;
};

export const createRemoteAssessmentClient = (
  config: CapabilityConfig,
): RemoteAssessmentClient => ({
  buildRun(request) {
    return postRun(config, request);
  },

  /**
   * A live run is not recorded locally: with a service configured, the service is
   * the register, and `listRuns` reads it. Recording inputs here as well would
   * create two registers that could disagree.
   */
  run(request) {
    return postRun(config, request);
  },

  async getRun(runId) {
    const response = await fetch(`${base(config.endpoint)}/${encodeURIComponent(runId)}`, {
      headers: authHeaders(config),
    });
    if (!response.ok) return undefined;
    const payload: unknown = await response.json();
    return isAssessmentRun(payload) ? payload : undefined;
  },

  async listRuns(departmentId) {
    const url = `${base(config.endpoint)}?department=${encodeURIComponent(departmentId)}`;
    const response = await fetch(url, { headers: authHeaders(config) });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return Array.isArray(payload) ? payload.filter(isAssessmentRun) : [];
  },
});

/** The client when the capability is live, otherwise null — use the scenario engine. */
export const remoteAssessmentClient = (): RemoteAssessmentClient | null => {
  const config = liveService("assessment");
  return config ? createRemoteAssessmentClient(config) : null;
};
