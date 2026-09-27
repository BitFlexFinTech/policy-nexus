/**
 * Government sign-in — the OIDC Authorization Code flow with PKCE, no dependency.
 *
 * NOT ACTIVATED: every entry point reports "not configured" unless sign-in is
 * completely set up in platform administration. Until then the workspace keeps
 * its one-click simulated entry, labelled as such.
 *
 * STILL MISSING, and it cannot be written without a registered identity provider:
 *  1. a route to receive the provider's callback, and
 *  2. the mapping from the provider's claims to one of the 16 departments.
 * Both are specified in docs/SERVER_CONTRACT.md.
 *
 * ON RANDOMNESS: PKCE needs an unpredictable verifier — a guessable one defeats
 * the protection entirely. `crypto.getRandomValues` is used for the state and the
 * verifier ONLY, never to generate content, so the determinism guarantee (same
 * input, same output) is untouched: no screen and no document reads this value.
 */

import { liveSso, type SsoConfig } from "@/config/platform";

const STATE_KEY = "nzwisiso.sso.state.v1";
const VERIFIER_KEY = "nzwisiso.sso.verifier.v1";

export type SsoFailureReason =
  | "not-configured"
  | "no-code"
  | "state-mismatch"
  | "token-rejected";

/**
 * The outcome of a sign-in attempt. A single shape with optional fields rather
 * than a union, so callers never have to rely on narrowing to read it.
 */
export interface SsoResult {
  ok: boolean;
  /** Present only when `ok` is true. */
  idToken?: string;
  /** Present only when `ok` is false. */
  reason?: SsoFailureReason;
  /** Plain-language explanation. Present only when `ok` is false. */
  detail?: string;
}

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).split("+").join("-").split("/").join("_").split("=").join("");
};

/** An unpredictable URL-safe value. PKCE only — never content. */
const randomUrlSafe = (byteLength: number): string => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

/** The S256 challenge for a verifier. Pure for a given verifier. */
export const codeChallengeFor = async (verifier: string): Promise<string> =>
  toBase64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))),
  );

const under = (issuer: string, path: string) => `${issuer.trim().replace(/\/+$/, "")}/${path}`;

/** The address the provider should send the officer to. Exported for the tests. */
export const signInUrl = async (
  config: SsoConfig,
  state: string,
  verifier: string,
): Promise<string> => {
  const url = new URL(under(config.issuer, "authorize"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await codeChallengeFor(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
};

/** True when sign-in is completely configured. */
export const isSsoConfigured = (): boolean => liveSso() !== null;

/**
 * Begin sign-in. Returns false when sign-in is not configured, so a caller can
 * fall back to the one-click entry rather than sending anyone nowhere.
 */
export const beginSignIn = async (): Promise<boolean> => {
  const config = liveSso();
  if (!config) return false;

  const state = randomUrlSafe(16);
  const verifier = randomUrlSafe(32);
  window.sessionStorage.setItem(STATE_KEY, state);
  window.sessionStorage.setItem(VERIFIER_KEY, verifier);
  window.location.assign(await signInUrl(config, state, verifier));
  return true;
};

const fromBase64Url = (value: string): string => {
  const normalised = value.split("-").join("+").split("_").join("/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * Read one claim from the provider's identity token.
 *
 * ⚠️ THIS DOES NOT VERIFY THE TOKEN'S SIGNATURE. A browser cannot verify it — that
 * needs the provider's public keys and a trusted step. It is provided so the
 * sign-in path is complete and demonstrable, and it MUST NOT be treated as
 * authorisation: before production the token must be verified and the department
 * mapped on the server (docs/SERVER_CONTRACT.md §4).
 */
export const claimFrom = (idToken: string, claim: string): string | null => {
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload: unknown = JSON.parse(fromBase64Url(parts[1]));
    if (typeof payload !== "object" || payload === null) return null;
    const value = (payload as Record<string, unknown>)[claim];
    return typeof value === "string" && value ? value : null;
  } catch {
    return null;
  }
};

/**
 * Finish sign-in from the provider's callback query string. The state is checked
 * BEFORE the code is exchanged, so a callback that does not match the attempt
 * that started it is refused.
 */
export const completeSignIn = async (query: string): Promise<SsoResult> => {
  const config = liveSso();
  if (!config) {
    return { ok: false, reason: "not-configured", detail: "No identity provider is configured." };
  }

  const params = new URLSearchParams(query);
  const code = params.get("code");
  const state = params.get("state") ?? "";
  if (!code || !state) {
    return { ok: false, reason: "no-code", detail: "The provider returned no authorisation code." };
  }

  const expectedState = window.sessionStorage.getItem(STATE_KEY);
  const verifier = window.sessionStorage.getItem(VERIFIER_KEY);
  window.sessionStorage.removeItem(STATE_KEY);
  window.sessionStorage.removeItem(VERIFIER_KEY);

  if (!expectedState || state !== expectedState || !verifier) {
    return {
      ok: false,
      reason: "state-mismatch",
      detail: "The callback did not match the sign-in attempt that started it.",
    };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: verifier,
  });
  const response = await fetch(under(config.issuer, "token"), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    return {
      ok: false,
      reason: "token-rejected",
      detail: `The provider answered ${response.status}.`,
    };
  }

  const payload: unknown = await response.json();
  const idToken =
    typeof payload === "object" && payload !== null
      ? (payload as { id_token?: unknown }).id_token
      : undefined;
  if (typeof idToken !== "string" || !idToken) {
    return {
      ok: false,
      reason: "token-rejected",
      detail: "The provider returned no identity token.",
    };
  }
  return { ok: true, idToken };
};
