import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import {
  DEPARTMENTS,
  countIndicatorsByBasis,
  findDepartment,
  indicatorBasisLabel,
} from "@/config/departments";
import {
  formatReferenceDate,
  MODELLED_INDICATOR_LABEL,
  MODELLED_SHARE_LABEL,
  NAMED_SOURCES,
  NAMED_SOURCE_STATEMENT,
  REFERENCE_DATE_LABEL,
} from "@/config/reference";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import type { AssessmentRequest } from "@/services/assessment/types";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The month names in order, and the reference month's position, read out of
 * `formatReferenceDate` itself — never a second hand-written month list.
 */
const [, REFERENCE_MONTH, REFERENCE_YEAR] = REFERENCE_DATE_LABEL.split(" ");
const MONTHS_IN_ORDER = Array.from({ length: 12 }, (_, index) =>
  formatReferenceDate(`${REFERENCE_YEAR}-${String(index + 1).padStart(2, "0")}-01`).split(" ")[1],
);
const REFERENCE_MONTH_INDEX = MONTHS_IN_ORDER.indexOf(REFERENCE_MONTH);

const EVERY = DEPARTMENTS.flatMap((department) =>
  department.indicators.map((indicator) => ({ department, indicator })),
);

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
/**
 * Where a department indicator's number comes from.
 *
 * The defect these gates exist for: all 63 indicators were authored demonstration
 * figures, each carrying a free-text `source` such as "Trade statistics", while the
 * engine vitals called the whole set "Published department measures". An authored
 * number therefore read as an official published figure — the one thing the
 * platform's own sourcing rule forbids.
 *
 * The fix is the union: an indicator either names the body that publishes it, the
 * publication and the period, or it says plainly that it is modelled. There is no
 * third state, and these gates fail if one is reintroduced.
 */
describe("department indicators — published with a named source, or plainly modelled", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("gives every one of the 63 indicators a basis, and no free text that reads as a source", () => {
    expect(EVERY).toHaveLength(63);
    EVERY.forEach(({ department, indicator }) => {
      const where = `${department.id}/${indicator.id}`;
      expect(["published", "modelled"], `${where} basis`).toContain(indicator.basis.kind);
      // The retired shape. Its return must fail the build.
      expect(indicator, `${where} carries no free-text source`).not.toHaveProperty("source");
    });
  });

  it("counts every indicator exactly once, published plus modelled", () => {
    for (const department of DEPARTMENTS) {
      const split = countIndicatorsByBasis(department.indicators);
      expect(split.published + split.modelled, `${department.id} counted once`).toBe(
        department.indicators.length,
      );
    }
  });

  it("names the publisher, the publication and the period for every published figure", () => {
    const named = new Set(NAMED_SOURCES.map((source) => source.id));
    EVERY.forEach(({ department, indicator }) => {
      if (indicator.basis.kind !== "published") return;
      const where = `${department.id}/${indicator.id}`;
      expect(
        named.has(indicator.basis.sourceId),
        `${where} → ${indicator.basis.sourceId} is a named source`,
      ).toBe(true);
      expect(indicator.basis.publication.length, `${where} publication`).toBeGreaterThan(3);
      // A published figure states its period. Some publications are monthly and some
      // are annual or one-off (a census year, a survey year), so the period is either
      // "<Month> <Year>" or "<Year>" — but it must always be stated, and never in the
      // future relative to the workspace's own reference date.
      const parts = indicator.basis.asOf.split(" ");
      expect(parts.length, `${where} period is "<Month> <Year>" or "<Year>"`).toBeLessThanOrEqual(2);
      const year = parts[parts.length - 1];
      expect(year, `${where} states a four-digit year: ${indicator.basis.asOf}`).toMatch(/^\d{4}$/);
      expect(Number(year), `${where} is not dated after the reference year`).toBeLessThanOrEqual(
        Number(REFERENCE_YEAR),
      );
      if (parts.length !== 2) return;
      const [month] = parts;
      const index = MONTHS_IN_ORDER.indexOf(month);
      expect(index, `${where} names a real month: ${indicator.basis.asOf}`).toBeGreaterThanOrEqual(0);
      if (Number(year) !== Number(REFERENCE_YEAR)) return;
      expect(index, `${where} is not dated after the reference month`).toBeLessThanOrEqual(
        REFERENCE_MONTH_INDEX,
      );
    });
  });

  it("shows a modelled indicator as modelled, and never under a publisher's name", () => {
    const names = NAMED_SOURCES.map((source) => source.name);
    EVERY.forEach(({ department, indicator }) => {
      if (indicator.basis.kind !== "modelled") return;
      const where = `${department.id}/${indicator.id}`;
      const label = indicatorBasisLabel(indicator.basis);
      expect(label, `${where} says it is modelled`).toBe(MODELLED_INDICATOR_LABEL);
      expect(label, `${where} uses the platform's single word`).toContain(MODELLED_SHARE_LABEL);
      names.forEach((name) => expect(label, `${where} names no publisher`).not.toContain(name));
    });
  });

  it("states the indicator rule in the platform's own sourcing statement", () => {
    expect(NAMED_SOURCE_STATEMENT).toContain(MODELLED_INDICATOR_LABEL);
  });

  it("renders the derived provenance on the drill-down and the derived split in the engine vitals", () => {
    signInToDepartment("fin");
    renderAt("/app");
    const department = findDepartment("fin")!;
    const first = department.indicators[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(escapeRegex(first.label)) }));
    expect(screen.getByText(`Source: ${indicatorBasisLabel(first.basis)}`)).toBeInTheDocument();
    const split = countIndicatorsByBasis(department.indicators);
    expect(
      screen.getByText(`${split.published} published · ${split.modelled} modelled`),
    ).toBeInTheDocument();
  });

  it("never describes the indicator set as published measures on the workspace", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.queryByText(/published department measures/i)).toBeNull();
  });

  it("keeps the retired free-text field and the false phrase out of the source", () => {
    for (const file of [
      "src/components/EngineStatus.tsx",
      "src/components/KPICards.tsx",
      "src/config/departments.ts",
      "src/services/assessment/documents.ts",
    ]) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(text, `${file} does not call the set published measures`).not.toMatch(
        /published department measures/i,
      );
    }
    const departments = readFileSync(resolve(process.cwd(), "src/config/departments.ts"), "utf8");
    expect(departments, "the indicator type carries no free-text source field").not.toMatch(
      /^\s+source: string;$/m,
    );
  });

  it("never calls its own authored indicators published anywhere in the platform's own text", () => {
    const files = readdirSync(resolve(process.cwd(), "src"), { recursive: true, encoding: "utf8" })
      .filter((entry) => /\.(ts|tsx)$/.test(entry) && !entry.includes("test"));
    const offenders: string[] = [];
    for (const entry of files) {
      const text = readFileSync(resolve(process.cwd(), "src", entry), "utf8");
      for (const match of text.matchAll(
        /[^\n]*(published department measures|published (reference )?indicators)[^\n]*/gi,
      )) {
        offenders.push(`${entry}: ${match[0].trim().slice(0, 120)}`);
      }
    }
    expect(offenders, "the platform never calls its authored indicators published").toEqual([]);
  });

  it("writes a modelled baseline into the drafted policy as modelled, not as a published figure", async () => {
    const department = findDepartment("fin")!;
    const run = await assessmentService.buildRun(requestFor("fin"));
    const text = renderDocumentText(buildPolicyDraft(run, department));
    expect(text).not.toContain("published reference indicators");
    department.indicators
      .filter((indicator) => indicator.basis.kind === "modelled")
      .forEach((indicator) => {
        const unit = indicator.unit ? ` ${indicator.unit}` : "";
        expect(text, `${indicator.id} baseline is written as modelled`).toContain(
          `${indicator.label} — baseline ${indicator.value}${unit} (${MODELLED_INDICATOR_LABEL})`,
        );
      });
  });

  /**
   * Phase AD R3 — the figures researched and written in, recorded here so a later edit
   * cannot silently change a published number or quietly turn one back into a modelled
   * one. Every row is what the publication itself reported, read from the World Bank's
   * own API during the session. The check fails if a value, a publication or a period
   * drifts, and it fails if the platform's published set grows without being recorded.
   */
  it("holds every published figure, with the value and period it was read from", () => {
    const RECORDED: ReadonlyArray<[string, string, string, string]> = [
      ["fin/fin-deficit", "3.6", "World Development Indicators: Net lending (+) / net borrowing (-) (% of GDP)", "2018"],
      ["fin/fin-revenue", "7.2", "World Development Indicators: Tax revenue (% of GDP)", "2018"],
      ["fin/fin-investment", "USD 465M", "World Development Indicators: Foreign direct investment, net inflows (BoP, current US$)", "2024"],
      ["agri/agri-grain", "121.7", "World Development Indicators: Food production index (2014-2016 = 100)", "2022"],
      ["agri/agri-herd", "119.6", "World Development Indicators: Livestock production index (2014-2016 = 100)", "2022"],
      ["agri/agri-input", "26.2", "World Development Indicators: Fertilizer consumption (kilograms per hectare of arable land)", "2023"],
      ["health/health-immune", "90", "World Development Indicators: Immunisation, measles (% of children aged 12–23 months)", "2024"],
      ["edu/edu-enrolment", "94.1", "World Development Indicators: School enrolment, primary (% net)", "2013"],
      ["edu/edu-ratio", "36.4:1", "World Development Indicators: Pupil-teacher ratio, primary", "2013"],
      ["hedu/hedu-enrolment", "7.7", "World Development Indicators: School enrolment, tertiary (% gross)", "2024"],
      ["ict/ict-coverage", "94.2", "World Development Indicators: Mobile cellular subscriptions (per 100 people)", "2024"],
      ["ict/ict-broadband", "1.9", "World Development Indicators: Fixed broadband subscriptions (per 100 people)", "2024"],
      ["mines/mines-share", "33.8", "World Development Indicators: Ores and metals exports (% of merchandise exports)", "2024"],
      ["energy/energy-access", "62", "World Development Indicators: Access to electricity (% of population)", "2024"],
      ["energy/energy-losses", "23.0", "World Development Indicators: Electric power transmission and distribution losses (% of output)", "2023"],
      ["lg/lg-water", "67.2", "World Development Indicators: People using at least basic drinking water services (% of population)", "2024"],
      ["lg/lg-sanitation", "34.6", "World Development Indicators: People using at least basic sanitation services (% of population)", "2024"],
      ["mfa/mfa-remittance", "USD 3.51B", "World Development Indicators: Personal remittances received (current US$)", "2024"],
      ["env/env-parks", "28.3", "World Development Indicators: Terrestrial protected areas (% of total land area)", "2025"],
      ["env/env-forest", "44.7", "World Development Indicators: Forest area (% of land area)", "2023"],
      ["zimra/zimra-target", "7.2", "World Development Indicators: Tax revenue (% of GDP)", "2018"],
      // Phase AD R4 (2026-09-29) — the first three of the remaining departments' figures.
      ["health/health-staffing", "3.1", "World Development Indicators: Nurses and midwives (per 1,000 people)", "2022"],
      ["edu/edu-transition", "86.0", "World Development Indicators: Primary completion rate, total (% of relevant age group)", "2024"],
      ["hedu/hedu-research", "519.9", "World Development Indicators: Scientific and technical journal articles", "2023"],
    ];

    RECORDED.forEach(([where, value, publication, asOf]) => {
      const [departmentId, indicatorId] = where.split("/");
      const indicator = findDepartment(departmentId)!.indicators.find((entry) => entry.id === indicatorId)!;
      expect(indicator, `${where} exists`).toBeTruthy();
      expect(indicator.value, `${where} value`).toBe(value);
      expect(indicator.basis.kind, `${where} is published`).toBe("published");
      if (indicator.basis.kind !== "published") return;
      expect(indicator.basis.sourceId, `${where} source`).toBe("worldbank");
      expect(indicator.basis.publication, `${where} publication`).toBe(publication);
      expect(indicator.basis.asOf, `${where} period`).toBe(asOf);
    });

    // The recorded list is the whole published set: an unrecorded conversion fails here.
    const published = EVERY.filter(({ indicator }) => indicator.basis.kind === "published");
    expect(published, "the published set is fully recorded").toHaveLength(RECORDED.length);
  });

  /**
   * Phase AD R6 — the drill-down already prints the publisher, the publication and the
   * period on the source line, so a note that repeated them printed the same fact twice
   * in two different wordings, which can drift apart. The note now carries meaning only,
   * and this gate fails if a note starts naming a publisher or its provenance again.
   */
  it("keeps a figure's provenance in its source line, not repeated in the note", () => {
    const publisherMarkers = NAMED_SOURCES.map((source) =>
      source.name
        .replace(/\s*\(.*\)/, "")
        .split(" ")
        .slice(0, 2)
        .join(" ")
        .toLowerCase(),
    );
    EVERY.forEach(({ department, indicator }) => {
      const where = `${department.id}/${indicator.id}`;
      const note = indicator.note.toLowerCase();
      publisherMarkers.forEach((marker) => {
        expect(note, `${where} does not name ${marker} in the note`).not.toContain(marker);
      });
      expect(note, `${where} states no provenance in the note`).not.toMatch(
        /as reported to|reported to the|published by|according to|source:/,
      );
    });
  });
});
