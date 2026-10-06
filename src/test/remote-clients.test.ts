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
import { buildDraftingGrounding } from "@/services/documents/drafting";
import type { AssessmentRequest, AssessmentRun } from "@/services/assessment/types";
import { getDepartment } from "@/config/departments";

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
  horizonMonths: 6,
  levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 },
  leverNotes: ["Modelled horizon of 6 months."],
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

/** The department's grounding, assembled exactly as the screen assembles it. */
const grounding = buildDraftingGrounding(run, getDepartment("fin"));

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

  it("posts the OpenRouter request and turns the model's JSON into a document", async () => {
    const answer = JSON.stringify({
      title: "A report",
      subtitle: "FIN-01",
      sections: [{ id: "purpose", heading: "Purpose", paragraphs: ["One."] }],
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: answer } }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createRemoteDraftingClient(service(DRAFTING));

    await expect(
      client.generate({ kind: "report", model: "", run, grounding }),
    ).resolves.toMatchObject({ kind: "report", fileStem: "report", title: "A report" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(DRAFTING);
    // The department's own prompt and its allowed citations are handed to the model, so a
    // configured model is asked for exactly what the offline generator produces.
    const body = JSON.parse(String(init.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("model-1"); // falls back to the configured model
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Ministry of Finance");
    expect(body.messages[0].content).toContain("Public Finance Management Act [Chapter 22:19]");
    expect(body.messages[1].role).toBe("user");
  });

  it("refuses an answer that is not a usable document", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "not json" } }] }),
      })),
    );
    const client = createRemoteDraftingClient(service(DRAFTING));
    await expect(client.generate({ kind: "report", model: "m", run, grounding })).rejects.toThrow(
      /valid JSON/,
    );
  });

  it("is unavailable until the capability is live and complete", () => {
    expect(remoteDraftingClient()).toBeNull();
    saveConfig({ ...DEFAULT_PLATFORM_CONFIG, drafting: service(DRAFTING) });
    expect(remoteDraftingClient()).not.toBeNull();
  });
});
