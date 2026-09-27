import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type SsoConfig,
} from "@/config/platform";
import { SESSION_STORAGE_KEY, getSession, signInWithSso } from "@/session/session";
import {
  beginSignIn,
  claimFrom,
  completeSignIn,
  isSsoConfigured,
  signInUrl,
} from "@/session/sso";

/** Local addresses only, so no reachable remote address appears in this file. */
const IDP = "http://localhost:8787/idp";
const CALLBACK = "http://localhost:8080/auth/callback";

const ssoConfig: SsoConfig = {
  mode: "live",
  issuer: IDP,
  clientId: "client-1",
  redirectUri: CALLBACK,
  departmentClaim: "department_id",
};

const STATE_KEY = "nzwisiso.sso.state.v1";
const VERIFIER_KEY = "nzwisiso.sso.verifier.v1";

const configureSso = () => saveConfig({ ...DEFAULT_PLATFORM_CONFIG, sso: ssoConfig });

/** A token shaped like the provider's: header.payload.signature. */
const tokenWith = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload)).split("+").join("-").split("/").join("_").split("=").join("")}.signature`;

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

describe("reading a claim from the provider's token", () => {
  it("reads the department the provider states, and who signed in", () => {
    const token = tokenWith({ department_id: "fin", sub: "officer-1" });
    expect(claimFrom(token, "department_id")).toBe("fin");
    expect(claimFrom(token, "sub")).toBe("officer-1");
  });

  it("returns nothing for a claim that is absent, empty or not text", () => {
    expect(claimFrom(tokenWith({ department_id: "" }), "department_id")).toBeNull();
    expect(claimFrom(tokenWith({ department_id: 5 }), "department_id")).toBeNull();
    expect(claimFrom(tokenWith({}), "department_id")).toBeNull();
  });

  it("returns nothing for a token it cannot read", () => {
    expect(claimFrom("not-a-token", "department_id")).toBeNull();
    expect(claimFrom("header.!!!not-base64!!!.signature", "department_id")).toBeNull();
  });
});

describe("a session that came from the provider", () => {
  it("records that sign-in was real, and who signed in", () => {
    expect(signInWithSso("fin", "officer-1")).toMatchObject({
      departmentId: "fin",
      mode: "sso",
      subject: "officer-1",
    });
    expect(getSession()).toMatchObject({ mode: "sso", subject: "officer-1" });
  });

  it("refuses an id that is not one of the 16 departments", () => {
    expect(signInWithSso("not-a-department", "officer-1")).toBeNull();
    expect(getSession()).toBeNull();
  });

  it("never reads an unrecognised stored mode as a real sign-in", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ departmentId: "fin", mode: "whatever", signedInAt: "2026-09-24" }),
    );
    expect(getSession()?.mode).toBe("oneclick");
  });
});

