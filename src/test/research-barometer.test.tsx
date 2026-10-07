import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import { clearAllBarometerReadings } from "@/services/research/researchBarometer";
import { seedResearchSample } from "@/services/research/researchSample";
import {
  LOCAL_RESEARCH_BAROMETER_STORE,
  getResearchBarometerStore,
  researchBarometerStoreFor,
} from "@/services/research/researchBarometerStore";
import { signInResearcher } from "@/session/researchSession";

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/library";

const configured = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  library: { mode: "live", endpoint: ENDPOINT, key: "key", model: "" },
});

const reading = () => ({
  indicator: "Headline inflation",
  period: "2026 Q1",
  value: "12.4",
  unit: "%",
  source: "ZIMSTAT CPI, 2026 Q1",
});

/**
 * The Economic Barometer (ZEPARI Batch G) — ZEPARI's own indicators tracked over time, each figure
 * naming the body that published it, behind a mock-first seam.
 */
describe("the Economic Barometer seam", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    // Mark the demonstration sample as already seeded, so the workspace does not add it during the
    // render and this test counts only what it adds itself.
    seedResearchSample();
    clearAllBarometerReadings();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps readings in this browser by default, each with its source", async () => {
    const store = getResearchBarometerStore();
    expect(store.mode).toBe("local");
    expect(store.label).toBe("This browser (Local)");

    const saved = await store.add(reading());
    expect(saved.source).toBe("ZIMSTAT CPI, 2026 Q1");
    expect(store.list().map((entry) => entry.id)).toContain(saved.id);

    await store.remove(saved.id);
    expect(store.list()).toHaveLength(0);
  });

  it("switches to the shared client purely by configuration, and back again", () => {
    expect(getResearchBarometerStore()).toBe(LOCAL_RESEARCH_BAROMETER_STORE);

    saveConfig(configured());
    expect(getResearchBarometerStore().mode).toBe("shared");

    clearConfig();
    expect(getResearchBarometerStore()).toBe(LOCAL_RESEARCH_BAROMETER_STORE);
  });

  it("keeps the barometer Local when the server is only half-configured", () => {
    const half: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: ENDPOINT, key: "", model: "" },
    };
    expect(researchBarometerStoreFor(half)).toBe(LOCAL_RESEARCH_BAROMETER_STORE);
  });

  it("refuses a reading with no source, and records one that names its source", async () => {
    window.history.pushState({}, "", "/research/app/barometer");
    signInResearcher("chigumira");
    render(<App />);

    const panel = screen
      .getByRole("heading", { name: "Economic Barometer" })
      .closest("section") as HTMLElement;

    // No source: refused, and nothing is recorded.
    fireEvent.change(within(panel).getByLabelText("Indicator"), {
      target: { value: "Headline inflation" },
    });
    fireEvent.change(within(panel).getByLabelText("Period"), { target: { value: "2026 Q1" } });
    fireEvent.change(within(panel).getByLabelText("Figure"), { target: { value: "12.4" } });
    fireEvent.click(within(panel).getByRole("button", { name: /add this reading/i }));
    expect(within(panel).getByText(/never recorded without its source/i)).toBeInTheDocument();
    expect(getResearchBarometerStore().list()).toHaveLength(0);

    // With a source: recorded, and shown under its indicator.
    fireEvent.change(within(panel).getByLabelText("Source"), {
      target: { value: "ZIMSTAT CPI, 2026 Q1" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: /add this reading/i }));
    await waitFor(() =>
      expect(within(panel).getByText("ZIMSTAT CPI, 2026 Q1")).toBeInTheDocument(),
    );
    expect(getResearchBarometerStore().list()[0].source).toBe("ZIMSTAT CPI, 2026 Q1");
  });
});