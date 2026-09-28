import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GRAPH_EDGE_STROKE,
  GRAPH_EDGE_STROKE_STRENGTH,
  GRAPH_FOCUS_STROKE,
  GRAPH_GROUP_COLOURS,
  GRAPH_INK,
  GRAPH_MARK_OUTLINE_STROKE,
  GRAPH_NODE_FILL,
  GRAPH_NODE_SHAPE,
  GRAPH_RING_STROKE,
  closestPair,
  colourDistance,
  simulateCvd,
} from "@/lib/graph/palette";

/**
 * The card's own colour, read from `src/index.css` rather than typed in here — the
 * surface a mark is drawn on is a project token, and a guard that hardcoded it would
 * keep passing after the surface changed.
 */
const cardColour = (() => {
  const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
  const match = css.match(/--card:\s*([^;]+);/);
  if (!match) throw new Error("--card is missing from src/index.css");
  const [h, s, l] = match[1]
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part.replace("%", "")));
  const sN = s / 100;
  const lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const channel = (n: number) =>
    Math.round(255 * f(n))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
})();

/**
 * The graph palette. The user asked for colours that remove ambiguity, so the palette is
 * MEASURED rather than eyeballed: every value is re-checked as a red-green colour-blind
 * reader would see it, and the build fails if two colours collapse together. One in 25
 * African males is affected (Okabe & Ito, "Colour Universal Design").
 *
 * THE THRESHOLD, and why it is 14: in CIE Lab a distance above roughly 10 is where two
 * colours become distinct at a glance, so 14 demands a margin above that line. It is not
 * higher because the Phase AB probe MEASURED the ceiling: under both red-green simulations
 * only five colours in this space can clear 14 together. Demanding more would force colours
 * that a colour-blind reader genuinely cannot separate.
 */
const MIN_DISTINCT = 14;

/**
 * How far a fill must sit from the card it is drawn on, and how far the ink outline must
 * sit from the fill it outlines. 25 is comfortably clear of the roughly-10 "distinct at a
 * glance" line in CIE Lab, while still being below the tightest real pair (the ink
 * outline against the document grey, measured at 39.7) — so it demands a margin without
 * pretending the palette has more room than it does.
 */
const FROM_SURFACE = 25;

describe("the graph palette", () => {
  it("separates the group colours for a reader with normal colour vision", () => {
    const worst = closestPair(GRAPH_GROUP_COLOURS);
    expect(
      worst.distance,
      `closest pair ${worst.a} / ${worst.b} at ${worst.distance.toFixed(1)}`,
    ).toBeGreaterThan(25);
  });

  it.each(["protanopia", "deuteranopia"] as const)(
    "keeps the group colours apart for a %s reader",
    (type) => {
      const worst = closestPair(GRAPH_GROUP_COLOURS, type);
      expect(
        worst.distance,
        `closest pair ${worst.a} / ${worst.b} at ${worst.distance.toFixed(1)}`,
      ).toBeGreaterThan(MIN_DISTINCT);
    },
  );

  it.each(["protanopia", "deuteranopia"] as const)(
    "keeps every group colour apart from the reserved fills and the ink for a %s reader",
    (type) => {
      const reserved = [GRAPH_NODE_FILL.priority, GRAPH_NODE_FILL.corpus, GRAPH_INK];
      GRAPH_GROUP_COLOURS.forEach((group) => {
        reserved.forEach((kind) => {
          const distance = colourDistance(simulateCvd(group, type), simulateCvd(kind, type));
          expect(distance, `${group} against ${kind} under ${type}`).toBeGreaterThan(MIN_DISTINCT);
        });
      });
    },
  );

  it("records the measured limit: five colours, and past that the label carries it", () => {
    expect(GRAPH_GROUP_COLOURS).toHaveLength(5);
    expect(new Set(GRAPH_GROUP_COLOURS).size).toBe(5);
  });
/**
   * The guards below are what make the drawing's legibility MEASURED rather than
   * eyeballed. They were added with the stroke-weight fix: the fills are pale enough on
   * the card (the yellow measures 1.32:1) that the ink outline is what carries every
   * mark's shape, and a stroke expressed in the virtual space instead of in pixels is
   * what made the surface look poor. Change any of these and the build fails.
   */
  it("keeps every fill far enough from the card surface to be seen at all", () => {
    const fills = [...GRAPH_GROUP_COLOURS, GRAPH_NODE_FILL.priority, GRAPH_NODE_FILL.corpus];
    fills.forEach((fill) => {
      const distance = colourDistance(fill, cardColour);
      expect(
        distance,
        `${fill} sits only ${distance.toFixed(1)} from the card ${cardColour} — too close to read`,
      ).toBeGreaterThan(FROM_SURFACE);
    });
  });

  it("keeps the ink outline apart from every fill it outlines", () => {
    const fills = [...GRAPH_GROUP_COLOURS, GRAPH_NODE_FILL.priority, GRAPH_NODE_FILL.corpus];
    fills.forEach((fill) => {
      const distance = colourDistance(fill, GRAPH_INK);
      expect(
        distance,
        `the ink outline would vanish into ${fill} at ${distance.toFixed(1)}`,
      ).toBeGreaterThan(FROM_SURFACE);
    });
  });

  it("keeps every pinned stroke in a usable pixel band", () => {
    // A hairline thinner than a pixel anti-aliases into grey; the draft's ring is the
    // heaviest line and must outweigh the outlines it sits among.
    expect(GRAPH_EDGE_STROKE).toBeGreaterThanOrEqual(1);
    expect(GRAPH_EDGE_STROKE + GRAPH_EDGE_STROKE_STRENGTH).toBeLessThanOrEqual(2);
    expect(GRAPH_MARK_OUTLINE_STROKE).toBeGreaterThanOrEqual(1);
    expect(GRAPH_FOCUS_STROKE).toBeGreaterThanOrEqual(1);
    expect(GRAPH_RING_STROKE).toBeGreaterThan(GRAPH_MARK_OUTLINE_STROKE);
  });

  it("gives every kind of mark a shape of its own", () => {
    const shapes = Object.values(GRAPH_NODE_SHAPE);
    expect(shapes).toHaveLength(4);
    expect(new Set(shapes).size).toBe(4);
  });
});
