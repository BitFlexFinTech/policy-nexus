/**
 * THE RESEARCH CHAT — a question answered from the research library, with its sources shown.
 *
 * The owner's decision (ZEPARI Batch E): the research assistant answers a question grounded in
 * ZEPARI's own documents, and shows where each answer came from. Two parts, kept apart on purpose:
 *
 *  - **Retrieval** always runs, locally and deterministically, over the documents ZEPARI added
 *    (see `researchRetrieval.ts`). The matching passages are the SOURCES, and they are real text.
 *  - **The written answer** is produced by the research model (OpenRouter, the research key entered
 *    on the administration screen). When no model is connected, NO answer is written — the platform
 *    shows the sources and says plainly that no answer model is connected. It never invents an answer.
 *
 * The strict boundary holds: nothing here reaches the policy-simulation engine.
 */

import { liveService, OPENROUTER_CHAT_ENDPOINT, type CapabilityConfig } from "@/config/platform";
import { listResearchDocuments } from "./researchDocuments";
import { findSources, type ResearchSource } from "./researchRetrieval";

export type ResearchChatStatus = "answered" | "no-answer-model" | "no-sources" | "error";

export interface ResearchChatAnswer {
  status: ResearchChatStatus;
  /** The written answer, when a research model is connected. `null` when none is. */
  answer: string | null;
  /** The library documents the question matched, quoted. Always shown. */
  sources: readonly ResearchSource[];
  /** One plain line stating exactly what happened. */
  detail: string;
}

const SYSTEM_INSTRUCTION = [
  "You are a research assistant for ZEPARI (the Zimbabwe Economic Policy Analysis and Research Institute).",
  "Answer the question USING ONLY the excerpts provided from ZEPARI's research library.",
  "If the excerpts do not contain the answer, say so plainly and do not invent anything.",
  "Never state a figure that is not in the excerpts. Name the source of each point.",
].join(" ");

/** The grounded question put to the research model, with the retrieved passages as its only evidence. */
const userInstruction = (question: string, sources: readonly ResearchSource[], howMany): string =>
  [
    `Question: ${question}`,
    "",
    `Excerpts from ZEPARI's research library (${howMany} source${howMany === 1 ? "" : "s"}):`,
    ...sources.map((source, index) => `[${index + 1}] ${source.name}: ${source.excerpt}`),
  ].join("\n");

const researchClient = (config: CapabilityConfig) => ({
  async answer(question: string, sources: readonly ResearchSource[]): Promise<string> {
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
          { role: "user", content: userInstruction(question, sources, sources.length) },
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
 * Ask the research assistant a question. Retrieval always runs; the written answer needs the research
 * model. With no model connected the sources are still shown — no answer is fabricated.
 */
export const askResearchQuestion = async (question: string): Promise<ResearchChatAnswer> => {
  const trimmed = question.trim();
  const sources = findSources(trimmed, listResearchDocuments());
  const config = liveService("research");

  if (!config) {
    return {
      status: sources.length ? "no-answer-model" : "no-sources",
      answer: null,
      sources,
      detail: sources.length
        ? "No answer model is connected. The sources this question matched are shown below; connect the research model on the administration screen to have them answered."
        : "No answer model is connected, and no document in the research library matches this question.",
    };
  }

  if (!sources.length) {
    return {
      status: "no-sources",
      answer: null,
      sources,
      detail:
        "No document in the research library matches this question. Add the relevant document to the library first.",
    };
  }

  try {
    const answer = await researchClient(config).answer(trimmed, sources);
    return {
      status: "answered",
      answer,
      sources,
      detail: "Answered from the research library, using the research model.",
    };
  } catch (error) {
    return {
      status: "error",
      answer: null,
      sources,
      detail: error instanceof Error ? error.message : "The research model could not be reached.",
    };
  }
};