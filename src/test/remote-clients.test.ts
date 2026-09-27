import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PLATFORM_CONFIG, clearConfig, saveConfig, type CapabilityConfig } from "@/config/platform";
import {
  createRemoteAssessmentClient,
  isAssessmentRun,
  remoteAssessmentClient,
} from "@/services/assessment/remoteAssessmentClient";
import {
  createRemoteDraftingClient,
  isGeneratedDocument,
  remoteDraftingClient,
} from "@/services/documents/remoteDraftingClient";
import type { AssessmentRequest, AssessmentRun } from "@/services/assessment/types";

/** Local addresses only, so no reachable remote address appears in this file. */
const ASSESSMENT = "http://localhost:8787/assess";
const DRAFTING = "http://localhost:8787/draft";

const service = (endpoint: string): CapabilityConfig => ({
  mode: "live",
  endpoint,
  key: "test-key",
  model: "model-1",
});

const run: AssessmentRun = {
  id: "run-1",
  departmentId: "fin",
  departmentName: "Ministry of Finance",
  departmentAbbr: "FIN",
  reference: "FIN-01",
  policyTitle: "A draft",
  policyText: "A draft",
  source: "paste",
  createdAt: "2026-09-24",
  seed: "seed-1",
  timeHorizon: "short",
  horizonLabel: "Short term",
  status: "complete",
  confidence: 70,
  summary: "A summary.",
  fileNames: [],
  rounds: [],
  reactions: [],
  impacts: [],
  risks: [],
  recommendations: [],
  metrics: [],
};

const request: AssessmentRequest = { departmentId: "fin", policyText: "A draft", source: "paste" };

const document = {
  kind: "report" as const,
  title: "Long-form report",
  subtitle: "FIN-01",
  fileStem: "FIN-01-report",
  sections: [{ id: "purpose", heading: "Purpose", paragraphs: ["One."] }],
};

beforeEach(() => {
  window.localStorage.clear();
  clearConfig();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearConfig();
});

describe("remote assessment client", () => {
  it("accepts only a payload that is a complete run", () => {
    expect(isAssessmentRun({ id: "x" })).toBe(false);
    expect(isAssessmentRun(null)).toBe(false);
    expect(isAssessmentRun({ ...run, rounds: "not an array" })).toBe(false);
    expect(isAssessmentRun(run)).toBe(true);
  });

  it("posts the request and maps a complete answer", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => run }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createRemoteAssessmentClient(service(ASSESSMENT));

    await expect(client.buildRun(request)).resolves.toMatchObject({ id: "run-1" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(ASSESSMENT);
    expect(init.method).toBe("POST");
    expect(JSON.stringify(init.body)).toContain("A draft");
  });

  it("refuses an answer missing fields rather than rendering it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ id: "run-1" }) })));
    const client = createRemoteAssessmentClient(service(ASSESSMENT));
    await expect(client.buildRun(request)).rejects.toThrow(/complete run/);
  });

  it("reports a failing service instead of inventing a result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    const client = createRemoteAssessmentClient(service(ASSESSMENT));
    await expect(client.buildRun(request)).rejects.toThrow(/503/);
  });

  it("returns no runs when the service cannot list them", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    const client = createRemoteAssessmentClient(service(ASSESSMENT));
    await expect(client.listRuns("fin")).resolves.toEqual([]);
  });

  it("is unavailable until the capability is live and complete", () => {
    expect(remoteAssessmentClient()).toBeNull();

    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      assessment: { mode: "live", endpoint: ASSESSMENT, key: "", model: "" },
    });
    expect(remoteAssessmentClient()).toBeNull();

    saveConfig({ ...DEFAULT_PLATFORM_CONFIG, assessment: service(ASSESSMENT) });
    expect(remoteAssessmentClient()).not.toBeNull();
  });
});

describe("remote drafting client", () => {
  it("accepts only a document that carries its sections", () => {
    expect(isGeneratedDocument({ ...document, sections: [] })).toBe(false);
    expect(isGeneratedDocument({ ...document, kind: "other" })).toBe(false);
    expect(isGeneratedDocument(document)).toBe(true);
  });

  it("posts the request and maps a complete document", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => document }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createRemoteDraftingClient(service(DRAFTING));

    await expect(client.generate({ kind: "report", model: "", run })).resolves.toMatchObject({
      fileStem: "FIN-01-report",
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.stringify(init.body)).toContain("model-1"); // falls back to the configured model
  });

  it("refuses an incomplete document", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ kind: "report" }) })));
    const client = createRemoteDraftingClient(service(DRAFTING));
    await expect(client.generate({ kind: "report", model: "m", run })).rejects.toThrow(
      /complete document/,
    );
  });

  it("is unavailable until the capability is live and complete", () => {
    expect(remoteDraftingClient()).toBeNull();
    saveConfig({ ...DEFAULT_PLATFORM_CONFIG, drafting: service(DRAFTING) });
    expect(remoteDraftingClient()).not.toBeNull();
  });
});
