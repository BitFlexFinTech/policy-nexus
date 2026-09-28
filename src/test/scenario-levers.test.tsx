import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { LEVER_CONTROLS } from "@/services/assessment/levers";
import { clearRuns, listRunRequestsFor } from "@/services/assessment/runStore";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/**
 * BATCH E, through the interface. The controls are rendered FROM the lever
 * definitions, and the setting an officer chooses reaches the stored run request —
 * which is what makes a lever real rather than decorative.
 */
describe("scenario assumptions — the officer can set them, and they travel with the run", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
  });

  it("renders one control per lever, plus the phasing choices", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.getByText("Scenario assumptions")).toBeInTheDocument();
    LEVER_CONTROLS.forEach((control) => {
      expect(screen.getByText(control.label), `${control.id} control`).toBeInTheDocument();
      control.options.forEach((option) => {
        expect(
          screen.getAllByRole("button", { name: option.label }).length,
          `${control.id} option ${option.value}`,
        ).toBeGreaterThan(0);
      });
    });
    expect(screen.getByText("Phasing before duties begin")).toBeInTheDocument();
  });

  it("starts neutral, and the reset action only appears once a lever is moved", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Needs training or staff" }));
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });

  it("carries the chosen assumptions into the recorded run request", async () => {
    signInToDepartment("fin");
    renderAt("/app");
    fireEvent.change(screen.getByPlaceholderText(/Draft the policy text/), {
      target: { value: "Each bank must register, and a transition period of twelve months applies." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inside the current budget" }));
    fireEvent.click(screen.getByRole("button", { name: "6 months" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));

    const stored = listRunRequestsFor("fin");
    expect(stored).toHaveLength(1);
    expect(stored[0].levers).toEqual({
      funding: "within-budget",
      capacity: "unstated",
      enforcement: "standard",
      phaseInMonths: 6,
    });
  });
});
