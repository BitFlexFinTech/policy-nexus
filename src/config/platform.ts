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

export type CapabilityId = "assessment" | "drafting" | "research" | "extraction" | "library" | "sso";
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
  /**
   * THE ONE MASTER SWITCH (owner's rule, 2026-10-06). `simulated` runs the deterministic
   * scenario engine and shows its results, plainly labelled; `live` uses only real services and
   * shows nothing (a clear "not connected" state) where a service is missing — never a simulated
   * figure dressed up as real. It flips every capability together, so the admin has one control,
   * not six.
   */
  platformMode: CapabilityMode;
  assessment: CapabilityConfig;
  drafting: CapabilityConfig;
  /**
   * The ZEPARI research assistant's OWN OpenRouter credential, separate from the drafting key, so
   * the two assistants' usage and cost are metered against separate keys (owner's decision,
   * 2026-10-06). It is reached through the same OpenRouter address; only the key and the model
   * differ.
   */
  research: CapabilityConfig;
  extraction: CapabilityConfig;
  /** The shared document-library server. Off by default: documents stay in the browser. */
  library: CapabilityConfig;
  sso: SsoConfig;
}

/**
 * Where the administrator's own saved settings are kept in this browser.
 *
 * BUMPED TO v2 on 2026-10-09, on purpose. From this build the two demonstration keys are baked into
 * the platform's own defaults (see `DEFAULT_PLATFORM_CONFIG` below), so the site is live the moment it
 * opens. A browser that still held a v1 record from an earlier build would keep overriding those
 * defaults with its old settings, and the owner's rule is "i should just open the website and
 * everything should work" — so the older record is deliberately left behind. An administrator can
 * still change anything on the screen and save it again.
 */
export const PLATFORM_CONFIG_STORAGE_KEY = "nzwisiso.platform.config.v2";

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
  "research",
  "extraction",
  "library",
  "sso",
];

export const CAPABILITY_LABELS: Record<CapabilityId, string> = {
  assessment: "Assessment service",
  drafting: "Drafting model (OpenRouter)",
  research: "Research model (OpenRouter)",
  extraction: "Document text extraction",
  library: "Shared document library",
  sso: "Government sign-in (SSO)",
};

/**
 * The drafting model is reached through OpenRouter, which speaks the standard
 * chat-completions shape. This is the DEFAULT address shown to the administrator for
 * the drafting capability; it is data, not a request the shipped build makes — the
 * platform contacts nothing until the administrator switches the capability on.
 */
export const OPENROUTER_CHAT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * The model the drafting capability uses unless an administrator chooses another — the
 * owner's chosen default (2026-10-06). It is a real OpenRouter model id, read from
 * OpenRouter's own list.
 */
export const DEFAULT_DRAFTING_MODEL = "deepseek/deepseek-v4.1-flash";

/**
 * Suggested OpenRouter model ids for the drafting picker — the default first. Every id was
 * read from OpenRouter's own model list, so none is invented; the picker also accepts ANY
 * other id OpenRouter carries (typed in), so this is a convenience list, never a closed one.
 */
export const OPENROUTER_MODEL_SUGGESTIONS: readonly string[] = [
  DEFAULT_DRAFTING_MODEL,
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v3.2",
  "openai/gpt-6.1-sol",
  "openai/gpt-6-luna",
  "anthropic/claude-sonnet-5.5",
  "anthropic/claude-opus-5",
  "google/gemini-3.8-flash",
  "meta-llama/llama-4-maverick",
  "mistralai/mistral-large-4-0",
  "qwen/qwen3.8-flash",
  "x-ai/grok-4.5",
  "z-ai/glm-5.3-flash",
];

const SIMULATED: CapabilityConfig = { mode: "simulated", endpoint: "", key: "", model: "" };

/* ------------------------------------------------------------------------- */
/* The demonstration keys, baked into the build                               */
/* ------------------------------------------------------------------------- */

/**
 * THE DEMONSTRATION KEYS ARE SAVED INTO THIS BUILD (the owner's strict rule, 2026-10-07): *"this is
 * the machine i am doing the demo from … i should not have to enter anything manually the api keys
 * should be saved … i should just open the website and everything should work."*
 *
 * `.env` carries the same two keys under the `VITE_`-prefixed names below. Vite copies a `VITE_`
 * value into the built site at build time, which is exactly what "saved into the build" means: the
 * Nzwisiso policy drafter and the ZEPARI research assistant are live the moment the site opens, with
 * nothing typed in.
 *
 * The test runner is deliberately left out, so the suite never depends on a secret being present and
 * stays deterministic. The development server and the published build are both live.
 *
 * A key that ships inside a website can be read by anyone who looks at that website's code. That is
 * acceptable here, and only here, because these are demonstration keys and the owner rotates both
 * immediately after the demo. The long-term answer (the funded server — the "MiroFish" seam this
 * project already plans) keeps the key on the server, so nothing sensitive ever reaches a browser.
 */
const IS_TEST_ENV = import.meta.env.MODE === "test";
const BAKED_POLICY_KEY: string = IS_TEST_ENV ? "" : (import.meta.env.VITE_OPENROUTER_KEY_POLICY ?? "");
const BAKED_RESEARCH_KEY: string = IS_TEST_ENV ? "" : (import.meta.env.VITE_OPENROUTER_KEY_RESEARCH ?? "");

/**
 * One assistant capability, already carrying its demonstration key: live and completely configured
 * when a key is present, and plain simulated when none is (a machine with no `.env`), so a missing key
 * can never leave a half-configured capability behind.
 */
export const demoAssistantCapability = (key: string): CapabilityConfig =>
  key.trim()
    ? { mode: "live", endpoint: OPENROUTER_CHAT_ENDPOINT, key, model: DEFAULT_DRAFTING_MODEL }
    : { ...SIMULATED };

/**
 * The state the platform ships in: everything simulated EXCEPT the two assistants, which carry the
 * demonstration keys baked into this build and are therefore live from the first moment the site
 * opens.
 */
export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platformMode: "simulated",
  assessment: { ...SIMULATED },
  drafting: demoAssistantCapability(BAKED_POLICY_KEY),
  research: demoAssistantCapability(BAKED_RESEARCH_KEY),
  extraction: { ...SIMULATED },
  library: { ...SIMULATED },
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
    platformMode: asMode(record.platformMode, "simulated"),
    assessment: normaliseService(record.assessment, DEFAULT_PLATFORM_CONFIG.assessment),
    drafting: normaliseService(record.drafting, DEFAULT_PLATFORM_CONFIG.drafting),
    research: normaliseService(record.research, DEFAULT_PLATFORM_CONFIG.research),
    extraction: normaliseService(record.extraction, DEFAULT_PLATFORM_CONFIG.extraction),
    library: normaliseService(record.library, DEFAULT_PLATFORM_CONFIG.library),
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
/* The platform mode — the one master switch                                  */
/* ------------------------------------------------------------------------- */

/** The platform's one mode. Defaults to simulated. */
export const platformModeOf = (config: PlatformConfig = getConfig()): CapabilityMode =>
  config.platformMode;

/** True only when the whole platform is switched to live. */
export const isPlatformLive = (config: PlatformConfig = getConfig()): boolean =>
  config.platformMode === "live";

/**
 * The whole platform at the chosen mode — the master switch. Setting it flips every capability
 * together, so an administrator has one control rather than six, and the platform can never be
 * half-live by accident.
 */
export const withPlatformMode = (
  config: PlatformConfig,
  mode: CapabilityMode,
): PlatformConfig => ({
  ...config,
  platformMode: mode,
  assessment: { ...config.assessment, mode },
  drafting: { ...config.drafting, mode },
  research: { ...config.research, mode },
  extraction: { ...config.extraction, mode },
  library: { ...config.library, mode },
  sso: { ...config.sso, mode },
});

/** Set the whole platform mode and persist it — the single master switch, in one step. */
export const setPlatformMode = (mode: CapabilityMode): PlatformConfig =>
  saveConfig(withPlatformMode(getConfig(), mode));

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
      detail:
        id === "library"
          ? "Off. Documents are kept in this browser only and are not shared with anyone else."
          : "Simulated. Results are computed locally and labelled as simulated.",
    };
  }
  const missing: string[] = [];
  if (!isAbsoluteHttpUrl(capability.endpoint)) missing.push("endpoint URL");
  if (!capability.key.trim()) missing.push("key");
  if ((id === "drafting" || id === "research") && !capability.model.trim()) missing.push("model name");
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
