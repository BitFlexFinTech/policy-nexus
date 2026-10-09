import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { clearConfig } from "@/config/platform";
import { clearResearchSample } from "@/services/research/researchSample";
import { forgetZepariCorpus } from "@/services/research/zepariCorpus";
import { signInResearcher } from "@/session/researchSession";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/**
 * The research workspace (the redesign) — it is a workspace with a section navigation, a home that
 * orients, and a library that is never empty: ZEPARI's own published documents ARE the library (the
 * owner's strict rule, 2026-10-07), not the short "demonstration extract" stand-ins that used to be
 * seeded here.
 */
describe("the research workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
    clearResearchSample();
    forgetZepariCorpus();
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

  it("never opens an empty library: ZEPARI's published documents are the library", () => {
    renderAt("/research/app/library");
    const panel = screen
      .getByRole("heading", { name: /research library/i })
      .closest("section") as HTMLElement;
    expect(within(panel).getByText(/ZEPARI's published library/)).toBeInTheDocument();
    // The old "(demonstration extract)" stand-ins are gone for good — the library is ZEPARI's real
    // publications, and if they cannot be read the panel says so rather than showing an empty library.
    expect(within(panel).queryByText(/demonstration extract/i)).not.toBeInTheDocument();
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