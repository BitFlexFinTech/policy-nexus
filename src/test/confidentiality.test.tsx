import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { CONFIDENTIALITY, NAME, PROMOTER } from "@/config/brand";

/**
 * The two confidentiality cards (owner's instruction, 2026-10-07).
 *
 * The owner dictated both sentences: one for the policy simulator, about a POLICY DRAFT, and one for
 * the platform home page, about DOCUMENTS. They must appear exactly, each on its own page, and must
 * never be swapped — the simulator's promise is the narrower one.
 *
 * A companion gate lives in the build (`scripts/validate.mjs`, check 47), which fails if either page
 * loses its card or if the two wordings are exchanged in the source. This file proves the same thing
 * on the rendered pages.
 */
describe("the confidentiality cards", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the policy-draft wording on the policy simulator, and not the home page's", () => {
    window.history.pushState({}, "", "/simulation");
    render(<App />);

    expect(screen.getByText(CONFIDENTIALITY.simulator)).toBeInTheDocument();
    expect(screen.queryByText(CONFIDENTIALITY.home)).not.toBeInTheDocument();
    expect(CONFIDENTIALITY.simulator).toContain("cannot read any policy draft");
    // The card is headed "Confidentiality", on the page, not just in the config.
    expect(screen.getAllByText(CONFIDENTIALITY.heading).length).toBeGreaterThan(0);
  });

  it("shows the documents wording on the home page, and not the simulator's", () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(screen.getByText(CONFIDENTIALITY.home)).toBeInTheDocument();
    expect(screen.queryByText(CONFIDENTIALITY.simulator)).not.toBeInTheDocument();
    expect(CONFIDENTIALITY.home).toContain("cannot read any documents");
    expect(screen.getAllByText(CONFIDENTIALITY.heading).length).toBeGreaterThan(0);
  });

  it("keeps the owner's two names in the sentence: the product's ™ and the company's name", () => {
    for (const sentence of [CONFIDENTIALITY.simulator, CONFIDENTIALITY.home]) {
      expect(sentence).toContain(NAME);
      expect(NAME).toContain("™");
      expect(sentence).toContain(`servers managed by ${PROMOTER.name}`);
    }
  });
});