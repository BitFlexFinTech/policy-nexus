/**
 * THE DEMONSTRATION SAMPLE — the small set of content that makes the research assistant usable the
 * moment it opens, instead of empty boxes.
 *
 * THE LIBRARY IS NO LONGER A SAMPLE. ZEPARI's own published documents are the library now — every
 * publication on their three listing pages, read in full (see `zepariCorpus.ts`) — so nothing here
 * stands in for a real document. What remains, plainly marked as a sample, is:
 *  - the data sources and the findings (the institute records its own when its server is joined);
 *  - the barometer readings, which are REAL published figures, each carried with the body that
 *    published it (the same figures the platform's own reference data already cites).
 *
 * It seeds ONCE (a flag in this browser), and the workspace offers "Reset the sample" to restore it.
 *
 * Determinism: plain authored data. No clock, no randomness (the store adds each record's moment).
 */

import { createKeyValueStore } from "@/lib/browserStorage";
import type { DepartmentId } from "@/config/departments";
import { clearAllResearchDocuments } from "./researchDocuments";
import { addResearchDataSource, clearAllResearchDataSources } from "./researchDataSources";
import { addBarometerReading, clearAllBarometerReadings } from "./researchBarometer";
import { addResearchFinding, clearAllResearchFindings } from "./researchFindings";

const SAMPLE_FLAG_KEY = "nzwisiso.research.sample-seeded.v1";
const storage = createKeyValueStore();

/** The data sources — plainly labelled samples (the institute records its own when its server is joined). */
const SAMPLE_SOURCES = [
  { name: "ZEPARI Economic Barometer (demonstration sample)", address: "sources://zepari/barometer", provides: "quarterly macro-economic indicators" },
  { name: "ZIMSTAT statistical releases (demonstration sample)", address: "sources://zimstat/releases", provides: "national statistics" },
];

/** The barometer readings — REAL published figures, each naming the body that published it. */
const SAMPLE_READINGS = [
  { indicator: "Fiscal deficit", period: "2018", value: "3.6", unit: "% of GDP", source: "World Bank, World Development Indicators (net lending / net borrowing, % of GDP), 2018" },
  { indicator: "Tax revenue", period: "2018", value: "7.2", unit: "% of GDP", source: "World Bank, World Development Indicators (tax revenue, % of GDP), 2018" },
  { indicator: "Public debt stock", period: "December 2024", value: "21.5", unit: "USD bn", source: "Ministry of Finance, Public Debt Report (total public and publicly guaranteed debt stock), December 2024" },
  { indicator: "Debt to GDP", period: "2024", value: "70.4", unit: "% of GDP", source: "IMF, World Economic Outlook (general government gross debt, % of GDP), 2024" },
  { indicator: "Compensation of employees", period: "2025", value: "47.3", unit: "% of total expenditure", source: "Ministry of Finance, 2025 Annual Budget Review, 2025" },
  { indicator: "Lending interest rate", period: "2025", value: "46.36", unit: "%", source: "World Bank, World Development Indicators (lending interest rate, %), 2025" },
];

/** The findings — plainly labelled samples, routed to the departments they would concern. */
const SAMPLE_FINDINGS: ReadonlyArray<{ text: string; departments: DepartmentId[] }> = [
  {
    text: "Mineral revenue is concentrated in a small number of districts, so the fiscal framework should reflect that concentration (demonstration sample).",
    departments: ["mines", "fin"],
  },
  {
    text: "Loan-to-deposit spreads constrain small-firm borrowing, which the SME finance review should weigh (demonstration sample).",
    departments: ["fin", "zida"],
  },
];

export const hasSeededResearchSample = (): boolean => storage.read(SAMPLE_FLAG_KEY) === "1";

/** Put the demonstration sample into the four stores. Called when the workspace first opens. */
export const seedResearchSample = (): void => {
  if (hasSeededResearchSample()) return;

  SAMPLE_SOURCES.forEach((source) => addResearchDataSource(source));
  SAMPLE_READINGS.forEach((reading) => addBarometerReading(reading));
  SAMPLE_FINDINGS.forEach((finding) =>
    addResearchFinding({ text: finding.text, departments: finding.departments }),
  );

  storage.write(SAMPLE_FLAG_KEY, "1");
};

/** Clear the four stores and put the sample back — so the demonstration can be re-run from scratch. */
export const resetResearchSample = (): void => {
  clearAllResearchDocuments();
  clearAllResearchDataSources();
  clearAllBarometerReadings();
  clearAllResearchFindings();
  storage.remove(SAMPLE_FLAG_KEY);
  seedResearchSample();
};

/** Empty every research store and forget that the sample was seeded (a full clear). */
export const clearResearchSample = (): void => {
  clearAllResearchDocuments();
  clearAllResearchDataSources();
  clearAllBarometerReadings();
  clearAllResearchFindings();
  storage.remove(SAMPLE_FLAG_KEY);
};