import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import {
  ADMIN_ROUTE,
  PLATFORM_CONFIG_STORAGE_KEY,
  clearConfig,
} from "@/config/platform";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/** Pass the administrator gate so the settings screen itself is what is under test. */
const enterAdmin = () =>
  fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));

describe("platform administration screen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearConfig();
    clearSession();
  });

  it("keeps only the drafting card and the sign-in card, and shows the mode plainly", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    expect(
      screen.getByRole("heading", { level: 1, name: "Platform administration" }),
    ).toBeInTheDocument();
    // The service cards the owner asked to remove are gone; the drafting card (the OpenRouter
    // key) and the sign-in card remain.
    ["Drafting model (OpenRouter)", "Government sign-in (SSO)"].forEach((label) =>
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument(),
    );
    ["Assessment service", "Document text extraction", "Shared document library"].forEach((label) =>
      expect(screen.queryByRole("heading", { name: label })).toBeNull(),
    );
    expect(screen.getAllByText("simulated")).toHaveLength(2);
    // The mode is shown plainly, in the platform-mode badge.
    expect(screen.getAllByText("Simulated").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Everything is simulated/)).toBeInTheDocument();
  });

  it("is linked from the public footer so an administrator can find it (owner's instruction)", () => {
    for (const path of ["/", "/start"]) {
      const view = renderAt(path);
      const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
      expect(hrefs, path).toContain(ADMIN_ROUTE);
      view.unmount();
    }
  });

  it("is not reachable by a link from the workspace chrome", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.queryByRole("link", { name: /administration/i })).toBeNull();
  });

  it("reports capabilities as misconfigured when the platform is switched Live with nothing configured", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    // The one platform-mode control switches the whole platform Live.
    fireEvent.click(screen.getByRole("switch", { name: "Platform mode is live" }));
    // The platform is Live, but nothing is connected, so no capability is live.
    expect(screen.queryAllByText("live")).toHaveLength(0);
    expect(screen.getAllByText("misconfigured").length).toBeGreaterThan(0);
  });

  it("goes live once the OpenRouter key is entered, and persists on save", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();

    // Only the drafting capability carries a model field.
    expect(screen.getAllByLabelText("Model")).toHaveLength(1);

    // The one platform-mode control switches the platform Live; with no key nothing is live.
    fireEvent.click(screen.getByRole("switch", { name: "Platform mode is live" }));
    expect(screen.queryAllByText("live")).toHaveLength(0);

    // Entering the OpenRouter key completes drafting — its address and default model are filled
    // in automatically — so drafting becomes live.
    fireEvent.change(screen.getAllByLabelText("OpenRouter key")[0], {
      target: { value: "test-key" },
    });
    expect(screen.getAllByText("live").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    expect(window.localStorage.getItem(PLATFORM_CONFIG_STORAGE_KEY)).toContain("live");
  });

  it("makes no network request while rendering the screen", () => {
    const hasFetch = typeof globalThis.fetch === "function";
    const fetchSpy = hasFetch ? vi.spyOn(globalThis, "fetch") : null;
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    if (fetchSpy) expect(fetchSpy).not.toHaveBeenCalled();
  });
});
