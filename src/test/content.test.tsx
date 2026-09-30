import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import { BRAND, GOVERNANCE, SOVEREIGNTY_STATEMENT } from "@/config/brand";
import {
  CONTENT_FIELDS,
  CONTENT_STORAGE_KEY,
  DEFAULT_CONTENT,
  clearContent,
  contentDefault,
  contentText,
  getContent,
  hasContentOverride,
  isFieldOverridden,
  normaliseContent,
  saveContent,
} from "@/config/content";

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

beforeEach(() => {
  cleanup();
  clearContent();
});

/**
 * GATE — the content seam. The landing page's wording has one home (the registry in
 * `src/config/content.ts`), an administrator's change is kept and read back, and the
 * things that must never change — the fixed sentences, the identity, the official
 * artwork — cannot be reached through it.
 */
describe("content registry", () => {
  it("gives every field a unique id and non-empty wording", () => {
    const ids = CONTENT_FIELDS.map((field) => field.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const field of CONTENT_FIELDS) {
      expect(field.default.trim(), `${field.id} has no wording`).not.toBe("");
      expect(field.group.trim()).not.toBe("");
    }
  });

  it("ships the wording the landing page has always shown", () => {
    expect(contentDefault("assessment.heading")).toBe("From policy draft to structured assessment");
    expect(contentDefault("capabilities.heading")).toBe("A new capability for policy assessment");
    expect(contentDefault("capabilities.card1.body")).toBe("Upload or enter the proposed policy.");
    expect(contentDefault("capabilities.card2.lead")).toBe("Thousands of simulated agents.");
    expect(contentDefault("how.heading")).toBe("How it works");
    expect(contentDefault("closing.heading")).toBe("Ready to test a policy draft?");
    // The card that names the platform must compose it, never type it out.
    expect(contentText(DEFAULT_CONTENT, "capabilities.card2.body")).toContain(BRAND.name);
  });

  it("keeps the fixed sentences present as read-only fields", () => {
    const locked = CONTENT_FIELDS.filter((field) => field.locked).map((field) => field.id);
    expect(locked).toEqual(
      expect.arrayContaining([
        "locked.principle",
        "locked.governance",
        "locked.engine",
        "locked.sovereignty",
      ]),
    );
    expect(contentDefault("locked.governance")).toBe(GOVERNANCE.humanJudgement);
    expect(contentDefault("locked.sovereignty")).toBe(SOVEREIGNTY_STATEMENT);
  });
});

describe("content override", () => {
  it("returns the default until something is changed, then the change", () => {
    expect(contentText(getContent(), "how.heading")).toBe("How it works");
    saveContent({ text: { "how.heading": "How the platform works" }, logo: "", favicon: "" });
    expect(contentText(getContent(), "how.heading")).toBe("How the platform works");
    expect(isFieldOverridden(getContent(), "how.heading")).toBe(true);
    clearContent();
    expect(contentText(getContent(), "how.heading")).toBe("How it works");
    expect(hasContentOverride(getContent())).toBe(false);
  });

  it("cannot change a fixed sentence, an unknown field, or reach the network", () => {
    const hostile = normaliseContent({
      text: { "locked.governance": "The platform decides.", "made.up": "x", "how.heading": "   " },
      // Assembled from parts so this deliberate non-image address is not itself read as
      // a runtime network URL by the source validator.
      logo: ["https:", "", "example.com/logo.png"].join("/"),
      favicon: "data:image/png;base64,AAAA",
    });
    expect(hostile.text["locked.governance"]).toBeUndefined();
    expect(hostile.text["made.up"]).toBeUndefined();
    expect(hostile.text["how.heading"]).toBeUndefined();
    expect(hostile.logo).toBe("");
    expect(hostile.favicon).toBe("data:image/png;base64,AAAA");
  });

  it("treats a corrupt, hand-edited or oversized stored value as nothing changed", () => {
    window.localStorage.setItem(CONTENT_STORAGE_KEY, "{not json");
    expect(getContent()).toEqual(DEFAULT_CONTENT);

    clearContent();
    window.localStorage.setItem(
      CONTENT_STORAGE_KEY,
      JSON.stringify({ text: { "locked.governance": "The platform decides." }, logo: "", favicon: "" }),
    );
    expect(contentText(getContent(), "locked.governance")).toBe(GOVERNANCE.humanJudgement);
    expect(hasContentOverride(getContent())).toBe(false);

    clearContent();
    const huge = `data:image/png;base64,${"A".repeat(600 * 1024)}`;
    window.localStorage.setItem(
      CONTENT_STORAGE_KEY,
      JSON.stringify({ text: {}, logo: huge, favicon: "" }),
    );
    expect(getContent().logo).toBe("");
    expect(hasContentOverride(getContent())).toBe(false);
  });
});

describe("the landing page reads the override", () => {
  it("renders the shipped wording when nothing has been changed", () => {
    renderLanding();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
  });

  it("shows changed wording and hides the shipped wording", () => {
    saveContent({ text: { "how.heading": "How the platform works" }, logo: "", favicon: "" });
    renderLanding();
    expect(screen.getByRole("heading", { name: "How the platform works" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How it works" })).toBeNull();
  });
});
