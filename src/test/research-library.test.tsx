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
  LOCAL_RESEARCH_LIBRARY_STORE,
  getResearchDocumentStore,
  researchDocumentStoreFor,
} from "@/services/research/researchDocumentStore";
import { clearAllResearchDocuments } from "@/services/research/researchDocuments";
import { signInResearcher } from "@/session/researchSession";

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/library";

const configured = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  library: { mode: "live", endpoint: ENDPOINT, key: "key", model: "" },
});

const documentInput = () => ({
  name: "Economic Barometer 2026 Q1",
  sizeLabel: "11 characters",
  kind: "text" as const,
  text: "hello world",
  status: "Text added directly — read in full.",
});

/**
 * The research library (ZEPARI Batch C) — mock-first, kept in this browser behind a seam so ZEPARI's
 * own document server can be connected later by configuration alone.
 */
describe("the research library seam", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearAllResearchDocuments();
    vi.restoreAllMocks();
  });

  it("keeps documents in this browser by default, and states the limit plainly", async () => {
    const store = getResearchDocumentStore();
    expect(store.mode).toBe("local");
    expect(store.label).toBe("This browser (Local)");
    expect(store.limitation).toMatch(/Shared with nobody/);

    const saved = await store.add(documentInput());
    expect(store.list().map((document) => document.id)).toContain(saved.id);

    await store.remove(saved.id);
    expect(store.list()).toHaveLength(0);
  });

  it("switches to the shared client purely by configuration, and back again", () => {
    expect(getResearchDocumentStore()).toBe(LOCAL_RESEARCH_LIBRARY_STORE);

    saveConfig(configured());
    const shared = getResearchDocumentStore();
    expect(shared.mode).toBe("shared");
    expect(shared.label).not.toBe("This browser (Local)");

    clearConfig();
    expect(getResearchDocumentStore()).toBe(LOCAL_RESEARCH_LIBRARY_STORE);
  });

  it("keeps the library Local when it is only half-configured", () => {
    const half: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: ENDPOINT, key: "", model: "" },
    };
    expect(researchDocumentStoreFor(half)).toBe(LOCAL_RESEARCH_LIBRARY_STORE);
  });

  it("sends an add to the server when the shared client is active", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    saveConfig(configured());
    const store = getResearchDocumentStore();

    await store.add(documentInput());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the research library on the research workspace, honestly labelled", () => {
    window.history.pushState({}, "", "/research/app");
    signInResearcher("chigumira");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: "Research library" })
      .closest("section") as HTMLElement;
    expect(within(panel).getByText(/Kept on: This browser \(Local\)/)).toBeInTheDocument();
    expect(within(panel).getByText(/Shared with nobody/)).toBeInTheDocument();
  });
});