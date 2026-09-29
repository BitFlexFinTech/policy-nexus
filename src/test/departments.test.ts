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
import { STAKEHOLDER_SEGMENTS, TIME_HORIZONS, REFERENCE_DATE, getNamedSource } from "@/config/reference";
import {
  CITED_INSTRUMENTS,
  UNIVERSAL_INSTRUMENTS,
  citedInstrumentLabel,
  isCitedInstrumentId,
} from "@/config/instruments";

/**
 * The groups each department models, pinned exactly (Phase AC, batch E-2).
 *
 * This list is the one the run, the assessment and the relationship graph all derive
 * their participant groups from, so a change here changes what a simulation models.
 * Pinning it makes any later change deliberate instead of silent drift.
 */
const DEPARTMENT_SEGMENTS: Record<string, string[]> = {
  opc: ["civil-servants", "local-authorities", "development-partners", "formal-business", "youth", "traditional-leaders", "faith-groups", "media"],
  fin: ["exporters", "formal-business", "financial-sector", "civil-servants", "informal-traders", "diaspora", "manufacturers", "pensioners"],
  agri: ["smallholder-farmers", "rural-households", "informal-traders", "exporters", "women-led-enterprises", "development-partners", "cooperatives", "informal-workers"],
  health: ["health-workers", "urban-households", "rural-households", "civil-servants", "development-partners", "women-led-enterprises", "persons-with-disabilities", "women"],
  edu: ["educators", "rural-households", "urban-households", "youth", "development-partners", "women-led-enterprises", "faith-groups", "persons-with-disabilities"],
  hedu: ["youth", "educators", "formal-business", "diaspora", "development-partners", "researchers", "employer-federations"],
  ict: ["urban-households", "rural-households", "financial-sector", "formal-business", "youth", "informal-traders", "ict-operators", "researchers"],
  mines: ["mining-operators", "rural-households", "exporters", "local-authorities", "formal-business", "artisanal-miners", "conservation-communities"],
  energy: ["formal-business", "urban-households", "rural-households", "mining-operators", "informal-traders", "energy-water-utilities", "transport-operators"],
  psc: ["civil-servants", "youth", "women-led-enterprises", "local-authorities", "development-partners", "pensioners", "trade-unions"],
  lg: ["local-authorities", "urban-households", "rural-households", "informal-traders", "women-led-enterprises", "traditional-leaders", "energy-water-utilities", "transport-operators"],
  mfa: ["exporters", "diaspora", "development-partners", "formal-business", "financial-sector", "tourism-operators", "cross-border-traders", "media"],
  env: ["rural-households", "smallholder-farmers", "mining-operators", "development-partners", "local-authorities", "conservation-communities", "tourism-operators", "energy-water-utilities"],
  def: ["civil-servants", "rural-households", "development-partners", "local-authorities", "war-veterans", "pensioners", "persons-with-disabilities"],
  zimra: ["formal-business", "informal-traders", "exporters", "financial-sector", "mining-operators", "informal-workers", "cross-border-traders", "manufacturers"],
  zida: ["formal-business", "exporters", "diaspora", "development-partners", "financial-sector", "manufacturers", "employer-federations", "tourism-operators"],
};

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

  /**
   * GATE — the Ministry of ICT is the custodian of this platform, so it is listed second,
   * immediately after the Office of the President and Cabinet, on every screen that reads the
   * canonical order. The order itself lives in `DEPARTMENT_IDS` and `DEPARTMENTS` is derived
   * from it, so this can only change if that one list is edited.
   */
  it("lists the Ministry of ICT second, after the Office of the President and Cabinet", () => {
    expect([...DEPARTMENT_IDS].slice(0, 2)).toEqual(["opc", "ict"]);
    expect(DEPARTMENTS.slice(0, 2).map((d) => d.id)).toEqual(["opc", "ict"]);
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
        // Where the number comes from. A published figure must name the body that
        // publishes it, the publication and the period; a modelled one carries no
        // source at all, so nothing here can be read as an official figure by default.
        if (i.basis.kind === "published") {
          const source = getNamedSource(i.basis.sourceId);
          expect(source.name, `${d.id}/${i.id} publisher`).toBeTruthy();
          expect(i.basis.publication.length, `${d.id}/${i.id} publication`).toBeGreaterThan(3);
          expect(i.basis.asOf, `${d.id}/${i.id} period`).toBeTruthy();
        }
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

  it("gives every department between 6 and 8 stakeholder groups, with no repeats", () => {
    for (const d of DEPARTMENTS) {
      expect(d.segments.length, `${d.id} models ${d.segments.length} groups`).toBeGreaterThanOrEqual(6);
      expect(d.segments.length, `${d.id} models ${d.segments.length} groups`).toBeLessThanOrEqual(8);
      expect(new Set(d.segments).size, `${d.id} repeats a group`).toBe(d.segments.length);
    }
  });

  it("models every canonical group in at least one department", () => {
    // A group no department models is dead weight: the run, the assessment and the
    // graph would never draw on it, so it would sit on the reference screen only.
    const modelled = new Set<string>(DEPARTMENTS.flatMap((d) => [...d.segments]));
    const orphans = STAKEHOLDER_SEGMENTS.filter((s) => !modelled.has(s.id)).map((s) => s.id);
    expect(orphans, "canonical groups no department models").toEqual([]);
    const allowed = new Set<string>(STAKEHOLDER_SEGMENTS.map((s) => s.id));
    for (const id of modelled) expect(allowed, `${id} is not a canonical group`).toContain(id);
  });

  it("keeps each department's groups exactly as agreed — a deliberate change, not drift", () => {
    for (const d of DEPARTMENTS) {
      expect(d.segments, `${d.id} groups changed`).toEqual(DEPARTMENT_SEGMENTS[d.id]);
    }
    // The pin covers every department, so a new department cannot slip past this gate.
    expect(Object.keys(DEPARTMENT_SEGMENTS).sort()).toEqual([...DEPARTMENT_IDS].sort());
  });

  it("cites only real instruments, each from its own department's register", () => {
    for (const d of DEPARTMENTS) {
      // Every instrument in the register must exist in the table.
      for (const id of d.instruments) {
        expect(isCitedInstrumentId(id), `${d.id} registers unknown instrument ${id}`).toBe(true);
      }
      // Every document must cite one of ITS OWN department's instruments — so a document
      // can neither carry a fabricated citation nor reach outside its mandate.
      expect(d.documents.length, `${d.id} documents`).toBeGreaterThan(0);
      for (const doc of d.documents) {
        expect(doc.instrument, `${doc.id} cites an instrument`).toBeTruthy();
        expect(d.instruments, `${doc.id} cites outside ${d.id}'s register`).toContain(doc.instrument);
      }
    }
  });

  it("carries the universal instruments in every department", () => {
    for (const d of DEPARTMENTS) {
      for (const id of UNIVERSAL_INSTRUMENTS) {
        expect(d.instruments, `${d.id} carries ${id}`).toContain(id);
      }
    }
  });

  it("keeps the instrument table honest: unique ids, a title, a source, no guessed chapter", () => {
    const ids = CITED_INSTRUMENTS.map((i) => i.id);
    expect(new Set(ids).size, "duplicate instrument id").toBe(ids.length);
    CITED_INSTRUMENTS.forEach((i) => {
      expect(i.title.length, `${i.id} title`).toBeGreaterThan(3);
      expect(i.source.length, `${i.id} source`).toBeGreaterThan(3);
      // A chapter is either absent (null) or written the one documented way, "Chapter 12:05".
      // A number in any other shape means someone typed a chapter the index did not confirm.
      if (i.chapter !== null) {
        expect(i.chapter, `${i.id} chapter form`).toMatch(/^Chapter \d+:\d+$/);
      }
    });
  });

  it("uses every instrument in the table in at least one department", () => {
    const used = new Set<string>(DEPARTMENTS.flatMap((d) => [...d.instruments]));
    const unused = CITED_INSTRUMENTS.filter((i) => !used.has(i.id)).map((i) => i.id);
    expect(unused, "instruments no department carries").toEqual([]);
  });

  it("renders a citation as the title, with the chapter only where the index confirms it", () => {
    expect(citedInstrumentLabel("banking-act")).toBe("Banking Act [Chapter 24:20]");
    expect(citedInstrumentLabel("environmental-management-act")).toBe("Environmental Management Act");
    // The label is DERIVED from the table, so it can never disagree with it.
    CITED_INSTRUMENTS.forEach((i) => {
      const label = citedInstrumentLabel(i.id);
      expect(label.startsWith(i.title), `${i.id} label starts with its title`).toBe(true);
      expect(label.includes(i.chapter ?? i.title), `${i.id} label carries its chapter`).toBe(true);
    });
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