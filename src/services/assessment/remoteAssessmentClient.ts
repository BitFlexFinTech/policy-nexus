/**
 * The remote assessment client (HTTP).
 *
 * NOT WIRED INTO THE SCREENS YET, deliberately. This is the real half of the
 * assessment seam: it sends a run request to the configured service and maps the
 * answer onto the canonical `AssessmentRun` schema.
 *
 * WHY IT IS NOT WIRED: `AssessmentService` — the interface every screen uses — is
 * SYNCHRONOUS (`buildRun` returns a run, not a promise). A network client cannot
 * satisfy that without the run path becoming asynchronous, which reaches the
 * policy input, both run hooks and every register that lists runs. That refactor
 * is the named next step in docs/SERVER_CONTRACT.md; until it is done this client
 * is verified against a stubbed transport but cannot serve a screen.
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
