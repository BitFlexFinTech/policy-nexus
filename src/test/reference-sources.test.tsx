import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import {
  formatReferenceDate,
  getNamedSource,
  MODELLED_SHARE_LABEL,
  NAMED_SOURCES,
  NAMED_SOURCE_STATEMENT,
  REFERENCE_DATE_LABEL,
  REFERENCE_RATES,
  SHARE_PUBLISHERS,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The month names in order, and the reference month's position in them, read out
 * of `formatReferenceDate` itself — never a second hand-written month list.
 */
const [, REFERENCE_MONTH, REFERENCE_YEAR] = REFERENCE_DATE_LABEL.split(" ");
const MONTHS_IN_ORDER = Array.from({ length: 12 }, (_, index) =>
  formatReferenceDate(`${REFERENCE_YEAR}-${String(index + 1).padStart(2, "0")}-01`).split(" ")[1],
);
const REFERENCE_MONTH_INDEX = MONTHS_IN_ORDER.indexOf(REFERENCE_MONTH);

/**
 * Reference provenance (AB-5). The defect these gates exist for: the workspace
 * stated a ZiG rate, a policy rate and an inflation rate as "reference inputs"
 * without naming who publishes them, and the inflation figure (8.4%) matched no
 * published figure at all. A rate must now always name its publisher and the
 * period it is for, and the screen must state the platform's sourcing rule.
 */
describe("reference provenance (AB-5) — no figure without a named source", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("gives every reference rate a named publisher, what the figure is, and its period", () => {
    expect(REFERENCE_RATES).toHaveLength(3);
    const named = new Set(NAMED_SOURCES.map((source) => source.id));
    REFERENCE_RATES.forEach((rate) => {
      // Throws if a rate points at a body the platform does not name.
      const source = getNamedSource(rate.sourceId);
      expect(named.has(rate.sourceId), `${rate.id} → ${rate.sourceId} is a named source`).toBe(true);
      expect(source.name, `${rate.id} names its publisher`).toBeTruthy();
      expect(rate.sourceDetail, `${rate.id} states what the figure is`).toBeTruthy();
      expect(rate.asOf, `${rate.id} states the period the figure is for`).toBeTruthy();
    });
  });

  it("dates every reference rate in the reference year and no later than the reference month", () => {
    expect(REFERENCE_MONTH_INDEX, REFERENCE_DATE_LABEL).toBeGreaterThanOrEqual(0);
    REFERENCE_RATES.forEach((rate) => {
      const parts = rate.asOf.split(" ");
      expect(parts, `${rate.id} states its period as "<Month> <Year>"`).toHaveLength(2);
      const [month, year] = parts;
      expect(year, `${rate.id} is dated in the reference year`).toBe(REFERENCE_YEAR);
      const index = MONTHS_IN_ORDER.indexOf(month);
      expect(index, `${rate.id} names a real month: ${rate.asOf}`).toBeGreaterThanOrEqual(0);
      expect(index, `${rate.id} is not dated after the reference month`).toBeLessThanOrEqual(
        REFERENCE_MONTH_INDEX,
      );
    });
  });

  it("states the sourcing rule in words, using the platform's own Modelled word", () => {
    expect(NAMED_SOURCE_STATEMENT).toContain(MODELLED_SHARE_LABEL);
    expect(NAMED_SOURCE_STATEMENT).toContain("reference inputs");
    expect(NAMED_SOURCE_STATEMENT.length).toBeGreaterThan(120);
  });

  /**
   * The defect this gate exists for (found 2026-10-02): the sentence said every stakeholder
   * share was a ZIMSTAT 2022 census figure, while one of the twenty published shares is the
   * Public Service Commission's. The screen therefore credited one publisher for shares that
   * came from two — and the same sentence is quoted in the funding memo and the deck.
   */
  it("names every publisher the shares actually use, and no publisher they do not", () => {
    const published = STAKEHOLDER_SEGMENTS.filter(
      (segment) => segment.shareSource !== MODELLED_SHARE_LABEL,
    );
    const modelled = STAKEHOLDER_SEGMENTS.filter(
      (segment) => segment.shareSource === MODELLED_SHARE_LABEL,
    );

    // The two figures the funding memo and the deck state. If a share is added or
    // removed, those documents must move with it, so this fails rather than drifting.
    expect(published, "published shares (the documents state 20)").toHaveLength(20);
    expect(modelled, "shares labelled Modelled (the documents state 130)").toHaveLength(130);

    // Every published share names one of the bodies on the list...
    published.forEach((segment) => {
      expect(
        SHARE_PUBLISHERS.some((publisher) => segment.shareSource.includes(publisher)),
        `${segment.id} names its publisher: "${segment.shareSource}"`,
      ).toBe(true);
    });

    // ...every body on the list is really used by a share, so the list cannot name a
    // publisher the data does not have...
    SHARE_PUBLISHERS.forEach((publisher) => {
      expect(
        published.some((segment) => segment.shareSource.includes(publisher)),
        `${publisher} is used by at least one published share`,
      ).toBe(true);
    });

    // ...and the sentence the reference screen prints names every one of them, so the
    // screen can never credit one publisher for shares that came from two.
    SHARE_PUBLISHERS.forEach((publisher) => {
      expect(NAMED_SOURCE_STATEMENT, `the sourcing rule names ${publisher}`).toContain(publisher);
    });
  });

  it("shows each rate's publisher and period on the reference screen", () => {
    signInToDepartment("ict");
    renderAt("/app/reference");

    REFERENCE_RATES.forEach((rate) => {
      const source = getNamedSource(rate.sourceId);
      expect(
        screen.getAllByText(new RegExp(escapeRegex(`as at ${rate.asOf}`))).length,
        `${rate.id} shows the period it is for`,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(new RegExp(escapeRegex(source.name))).length,
        `${rate.id} shows its publisher: ${source.name}`,
      ).toBeGreaterThan(0);
    });
  });

  it("lists every named source on the reference screen, with the rule stated", () => {
    signInToDepartment("ict");
    renderAt("/app/reference");

    expect(screen.getByRole("heading", { name: "Named sources" })).toBeInTheDocument();
    expect(screen.getByText(NAMED_SOURCE_STATEMENT)).toBeInTheDocument();
    NAMED_SOURCES.forEach((source) => {
      expect(screen.getByText(source.name)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(escapeRegex(source.figures))),
        `${source.id} says what it publishes`,
      ).toBeInTheDocument();
      expect(screen.getByText(new RegExp(escapeRegex(source.publication)))).toBeInTheDocument();
    });
  });
});
