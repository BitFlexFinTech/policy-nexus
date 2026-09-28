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
      const parts = indicator.basis.asOf.split(" ");
      expect(parts, `${where} period is "<Month> <Year>"`).toHaveLength(2);
      const [month, year] = parts;
      expect(year, `${where} is dated in the reference year`).toBe(REFERENCE_YEAR);
      const index = MONTHS_IN_ORDER.indexOf(month);
      expect(index, `${where} names a real month: ${indicator.basis.asOf}`).toBeGreaterThanOrEqual(0);
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
});
