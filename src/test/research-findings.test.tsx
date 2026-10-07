import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import { findDepartment } from "@/config/departments";
import { clearAllResearchFindings } from "@/services/research/researchFindings";
import { seedResearchSample } from "@/services/research/researchSample";
import {
  LOCAL_RESEARCH_FINDINGS_STORE,
  getResearchFindingsStore,
  researchFindingsStoreFor,
} from "@/services/research/researchFindingsStore";
import { signInResearcher } from "@/session/researchSession";

const FIN = findDepartment("fin")!;

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/library";

const configured = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  library: { mode: "live", endpoint: ENDPOINT, key: "key", model: "" },
});

/**
 * Findings to departments (the last ZEPARI surface) — a finding routed to the departments it concerns,
 * a note for a human, never read by the simulation engine.
 */
describe("the findings seam", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    // Mark the demonstration sample as already seeded, so the workspace does not add it during the
    // render and this test counts only what it adds itself.
    seedResearchSample();
    clearAllResearchFindings();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps findings in this browser by default, with the departments they concern", async () => {
    const store = getResearchFindingsStore();
    expect(store.mode).toBe("local");
    expect(store.label).toBe("This browser (Local)");

    const saved = await store.add({ text: "mineral revenue is concentrated", departments: ["fin", "agri"] });
    expect(saved.departments).toEqual(["fin", "agri"]);
    expect(store.list().map((finding) => finding.id)).toContain(saved.id);

    await store.remove(saved.id);
    expect(store.list()).toHaveLength(0);
  });

  it("switches to the shared client purely by configuration, and back again", () => {
    expect(getResearchFindingsStore()).toBe(LOCAL_RESEARCH_FINDINGS_STORE);

    saveConfig(configured());
    expect(getResearchFindingsStore().mode).toBe("shared");

    clearConfig();
    expect(getResearchFindingsStore()).toBe(LOCAL_RESEARCH_FINDINGS_STORE);
  });

  it("keeps the findings Local when the server is only half-configured", () => {
    const half: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: ENDPOINT, key: "", model: "" },
    };
    expect(researchFindingsStoreFor(half)).toBe(LOCAL_RESEARCH_FINDINGS_STORE);
  });

  it("refuses a finding with no department, then routes one that names its department", async () => {
    window.history.pushState({}, "", "/research/app/findings");
    signInResearcher("chipika");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: "Findings to departments" })
      .closest("section") as HTMLElement;

    // No department: refused, nothing recorded.
    fireEvent.change(within(panel).getByLabelText("Finding"), {
      target: { value: "mineral revenue is concentrated" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /record this finding/i }));
    expect(within(panel).getByText(/at least one department/i)).toBeInTheDocument();
    expect(getResearchFindingsStore().list()).toHaveLength(0);

    // With a department: routed and shown.
    fireEvent.click(within(panel).getByLabelText(FIN.shortName));
    fireEvent.click(within(panel).getByRole("button", { name: /record this finding/i }));
    await waitFor(() => expect(within(panel).getByText(/Routed to:/)).toBeInTheDocument());
    expect(getResearchFindingsStore().list()[0].departments).toContain("fin");
  });
});