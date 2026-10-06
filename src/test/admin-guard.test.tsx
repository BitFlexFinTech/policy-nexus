import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { ADMIN_ROUTE } from "@/config/platform";
import { ADMIN_GUARD_STATEMENT, isAdminAcknowledged } from "@/session/adminAccess";

const renderAtAdmin = () => {
  window.history.pushState({}, "", ADMIN_ROUTE);
  return render(<App />);
};

describe("administrator gate on the platform administration screen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // The confirmation is remembered per browser tab, so clearing it is what a new tab does.
    window.sessionStorage.clear();
  });

  it("asks the question before it will show the settings", () => {
    renderAtAdmin();
    expect(
      screen.getByRole("heading", { level: 1, name: "Administrator access" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Are you the administrator\?/)).toBeInTheDocument();
    // The settings screen itself is not shown until the question is answered.
    expect(
      screen.queryByRole("heading", { level: 1, name: "Platform administration" }),
    ).toBeNull();
  });

  it("states plainly that the confirmation is not real protection", () => {
    renderAtAdmin();
    expect(screen.getByText(ADMIN_GUARD_STATEMENT)).toBeInTheDocument();
    expect(ADMIN_GUARD_STATEMENT).toMatch(/not real protection/);
  });

  it("shows the settings only after the confirmation, and remembers it for the tab", () => {
    renderAtAdmin();
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Platform administration" }),
    ).toBeInTheDocument();
    expect(isAdminAcknowledged()).toBe(true);
    expect(window.sessionStorage.getItem("nzwisiso.admin.ack.v1")).toBe("confirmed");
  });

  it("locks the screen again, asking the question once more", () => {
    renderAtAdmin();
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock this screen" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Administrator access" }),
    ).toBeInTheDocument();
    expect(isAdminAcknowledged()).toBe(false);
    expect(window.sessionStorage.getItem("nzwisiso.admin.ack.v1")).toBeNull();
  });

  it("makes no network request while asking", () => {
    const hasFetch = typeof globalThis.fetch === "function";
    const fetchSpy = hasFetch ? vi.spyOn(globalThis, "fetch") : null;
    renderAtAdmin();
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));
    if (fetchSpy) expect(fetchSpy).not.toHaveBeenCalled();
  });
});
