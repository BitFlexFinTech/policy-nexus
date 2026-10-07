import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import App from "@/App";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  LOCAL_RESEARCH_CONNECTOR_STORE,
  getResearchConnectorStore,
  researchConnectorStoreFor,
} from "@/services/research/researchConnectorStore";
import { clearAllResearchDataSources } from "@/services/research/researchDataSources";
import { signInResearcher } from "@/session/researchSession";

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/library";

const configured = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  library: { mode: "live", endpoint: ENDPOINT, key: "key", model: "" },
});

const sourceInput = () => ({
  name: "ZEPARI Economic Barometer",
  address: "sources://zepari/barometer",
  provides: "quarterly economic indicators",
});

/**
 * The institution data-connectors (ZEPARI Batch D) — mock-first, recording WHICH sources ZEPARI may
 * read from, and reading NO figure until a server is connected.
 */
describe("the institution data-connector seam", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearAllResearchDataSources();
    vi.restoreAllMocks();
  });

  it("records sources in this browser by default, and says no figure is read yet", async () => {
    const store = getResearchConnectorStore();
    expect(store.mode).toBe("local");
    expect(store.label).toBe("This browser (Local)");
    expect(store.limitation).toMatch(/No figures are read from these sources yet/);

    const saved = await store.add(sourceInput());
    expect(store.list().map((source) => source.id)).toContain(saved.id);

    await store.remove(saved.id);
    expect(store.list()).toHaveLength(0);
  });

  it("switches to the shared client purely by configuration, and back again", () => {
    expect(getResearchConnectorStore()).toBe(LOCAL_RESEARCH_CONNECTOR_STORE);

    saveConfig(configured());
    const shared = getResearchConnectorStore();
    expect(shared.mode).toBe("shared");

    clearConfig();
    expect(getResearchConnectorStore()).toBe(LOCAL_RESEARCH_CONNECTOR_STORE);
  });

  it("keeps the connectors Local when the server is only half-configured", () => {
    const half: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: ENDPOINT, key: "", model: "" },
    };
    expect(researchConnectorStoreFor(half)).toBe(LOCAL_RESEARCH_CONNECTOR_STORE);
  });

  it("sends an add to the server when the shared client is active", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    saveConfig(configured());
    const store = getResearchConnectorStore();

    await store.add(sourceInput());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the data sources on the research workspace, honestly labelled", () => {
    window.history.pushState({}, "", "/research/app/data");
    signInResearcher("chipika");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: /institution data-connectors/i })
      .closest("section") as HTMLElement;
    expect(within(panel).getByText(/No figures are read from them/)).toBeInTheDocument();
    expect(within(panel).getByText(/Kept on: This browser \(Local\)/)).toBeInTheDocument();
  });
});