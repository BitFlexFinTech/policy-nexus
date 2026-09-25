import { describe, it, expect } from "vitest";
import {
  ALL_POLICY_TEMPLATES,
  DEPARTMENTS,
  DEPARTMENT_COUNT,
  DEPARTMENT_IDS,
  findDepartment,
  getDepartment,
  isDepartmentId,
} from "@/config/departments";
import { STAKEHOLDER_SEGMENTS, TIME_HORIZONS, REFERENCE_DATE } from "@/config/reference";

/**
 * Department config regression guard. These are real, failable checks: the
 * homepage, the dashboard, the preset chips and the reports all depend on this
 * data being complete and internally consistent. A missing department or a
 * duplicated template id breaks the platform, so the test must fail loudly.
 */
describe("department config (src/config/departments.ts)", () => {
  it("defines exactly 16 departments", () => {
    expect(DEPARTMENT_COUNT).toBe(16);
    expect(DEPARTMENTS).toHaveLength(16);
  });

  it("keeps DEPARTMENTS in the canonical DEPARTMENT_IDS order", () => {
    expect(DEPARTMENTS.map((d) => d.id)).toEqual([...DEPARTMENT_IDS]);
  });

  it("uses only the canonical ids from DEPARTMENT_IDS", () => {
    for (const d of DEPARTMENTS) expect([...DEPARTMENT_IDS]).toContain(d.id);
  });

  it("has unique department ids", () => {
    expect(new Set(DEPARTMENTS.map((d) => d.id)).size).toBe(DEPARTMENTS.length);
  });

  it("gives every department a mandate, description and identity", () => {
    for (const d of DEPARTMENTS) {
      expect(d.name.length, `${d.id} name`).toBeGreaterThan(10);
      expect(d.shortName.length, `${d.id} shortName`).toBeGreaterThan(3);
      expect(d.abbr.length, `${d.id} abbr`).toBeGreaterThan(1);
      expect(d.mandate.length, `${d.id} mandate`).toBeGreaterThan(40);
      expect(d.description.length, `${d.id} description`).toBeGreaterThan(80);
    }
  });

  it("gives every department 4 priorities with unique ids", () => {
    for (const d of DEPARTMENTS) {
      expect(d.priorities, `${d.id} priorities`).toHaveLength(4);
      expect(new Set(d.priorities.map((p) => p.id)).size, `${d.id} duplicate priority id`).toBe(4);
    }
  });

  it("gives every department at least 3 indicators with unique ids and bounded scores", () => {
    for (const d of DEPARTMENTS) {
      expect(d.indicators.length, `${d.id} indicators`).toBeGreaterThanOrEqual(3);
      expect(new Set(d.indicators.map((i) => i.id)).size, `${d.id} duplicate indicator id`).toBe(d.indicators.length);
      for (const i of d.indicators) {
        expect(i.score, `${d.id}/${i.id} score`).toBeGreaterThanOrEqual(0);
        expect(i.score, `${d.id}/${i.id} score`).toBeLessThanOrEqual(100);
        expect(i.note.length, `${d.id}/${i.id} note`).toBeGreaterThan(10);
        expect(i.source.length, `${d.id}/${i.id} source`).toBeGreaterThan(3);
      }
    }
  });

  it("gives every department 3 policy templates with unique ids", () => {
    for (const d of DEPARTMENTS) {
      expect(d.policyTemplates, `${d.id} templates`).toHaveLength(3);
      expect(new Set(d.policyTemplates.map((t) => t.id)).size, `${d.id} duplicate template id`).toBe(3);
      for (const t of d.policyTemplates) {
        expect(t.policyText.length, `${t.id} policyText`).toBeGreaterThan(200);
        expect(t.summary.length, `${t.id} summary`).toBeGreaterThan(20);
        expect(t.segments.length, `${t.id} segments`).toBeGreaterThan(0);
      }
    }
  });

  it("has globally unique policy template ids", () => {
    const ids = ALL_POLICY_TEMPLATES.map((t) => t.template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only canonical stakeholder segments", () => {
    const allowed = new Set(STAKEHOLDER_SEGMENTS.map((s) => s.id));
    for (const d of DEPARTMENTS) {
      for (const segment of d.segments) expect(allowed, `${d.id} segment ${segment}`).toContain(segment);
      for (const t of d.policyTemplates) {
        for (const segment of t.segments) expect(allowed, `${t.id} segment ${segment}`).toContain(segment);
      }
    }
  });

  it("references only canonical time horizons", () => {
    const allowed = new Set(TIME_HORIZONS.map((h) => h.id));
    for (const t of ALL_POLICY_TEMPLATES) expect(allowed, `${t.template.id} horizon`).toContain(t.template.timeHorizon);
  });

  it("gives every department a document rail with unique document ids", () => {
    for (const d of DEPARTMENTS) {
      expect(d.documents.length, `${d.id} documents`).toBeGreaterThanOrEqual(3);
      expect(new Set(d.documents.map((doc) => doc.id)).size, `${d.id} duplicate document id`).toBe(d.documents.length);
    }
  });

  it("keeps every document date on or before REFERENCE_DATE (determinism)", () => {
    for (const d of DEPARTMENTS) {
      for (const doc of d.documents) {
        expect(doc.date <= REFERENCE_DATE, `${doc.id} ${doc.date} is after REFERENCE_DATE`).toBe(true);
      }
    }
  });

  it("resolves departments through the look-up helpers", () => {
    for (const id of DEPARTMENT_IDS) expect(getDepartment(id).id).toBe(id);
    expect(findDepartment(undefined)).toBeUndefined();
    expect(findDepartment("nope")).toBeUndefined();
    expect(isDepartmentId("fin")).toBe(true);
    expect(isDepartmentId("nope")).toBe(false);
  });
});