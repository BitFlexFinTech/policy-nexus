import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import { RESEARCH_BRIEF_SECTIONS } from "@/config/research";
import {
  addResearchDocument,
  clearAllResearchDocuments,
} from "@/services/research/researchDocuments";
import { draftResearchBrief } from "@/services/research/researchBrief";
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
 * The research policy brief (ZEPARI Batch F) — the structure and the sources are always shown; the
 * words need the research model, and with none connected the platform writes NO brief.
 */
describe("the research policy brief", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearAllResearchDocuments();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the structure and the sources, but writes NO brief, when no model is connected", async () => {
    seedDocument();
    const result = await draftResearchBrief("mining revenue");

    expect(result.status).toBe("no-answer-model");
    expect(result.brief).toBeNull();
    expect(result.structure).toEqual(RESEARCH_BRIEF_SECTIONS);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.detail).toMatch(/No brief model is connected/);
  });

  it("drafts the brief from the sources when the research model is connected", async () => {
    seedDocument();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                "Purpose: inform the fiscus. Context: gold output rose (Mining revenue note). " +
                "Key findings: mining revenue rose. Recommendations: sustain gold incentives.",
            },
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    saveConfig(withResearchModel());

    const result = await draftResearchBrief("mining revenue");

    expect(result.status).toBe("drafted");
    expect(result.brief).toMatch(/Purpose: inform the fiscus/);
    expect(result.structure).toEqual(RESEARCH_BRIEF_SECTIONS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports no sources when the library holds nothing on the topic", async () => {
    const result = await draftResearchBrief("an entirely unheld subject");
    expect(result.status).toBe("no-sources");
    expect(result.brief).toBeNull();
    expect(result.sources).toHaveLength(0);
  });

  it("renders on the research workspace, and writes no brief with no model", async () => {
    seedDocument();
    window.history.pushState({}, "", "/research/app");
    signInResearcher("chipika");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: "Policy brief" })
      .closest("section") as HTMLElement;
    fireEvent.change(within(panel).getByLabelText("Topic"), {
      target: { value: "mining revenue" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /draft the brief/i }));

    await waitFor(() =>
      expect(within(panel).getByText(/No brief model is connected/)).toBeInTheDocument(),
    );
    expect(within(panel).getByText("Mining revenue note")).toBeInTheDocument();
  });
});