import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_ROUTE,
  CAPABILITY_IDS,
  DEFAULT_PLATFORM_CONFIG,
  PLATFORM_CONFIG_STORAGE_KEY,
  clearConfig,
  describeCapability,
  getConfig,
  isAbsoluteHttpUrl,
  isAnyCapabilityLive,
  liveService,
  normaliseConfig,
  saveConfig,
  subscribeToConfig,
  type PlatformConfig,
} from "@/config/platform";

/** A local address, so the file carries no reachable remote address at all. */
const LOCAL = "http://localhost:8787/assess";
const IDP = "http://localhost:8787/idp";
const CALLBACK = "http://localhost:8080/auth/callback";

const service = () => ({ mode: "live" as const, endpoint: LOCAL, key: "test-key", model: "model-1" });

const complete = (): PlatformConfig => ({
  platformMode: "live",
  assessment: service(),
  drafting: service(),
  research: service(),
  extraction: service(),
  library: service(),
  sso: { mode: "live", issuer: IDP, clientId: "client-1", redirectUri: CALLBACK, departmentClaim: "department_id" },
});

describe("platform configuration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
  });

  it("ships with every capability simulated", () => {
    expect(getConfig()).toEqual(DEFAULT_PLATFORM_CONFIG);
    CAPABILITY_IDS.forEach((id) =>
      expect(describeCapability(getConfig(), id).state, id).toBe("simulated"),
    );
    expect(isAnyCapabilityLive()).toBe(false);
  });

  it("keeps a half-configured capability simulated rather than half-working", () => {
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      assessment: { mode: "live", endpoint: LOCAL, key: "", model: "" },
    });
    const status = describeCapability(getConfig(), "assessment");
    expect(status.state).toBe("misconfigured");
    expect(status.detail).toMatch(/key/);
    expect(liveService("assessment")).toBeNull();
  });

  it("rejects an address that is not absolute", () => {
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      assessment: { mode: "live", endpoint: "/relative/route", key: "k", model: "" },
    });
    expect(describeCapability(getConfig(), "assessment").state).toBe("misconfigured");
  });

  it("requires a model for the two model capabilities (drafting and research), but not the others", () => {
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      drafting: { mode: "live", endpoint: LOCAL, key: "k", model: "" },
    });
    expect(describeCapability(getConfig(), "drafting").state).toBe("misconfigured");

    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      research: { mode: "live", endpoint: LOCAL, key: "k", model: "" },
    });
    expect(describeCapability(getConfig(), "research").state).toBe("misconfigured");

    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      assessment: { mode: "live", endpoint: LOCAL, key: "k", model: "" },
    });
    expect(describeCapability(getConfig(), "assessment").state).toBe("live");
  });

  it("reports a completely configured capability as live and returns its settings", () => {
    saveConfig(complete());
    expect(describeCapability(getConfig(), "assessment").state).toBe("live");
    expect(liveService("assessment")).toMatchObject({ endpoint: LOCAL, key: "test-key" });
    expect(liveService("extraction")).toMatchObject({ endpoint: LOCAL });
    expect(isAnyCapabilityLive()).toBe(true);
  });

  it("keeps the research key separate from the drafting key, so each is metered on its own", () => {
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      drafting: { mode: "live", endpoint: LOCAL, key: "draft-key", model: "model-a" },
      research: { mode: "live", endpoint: LOCAL, key: "research-key", model: "model-b" },
    });
    expect(liveService("drafting")).toMatchObject({ key: "draft-key", model: "model-a" });
    expect(liveService("research")).toMatchObject({ key: "research-key", model: "model-b" });
  });

  it("needs an issuer, a client ID and a redirect address for sign-in", () => {
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      sso: { mode: "live", issuer: "", clientId: "client-1", redirectUri: "", departmentClaim: "department_id" },
    });
    const status = describeCapability(getConfig(), "sso");
    expect(status.state).toBe("misconfigured");
    expect(status.detail).toMatch(/issuer URL/);
    expect(status.detail).toMatch(/redirect URL/);
  });

  it("persists, notifies subscribers, and returns to simulated when cleared", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToConfig(listener);

    saveConfig(complete());
    expect(listener).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(PLATFORM_CONFIG_STORAGE_KEY)).toContain("test-key");

    clearConfig();
    expect(getConfig()).toEqual(DEFAULT_PLATFORM_CONFIG);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("returns an identical reference until the stored value changes", () => {
    expect(getConfig()).toBe(getConfig());
  });

  it("treats unreadable stored configuration as nothing configured", () => {
    window.localStorage.setItem(PLATFORM_CONFIG_STORAGE_KEY, "{ this is not json");
    expect(getConfig()).toEqual(DEFAULT_PLATFORM_CONFIG);
  });

  it("ignores unknown stored values when normalising", () => {
    expect(normaliseConfig({ assessment: { mode: "on", endpoint: 5, key: null } })).toEqual(
      DEFAULT_PLATFORM_CONFIG,
    );
    expect(normaliseConfig(undefined)).toEqual(DEFAULT_PLATFORM_CONFIG);
  });

  it("recognises only absolute http addresses", () => {
    expect(isAbsoluteHttpUrl(LOCAL)).toBe(true);
    expect(isAbsoluteHttpUrl("")).toBe(false);
    expect(isAbsoluteHttpUrl("/assess")).toBe(false);
    expect(isAbsoluteHttpUrl("just words")).toBe(false);
  });

  it("keeps the shared document library off until it is completely configured", () => {
    // Off by default: nothing is shared until an administrator configures a server.
    expect(describeCapability(getConfig(), "library").state).toBe("simulated");
    expect(describeCapability(getConfig(), "library").detail).toMatch(/this browser only/);

    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: LOCAL, key: "", model: "" },
    });
    expect(describeCapability(getConfig(), "library").state).toBe("misconfigured");

    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: LOCAL, key: "k", model: "" },
    });
    expect(describeCapability(getConfig(), "library").state).toBe("live");
    expect(liveService("library")).toMatchObject({ endpoint: LOCAL, key: "k" });
  });

  it("defines the administration address in one place", () => {
    expect(ADMIN_ROUTE.startsWith("/")).toBe(true);
  });
});
