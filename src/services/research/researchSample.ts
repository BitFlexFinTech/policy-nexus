/**
 * THE DEMONSTRATION SAMPLE — the small set of content that makes the research assistant usable the
 * moment it opens, instead of empty boxes.
 *
 * Every item is clearly labelled as a demonstration sample, and nothing here is invented:
 *  - the two library documents are short, cited extracts from real published Zimbabwean policies
 *    (the agriculture framework's nine pillars; the ICT policy's own areas), quoted and named;
 *  - the barometer readings are REAL published figures, each carried with the body that published it
 *    (the same figures the platform's own reference data already cites);
 *  - the data sources and the findings are plainly marked samples.
 *
 * It seeds ONCE (a flag in this browser), and the workspace offers "Reset the sample" to restore it.
 *
 * Determinism: plain authored data. No clock, no randomness (the store adds each record's moment).
 */

import { createKeyValueStore } from "@/lib/browserStorage";
import type { DepartmentId } from "@/config/departments";
import { addResearchDocument, clearAllResearchDocuments } from "./researchDocuments";
import { addResearchDataSource, clearAllResearchDataSources } from "./researchDataSources";
import { addBarometerReading, clearAllBarometerReadings } from "./researchBarometer";
import { addResearchFinding, clearAllResearchFindings } from "./researchFindings";

const SAMPLE_FLAG_KEY = "nzwisiso.research.sample-seeded.v1";
const storage = createKeyValueStore();

/** The library extracts — short, real, cited passages so the chat and the brief have something to use. */
const SAMPLE_DOCUMENTS = [
  {
    name: "National Agriculture Policy Framework 2019–2030 — key pillars (demonstration extract)",
    text:
      "The National Agriculture Policy Framework groups the challenges facing the agricultural sector " +
      "into nine pillars: Food and Nutrition Security and Resilience; Agricultural Knowledge, Technology " +
      "and Innovation System; Production and Supply of Agricultural Inputs; Development of Agricultural " +
      "Infrastructure; Agricultural Marketing and Trade Development; Agricultural Finance and Credit; " +
      "Access, Tenure Security and Land Administration; Resilient and Sustainable Agriculture; and the " +
      "Institutional Arrangement for Policy Implementation. Source: Ministry of Lands, Agriculture, " +
      "Fisheries, Water and Rural Development, National Agriculture Policy Framework 2019-2030.",
    status: "Demonstration extract — read in full.",
  },
  {
    name: "Zimbabwe National Policy for ICT 2016 — policy areas (demonstration extract)",
    text:
      "The Zimbabwe National Policy for Information and Communication Technology carries these areas: " +
      "institutional framework; legal and regulatory framework; universal access and service to ICTs; a " +
      "national broadband plan; management of national resources (spectrum, satellite orbits, numbering " +
      "and naming); broad-based entrepreneurship and innovation; empowerment and indigenisation for " +
      "service providers and vendors; incentives to attract foreign investors; ICT sector competitiveness " +
      "and viability; infrastructure sharing; and human resource skills, capacity building and research. " +
      "Source: Ministry of Information Communication Technology, Postal and Courier Services, Zimbabwe " +
      "National Policy for ICT 2016.",
    status: "Demonstration extract — read in full.",
  },
];

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

  SAMPLE_DOCUMENTS.forEach((doc) =>
    addResearchDocument({
      name: doc.name,
      sizeLabel: `${doc.text.length} characters`,
      kind: "text",
      text: doc.text,
      status: doc.status,
    }),
  );
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