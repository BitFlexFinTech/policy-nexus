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
 * The groups each department models, pinned exactly.
 *
 * This list is the one the run, the assessment and the relationship graph all derive
 * their participant groups from, so a change here changes what a simulation models.
 * Pinning it makes any later change deliberate instead of silent drift.
 *
 * RAISED 2026-09-30 — the owner's item 11. The owner reported for the second time that the
 * relationship graph was still sparse and that a department still showed "Stakeholder
 * segments 8". The cause: the *platform-wide* canonical list had grown to 36 groups, but each
 * department still modelled only 6–8 of them, and the run, the graph and the dashboard all
 * read the department's own list — so nothing the owner looked at had changed. Every
 * department now models **16** groups, chosen from the 36 national groups for what that
 * department's policies genuinely affect, keeping the departments distinct (Finance and
 * Agriculture do not model the same population). The count is raised, not removed: the gate
 * below still holds it to a range, and this pin still makes any change deliberate.
 */
const DEPARTMENT_SEGMENTS: Record<string, string[]> = {
  opc: ["civil-servants", "local-authorities", "development-partners", "formal-business", "youth", "traditional-leaders", "faith-groups", "media", "urban-households", "rural-households", "women", "trade-unions", "employer-federations", "persons-with-disabilities", "researchers", "informal-workers", "parliament-legislators", "judiciary-courts", "professional-councils", "religious-leaders", "district-councils", "smes", "refugees-migrants", "informal-settlement-residents", "journalists", "community-radio", "advertising-agencies", "pr-firms", "parents-associations", "school-heads", "pension-funds", "asset-managers", "software-developers", "isps", "data-centres", "cybersecurity-firms", "warehousing", "courier-firms", "building-societies", "saccos"],
  fin: ["exporters", "formal-business", "financial-sector", "civil-servants", "informal-traders", "diaspora", "manufacturers", "pensioners", "urban-households", "rural-households", "informal-workers", "smallholder-farmers", "mining-operators", "trade-unions", "employer-federations", "women-led-enterprises", "smes", "fintech-mobile-money", "microfinance-institutions", "insurance-sector", "professional-councils", "parliament-legislators", "construction-sector", "village-savings-groups", "pension-funds", "insurance-brokers", "stockbrokers", "asset-managers", "bureaux-de-change", "mobile-money-agents", "building-societies", "saccos", "micro-insurers", "customs-brokers", "cement-producers", "food-beverage", "chemicals-industry", "engineering-firms", "printing-publishing", "warehousing"],
  agri: ["smallholder-farmers", "rural-households", "informal-traders", "exporters", "women-led-enterprises", "development-partners", "cooperatives", "informal-workers", "urban-households", "formal-business", "financial-sector", "local-authorities", "traditional-leaders", "transport-operators", "energy-water-utilities", "cross-border-traders", "farmer-unions", "horticulture-growers", "livestock-producers", "water-user-associations", "timber-forestry-operators", "district-councils", "fishing-communities", "smes", "grain-millers", "cotton-ginners", "sugar-producers", "dairy-producers", "poultry-producers", "aquaculture-operators", "beekeepers", "seed-suppliers", "agro-processors", "tobacco-merchants", "rural-teachers", "haulage-operators", "warehousing", "kombi-operators", "drivers-associations", "community-radio"],
  health: ["health-workers", "urban-households", "rural-households", "civil-servants", "development-partners", "women-led-enterprises", "persons-with-disabilities", "women", "youth", "educators", "faith-groups", "local-authorities", "pensioners", "informal-workers", "traditional-leaders", "media", "nurses-associations", "medical-aid-societies", "pharmaceutical-sector", "traditional-healers", "professional-councils", "refugees-migrants", "informal-settlement-residents", "religious-leaders", "private-clinics", "pharmacists", "laboratory-techs", "radiographers", "ambulance-services", "community-caregivers", "ecd-caregivers", "school-heads", "parents-associations", "food-beverage", "chemicals-industry", "insurance-brokers", "asset-managers", "pension-funds", "journalists", "community-radio"],
  edu: ["educators", "rural-households", "urban-households", "youth", "development-partners", "women-led-enterprises", "faith-groups", "persons-with-disabilities", "civil-servants", "local-authorities", "traditional-leaders", "health-workers", "informal-workers", "media", "researchers", "trade-unions", "teachers-unions", "private-schools", "tertiary-students", "youth-councils", "religious-leaders", "professional-councils", "informal-settlement-residents", "refugees-migrants", "rural-teachers", "urban-teachers", "school-heads", "parents-associations", "ecd-caregivers", "tvet-instructors", "polytechnic-lecturers", "apprentices", "musicians", "creative-industries", "film-makers", "journalists", "community-radio", "software-developers", "ecommerce-platforms", "digital-marketers"],
  hedu: ["youth", "educators", "formal-business", "diaspora", "development-partners", "researchers", "employer-federations", "urban-households", "rural-households", "civil-servants", "financial-sector", "manufacturers", "ict-operators", "women-led-enterprises", "media", "trade-unions", "tertiary-students", "professional-councils", "fintech-mobile-money", "smes", "construction-sector", "teachers-unions", "youth-councils", "private-schools", "polytechnic-lecturers", "tvet-instructors", "apprentices", "software-developers", "engineering-firms", "laboratory-techs", "film-makers", "creative-industries", "musicians", "ecommerce-platforms", "isps", "data-centres", "cybersecurity-firms", "journalists", "community-radio", "rural-teachers"],
  ict: ["urban-households", "rural-households", "financial-sector", "formal-business", "youth", "informal-traders", "ict-operators", "researchers", "civil-servants", "local-authorities", "media", "educators", "persons-with-disabilities", "women-led-enterprises", "energy-water-utilities", "development-partners", "fintech-mobile-money", "microfinance-institutions", "smes", "professional-councils", "tertiary-students", "youth-councils", "urban-ratepayers", "district-councils", "software-developers", "isps", "tower-companies", "data-centres", "cybersecurity-firms", "ecommerce-platforms", "digital-marketers", "journalists", "community-radio", "advertising-agencies", "pr-firms", "bloggers", "courier-firms", "musicians", "film-makers", "creative-industries"],
  mines: ["mining-operators", "rural-households", "exporters", "local-authorities", "formal-business", "artisanal-miners", "conservation-communities", "urban-households", "civil-servants", "financial-sector", "manufacturers", "transport-operators", "energy-water-utilities", "trade-unions", "women-led-enterprises", "development-partners", "mining-host-communities", "smes", "construction-sector", "professional-councils", "freight-logistics", "water-user-associations", "timber-forestry-operators", "district-councils", "coal-producers", "mine-suppliers", "smelters", "mineral-dealers", "diamond-sector", "fuel-retailers", "haulage-operators", "warehousing", "customs-brokers", "engineering-firms", "chemicals-industry", "cement-producers", "rail-users", "drivers-associations", "journalists", "community-radio"],
  energy: ["formal-business", "urban-households", "rural-households", "mining-operators", "informal-traders", "energy-water-utilities", "transport-operators", "civil-servants", "manufacturers", "smallholder-farmers", "local-authorities", "development-partners", "financial-sector", "women-led-enterprises", "informal-workers", "trade-unions", "construction-sector", "smes", "professional-councils", "mining-host-communities", "informal-settlement-residents", "urban-ratepayers", "district-councils", "freight-logistics", "coal-producers", "fuel-retailers", "lpg-distributors", "solar-installers", "mine-suppliers", "smelters", "engineering-firms", "cement-producers", "chemicals-industry", "warehousing", "haulage-operators", "isps", "drivers-associations", "journalists", "community-radio", "courier-firms"],
  psc: ["civil-servants", "youth", "women-led-enterprises", "local-authorities", "development-partners", "pensioners", "trade-unions", "urban-households", "rural-households", "health-workers", "educators", "persons-with-disabilities", "women", "informal-workers", "employer-federations", "researchers", "professional-councils", "teachers-unions", "nurses-associations", "parliament-legislators", "judiciary-courts", "smes", "village-savings-groups", "youth-councils", "rural-teachers", "urban-teachers", "school-heads", "parents-associations", "ecd-caregivers", "private-clinics", "pharmacists", "laboratory-techs", "radiographers", "ambulance-services", "community-caregivers", "journalists", "community-radio", "software-developers", "data-centres", "cybersecurity-firms"],
  lg: ["local-authorities", "urban-households", "rural-households", "informal-traders", "women-led-enterprises", "traditional-leaders", "energy-water-utilities", "transport-operators", "civil-servants", "smallholder-farmers", "cooperatives", "faith-groups", "youth", "informal-workers", "development-partners", "persons-with-disabilities", "urban-ratepayers", "district-councils", "informal-settlement-residents", "water-user-associations", "smes", "commuter-transport-associations", "construction-sector", "religious-leaders", "kombi-operators", "taxi-associations", "courier-firms", "warehousing", "restaurant-operators", "hoteliers", "tour-operators", "travel-agents", "creative-industries", "musicians", "community-radio", "journalists", "ecd-caregivers", "school-heads", "parents-associations", "rail-users"],
  mfa: ["exporters", "diaspora", "development-partners", "formal-business", "financial-sector", "tourism-operators", "cross-border-traders", "media", "manufacturers", "mining-operators", "employer-federations", "trade-unions", "civil-servants", "urban-households", "informal-traders", "researchers", "parliament-legislators", "refugees-migrants", "cross-border-labour-migrants", "aviation-operators", "freight-logistics", "professional-councils", "hospitality-hoteliers", "smes", "customs-brokers", "shipping-agents", "warehousing", "courier-firms", "tour-operators", "travel-agents", "hoteliers", "restaurant-operators", "haulage-operators", "kombi-operators", "bureaux-de-change", "insurance-brokers", "journalists", "community-radio", "ecommerce-platforms", "digital-marketers"],
  env: ["rural-households", "smallholder-farmers", "mining-operators", "development-partners", "local-authorities", "conservation-communities", "tourism-operators", "energy-water-utilities", "urban-households", "artisanal-miners", "cooperatives", "traditional-leaders", "informal-workers", "women-led-enterprises", "manufacturers", "media", "wildlife-conservancies", "safari-operators", "fishing-communities", "mining-host-communities", "water-user-associations", "timber-forestry-operators", "district-councils", "horticulture-growers", "coal-producers", "fuel-retailers", "lpg-distributors", "solar-installers", "mine-suppliers", "smelters", "mineral-dealers", "diamond-sector", "aquaculture-operators", "beekeepers", "agro-processors", "journalists", "community-radio", "ecd-caregivers", "school-heads", "parents-associations"],
  def: ["civil-servants", "rural-households", "development-partners", "local-authorities", "war-veterans", "pensioners", "persons-with-disabilities", "urban-households", "traditional-leaders", "faith-groups", "youth", "health-workers", "women", "media", "trade-unions", "transport-operators", "refugees-migrants", "cross-border-labour-migrants", "parliament-legislators", "judiciary-courts", "aviation-operators", "professional-councils", "religious-leaders", "smes", "warehousing", "haulage-operators", "shipping-agents", "courier-firms", "engineering-firms", "chemicals-industry", "fuel-retailers", "ambulance-services", "community-caregivers", "journalists", "community-radio", "software-developers", "cybersecurity-firms", "data-centres", "drivers-associations", "isps"],
  zimra: ["formal-business", "informal-traders", "exporters", "financial-sector", "mining-operators", "informal-workers", "cross-border-traders", "manufacturers", "urban-households", "rural-households", "smallholder-farmers", "transport-operators", "employer-federations", "trade-unions", "cooperatives", "artisanal-miners", "smes", "fintech-mobile-money", "freight-logistics", "professional-councils", "cross-border-labour-migrants", "construction-sector", "insurance-sector", "microfinance-institutions", "customs-brokers", "shipping-agents", "warehousing", "haulage-operators", "kombi-operators", "taxi-associations", "food-beverage", "cement-producers", "engineering-firms", "printing-publishing", "software-developers", "ecommerce-platforms", "mobile-money-agents", "bureaux-de-change", "courier-firms", "drivers-associations"],
  zida: ["formal-business", "exporters", "diaspora", "development-partners", "financial-sector", "manufacturers", "employer-federations", "tourism-operators", "mining-operators", "women-led-enterprises", "youth", "researchers", "ict-operators", "informal-traders", "transport-operators", "cooperatives", "smes", "construction-sector", "hospitality-hoteliers", "mining-host-communities", "professional-councils", "fintech-mobile-money", "aviation-operators", "insurance-sector", "cement-producers", "food-beverage", "textile-clothing", "leather-footwear", "chemicals-industry", "furniture-makers", "printing-publishing", "engineering-firms", "coal-producers", "smelters", "solar-installers", "data-centres", "software-developers", "tour-operators", "agro-processors", "quantity-surveyors"],
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

  it("gives every department between 36 and 44 stakeholder groups, with no repeats", () => {
    // Raised from 6–8 on 2026-09-30 (item 11), then 15–18, then 22–26 on 2026-10-02 for the
    // national policy-drafting set, then 36–44 on 2026-10-04 (batch 4) when the canonical list
    // grew to 150 groups. The relationship graph is drawn from these groups, so a larger set
    // makes it materially fuller. The gate is kept (not deleted), so the count cannot silently
    // fall back, and the range still lets the departments differ from one another.
    for (const d of DEPARTMENTS) {
      expect(d.segments.length, `${d.id} models ${d.segments.length} groups`).toBeGreaterThanOrEqual(36);
      expect(d.segments.length, `${d.id} models ${d.segments.length} groups`).toBeLessThanOrEqual(44);
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