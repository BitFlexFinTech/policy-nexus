import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import {
  ADMIN_ROUTE,
  PLATFORM_CONFIG_STORAGE_KEY,
  clearConfig,
} from "@/config/platform";
import { clearSession, signInToDepartment } from "@/session/session";

/** A local address, so the file carries no reachable remote address at all. */
const LOCAL = "http://localhost:8787/assess";

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

  it("renders at its own address with every capability simulated", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    expect(
      screen.getByRole("heading", { level: 1, name: "Platform administration" }),
    ).toBeInTheDocument();
    ["Assessment service", "Drafting model (OpenRouter)", "Document text extraction", "Shared document library", "Government sign-in (SSO)"].forEach(
      (label) => expect(screen.getByRole("heading", { name: label })).toBeInTheDocument(),
    );
    expect(screen.getAllByText("simulated")).toHaveLength(5);
    expect(screen.getByText(/Everything is simulated/)).toBeInTheDocument();
  });

  it("is not linked from any officer-facing screen", () => {
    for (const path of ["/", "/start", "/app"]) {
      if (path === "/app") signInToDepartment("fin");
      const view = renderAt(path);
      const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
      expect(hrefs, path).not.toContain(ADMIN_ROUTE);
      view.unmount();
    }
  });

  it("is not reachable by a link from the workspace chrome", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.queryByRole("link", { name: /administration/i })).toBeNull();
  });

  it("reports a capability as misconfigured when Live is switched on without its details", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    fireEvent.click(screen.getByRole("switch", { name: "Assessment service runs live" }));
    expect(screen.getAllByText("misconfigured")).toHaveLength(1);
    expect(screen.getAllByText("simulated")).toHaveLength(4);
    expect(screen.queryAllByText("live")).toHaveLength(0);
  });

  it("reports a capability as live only once it is complete, and persists on save", () => {
    renderAt(ADMIN_ROUTE);
    enterAdmin();

    // Only the drafting capability carries a model field.
    expect(screen.getAllByLabelText("Model (OpenRouter)")).toHaveLength(1);

    fireEvent.click(screen.getByRole("switch", { name: "Assessment service runs live" }));
    fireEvent.change(screen.getAllByLabelText("Service address")[0], {
      target: { value: LOCAL },
    });

    // Live, but not yet complete: it must not be treated as live.
    expect(screen.queryAllByText("live")).toHaveLength(0);

    fireEvent.change(screen.getAllByLabelText("Key")[0], { target: { value: "test-key" } });
    expect(screen.getAllByText("live")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    expect(screen.getAllByText("live")).toHaveLength(1);
    expect(window.localStorage.getItem(PLATFORM_CONFIG_STORAGE_KEY)).toContain(LOCAL);
  });

  it("makes no network request while rendering the screen", () => {
    const hasFetch = typeof globalThis.fetch === "function";
    const fetchSpy = hasFetch ? vi.spyOn(globalThis, "fetch") : null;
    renderAt(ADMIN_ROUTE);
    enterAdmin();
    if (fetchSpy) expect(fetchSpy).not.toHaveBeenCalled();
  });
});
