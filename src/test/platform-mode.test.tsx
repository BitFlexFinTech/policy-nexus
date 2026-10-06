import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import {
  ADMIN_ROUTE,
  CAPABILITY_IDS,
  clearConfig,
  getConfig,
  isPlatformLive,
  platformModeOf,
  setPlatformMode,
} from "@/config/platform";
import { clearSession } from "@/session/session";

describe("the platform mode — the one master switch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearConfig();
    clearSession();
  });

  it("ships simulated", () => {
    expect(platformModeOf()).toBe("simulated");
    expect(isPlatformLive()).toBe(false);
  });

  it("switches the whole platform — every capability at once — and back", () => {
    setPlatformMode("live");
    expect(isPlatformLive()).toBe(true);
    CAPABILITY_IDS.forEach((id) => expect(getConfig()[id].mode, id).toBe("live"));

    setPlatformMode("simulated");
    expect(isPlatformLive()).toBe(false);
    CAPABILITY_IDS.forEach((id) => expect(getConfig()[id].mode, id).toBe("simulated"));
  });

  it("is the single control on the administration screen", () => {
    window.history.pushState({}, "", ADMIN_ROUTE);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));

    const platformSwitch = screen.getByRole("switch", { name: "Platform mode is live" });
    expect(platformSwitch).not.toBeChecked();

    fireEvent.click(platformSwitch);
    expect(isPlatformLive()).toBe(true);

    // Every capability switch now reads live too — one control, not six.
    const capabilitySwitches = screen.getAllByRole("switch", { name: /runs live$/ });
    expect(capabilitySwitches).toHaveLength(5);
    capabilitySwitches.forEach((entry) => expect(entry).toBeChecked());
  });
});
