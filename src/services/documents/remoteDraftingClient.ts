/**
 * The OpenRouter drafting client.
 *
 * When an administrator enters an OpenRouter key and a model at `/platform-admin` and
 * switches the drafting capability on, the report, the drafted policy and the
 * implementation pack are produced by that model. With nothing configured the platform
 * uses its own deterministic generator instead, so the workspace works offline.
 *
 * OpenRouter speaks the standard chat-completions shape: the platform sends
 * `{ model, messages }` and reads `choices[0].message.content`. The model is asked for
 * its answer as JSON matching the document's own shape; an answer that does not match is
 * REJECTED and reported, never silently replaced by the offline text.
 */

import { liveService, OPENROUTER_CHAT_ENDPOINT, type CapabilityConfig } from "@/config/platform";
import {
  DOCUMENT_KINDS,
  type AssessmentRun,
  type DocumentKind,
  type GeneratedDocument,
  type GeneratedSection,
} from "@/services/assessment/types";
import type { DraftingGrounding } from "./drafting";

/** The kinds of document a drafting service may be asked for — the platform's own list. */
export type DraftingKind = DocumentKind;

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
  if (!DOCUMENT_KINDS.includes(value.kind as DocumentKind)) return false;
  if (typeof value.title !== "string" || typeof value.subtitle !== "string") return false;
  if (typeof value.fileStem !== "string") return false;
  if (!Array.isArray(value.sections) || value.sections.length === 0) return false;
  return value.sections.every(isSection);
};

/** The system instruction: who is drafting, the department prompt, and the JSON shape required. */
const systemInstruction = (request: RemoteDraftingRequest): string =>
  [
    "You are an experienced Zimbabwean government policy drafter.",
    "Produce a complete, formal policy instrument in the structure requested below.",
    request.grounding.prompt.instructions,
    "The sections, in order, are the following. Each section's heading must be one of them, in this order:",
    ...request.grounding.prompt.structure.map((heading) => `  - ${heading}`),
    "Return your answer as a SINGLE JSON object and nothing else, of exactly this shape:",
    '{"title": string, "subtitle": string, "sections": [{"id": string, "heading": string, "paragraphs": string[], "bullets"?: string[], "table"?: {"caption": string, "columns": string[], "rows": string[][]}}]}',
    "`id` is a short slug. Do not add any commentary outside the JSON.",
  ].join("\n");

/** The user instruction: the run and the department's own material, stated plainly. */
const userInstruction = (request: RemoteDraftingRequest): string =>
  [
    `Policy title: ${request.grounding.policyTitle}`,
    `Draft submitted for examination:\n${request.grounding.policyText}`,
    `Department: ${request.grounding.departmentName} (${request.grounding.departmentAbbr}).`,
    `Modelled stakeholder groups: ${request.grounding.groups
      .map((group) => `${group.label} (${group.share})`)
      .join("; ")}.`,
    `Instruments available to cite: ${request.grounding.instruments
      .map((instrument) => instrument.citation)
      .join("; ")}.`,
    `Simulation reference ${request.grounding.reference}.`,
  ].join("\n\n");

/** Pull the JSON object out of a model's answer, tolerating a ```json fence or surrounding prose. */
const extractJson = (text: string): string => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
};

const isTable = (
  value: unknown,
): value is { caption: string; columns: string[]; rows: string[][] } => {
  if (!isObject(value)) return false;
  return (
    typeof value.caption === "string" &&
    Array.isArray(value.columns) &&
    value.columns.every((column) => typeof column === "string") &&
    Array.isArray(value.rows) &&
    value.rows.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
  );
};

/** Turn a model's JSON answer into the platform's document shape, or throw if it does not match. */
const documentFromModelText = (
  content: string,
  request: RemoteDraftingRequest,
): GeneratedDocument => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    throw new Error("The drafting model did not return valid JSON.");
  }
  if (!isObject(parsed) || !Array.isArray(parsed.sections)) {
    throw new Error("The drafting model's answer was not a document.");
  }
  const sections: GeneratedSection[] = parsed.sections.map((raw, index) => {
    if (!isObject(raw)) throw new Error("The drafting model returned a malformed section.");
    const paragraphs = Array.isArray(raw.paragraphs)
      ? raw.paragraphs.filter((entry): entry is string => typeof entry === "string")
      : [];
    const bullets = Array.isArray(raw.bullets)
      ? raw.bullets.filter((entry): entry is string => typeof entry === "string")
      : undefined;
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : `section-${index + 1}`,
      heading: typeof raw.heading === "string" ? raw.heading : "",
      paragraphs,
      ...(bullets && bullets.length ? { bullets } : {}),
      ...(isTable(raw.table) ? { table: raw.table } : {}),
    };
  });
  const document: GeneratedDocument = {
    kind: request.kind,
    title: typeof parsed.title === "string" ? parsed.title : request.grounding.policyTitle,
    subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : "",
    fileStem: request.kind,
    sections,
  };
  if (!isGeneratedDocument(document)) {
    throw new Error("The drafting model's answer was missing required parts.");
  }
  return document;
};

export interface RemoteDraftingClient {
  generate(request: RemoteDraftingRequest): Promise<GeneratedDocument>;
}

export const createRemoteDraftingClient = (
  config: CapabilityConfig,
): RemoteDraftingClient => ({
  async generate(request) {
    const endpoint = config.endpoint.trim().replace(/\/+$/, "") || OPENROUTER_CHAT_ENDPOINT;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${config.key.trim()}`,
      },
      body: JSON.stringify({
        model: request.model || config.model,
        messages: [
          { role: "system", content: systemInstruction(request) },
          { role: "user", content: userInstruction(request) },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenRouter answered ${response.status}.`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenRouter returned no text.");
    }
    return documentFromModelText(content, request);
  },
});

/** The client when the capability is live, otherwise null — use the local generator. */
export const remoteDraftingClient = (): RemoteDraftingClient | null => {
  const config = liveService("drafting");
  return config ? createRemoteDraftingClient(config) : null;
};
