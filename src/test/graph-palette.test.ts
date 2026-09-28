import { describe, expect, it } from "vitest";
import {
  GRAPH_GROUP_COLOURS,
  GRAPH_NODE_FILL,
  closestPair,
  colourDistance,
  simulateCvd,
} from "@/lib/graph/palette";

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
    "keeps every group colour apart from the reserved kinds for a %s reader",
    (type) => {
      const reserved = [GRAPH_NODE_FILL.priority, GRAPH_NODE_FILL.corpus];
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
});
