/**
 * The remote drafting client (HTTP).
 *
 * NOT WIRED INTO THE SCREENS YET, deliberately — the same reason as the remote
 * assessment client: the drafting seam the report and policy-draft screens use is
 * synchronous, and a model call cannot be. See docs/SERVER_CONTRACT.md.
 *
 * It validates the answer: a document that is missing its sections is rejected
 * rather than rendered as an empty instrument.
 */

import { liveService, type CapabilityConfig } from "@/config/platform";
import type { AssessmentRun, GeneratedDocument, GeneratedSection } from "@/services/assessment/types";
import type { DraftingGrounding } from "./drafting";

export type DraftingKind = "report" | "policy-draft";

export interface RemoteDraftingRequest {
  kind: DraftingKind;
  /** Model or route name the administrator chose. */
  model: string;
  run: AssessmentRun;
  /**
   * The department's grounding: its mandate, priorities, modelled groups with the share
   * each carries, the instruments it may cite, and the document structure it must
   * produce. A service is given exactly what the local generator is given, so swapping
   * the two cannot change what a draft is allowed to rest on.
   */
  grounding: DraftingGrounding;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSection = (value: unknown): value is GeneratedSection => {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string" || typeof value.heading !== "string") return false;
  if (!Array.isArray(value.paragraphs)) return false;
  if (value.bullets !== undefined && !Array.isArray(value.bullets)) return false;
  return true;
};

/** True only for a document carrying every field the screens render. */
export const isGeneratedDocument = (value: unknown): value is GeneratedDocument => {
  if (!isObject(value)) return false;
  if (value.kind !== "report" && value.kind !== "policy-draft") return false;
  if (typeof value.title !== "string" || typeof value.subtitle !== "string") return false;
  if (typeof value.fileStem !== "string") return false;
  if (!Array.isArray(value.sections) || value.sections.length === 0) return false;
  return value.sections.every(isSection);
};

export interface RemoteDraftingClient {
  generate(request: RemoteDraftingRequest): Promise<GeneratedDocument>;
}

export const createRemoteDraftingClient = (
  config: CapabilityConfig,
): RemoteDraftingClient => ({
  async generate(request) {
    const response = await fetch(config.endpoint.trim().replace(/\/+$/, ""), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${config.key.trim()}`,
      },
      body: JSON.stringify({ ...request, model: request.model || config.model }),
    });
    if (!response.ok) {
      throw new Error(`The drafting service answered ${response.status}.`);
    }
    const payload: unknown = await response.json();
    if (!isGeneratedDocument(payload)) {
      throw new Error("The drafting service did not return a complete document.");
    }
    return payload;
  },
});

/** The client when the capability is live, otherwise null — use the local generator. */
export const remoteDraftingClient = (): RemoteDraftingClient | null => {
  const config = liveService("drafting");
  return config ? createRemoteDraftingClient(config) : null;
};
