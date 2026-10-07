import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearConfig } from "@/config/platform";
import { clearResearchSample } from "@/services/research/researchSample";
import { signInResearcher } from "@/session/researchSession";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/**
 * The research workspace (the redesign) — it is a workspace with a section navigation, a home that
 * orients, and a seeded demonstration sample, not six empty panels stacked down one page.
 */
describe("the research workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearResearchSample();
    signInResearcher("chigumira");
  });

  it("opens with a section navigation and a home that orients", () => {
    renderAt("/research/app");
    expect(
      screen.getByRole("navigation", { name: "Research assistant sections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try this")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset the sample" })).toBeInTheDocument();
  });

  it("seeds a demonstration sample, so a section is not empty on first open", () => {
    renderAt("/research/app/library");
    expect(screen.getAllByText(/demonstration extract/i).length).toBeGreaterThan(0);
  });

  it("carries the six tools, and a brief section shows its fixed structure", () => {
    renderAt("/research/app/brief");
    const nav = screen.getByRole("navigation", { name: "Research assistant sections" });
    ["Overview", "Library", "Data sources", "Ask", "Policy brief", "Economic Barometer", "Findings"].forEach(
      (label) => expect(nav.textContent, label).toContain(label),
    );
  });

  it("resets the sample from the home and stays usable", () => {
    renderAt("/research/app");
    fireEvent.click(screen.getByRole("button", { name: "Reset the sample" }));
    expect(screen.getByText("Try this")).toBeInTheDocument();
  });
});