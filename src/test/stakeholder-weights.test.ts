import { describe, expect, it } from "vitest";
import { findDepartment } from "@/config/departments";
import {
  MODELLED_SEGMENT_WEIGHT,
  MODELLED_SHARE_LABEL,
  STAKEHOLDER_SEGMENTS,
  getStakeholderSegment,
  segmentWeight,
} from "@/config/reference";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { buildRelationshipGraph } from "@/services/assessment/network";
import type { AssessmentRequest } from "@/services/assessment/types";

/**
 * The stakeholder weights (AB-2).
 *
 * Every segment now carries the REAL share of the country it stands for, so the
 * modelled agents are split the way the country is rather than evenly. These guards
 * make that claim checkable: a share must be either a published figure that matches
 * the census count it cites, or explicitly MODELLED — never a number in between, and
 * never presented as official when it is not.
 */

/** The published census counts each share is derived from, transcribed from the source. */
const PUBLISHED: Record<string, { count: number; base: "employed" | "population" }> = {
  "civil-servants": { count: 82_040, base: "employed" },
  "urban-households": { count: 5_855_099, base: "population" },
  "rural-households": { count: 9_323_858, base: "population" },
  "informal-traders": { count: 443_742, base: "employed" },
  "mining-operators": { count: 227_079, base: "employed" },
  "smallholder-farmers": { count: 582_138, base: "employed" },
  diaspora: { count: 908_914, base: "population" },
  youth: { count: 4_836_291, base: "population" },
  "financial-sector": { count: 32_050, base: "employed" },
  "health-workers": { count: 61_358, base: "employed" },
  educators: { count: 148_470, base: "employed" },
};

/** The census totals the shares are percentages of — ZIMSTAT 2022, Tables 6.6 and 2.7. */
const EMPLOYED_TOTAL = 2_501_887;
const POPULATION_TOTAL = 15_178_957;

/**
 * The segments with NO official figure, named one by one. If a later session adds a
 * published share for one of these, or silently marks a new segment "Modelled", this
 * list makes the change deliberate instead of invisible.
 */
const MODELLED_IDS = [
  "formal-business",
  "women-led-enterprises",
  "exporters",
  "local-authorities",
  "development-partners",
];

const requestFor = (departmentId: string): AssessmentRequest => {
  const department = findDepartment(departmentId)!;
  const template = department.policyTemplates[0];
  return {
    departmentId: department.id,
    policyText: template.policyText,
    source: "preset",
    templateId: template.id,
    timeHorizon: template.timeHorizon,
  };
};

/** How many marks a run's field draws for one group. */
const marksFor = (departmentId: string, segmentId: string): number => {
  const graph = buildRelationshipGraph(buildSimulatedRun(requestFor(departmentId)));
  return graph.agents.filter((agent) => agent.groupId === `stakeholder:${segmentId}`).length;
};

describe("stakeholder weights — published or modelled, never invented", () => {
  it("declares a source and a base for every segment, and never a bare number", () => {
    STAKEHOLDER_SEGMENTS.forEach((segment) => {
      expect(segment.shareSource.length, `${segment.id} names a source`).toBeGreaterThan(0);
      if (segment.share === null) {
        // A modelled share must say so, and must not pretend to a base.
        expect(segment.shareSource, `${segment.id} is labelled modelled`).toBe(MODELLED_SHARE_LABEL);
        expect(segment.shareBase, `${segment.id} claims no base`).toBeNull();
      } else {
        expect(segment.shareSource, `${segment.id} is not labelled modelled`).not.toBe(
          MODELLED_SHARE_LABEL,
        );
        expect(segment.share, `${segment.id} share is in range`).toBeGreaterThan(0);
        expect(segment.share).toBeLessThanOrEqual(100);
        expect(segment.shareBase, `${segment.id} names what the share is of`).toBeTruthy();
      }
    });
  });

  it("makes every published share equal the census count it cites", () => {
    Object.entries(PUBLISHED).forEach(([id, { count, base }]) => {
      const segment = getStakeholderSegment(id as (typeof STAKEHOLDER_SEGMENTS)[number]["id"]);
      const total = base === "employed" ? EMPLOYED_TOTAL : POPULATION_TOTAL;
      const expected = (count / total) * 100;
      // The stored share is rounded to one decimal place; anything further off means
      // the figure and the claim it makes have drifted apart.
      expect(segment.share, `${id} matches its cited count`).not.toBeNull();
      expect(Math.abs((segment.share as number) - expected)).toBeLessThanOrEqual(0.05);
    });
  });

  it("marks exactly the segments with no published figure as modelled", () => {
    const modelled = STAKEHOLDER_SEGMENTS.filter((s) => s.share === null).map((s) => s.id);
    expect([...modelled].sort()).toEqual([...MODELLED_IDS].sort());
    // And the published set is the remainder, so a new segment cannot slip in unlabelled.
    const published = STAKEHOLDER_SEGMENTS.filter((s) => s.share !== null).map((s) => s.id);
    expect([...published].sort()).toEqual(Object.keys(PUBLISHED).sort());
  });

  it("hands the split each segment's own weight, with a neutral weight for modelled ones", () => {
    STAKEHOLDER_SEGMENTS.forEach((segment) => {
      const expected = segment.share ?? MODELLED_SEGMENT_WEIGHT;
      expect(segmentWeight(segment.id)).toBe(expected);
    });
    expect(MODELLED_SEGMENT_WEIGHT).toBeGreaterThan(0);
  });

  it("draws more agents for a group that stands for more of the country", () => {
    // agri models, among others, rural households (61.4% of the population) and two
    // modelled groups (a neutral weight of 1 each). The published share must win.
    const rural = marksFor("agri", "rural-households");
    const smallholder = marksFor("agri", "smallholder-farmers");
    const exporters = marksFor("agri", "exporters");
    const partners = marksFor("agri", "development-partners");

    expect(rural).toBeGreaterThan(exporters);
    expect(smallholder).toBeGreaterThan(partners);
    // No modelled group may be dropped, however small its weight.
    expect(exporters).toBeGreaterThanOrEqual(1);
    expect(partners).toBeGreaterThanOrEqual(1);
    // And the split follows the declared order of the shares themselves.
    expect(rural).toBeGreaterThan(smallholder);
    expect(smallholder).toBeGreaterThan(marksFor("agri", "informal-traders"));
  });
});
