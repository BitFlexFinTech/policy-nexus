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
 * The grounded research chat (ZEPARI Batch E) — retrieval always runs over ZEPARI's own documents;
 * a written answer needs the research model, and with none connected the platform shows the sources
 * and says so rather than inventing an answer.
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

  it("shows the sources but writes NO answer when no research model is connected", async () => {
    seedDocument();
    const result = await askResearchQuestion("mining revenue gold");

    expect(result.status).toBe("no-answer-model");
    expect(result.answer).toBeNull();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.detail).toMatch(/No answer model is connected/);
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

  it("renders on the research workspace, and writes no answer with no model", async () => {
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

    await waitFor(() =>
      expect(within(panel).getByText(/No answer model is connected/)).toBeInTheDocument(),
    );
    expect(within(panel).getByText("Mining revenue note")).toBeInTheDocument();
  });
});