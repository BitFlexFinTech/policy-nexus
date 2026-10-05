import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
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
  type NamedSourceId,
} from "@/config/reference";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import type { AssessmentRequest } from "@/services/assessment/types";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

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
 *
 * 2026-10-02: the set grew from 63 to 160 for national policy drafting (ten indicators
 * per department), the new ones all Modelled. The published set is unchanged, so the
 * RECORDED list below still holds the whole published set.
 *
 * 2026-10-04: batch 3 of the national-scale expansion raised the set to 320 (twenty
 * indicators per department), all the new ones Modelled — demo figures, per the owner.
 */
describe("department indicators — published with a named source, or plainly modelled", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("gives every one of the 510 indicators a basis, and no free text that reads as a source", () => {
    expect(EVERY).toHaveLength(510);
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

  it("states the derived split in the engine vitals", () => {
    signInToDepartment("fin");
    renderAt("/app");
    const split = countIndicatorsByBasis(findDepartment("fin")!.indicators);
    expect(
      screen.getByText(`${split.published} published · ${split.modelled} modelled`),
    ).toBeInTheDocument();
  });

  /**
   * The owner's instruction, 2026-10-02: the indicator card strip was removed from the
   * Overview, and every figure moved to the Reference screen with the same derived source
   * line the cards printed. This is the gate for that move — all of them, never a subset.
   */
  it("states the derived provenance of every indicator on the Reference screen", () => {
    signInToDepartment("fin");
    renderAt("/app/reference");
    const department = findDepartment("fin")!;
    department.indicators.forEach((indicator) => {
      expect(
        screen.getAllByText(`Source: ${indicatorBasisLabel(indicator.basis)}`).length,
        `${indicator.id} states its derived source line`,
      ).toBeGreaterThan(0);
    });
  });

  it("never describes the indicator set as published measures on the workspace", () => {
    signInToDepartment("fin");
    renderAt("/app");
    expect(screen.queryByText(/published department measures/i)).toBeNull();
  });

  it("keeps the retired free-text field and the false phrase out of the source", () => {
    for (const file of [
      "src/components/EngineStatus.tsx",
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
        // The baseline now sits in the monitoring matrix rather than in a sentence, so the
        // check follows it there: the row carrying this indicator must carry its baseline
        // AND the modelled label, on the same line. A modelled figure presented as a
        // published one still fails here.
        const row = text
          .split("\n")
          .find((line) => line.includes(indicator.label) && line.includes(`| ${indicator.value}${unit} |`));
        expect(row, `${indicator.id} has a monitoring row with its baseline`).toBeTruthy();
        expect(row, `${indicator.id} baseline is written as modelled`).toContain(
          MODELLED_INDICATOR_LABEL,
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
    /**
     * Who publishes each recorded figure. Every row below is a World Bank series except
     * the ones named here, so a figure cannot be re-attributed to another body by
     * accident — and a new publisher must also be named in `NAMED_SOURCES`, which the
     * test above requires before a row may point at it.
     */
    const SOURCE_OVERRIDES: Readonly<Record<string, NamedSourceId>> = {
      "fin/fin-debt-gdp": "imf",
      "fin/fin-currency": "rbz",
      "fin/fin-npl": "rbz",
      "fin/fin-debt": "treasury",
      "fin/fin-compensation": "treasury",
      "fin/fin-revenue-gdp": "treasury",
      "fin/fin-expenditure": "treasury",
      "fin/fin-capital": "treasury",
      "zimra/zimra-audit": "zimra",
      "zimra/zimra-collection": "zimra",
      "zimra/zimra-register": "zimra",
      "edu/edu-lower-secondary": "unesco",
      "hedu/hedu-stem": "unesco",
      "agri/agri-tobacco": "timb",
      "edu/edu-sanitation": "unesco",
      "edu/edu-connectivity": "unesco",
      "edu/edu-water": "unesco",
      // 2026-10-04 — Batch S5: Zimbabwe's own ZIMSTAT (its quarterly mineral-production and
      // electricity-generation indices) and the Agriculture Ministry's own winter-wheat update.
      "mines/mines-gold": "zimstat",
      "mines/mines-platinum": "zimstat",
      "mines/mines-lithium": "zimstat",
      "energy/energy-gen": "zimstat",
      "energy/energy-ipp": "zimstat",
      "energy/energy-imports": "zimstat",
      "agri/agri-wheat": "agric",
      // 2026-10-04 — Batch S6: ZIMSTAT's own Demographic and Health Survey 2023-24 and the
      // Environmental Management Agency's Annual Report 2024.
      "health/health-deliveries": "zimstat",
      "health/health-anc": "zimstat",
      "lg/lg-sanitation-hh": "zimstat",
      "env/env-eia": "ema",
      "env/env-licences": "ema",
      // 2026-10-04 — Batch S7: ZIMSTAT's Environmental Resources report 2023 and the 2022 Census.
      "agri/agri-cotton": "zimstat",
      "lg/lg-water-piped": "zimstat",
      // 2026-10-05 — PART 11, batch 2: the WHO Global Health Observatory joins the named
      // sources; each figure below it is a WHO GHO series rather than a World Bank one.
      "health/health-hale": "who",
      "health/health-skilled-birth": "who",
      "health/health-ncd-mortality": "who",
      "health/health-suicide": "who",
      "health/health-road-deaths": "who",
      "health/health-diabetes": "who",
      "health/health-obesity": "who",
      "health/health-alcohol": "who",
      "health/health-hwf": "who",
      // 2026-10-05 — PART 11, batch 3: the United Nations Comtrade Database joins the
      // named sources; the two goods-trade figures below are reported to the United
      // Nations by the national customs authority rather than being World Bank series.
      "mfa/mfa-goods-exports": "comtrade",
      "mfa/mfa-goods-imports": "comtrade",
      // 2026-10-05 — PART 11, batch 4: the International Labour Organization joins the named
      // sources; the employment-to-population ratio below is an ILO modelled estimate
      // (the WDI series states it is an ILO estimate) rather than a World Bank series.
      "psc/psc-emp-ratio": "ilo",
      // 2026-10-05 — PART 11, batch 7: three new publishers join the named sources.
      // Transparency International's Corruption Perceptions Index, Reporters Without
      // Borders' World Press Freedom Index and the UNDP Human Development Index are not
      // World Bank series, so each is attributed to the body that publishes it.
      "opc/opc-corruption-perceptions": "transparency-intl",
      "opc/opc-press-freedom": "rsf",
      "opc/opc-hdi": "undp",
    };
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
      // 2026-10-04 — the national-scale dataset expansion (item 1), batch 1. Eleven of the
      // modelled indicators that were added on 2026-10-02 were re-researched against the
      // World Bank's own API and found to have a series that measures the same thing; each
      // value below was read live from api.worldbank.org this session. The two re-framed
      // notes (exports now "goods and services"; renewable now "including hydro") move with
      // the published measure, so the wording stays true.
      ["fin/fin-reserves", "0.5", "World Development Indicators: Total reserves in months of imports", "2024"],
      ["fin/fin-savings", "10.7", "World Development Indicators: Gross savings (% of GDP)", "2024"],
      ["fin/fin-money", "708.9", "World Development Indicators: Broad money growth (annual %)", "2023"],
      ["health/health-life", "63.1", "World Development Indicators: Life expectancy at birth, total (years)", "2024"],
      ["health/health-hiv", "95", "World Development Indicators: Antiretroviral therapy coverage (% of people living with HIV)", "2024"],
      ["edu/edu-repetition", "1.9", "World Development Indicators: Repeaters, primary, total (% of total enrollment)", "2013"],
      ["edu/edu-ecd", "74.3", "World Development Indicators: School enrollment, preprimary (% gross)", "2021"],
      ["ict/ict-internet", "41.6", "World Development Indicators: Individuals using the Internet (% of population)", "2024"],
      ["mfa/mfa-exports", "USD 7.50B", "World Development Indicators: Exports of goods and services (current US$)", "2024"],
      ["env/env-emissions", "0.8", "World Development Indicators: Carbon dioxide (CO2) emissions excluding LULUCF per capita (t CO2e/capita)", "2024"],
      ["env/env-renewable", "88.3", "World Development Indicators: Renewable electricity output (% of total electricity output)", "2021"],
      // 2026-10-04 — batch 2 of the expansion. The rest of the modelled set was swept against the
      // same API; these four genuinely measure what their indicator says, so they convert. The
      // remaining modelled ones are operational returns with no matching series (recorded in PART 9
      // of docs/PLATFORM_ENRICHMENT_PLAN.md) and stay Modelled.
      ["env/env-water", "40.0", "World Development Indicators: Annual freshwater withdrawals, total (% of internal resources)", "2022"],
      ["health/health-malaria", "11.4", "World Development Indicators: Incidence of malaria (per 1,000 population at risk)", "2024"],
      ["health/health-anc", "71.2", "Zimbabwe Demographic and Health Survey 2023-24: four or more antenatal care visits", "2024"],
      ["agri/agri-maize", "743.9", "World Development Indicators: Cereal yield (kg per hectare)", "2023"],
      // 2026-10-04 — Batch B (real evidence base). Twelve more modelled indicators were found to have a
      // real World Bank series that measures the same thing; each value was read live this session. Three
      // were re-framed to the published measure (fin-trade now % of GDP; edu-literacy is the adult rate;
      // energy-coal/hydro are shares of output), so the wording stays true.
      ["fin/fin-interest", "13.5", "World Development Indicators: Interest payments (% of revenue)", "2018"],
      ["fin/fin-inflation", "104.7", "World Development Indicators: Inflation, consumer prices (annual %)", "2022"],
      ["fin/fin-trade", "-5.4", "World Development Indicators: External balance on goods and services (% of GDP)", "2024"],
      ["fin/fin-remit-gdp", "8.5", "World Development Indicators: Personal remittances, received (% of GDP)", "2024"],
      ["health/health-full-immunisation", "91", "World Development Indicators: Immunization, DPT (% of children ages 12-23 months)", "2024"],
      ["health/health-maternal", "358", "World Development Indicators: Maternal mortality ratio (modeled estimate, per 100,000 live births)", "2023"],
      ["health/health-tb", "91", "World Development Indicators: Tuberculosis treatment success rate (% of new cases)", "2023"],
      ["edu/edu-literacy", "93.2", "World Development Indicators: Literacy rate, adult total (% of people ages 15 and above)", "2019"],
      ["mines/mines-rents", "4.2", "World Development Indicators: Mineral rents (% of GDP)", "2021"],
      ["energy/energy-coal", "54.1", "World Development Indicators: Electricity production from coal sources (% of total)", "2023"],
      ["energy/energy-hydro", "45.1", "World Development Indicators: Electricity production from hydroelectric sources (% of total)", "2023"],
      ["energy/energy-rural", "46.6", "World Development Indicators: Access to electricity, rural (% of rural population)", "2024"],
      // 2026-10-04 — Batch B part 2 (the rest of the evidence base). The World Bank sweep was widened to the
      // publishers the sourcing rule names beyond it, and two more modelled indicators were found to measure
      // exactly what a published series measures: `mfa-remit-cost` (the World Bank's own remittance-price
      // series) and `edu-girls` (the female secondary enrolment ratio, re-framed as "gross" because that is
      // what the series counts). One publisher was added for the third — `fin-debt-gdp` — because the IMF's
      // World Economic Outlook, not the World Bank, is the body that publishes Zimbabwe's general government
      // gross debt; the wording moved from "central government debt" to the published measure. Each value was
      // read live this session. Everything else checked is an operational return with no published series,
      // and is recorded in PART 9 of docs/PLATFORM_ENRICHMENT_PLAN.md.
      ["fin/fin-debt-gdp", "70.4", "World Economic Outlook: General government gross debt (% of GDP)", "2024"],
      ["mfa/mfa-remit-cost", "5.3", "World Development Indicators: Average transaction cost of sending remittances to a specific country (%)", "2023"],
      ["edu/edu-girls", "50.9", "World Development Indicators: School enrollment, secondary, female (% gross)", "2013"],
      // 2026-10-04 — the NATIONAL sources (S1 of the widened sweep): Zimbabwe's own publishers, not the
      // international databases. The defect this answers: the earlier sweep checked only the six international
      // data services and wrongly concluded that no publisher holds these measures. ZIMRA's Annual Report and
      // the RBZ Bank Supervision Annual Report do. Each value below was read from the publisher's own document.
      // Two measures were re-framed to the published one (`fin-currency` is now *foreign* currency deposits,
      // the figure the RBZ balance sheet states; `zimra-audit` is now *audit coverage*, which the report
      // states as a percentage, instead of a yield per case it does not state).
      ["fin/fin-currency", "45.7", "Bank Supervision Annual Report: consolidated balance sheet — foreign currency deposits", "December 2025"],
      ["fin/fin-npl", "3.47", "Bank Supervision Annual Report: asset quality — non-performing loans to total loans", "December 2025"],
      ["zimra/zimra-collection", "110.3", "Annual Report: net revenue collections against target", "2024"],
      ["zimra/zimra-register", "120,234", "Annual Report: active registered taxpayers", "2024"],
      ["zimra/zimra-audit", "3.53", "Annual Report: audit coverage of active registered taxpayers", "2024"],
      // 2026-10-04 — S2 begins, with UNESCO's own statistics institute (UIS), which the earlier sweep had
      // queried with guessed indicator codes and therefore wrongly reported as empty. Both codes below were
      // found in the UIS definitions list first, then Zimbabwe's values read from the UIS data service.
      ["edu/edu-lower-secondary", "72.4", "UIS: completion rate, lower secondary education, both sexes", "2015"],
      ["hedu/hedu-stem", "23.8", "UIS: percentage of tertiary graduates from STEM programmes, both sexes", "2024"],
      // 2026-10-04 — S2 continues with a ZIMBABWEAN publisher: TIMB's own marketing-season statistics, read
      // from its site this session (year-to-date sold mass 359,099,787 kg as at 22 September 2026). The
      // measure is tobacco SOLD through the floors, so the label moved from "Tobacco output" to "Tobacco
      // sold" to say exactly what the publisher counts.
      ["agri/agri-tobacco", "359.1", "Marketing-season statistics: year-to-date sold mass", "September 2026"],
      // 2026-10-04 — S3 begins with UNESCO's SCHOOL-FACILITY series, which the earlier sweeps never queried.
      // Each value read from the UIS data service. `edu-sanitation` was re-framed from a pupils-per-toilet
      // ratio to the published proportion of schools, because that is the measure UIS actually holds.
      ["edu/edu-connectivity", "35.3", "UIS: proportion of primary schools with access to the internet for pedagogical purposes", "2024"],
      ["edu/edu-water", "92.0", "UIS: proportion of primary schools with access to basic drinking water", "2024"],
      ["edu/edu-sanitation", "99.3", "UIS: proportion of primary schools with single-sex basic sanitation facilities", "2024"],
      // 2026-10-04 — S4's first conversion, from the World Bank catalogue (the armed-forces series). The
      // platform's indicator was "Personnel strength (% of establishment)", which no publisher states; the
      // published measure is the total number of armed forces personnel, so the label moved to match it.
      ["def/def-personnel", "51,000", "World Development Indicators: Armed forces personnel, total", "2020"],
      // 2026-10-04 — the owner's decision on the DUPLICATE measure found in S4: `ict-data-cost`
      // ("Data cost", 4.1 % of GNI) and `ict-affordability` ("Data basket cost", 3.2 % of income) were the
      // same question asked twice. The owner chose option 1 — keep one data-cost figure and use the freed
      // slot for a genuinely different measure with a real published source. The duplicate row is gone and
      // this real series sits in its place, so the department keeps its twenty indicators.
      ["ict/ict-secure-servers", "90.0", "World Development Indicators: Secure Internet servers (per 1 million people)", "2024"],
      // 2026-10-04 — S1 continues with ZIMBABWE'S OWN TREASURY (zimtreasury.co.zw), which the earlier
      // sweep could not reach because its old .gov.zw address no longer resolves. Four modelled figures
      // became real ones, read from the 2025 Annual Budget Review and the Public Debt Report 2024, and the
      // duplicate "Budget execution" measure found in the same tables was resolved (see the fifth row).
      ["fin/fin-debt", "USD 21.5B", "Public Debt Report: total public and publicly guaranteed debt stock", "December 2024"],
      ["fin/fin-revenue-gdp", "15.7", "2025 Annual Budget Review: revenue as a share of GDP", "2025"],
      ["fin/fin-expenditure", "79", "2025 Annual Budget Review: expenditure utilisation against budget", "2025"],
      ["fin/fin-capital", "186", "2025 Annual Budget Review: capital expenditure utilisation against budget", "2025"],
      // The freed slot: `fin-budget` ("Budget execution") and `fin-expenditure` were the SAME question —
      // the share of the voted budget actually spent — and the Treasury publishes ONE figure for it (79%).
      // Following the owner's decision on the identical ICT duplicate, the duplicate row is gone and a
      // genuinely different Treasury figure takes its place, so Finance keeps its twenty indicators.
      ["fin/fin-compensation", "47.3", "2025 Annual Budget Review: compensation of employees as a share of total expenditure", "2025"],
      // 2026-10-04 — Batch S5: the national sweep reaches ZIMBABWE'S OWN STATISTICS AGENCY again,
      // this time its PRODUCTION and TRADE side. The quarterly Index of Mineral Production (built
      // from the Ministry of Mines and Mining Development's returns) and Index of Electricity
      // Generation (built from ZESA's returns) gave the physical volumes below, and the Agriculture
      // Ministry's own winter-wheat update gave the planted-area figure. Each value was read from
      // the publisher's own document this session. Four measures were re-framed to the published
      // one: `mines-gold` (deliveries → output), `mines-lithium` (concentrate → output),
      // `energy-gen` (installed capacity → electricity generated) and `energy-ipp` (MW produced →
      // share of generation) — no publisher states the platform's old wording, so the label moved
      // to what the publisher actually reports.
      ["mines/mines-gold", "9,894", "Index of Mineral Production: physical volume of gold output", "March 2026"],
      ["mines/mines-platinum", "3,807", "Index of Mineral Production: physical volume of platinum output", "March 2026"],
      ["mines/mines-lithium", "551,050", "Index of Mineral Production: physical volume of lithium output", "March 2026"],
      ["energy/energy-gen", "2,924", "Index of Electricity Generation: volume of electricity generated", "March 2026"],
      ["energy/energy-ipp", "12.0", "Index of Electricity Generation: independent power producers' share of generation", "March 2026"],
      ["energy/energy-imports", "371.4", "Index of Electricity Generation: volume of electricity imported", "March 2026"],
      ["agri/agri-wheat", "130,316", "Winter wheat planting update", "August 2026"],
      // 2026-10-04 — Batch S6: ZIMSTAT's Demographic and Health Survey 2023-24 (the national
      // household survey) and the Environmental Management Agency's Annual Report 2024. Four
      // modelled measures became real: facility deliveries, the share of households with improved
      // sanitation, the full impact assessments processed and the environmental licences issued.
      // One already-published figure — antenatal visits — was re-sourced from the World Bank's
      // 2019 series to the newer national survey (71.5 → 71.2, both the same "four or more visits"
      // measure), so its row moved with it. Three measures were re-framed to the published one:
      // `lg-sanitation-hh` (a latrine → an improved sanitation facility), `env-licences` (a licence
      // turnaround → licences issued, which is what the agency counts) and `env-eia` (assessments
      // completed → full assessments processed).
      ["health/health-deliveries", "84", "Zimbabwe Demographic and Health Survey 2023-24: institutional deliveries", "2024"],
      ["lg/lg-sanitation-hh", "77", "Zimbabwe Demographic and Health Survey 2023-24: households with improved sanitation", "2024"],
      ["env/env-eia", "1,180", "Annual Report 2024: full environmental and social impact assessments processed", "2024"],
      ["env/env-licences", "11,432", "Annual Report 2024: environmental licences issued", "2024"],
      // 2026-10-04 — Batch S7: ZIMSTAT's Environmental Resources Statistics Report 2023 (cotton
      // production, from the crop-production table) and the 2022 Population and Housing Census
      // (households whose main water source is piped — a measure distinct from `lg-water`, which is
      // the population-level basic-drinking-water series).
      ["agri/agri-cotton", "63,627", "Environmental Resources Statistics Report 2023: cotton production", "2023"],
      ["lg/lg-water-piped", "29.6", "2022 Population and Housing Census: households whose main water source is piped", "2022"],
      // 2026-10-04 — PART 11, batch 1 of the LOCKED GOAL (real must outnumber modelled): 23 NEW real
      // indicators added, each with a Zimbabwe value read from the World Bank's own API this session
      // (`api.worldbank.org/v2/country/ZW/indicator/<series>`). All point at `worldbank`, so no source
      // override is needed.
      ["fin/fin-growth", "8.1", "World Development Indicators: GDP growth (annual %)", "2025"],
      ["agri/agri-land-share", "41.8", "World Development Indicators: Agricultural land (% of land area)", "2023"],
      ["agri/agri-gdp", "9.5", "World Development Indicators: Agriculture, forestry, and fishing, value added (% of GDP)", "2025"],
      ["health/health-under5", "64.7", "World Development Indicators: Mortality rate, under-5 (per 1,000 live births)", "2024"],
      ["health/health-spend", "2.9", "World Development Indicators: Current health expenditure (% of GDP)", "2023"],
      ["edu/edu-trained-teachers", "97.9", "World Development Indicators: Trained teachers in primary education (% of total teachers)", "2024"],
      ["energy/energy-use", "472", "World Development Indicators: Energy use (kg of oil equivalent per capita)", "2023"],
      ["energy/energy-cooking", "30.7", "World Development Indicators: Access to clean fuels and technologies for cooking (% of population)", "2023"],
      ["ict/ict-fixed-lines", "1.8", "World Development Indicators: Fixed telephone subscriptions (per 100 people)", "2024"],
      ["lg/lg-urban", "40.5", "World Development Indicators: Urban population (% of total population)", "2025"],
      ["lg/lg-water-safe", "25.5", "World Development Indicators: People using safely managed drinking water services (% of population)", "2024"],
      ["def/def-spending", "0.4", "World Development Indicators: Military expenditure (% of GDP)", "2024"],
      ["mfa/mfa-oda", "2.2", "World Development Indicators: Net official development assistance received (% of GNI)", "2023"],
      ["mfa/mfa-merch-trade", "38.7", "World Development Indicators: Merchandise trade (% of GDP)", "2025"],
      ["env/env-co2-total", "12.9", "World Development Indicators: Carbon dioxide (CO2) emissions excluding LULUCF (Mt CO2e)", "2024"],
      ["env/env-freshwater", "763", "World Development Indicators: Renewable internal freshwater resources per capita (cubic meters)", "2022"],
      ["psc/psc-wage-workers", "29.2", "World Development Indicators: Wage and salaried workers, total (% of total employment)", "2025"],
      ["psc/psc-unemployment", "9.3", "World Development Indicators: Unemployment, total (% of total labor force)", "2025"],
      ["hedu/hedu-researchers", "95.1", "World Development Indicators: Researchers in R&D (per million people)", "2012"],
      // 2026-10-05 — PART 11, batch 2: 23 more NEW real indicators. The WHO Global Health
      // Observatory joins as a named source; the rest are World Bank series. Each value was
      // read live from the publisher's own API this session.
      ["health/health-hale", "52.5", "WHO Global Health Observatory: Healthy life expectancy (HALE) at birth, both sexes", "2023"],
      ["health/health-stunting", "25.9", "World Development Indicators: Prevalence of stunting, height for age (% of children under 5)", "2024"],
      ["health/health-tb-incidence", "203", "World Development Indicators: Incidence of tuberculosis (per 100,000 people)", "2024"],
      ["health/health-beds", "1.95", "World Development Indicators: Hospital beds (per 1,000 people)", "2014"],
      ["health/health-physicians", "0.136", "World Development Indicators: Physicians (per 1,000 people)", "2023"],
      ["health/health-skilled-birth", "91", "WHO Global Health Observatory: Births attended by skilled health personnel", "2025"],
      ["health/health-ncd-mortality", "31.2", "WHO Global Health Observatory: Premature mortality from non-communicable diseases (30–69)", "2021"],
      ["health/health-suicide", "25.4", "WHO Global Health Observatory: Suicide mortality rate", "2021"],
      ["health/health-road-deaths", "29.9", "WHO Global Health Observatory: Road traffic death rate", "2021"],
      ["health/health-diabetes", "7.1", "WHO Global Health Observatory: Raised fasting blood glucose among adults", "2014"],
      ["health/health-obesity", "6.1", "WHO Global Health Observatory: Prevalence of obesity among adults (BMI ≥ 30)", "2024"],
      ["health/health-alcohol", "5.4", "WHO Global Health Observatory: Total alcohol per capita consumption", "2024"],
      ["health/health-hwf", "14.65", "WHO Global Health Observatory: Skilled health professionals density", "2024"],
      ["edu/edu-secondary", "52.4", "World Development Indicators: School enrollment, secondary (% gross)", "2013"],
      ["fin/fin-industry", "37.1", "World Development Indicators: Industry (including construction), value added (% of GDP)", "2025"],
      ["fin/fin-services", "48.2", "World Development Indicators: Services, value added (% of GDP)", "2025"],
      ["fin/fin-external-debt", "33.0", "World Development Indicators: External debt stocks (% of GNI)", "2024"],
      ["psc/psc-lfp", "67.7", "World Development Indicators: Labor force participation rate, total (% of population ages 15+)", "2025"],
      ["psc/psc-youth-unemp", "15.5", "World Development Indicators: Unemployment, youth total (% of total labor force ages 15-24)", "2025"],
      ["psc/psc-female-lfp", "62.2", "World Development Indicators: Labor force participation rate, female (% of female population ages 15+)", "2025"],
      ["psc/psc-labour-force", "6,854,692", "World Development Indicators: Labor force, total", "2025"],
      ["lg/lg-population", "16,950,795", "World Development Indicators: Population, total", "2025"],
      ["lg/lg-pop-growth", "1.88", "World Development Indicators: Population growth (annual %)", "2025"],
      // 2026-10-05 — PART 11, batch 3: 52 more real indicators (53 were drafted; the armed-forces
      // personnel total was withdrawn as a duplicate of the existing `def-personnel` figure added
      // in Batch S4). Every value below was read from the publisher's own API this session (the
      // World Bank's World Development Indicators and Worldwide Governance Indicators, and the
      // United Nations Comtrade Database). UN Comtrade is a new named source, so its two rows are
      // attributed to it in SOURCE_OVERRIDES above.
      ["opc/opc-gov-effectiveness", "-0.89", "Worldwide Governance Indicators: Government effectiveness (estimate)", "2025"],
      ["opc/opc-control-corruption", "-1.29", "Worldwide Governance Indicators: Control of corruption (estimate)", "2025"],
      ["opc/opc-rule-of-law", "-1.22", "Worldwide Governance Indicators: Rule of law (estimate)", "2025"],
      ["opc/opc-regulatory-quality", "-1.28", "Worldwide Governance Indicators: Regulatory quality (estimate)", "2025"],
      ["fin/fin-gdp-percapita", "USD 3,021", "World Development Indicators: GDP per capita (current US$)", "2025"],
      ["fin/fin-gdp", "USD 51.2B", "World Development Indicators: GDP (current US$)", "2025"],
      ["fin/fin-investment-gdp", "8.8", "World Development Indicators: Gross capital formation (% of GDP)", "2024"],
      ["fin/fin-consumption", "84.4", "World Development Indicators: Household final consumption expenditure (% of GDP)", "2024"],
      ["fin/fin-gov-consumption", "12.2", "World Development Indicators: General government final consumption expenditure (% of GDP)", "2024"],
      ["fin/fin-credit-private", "6.5", "World Development Indicators: Domestic credit to private sector (% of GDP)", "2023"],
      ["fin/fin-current-account", "1.2", "World Development Indicators: Current account balance (% of GDP)", "2024"],
      ["fin/fin-trade-openness", "41.5", "World Development Indicators: Trade (% of GDP)", "2024"],
      ["agri/agri-food-index", "121.7", "World Development Indicators: Food production index (2014-2016 = 100)", "2022"],
      ["agri/agri-crop-index", "123.5", "World Development Indicators: Crop production index (2014-2016 = 100)", "2022"],
      ["agri/agri-arable", "10.4", "World Development Indicators: Arable land (% of land area)", "2023"],
      ["agri/agri-cereal-area", "1,569,913", "World Development Indicators: Land under cereal production (hectares)", "2023"],
      ["health/health-spend-capita", "USD 62.9", "World Development Indicators: Current health expenditure per capita (current US$)", "2023"],
      ["health/health-out-of-pocket", "10.6", "World Development Indicators: Out-of-pocket expenditure (% of current health expenditure)", "2023"],
      ["health/health-infant", "62.4", "World Development Indicators: Mortality rate, infant (per 1,000 live births)", "2024"],
      ["health/health-neonatal", "33.7", "World Development Indicators: Mortality rate, neonatal (per 1,000 live births)", "2024"],
      ["health/health-measles", "90", "World Development Indicators: Immunization, measles (% of children ages 12-23 months)", "2024"],
      ["health/health-hiv-prevalence", "9.8", "World Development Indicators: Prevalence of HIV, total (% of population ages 15-49)", "2024"],
      ["health/health-contraception", "66.8", "World Development Indicators: Contraceptive prevalence, any method (% of married women ages 15-49)", "2015"],
      ["health/health-teen-births", "95.5", "World Development Indicators: Adolescent fertility rate (births per 1,000 women ages 15-19)", "2024"],
      ["edu/edu-spend-gdp", "0.4", "World Development Indicators: Government expenditure on education, total (% of GDP)", "2023"],
      ["edu/edu-ratio-secondary", "22.5", "World Development Indicators: Pupil-teacher ratio, secondary", "2013"],
      ["edu/edu-out-of-school", "332,314", "World Development Indicators: Children out of school, primary", "2024"],
      ["edu/edu-youth-literacy", "92.5", "World Development Indicators: Literacy rate, youth total (% of people ages 15-24)", "2019"],
      ["edu/edu-net-enrolment", "94.6", "World Development Indicators: Adjusted net enrollment rate, primary (% of primary school age children)", "2013"],
      ["ict/ict-ict-exports", "0.02", "World Development Indicators: ICT goods exports (% of total goods exports)", "2024"],
      ["ict/ict-ict-services", "3.3", "World Development Indicators: ICT service exports (% of service exports, BoP)", "2024"],
      ["energy/energy-electricity-pc", "504", "World Development Indicators: Electric power consumption (kWh per capita)", "2023"],
      ["energy/energy-renewable-share", "82.4", "World Development Indicators: Renewable energy consumption (% of total final energy consumption)", "2021"],
      ["energy/energy-imports-net", "17.0", "World Development Indicators: Energy imports, net (% of energy use)", "2022"],
      ["psc/psc-employment-agri", "54.3", "World Development Indicators: Employment in agriculture (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-employment-industry", "11.5", "World Development Indicators: Employment in industry (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-employment-services", "34.2", "World Development Indicators: Employment in services (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-vulnerable", "68.2", "World Development Indicators: Vulnerable employment, total (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-working-age", "56.2", "World Development Indicators: Population ages 15-64 (% of total population)", "2025"],
      ["psc/psc-dependency", "78.1", "World Development Indicators: Age dependency ratio (% of working-age population)", "2025"],
      ["lg/lg-urban-growth", "3.4", "World Development Indicators: Urban population growth (annual %)", "2025"],
      ["lg/lg-rural-share", "59.5", "World Development Indicators: Rural population (% of total population)", "2025"],
      ["mfa/mfa-goods-exports", "USD 7.43B", "UN Comtrade Database: merchandise exports, total", "2024"],
      ["mfa/mfa-goods-imports", "USD 9.53B", "UN Comtrade Database: merchandise imports, total", "2024"],
      ["mfa/mfa-tourist-arrivals", "639,000", "World Development Indicators: International tourism, number of arrivals", "2020"],
      ["mfa/mfa-tourism-receipts", "USD 66M", "World Development Indicators: International tourism, receipts (current US$)", "2020"],
      ["mfa/mfa-export-share", "18.1", "World Development Indicators: Exports of goods and services (% of GDP)", "2024"],
      ["env/env-pm25", "15.0", "World Development Indicators: PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)", "2023"],
      ["env/env-air-mortality", "189.6", "World Development Indicators: Mortality rate attributed to household and ambient air pollution (per 100,000 population)", "2019"],
      ["def/def-spending-budget", "1.3", "World Development Indicators: Military expenditure (% of central government expenditure)", "2024"],
      ["def/def-personnel-share", "0.88", "World Development Indicators: Armed forces personnel (% of total labor force)", "2020"],
      ["zida/zida-manufacturing", "14.9", "World Development Indicators: Manufacturing, value added (% of GDP)", "2025"],
      // 2026-10-05 — PART 11, batch 4: 32 more real indicators, each read from the World Bank's
      // own API this session (the employment-to-population ratio is an ILO series, named above).
      // Two drafted figures — fixed broadband and primary completion — were withdrawn in the
      // same session as duplicates of the existing ict-broadband and edu-transition.
      ["fin/fin-gni-capita", "2,660", "World Development Indicators: GNI per capita, Atlas method (current US$)", "2025"],
      ["agri/agri-raw-exports", "0.9", "World Development Indicators: Agricultural raw materials exports (% of merchandise exports)", "2024"],
      ["health/health-hepb", "91", "World Development Indicators: Immunization, HepB3 (% of one-year-old children)", "2024"],
      ["health/health-life-female", "65.3", "World Development Indicators: Life expectancy at birth, female (years)", "2024"],
      ["health/health-life-male", "60.5", "World Development Indicators: Life expectancy at birth, male (years)", "2024"],
      ["health/health-undernourished", "19.7", "World Development Indicators: Prevalence of undernourishment (% of population)", "2023"],
      ["health/health-ncd-share", "38.3", "World Development Indicators: Cause of death, by non-communicable diseases (% of total)", "2021"],
      ["health/health-overweight", "4.3", "World Development Indicators: Prevalence of overweight, weight for height (% of children under 5)", "2024"],
      ["edu/edu-spend-share", "17.9", "World Development Indicators: Government expenditure on education, total (% of government expenditure)", "2025"],
      ["edu/edu-parity", "0.97", "World Development Indicators: School enrollment, primary and secondary (gross), gender parity index (GPI)", "2013"],
      ["edu/edu-private-secondary", "77.4", "World Development Indicators: School enrollment, secondary, private (% of total secondary)", "2012"],
      ["edu/edu-bachelors", "1.1", "World Development Indicators: Educational attainment, at least Bachelor's or equivalent, population 25+, total (%)", "2023"],
      ["hedu/hedu-patents", "8", "World Development Indicators: Patent applications, residents", "2016"],
      ["energy/energy-intensity", "14.8", "World Development Indicators: Energy intensity level of primary energy (MJ/$2021 PPP GDP)", "2021"],
      ["energy/energy-alt-nuclear", "4.1", "World Development Indicators: Alternative and nuclear energy (% of total energy use)", "2023"],
      ["psc/psc-emp-ratio", "61.4", "ILO modelled estimates: Employment-to-population ratio, 15+, total", "2025"],
      ["psc/psc-fertility", "3.67", "World Development Indicators: Fertility rate, total (births per woman)", "2024"],
      ["psc/psc-birth-rate", "29.9", "World Development Indicators: Birth rate, crude (per 1,000 people)", "2024"],
      ["psc/psc-death-rate", "7.5", "World Development Indicators: Death rate, crude (per 1,000 people)", "2024"],
      ["psc/psc-pop-density", "42.2", "World Development Indicators: Population density (people per sq. km of land area)", "2023"],
      ["psc/psc-older-share", "3.6", "World Development Indicators: Population ages 65 and above (% of total population)", "2025"],
      ["psc/psc-children-share", "40.3", "World Development Indicators: Population ages 0-14 (% of total population)", "2025"],
      ["psc/psc-unemployment-female", "9.4", "World Development Indicators: Unemployment, female (% of female labor force) (modeled ILO estimate)", "2025"],
      ["lg/lg-urban-population", "6,864,246", "World Development Indicators: Urban population", "2025"],
      ["lg/lg-gini", "50.3", "World Development Indicators: Gini index", "2019"],
      ["lg/lg-poverty", "49.2", "World Development Indicators: Poverty headcount ratio at $3.00 a day (2021 PPP) (% of population)", "2019"],
      ["mfa/mfa-tourism-share", "1.3", "World Development Indicators: International tourism, receipts (% of total exports)", "2020"],
      ["mfa/mfa-imports-gdp", "23.4", "World Development Indicators: Imports of goods and services (% of GDP)", "2024"],
      ["env/env-mammals", "10", "World Development Indicators: Mammal species, threatened", "2022"],
      ["env/env-birds", "22", "World Development Indicators: Bird species, threatened", "2022"],
      ["opc/opc-women-parliament", "30.1", "World Development Indicators: Proportion of seats held by women in national parliaments (%)", "2025"],
      ["zida/zida-tech-manufacturing", "9.6", "World Development Indicators: Medium and high-tech manufacturing value added (% manufacturing value added)", "2022"],
      // 2026-10-05 — PART 11, batch 5: THE FLIP. 34 more real indicators were added, each with a
      // Zimbabwe value read from the World Bank's own API this session
      // (`api.worldbank.org/v2/country/ZW/indicator/<series>`), so real, published figures now
      // OUTNUMBER the modelled ones (245 published / 235 modelled, 480 indicators). Two drafted
      // figures — population aged 15-64 and total life expectancy — were withdrawn in the same
      // session as duplicates of the existing `psc-working-age` and `health-life`. All the rows
      // below are World Bank series, so no source override is needed.
      ["lg/lg-income-share-low", "4.8", "World Development Indicators: Income share held by lowest 20%", "2019"],
      ["lg/lg-income-share-high", "40.5", "World Development Indicators: Income share held by highest 10%", "2019"],
      ["lg/lg-slum", "54.9", "World Development Indicators: Population living in slums (% of urban population)", "2022"],
      ["psc/psc-self-employed", "70.8", "World Development Indicators: Self-employed, total (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-employers", "2.6", "World Development Indicators: Employers, total (% of total employment) (modeled ILO estimate)", "2025"],
      ["psc/psc-youth-lfp", "48.2", "World Development Indicators: Labor force participation rate for ages 15-24, total (%) (modeled ILO estimate)", "2025"],
      ["psc/psc-unemployment-male", "9.2", "World Development Indicators: Unemployment, male (% of male labor force) (modeled ILO estimate)", "2025"],
      ["psc/psc-youth-unemployment-female", "16.2", "World Development Indicators: Unemployment, youth female (% of female labor force ages 15-24) (modeled ILO estimate)", "2025"],
      ["psc/psc-lfp-male", "74.3", "World Development Indicators: Labor force participation rate, male (% of male population ages 15+) (modeled ILO estimate)", "2025"],
      ["psc/psc-older-female", "4.1", "World Development Indicators: Population ages 65 and above, female (% of female population)", "2025"],
      ["health/health-smoking", "11.0", "World Development Indicators: Prevalence of current tobacco use (% of adults)", "2024"],
      ["health/health-wasting", "5.1", "World Development Indicators: Prevalence of wasting, weight for height (% of children under 5)", "2024"],
      ["health/health-polio", "91", "World Development Indicators: Immunization, Pol3 (% of one-year-old children)", "2024"],
      ["health/health-hiv-young-female", "3.7", "World Development Indicators: Prevalence of HIV, female (% ages 15-24)", "2024"],
      ["health/health-tb-detection", "60", "World Development Indicators: Tuberculosis case detection rate (%, all forms)", "2024"],
      ["health/health-malnutrition", "9.6", "World Development Indicators: Prevalence of malnutrition, weight for age (% of children under 5)", "2024"],
      ["health/health-anaemia-pregnancy", "30.1", "World Development Indicators: Prevalence of anemia among pregnant women (%)", "2023"],
      ["health/health-infant-mortality-female", "55.8", "World Development Indicators: Mortality rate, infant, female (per 1,000 live births)", "2024"],
      ["health/health-infant-mortality-male", "68.6", "World Development Indicators: Mortality rate, infant, male (per 1,000 live births)", "2024"],
      ["energy/energy-fuel-exports", "2.9", "World Development Indicators: Fuel exports (% of merchandise exports)", "2024"],
      ["energy/energy-connection-days", "19.6", "World Development Indicators: Time required to get electricity (days)", "2025"],
      ["zida/zida-manufactures-exports", "6.7", "World Development Indicators: Manufactures exports (% of merchandise exports)", "2024"],
      ["zida/zida-new-business-density", "2.8", "World Development Indicators: New business density (new registrations per 1,000 people ages 15-64)", "2024"],
      ["mfa/mfa-manufactures-imports", "58.3", "World Development Indicators: Manufactures imports (% of merchandise imports)", "2024"],
      ["mfa/mfa-travel-services", "44.4", "World Development Indicators: Travel services (% of commercial service exports)", "2024"],
      ["mfa/mfa-digital-services", "8.3", "World Development Indicators: Computer, communications and other services (% of commercial service exports)", "2024"],
      ["fin/fin-reserves-usd", "USD 485M", "World Development Indicators: Total reserves (includes gold, current US$)", "2024"],
      ["fin/fin-fdi-gdp", "1.1", "World Development Indicators: Foreign direct investment, net inflows (% of GDP)", "2024"],
      ["edu/edu-female-teachers", "62.0", "World Development Indicators: Primary education, teachers (% female)", "2024"],
      ["edu/edu-upper-secondary", "13.3", "World Development Indicators: Educational attainment, at least completed upper secondary, population 25+, total (%) (cumulative)", "2019"],
      ["edu/edu-private-primary", "13.1", "World Development Indicators: School enrollment, primary, private (% of total primary)", "2020"],
      ["edu/edu-upper-secondary-female", "10.6", "World Development Indicators: Educational attainment, at least completed upper secondary, population 25+, female (%) (cumulative)", "2019"],
      ["edu/edu-trained-female-teachers", "98.0", "World Development Indicators: Trained teachers in primary education, female (% of female teachers)", "2024"],
      ["hedu/hedu-masters", "0.2", "World Development Indicators: Educational attainment, at least completed master's or equivalent, population 25+ (%)", "2023"],
      // 2026-10-05 — PART 11, batch 6: 15 more real indicators, each read from the World Bank's own API
      // this session, widening the margin by which published figures exceed modelled. All are World Bank
      // series, so no source override is needed. (No new publisher was addable this session — FAOSTAT is
      // now auth-walled, UNCTAD/ITU/AfDB/UNAIDS return 403/404, UNdata 404 and UNICEF SDMX had no data.)
      ["fin/fin-debt-service", "19.5", "World Development Indicators: Total debt service (% of exports of goods, services and primary income)", "2023"],
      ["agri/agri-fisheries", "113,130", "World Development Indicators: Total fisheries production (metric tons)", "2024"],
      ["health/health-gov-health-spend", "USD 20.4", "World Development Indicators: Domestic general government health expenditure per capita (current US$)", "2023"],
      ["health/health-iodised-salt", "83.8", "World Development Indicators: Consumption of iodized salt (% of households)", "2019"],
      ["health/health-vitamin-a", "37", "World Development Indicators: Vitamin A supplementation coverage rate (% of children ages 6-59 months)", "2023"],
      ["health/health-survival-65-female", "61.2", "World Development Indicators: Survival to age 65, female (% of cohort)", "2024"],
      ["health/health-survival-65-male", "50.8", "World Development Indicators: Survival to age 65, male (% of cohort)", "2024"],
      ["edu/edu-youth-literacy-female", "94.2", "World Development Indicators: Literacy rate, youth female (% of females ages 15-24)", "2019"],
      ["edu/edu-youth-literacy-male", "90.8", "World Development Indicators: Literacy rate, youth male (% of males ages 15-24)", "2019"],
      ["energy/energy-urban-access", "85.1", "World Development Indicators: Access to electricity, urban (% of urban population)", "2024"],
      ["psc/psc-emp-ratio-female", "56.3", "World Development Indicators: Employment to population ratio, 15+, female (%) (modeled ILO estimate)", "2025"],
      ["psc/psc-emp-ratio-male", "67.4", "World Development Indicators: Employment to population ratio, 15+, male (%) (modeled ILO estimate)", "2025"],
      ["psc/psc-youth-unemployment-male", "15.0", "World Development Indicators: Unemployment, youth male (% of male labor force ages 15-24) (modeled ILO estimate)", "2025"],
      ["lg/lg-poverty-upper", "86.2", "World Development Indicators: Poverty headcount ratio at $8.30 a day (2021 PPP) (% of population)", "2019"],
      ["zida/zida-high-tech-exports", "2.8", "World Development Indicators: High-technology exports (% of manufactured exports)", "2024"],
      // 2026-10-05 — PART 11, batch 7: 15 more real indicators. Twelve are World Bank
      // series, each value read from the World Bank's own API this session; the last
      // three are the platform's three NEW publishers — Transparency International's
      // Corruption Perceptions Index, Reporters Without Borders' World Press Freedom
      // Index (each publisher's own site), and the UNDP Human Development Index (whose
      // value is pictured by Our World in Data, which names UNDP as its source).
      ["fin/fin-broad-money", "11.2", "World Development Indicators: Broad money (% of GDP)", "2023"],
      ["fin/fin-lending-rate", "46.36", "World Development Indicators: Lending interest rate (%)", "2025"],
      ["health/health-nurses", "3.071", "World Development Indicators: Nurses and midwives (per 1,000 people)", "2022"],
      ["health/health-smoking-female", "1.0", "World Development Indicators: Prevalence of current tobacco use, females (% of female adults)", "2024"],
      ["health/health-smoking-male", "21.0", "World Development Indicators: Prevalence of current tobacco use, males (% of male adults)", "2024"],
      ["health/health-ors-treatment", "45.6", "World Development Indicators: Diarrhea treatment (% of children under 5 receiving oral rehydration and continued feeding)", "2019"],
      ["health/health-adolescent-fertility", "95.5", "World Development Indicators: Adolescent fertility rate (births per 1,000 women ages 15-19)", "2024"],
      ["health/health-art-coverage", "95", "World Development Indicators: Antiretroviral therapy coverage (% of people living with HIV)", "2024"],
      ["edu/edu-preprimary", "74.3", "World Development Indicators: School enrollment, preprimary (% gross)", "2021"],
      ["ict/ict-mobile", "94.2", "World Development Indicators: Mobile cellular subscriptions (per 100 people)", "2024"],
      ["env/env-co2-percapita", "0.77", "World Development Indicators: Carbon dioxide (CO2) emissions excluding LULUCF per capita (t CO2e/capita)", "2024"],
      ["opc/opc-homicides", "6.76", "World Development Indicators: Intentional homicides (per 100,000 people)", "2022"],
      ["opc/opc-corruption-perceptions", "22", "Corruption Perceptions Index (Transparency International)", "2025"],
      ["opc/opc-press-freedom", "44.37", "World Press Freedom Index (Reporters Without Borders)", "2026"],
      ["opc/opc-hdi", "0.598", "Human Development Report (United Nations Development Programme)", "2023"],
    ];

    RECORDED.forEach(([where, value, publication, asOf]) => {
      const [departmentId, indicatorId] = where.split("/");
      const indicator = findDepartment(departmentId)!.indicators.find((entry) => entry.id === indicatorId)!;
      expect(indicator, `${where} exists`).toBeTruthy();
      expect(indicator.value, `${where} value`).toBe(value);
      expect(indicator.basis.kind, `${where} is published`).toBe("published");
      if (indicator.basis.kind !== "published") return;
      expect(indicator.basis.sourceId, `${where} source`).toBe(
        SOURCE_OVERRIDES[where] ?? "worldbank",
      );
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
