import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { clearConfig } from "@/config/platform";
import { clearSession, getSession } from "@/session/session";

/**
 * The screen an identity provider returns the officer to. It is reached only by
 * the provider's redirect, and it must never let anyone in when the answer cannot
 * be checked — which, with nothing configured, is always.
 */
describe("the sign-in callback screen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearSession();
  });

  it("reports honestly, states that it cannot check the answer, and signs nobody in", async () => {
    window.history.pushState({}, "", "/auth/callback?code=abc&state=xyz");
    render(<App />);

    expect(await screen.findByText(/Sign-in did not complete/)).toBeInTheDocument();
    expect(screen.getByText(/cannot check the identity provider's signature/)).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it("offers a way onward instead of leaving the officer stranded", () => {
    window.history.pushState({}, "", "/auth/callback");
    render(<App />);

    expect(screen.getByRole("link", { name: /Choose your Department/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/ })).toBeInTheDocument();
  });
});
