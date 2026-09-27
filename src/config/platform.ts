/**
 * SINGLE SOURCE OF TRUTH — platform configuration (the capability credentials).
 *
 * This module is the only place a capability's mode, endpoint, key or model is
 * defined. The administration screen writes it; the service seams read it. No
 * officer-facing screen links to either.
 *
 * MOCK-FIRST: every capability defaults to `simulated`, and a capability is only
 * treated as `live` when it is COMPLETELY configured. A half-configured
 * capability is reported as `misconfigured` and falls back to the simulated
 * implementation rather than half-working or failing silently.
 *
 * SECURITY — stated plainly, not implied: these values are stored in this
 * browser's local storage and are readable by anyone with access to the device's
 * developer tools. That is acceptable for a pilot and is stated in the
 * administration screen. Production requires a server-side proxy that holds the
 * credential and never exposes it to the browser.
 *
 * DETERMINISM: reading configuration is pure — no clock, no randomness.
 */

import { createKeyValueStore } from "@/lib/browserStorage";

export type CapabilityId = "assessment" | "drafting" | "extraction" | "sso";
export type CapabilityMode = "simulated" | "live";

/** A service capability reached over HTTP. */
export interface CapabilityConfig {
  /** `live` is only honoured when the capability is completely configured. */
  mode: CapabilityMode;
  /** Base URL of the service. Empty means "no service configured". */
  endpoint: string;
  /** Bearer credential. Rendered masked everywhere except the admin screen. */
  key: string;
  /** Model or route name — used by the drafting capability. */
  model: string;
}

/** Sign-in is configured with an identity provider, not a key. */
export interface SsoConfig {
  mode: CapabilityMode;
  issuer: string;
  /** A client ID is public, not a secret — stated in the admin screen. */
  clientId: string;
  redirectUri: string;
  /** Which claim in the provider's token names the officer's department. */
  departmentClaim: string;
}

export interface PlatformConfig {
  assessment: CapabilityConfig;
  drafting: CapabilityConfig;
  extraction: CapabilityConfig;
  sso: SsoConfig;
}

export const PLATFORM_CONFIG_STORAGE_KEY = "nzwisiso.platform.config.v1";

/**
 * Where the platform administration screen is mounted.
 *
 * It is NOT linked from any officer-facing screen — not the landing page, not the
 * workspace navigation, not the header, not the footer. It is reached only by
 * typing this path. When the platform is given a real server and a real URL,
 * change this single line to re-home the screen.
 */
export const ADMIN_ROUTE = "/platform-admin";

export const CAPABILITY_IDS: readonly CapabilityId[] = [
  "assessment",
  "drafting",
  "extraction",
  "sso",
];

export const CAPABILITY_LABELS: Record<CapabilityId, string> = {
  assessment: "Assessment service",
  drafting: "Drafting model",
  extraction: "Document text extraction",
  sso: "Government sign-in (SSO)",
};

const SIMULATED: CapabilityConfig = { mode: "simulated", endpoint: "", key: "", model: "" };

/** Everything simulated: the default, and the state the platform ships in. */
export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  assessment: { ...SIMULATED },
  drafting: { ...SIMULATED },
  extraction: { ...SIMULATED },
  sso: { mode: "simulated", issuer: "", clientId: "", redirectUri: "", departmentClaim: "department_id" },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const asMode = (value: unknown, fallback: CapabilityMode): CapabilityMode =>
  value === "live" ? "live" : value === "simulated" ? "simulated" : fallback;

/** True only for an absolute http(s) address. Pure; performs no network access. */
export const isAbsoluteHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const normaliseService = (value: unknown, fallback: CapabilityConfig): CapabilityConfig => {
  const record = isRecord(value) ? value : {};
  return {
    mode: asMode(record.mode, fallback.mode),
    endpoint: asString(record.endpoint, fallback.endpoint),
    key: asString(record.key, fallback.key),
    model: asString(record.model, fallback.model),
  };
};

/** Parse stored configuration defensively — anything unknown becomes simulated. */
export const normaliseConfig = (value: unknown): PlatformConfig => {
  const record = isRecord(value) ? value : {};
  const sso = isRecord(record.sso) ? record.sso : {};
  return {
    assessment: normaliseService(record.assessment, DEFAULT_PLATFORM_CONFIG.assessment),
    drafting: normaliseService(record.drafting, DEFAULT_PLATFORM_CONFIG.drafting),
    extraction: normaliseService(record.extraction, DEFAULT_PLATFORM_CONFIG.extraction),
    sso: {
      mode: asMode(sso.mode, "simulated"),
      issuer: asString(sso.issuer, ""),
      clientId: asString(sso.clientId, ""),
      redirectUri: asString(sso.redirectUri, ""),
      departmentClaim: asString(sso.departmentClaim, "department_id"),
    },
  };
};

/* ------------------------------------------------------------------------- */
/* Store                                                                      */
/* ------------------------------------------------------------------------- */

const storage = createKeyValueStore();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToConfig = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let cachedRaw: string | null | undefined;
let cachedConfig: PlatformConfig = DEFAULT_PLATFORM_CONFIG;

/**
 * Current configuration. The result is cached against the raw stored string, so
 * repeated calls return an identical reference — required by React's
 * useSyncExternalStore.
 */
export const getConfig = (): PlatformConfig => {
  const raw = storage.read(PLATFORM_CONFIG_STORAGE_KEY);
  if (raw === cachedRaw) return cachedConfig;
  cachedRaw = raw;
  if (!raw) {
    cachedConfig = DEFAULT_PLATFORM_CONFIG;
    return cachedConfig;
  }
  try {
    cachedConfig = normaliseConfig(JSON.parse(raw));
  } catch {
    // Unreadable configuration is treated as "nothing configured", which is the
    // safe state: every capability then runs simulated.
    cachedConfig = DEFAULT_PLATFORM_CONFIG;
  }
  return cachedConfig;
};

export const getConfigSnapshot = getConfig;
/** There is no configuration before hydration. */
export const getConfigServerSnapshot = (): PlatformConfig => DEFAULT_PLATFORM_CONFIG;

/** False when the browser refused persistent storage and memory is in use. */
export const isConfigPersistent = () => storage.isPersistent();

export const saveConfig = (next: PlatformConfig): PlatformConfig => {
  storage.write(PLATFORM_CONFIG_STORAGE_KEY, JSON.stringify(normaliseConfig(next)));
  cachedRaw = undefined; // force a re-read so the cache cannot go stale
  emit();
  return getConfig();
};

/** Return every capability to simulated and forget every credential. */
export const clearConfig = (): void => {
  storage.remove(PLATFORM_CONFIG_STORAGE_KEY);
  cachedRaw = undefined;
  emit();
};

/* ------------------------------------------------------------------------- */
/* Capability state                                                           */
/* ------------------------------------------------------------------------- */

export type CapabilityState = "simulated" | "live" | "misconfigured";

export interface CapabilityStatus {
  id: CapabilityId;
  state: CapabilityState;
  /** Plain-language reason, shown in the administration screen. */
  detail: string;
}

/**
 * Whether a capability is genuinely usable. A capability switched to `live` but
 * incompletely configured reports `misconfigured`, and the platform keeps using
 * the simulated implementation rather than half-working.
 */
export const describeCapability = (
  config: PlatformConfig,
  id: CapabilityId,
): CapabilityStatus => {
  if (id === "sso") {
    if (config.sso.mode !== "live") {
      return {
        id,
        state: "simulated",
        detail: "Simulated sign-in (one-click). No identity provider is contacted.",
      };
    }
    const missing: string[] = [];
    if (!isAbsoluteHttpUrl(config.sso.issuer)) missing.push("issuer URL");
    if (!config.sso.clientId.trim()) missing.push("client ID");
    if (!isAbsoluteHttpUrl(config.sso.redirectUri)) missing.push("redirect URL");
    if (!config.sso.departmentClaim.trim()) missing.push("department claim");
    return missing.length
      ? {
          id,
          state: "misconfigured",
          detail: `Live sign-in needs: ${missing.join(", ")}. Falling back to simulated sign-in.`,
        }
      : {
          id,
          state: "live",
          detail: "Live sign-in is configured. A client ID is public, not a secret.",
        };
  }

  const capability = config[id];
  if (capability.mode !== "live") {
    return {
      id,
      state: "simulated",
      detail: "Simulated. Results are computed locally and labelled as simulated.",
    };
  }
  const missing: string[] = [];
  if (!isAbsoluteHttpUrl(capability.endpoint)) missing.push("endpoint URL");
  if (!capability.key.trim()) missing.push("key");
  if (id === "drafting" && !capability.model.trim()) missing.push("model name");
  return missing.length
    ? {
        id,
        state: "misconfigured",
        detail: `Live mode needs: ${missing.join(", ")}. Falling back to simulated rather than half-working.`,
      }
    : {
        id,
        state: "live",
        detail: "Live. The credential is sent only to this endpoint.",
      };
};

/**
 * The stored settings for a service capability when it is genuinely usable,
 * otherwise null — in which case the caller must use the simulated
 * implementation.
 */
export const liveService = (id: Exclude<CapabilityId, "sso">): CapabilityConfig | null => {
  const config = getConfig();
  return describeCapability(config, id).state === "live" ? config[id] : null;
};

/** The SSO settings when they are genuinely usable, otherwise null. */
export const liveSso = (): SsoConfig | null => {
  const config = getConfig();
  return describeCapability(config, "sso").state === "live" ? config.sso : null;
};

/** True when at least one capability is running live. Drives the mode notice. */
export const isAnyCapabilityLive = (config: PlatformConfig = getConfig()): boolean =>
  CAPABILITY_IDS.some((id) => describeCapability(config, id).state === "live");
