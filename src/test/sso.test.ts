import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type SsoConfig,
} from "@/config/platform";
import { beginSignIn, completeSignIn, isSsoConfigured, signInUrl } from "@/session/sso";

/** Local addresses only, so no reachable remote address appears in this file. */
const IDP = "http://localhost:8787/idp";
const CALLBACK = "http://localhost:8080/auth/callback";

const ssoConfig: SsoConfig = {
  mode: "live",
  issuer: IDP,
  clientId: "client-1",
  redirectUri: CALLBACK,
};

const STATE_KEY = "nzwisiso.sso.state.v1";
const VERIFIER_KEY = "nzwisiso.sso.verifier.v1";

const configureSso = () => saveConfig({ ...DEFAULT_PLATFORM_CONFIG, sso: ssoConfig });

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  clearConfig();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearConfig();
});

describe("government sign-in client", () => {
  it("reports that it is not configured, and starts nothing", async () => {
    expect(isSsoConfigured()).toBe(false);
    await expect(beginSignIn()).resolves.toBe(false);
    await expect(completeSignIn("?code=abc&state=xyz")).resolves.toMatchObject({
      ok: false,
      reason: "not-configured",
    });
  });

  it("builds a PKCE authorisation address", async () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => bytes,
      subtle: { digest: async () => new ArrayBuffer(32) },
    });

    const url = new URL(await signInUrl(ssoConfig, "state-1", "verifier-1"));

    expect(url.pathname).toBe("/idp/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("redirect_uri")).toBe(CALLBACK);
    expect(url.searchParams.get("state")).toBe("state-1");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
  });

  it("refuses a callback whose state does not match the attempt that started it", async () => {
    configureSso();
    window.sessionStorage.setItem(STATE_KEY, "expected-state");

    await expect(completeSignIn("?code=abc&state=other-state")).resolves.toMatchObject({
      ok: false,
      reason: "state-mismatch",
    });
  });

  it("refuses a callback with no code", async () => {
    configureSso();
    await expect(completeSignIn("?state=state-1")).resolves.toMatchObject({
      ok: false,
      reason: "no-code",
    });
  });

  it("exchanges the code and returns the identity token, then forgets the verifier", async () => {
    configureSso();
    window.sessionStorage.setItem(STATE_KEY, "state-1");
    window.sessionStorage.setItem(VERIFIER_KEY, "verifier-1");
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id_token: "token-1" }) }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(completeSignIn("?code=abc&state=state-1")).resolves.toEqual({
      ok: true,
      idToken: "token-1",
    });
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe(`${IDP}/token`);
    expect(window.sessionStorage.getItem(VERIFIER_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("reports a rejection instead of pretending to be signed in", async () => {
    configureSso();
    window.sessionStorage.setItem(STATE_KEY, "state-1");
    window.sessionStorage.setItem(VERIFIER_KEY, "verifier-1");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })));

    await expect(completeSignIn("?code=abc&state=state-1")).resolves.toMatchObject({
      ok: false,
      reason: "token-rejected",
    });
  });
});
