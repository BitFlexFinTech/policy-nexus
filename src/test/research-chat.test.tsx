import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addResearchDocument,
  clearAllResearchDocuments,
} from "@/services/research/researchDocuments";
import { askResearchQuestion } from "@/services/research/researchChat";
import { findSources } from "@/services/research/researchRetrieval";
import { signInResearcher } from "@/session/researchSession";

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/chat";

const withResearchModel = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  research: { mode: "live", endpoint: ENDPOINT, key: "key", model: "model" },
});

const seedDocument = () =>
  addResearchDocument({
    name: "Mining revenue note",
    sizeLabel: "52 characters",
    kind: "text",
    text: "Mining revenue in Zimbabwe rose on higher gold output.",
    status: "Text added directly — read in full.",
  });

/**
 * The grounded research chat (ZEPARI Batch E) — retrieval always runs over ZEPARI's own documents, and
 * the question is ALWAYS answered: the research model writes the answer when one is connected, and with
 * none connected the matched passages are QUOTED from the library instead. Nothing is ever invented,
 * which is exactly why "no model connected" must still produce an answer (the owner's build plan
 * requires answers "from the library WITH OR WITHOUT AI").
 */
describe("the grounded research chat", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearAllResearchDocuments();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("finds and quotes the library documents a question matches, and nothing when none match", () => {
    const document = seedDocument();
    const sources = findSources("mining revenue", [document]);
    expect(sources.map((source) => source.name)).toContain("Mining revenue note");
    expect(sources[0].excerpt).toMatch(/Mining revenue/);

    expect(findSources("completely unrelated wording", [document])).toHaveLength(0);
  });

  it("ANSWERS FROM THE LIBRARY, QUOTED, when no research model is connected", async () => {
    const document = seedDocument();
    const result = await askResearchQuestion("mining revenue gold");

    expect(result.status).toBe("assembled");
    expect(result.answer, "a matched question must never be left unanswered").not.toBeNull();
    const answer = result.answer ?? "";
    // Every quotation in the answer traces to a document that really matched...
    expect(result.sources.length).toBeGreaterThan(0);
    for (const source of result.sources) {
      expect(answer).toContain(source.name);
      expect(answer).toContain(source.excerpt);
      expect(document.text).toContain(source.excerpt);
    }
    // ...and the platform says plainly that it ASSEMBLED the answer rather than writing it.
    expect(answer).toMatch(/no words were written for you/);
    expect(result.detail).toMatch(/Assembled from ZEPARI's own documents/);
  });

  it("answers from the sources when the research model is connected", async () => {
    seedDocument();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Mining revenue rose (Mining revenue note)." } }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    saveConfig(withResearchModel());

    const result = await askResearchQuestion("mining revenue");

    expect(result.status).toBe("answered");
    expect(result.answer).toMatch(/Mining revenue rose/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders on the research workspace, and ANSWERS from the library with no model", async () => {
    seedDocument();
    window.history.pushState({}, "", "/research/app/ask");
    signInResearcher("chigumira");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: /ask the research library/i })
      .closest("section") as HTMLElement;
    fireEvent.change(within(panel).getByLabelText("Question"), {
      target: { value: "mining revenue" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /ask/i }));

    // The ANSWER appears on the screen — quoted from the document — and not merely a notice that no
    // model is connected. This is the defect the owner reported: he asked and the screen did nothing.
    await waitFor(() =>
      expect(within(panel).getByText(/QUOTED from ZEPARI's own documents/)).toBeInTheDocument(),
    );
    expect(within(panel).getByText("Mining revenue note")).toBeInTheDocument();
  });
});