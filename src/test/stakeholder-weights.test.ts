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

/** The four real bases a share may be a percentage of, each named where it is used. */
type ShareBase = "employed" | "population" | "population5plus" | "qlfs-employed";

/** The published counts each share is derived from, transcribed from the source. */
const PUBLISHED: Record<string, { count: number; base: ShareBase }> = {
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
  // Phase AC (E-1) additions — a real, published figure for each.
  "persons-with-disabilities": { count: 206_447, base: "population5plus" },
  "faith-groups": { count: 12_937_804, base: "population" },
  "tourism-operators": { count: 40_921, base: "employed" },
  manufacturers: { count: 257_740, base: "employed" },
  "transport-operators": { count: 87_730, base: "employed" },
  researchers: { count: 51_478, base: "employed" },
  pensioners: { count: 209_360, base: "population" },
  "informal-workers": { count: 2_069_901, base: "qlfs-employed" },
  women: { count: 7_891_035, base: "population" },
};

/** The totals the shares are percentages of, each from its own named source. */
const BASE_TOTALS: Record<ShareBase, number> = {
  // ZIMSTAT 2022 census, Table 6.6 — employed persons by industry.
  employed: 2_501_887,
  // ZIMSTAT 2022 census, Table 2.7 — total population.
  population: 15_178_957,
  // ZIMSTAT 2022 PHC Disability Thematic Report — people aged 5 and over.
  population5plus: 13_102_643,
  // ZIMSTAT QLFS Q2 2025 — employed persons on the survey's own definition.
  "qlfs-employed": 3_186_598,
};

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
  // Phase AC (E-1) additions — no published share exists for any of these.
  "traditional-leaders",
  "energy-water-utilities",
  "ict-operators",
  "conservation-communities",
  "media",
  "cooperatives",
  "trade-unions",
  "employer-federations",
  "artisanal-miners",
  "cross-border-traders",
  "war-veterans",
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

  it("makes every published share equal the count it cites", () => {
    Object.entries(PUBLISHED).forEach(([id, { count, base }]) => {
      const segment = getStakeholderSegment(id as (typeof STAKEHOLDER_SEGMENTS)[number]["id"]);
      const total = BASE_TOTALS[base];
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

  it("keeps a real count in a modelled group's note instead of dressing it up as a share", () => {
    // Traditional leaders have real published counts (about 272 chiefs and more than
    // 24,000 village heads) but no published population share, so the count stays in the
    // note and the weight stays Modelled — never a handful mis-scaled against everyone.
    const leaders = getStakeholderSegment("traditional-leaders");
    expect(leaders.share).toBeNull();
    expect(leaders.shareSource).toBe(MODELLED_SHARE_LABEL);
    expect(leaders.note).toMatch(/\b272\b/);
    expect(leaders.note).toMatch(/24,000/);
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
