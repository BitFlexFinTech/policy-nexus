/**
 * THE RESEARCH POLICY BRIEF — a short brief drafted from the research library, with its sources shown.
 *
 * The owner's decision (ZEPARI Batch F). Built the same honest way as the research chat: retrieval
 * over ZEPARI's own documents always runs and its passages are shown as SOURCES; the words of the
 * brief are produced by the research model (OpenRouter, the research key), drawn ONLY from those
 * sources. **When no model is connected the brief is still PRODUCED — assembled from the library**
 * (see `researchAssembly.ts`): its fixed sections are filled with the passages the topic matched,
 * each named, and the one section that needs a judgement (Recommendations) says plainly that it was
 * not produced. The owner's build plan requires answers "from the library WITH OR WITHOUT AI"
 * (`docs/ZEPARI_BUILD_PLAN.md`, Stage B). No brief is ever invented.
 *
 * The strict boundary holds: nothing here reaches the policy-simulation engine.
 */

import { liveService, OPENROUTER_CHAT_ENDPOINT, type CapabilityConfig } from "@/config/platform";
import { RESEARCH_BRIEF_SECTIONS } from "@/config/research";
import { ASSEMBLED_BRIEF_DETAIL, assembleBrief } from "./researchAssembly";
import { listResearchDocuments } from "./researchDocuments";
import { findSources, type ResearchSource } from "./researchRetrieval";

export type ResearchBriefStatus = "drafted" | "assembled" | "no-sources" | "error";

export interface ResearchBrief {
  status: ResearchBriefStatus;
  /**
   * The brief. Written by the research model when one is connected; **assembled from the library**
   * when none is (status `assembled`). `null` only when no document matched the topic.
   */
  brief: string | null;
  /** The library documents the topic matched, quoted. Always shown. */
  sources: readonly ResearchSource[];
  /** The sections the brief carries, in order. Always shown, so the shape is visible before drafting. */
  structure: readonly string[];
  /** One plain line stating exactly what happened. */
  detail: string;
}

const SYSTEM_INSTRUCTION = [
  "You are a research analyst for ZEPARI (the Zimbabwe Economic Policy Analysis and Research Institute).",
  "Draft a SHORT policy brief from the excerpts provided from ZEPARI's research library.",
  "Use ONLY the excerpts. Never state a figure that is not in them, and say so when they do not support a point.",
  "Name the source of each point.",
].join(" ");

const userInstruction = (topic: string, sources: readonly ResearchSource[]): string =>
  [
    `Topic: ${topic}`,
    "",
    "Produce a policy brief with exactly these sections, in this order:",
    ...RESEARCH_BRIEF_SECTIONS.map((section) => `- ${section}`),
    "",
    `Excerpts from ZEPARI's research library (${sources.length} source${sources.length === 1 ? "" : "s"}):`,
    ...sources.map((source, index) => `[${index + 1}] ${source.name}: ${source.excerpt}`),
  ].join("\n");

const briefClient = (config: CapabilityConfig) => ({
  async draft(topic: string, sources: readonly ResearchSource[]): Promise<string> {
    const endpoint = config.endpoint.trim().replace(/\/+$/, "") || OPENROUTER_CHAT_ENDPOINT;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${config.key.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: userInstruction(topic, sources) },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`The research model answered ${response.status}.`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("The research model returned no text.");
    }
    return content.trim();
  },
});

/**
 * Draft a brief on a topic. Retrieval always runs, and a brief is always produced: the research model
 * writes it when one is connected, and with none connected it is ASSEMBLED from the matched passages
 * in the brief's fixed sections (`status: "assembled"`), saying plainly which section it could not
 * produce. `brief` is `null` only when no document matched at all.
 */
export const draftResearchBrief = async (topic: string): Promise<ResearchBrief> => {
  const trimmed = topic.trim();
  const sources = findSources(trimmed, listResearchDocuments());
  const structure = RESEARCH_BRIEF_SECTIONS;
  const config = liveService("research");

  if (!config) {
    if (!sources.length) {
      return {
        status: "no-sources",
        brief: null,
        sources,
        structure,
        detail:
          "No document in the research library matches this topic. Add the relevant document to the library first.",
      };
    }
    /* NO MODEL CONNECTED — the brief is still produced, assembled from the library. Same reason as
       the chat: the build plan's free default is "answers from the library WITH OR WITHOUT AI". */
    return {
      status: "assembled",
      brief: assembleBrief(trimmed, sources, structure),
      sources,
      structure,
      detail: ASSEMBLED_BRIEF_DETAIL,
    };
  }

  if (!sources.length) {
    return {
      status: "no-sources",
      brief: null,
      sources,
      structure,
      detail:
        "No document in the research library matches this topic. Add the relevant document to the library first.",
    };
  }

  try {
    const brief = await briefClient(config).draft(trimmed, sources);
    return {
      status: "drafted",
      brief,
      sources,
      structure,
      detail: "Drafted from the research library, using the research model.",
    };
  } catch (error) {
    return {
      status: "error",
      brief: null,
      sources,
      structure,
      detail: error instanceof Error ? error.message : "The research model could not be reached.",
    };
  }
};