import { describe, it, expect } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { CLAUSE_KEYS, readPolicy } from "@/services/assessment/policyReading";

const fin = findDepartment("fin")!;

describe("policy reading — the draft is actually read, deterministically", () => {
  it("is deterministic: the same text and department give a byte-identical reading", () => {
    const text = fin.policyTemplates[0].policyText;
    expect(readPolicy(text, fin)).toEqual(readPolicy(text, fin));
  });

  it("changes when the text changes, in ways a reader can point at", () => {
    const bare = readPolicy("This policy notes the importance of stability.", fin);
    const loaded = readPolicy(
      "Registered taxpayers must file a return. The Income Tax Act [Chapter 23:06] applies. " +
        "A transition period of twelve months applies before obligations begin, and the authority shall " +
        "monitor compliance and review the threshold within two years.",
      fin,
    );
    expect(bare.actionSentences).toHaveLength(0);
    expect(loaded.actionSentences.length).toBeGreaterThan(0);
    expect(loaded.breadth).toBeGreaterThan(bare.breadth);
    expect(loaded.clauses.transition).toBe(true);
    expect(bare.clauses.transition).toBe(false);
  });

  it("finds at least one obligation and a non-zero breadth in EVERY department's own prepared draft", () => {
    DEPARTMENTS.forEach((department) => {
      department.policyTemplates.forEach((template) => {
        const reading = readPolicy(template.policyText, department);
        expect(
          reading.actionSentences.length,
          `${department.id}/${template.id} places an obligation`,
        ).toBeGreaterThan(0);
        expect(reading.breadth, `${department.id}/${template.id} breadth`).toBeGreaterThan(0);
        expect(reading.wordCount, `${department.id}/${template.id} word count`).toBeGreaterThan(20);
        expect(reading.findings.length, `${department.id}/${template.id} findings`).toBeGreaterThan(0);
      });
    });
  });

  it("names the groups the draft's own words concern, and none when it names none", () => {
    const women = readPolicy("Women traders and youth in rural districts must be supported.", fin);
    expect(women.concernedSegmentIds).toContain("women");
    expect(women.concernedSegmentIds.length).toBeGreaterThan(0);

    const nobody = readPolicy("This instrument restates the reporting cycle.", fin);
    expect(nobody.concernedSegmentIds).toHaveLength(0);
    expect(nobody.findings.join(" ")).toContain("name none of the");
  });

  it("names an instrument held in the department's own register", () => {
    const reading = readPolicy(
      "Obligations under the Income Tax Act [Chapter 23:06] must be observed.",
      fin,
    );
    expect(reading.citedInstrumentIds.length).toBeGreaterThan(0);
    expect(reading.outsideInstrumentTitles).toHaveLength(0);
    expect(reading.findings.join(" ")).toContain("from this department's register");
  });

  it("flags an instrument outside the register rather than silently accepting it", () => {
    const reading = readPolicy(
      "The Public Health Act [Chapter 15:17] governs the inspection of premises.",
      fin,
    );
    expect(reading.citedInstrumentIds).toHaveLength(0);
    expect(reading.outsideInstrumentTitles.length).toBeGreaterThan(0);
    expect(reading.findings.join(" ")).toContain("outside this department's register");
  });

  it("states each of the seven clause kinds, and stays silent about none it cannot see", () => {
    const nothing = readPolicy("Intent only.", fin);
    CLAUSE_KEYS.forEach((key) => expect(nothing.clauses[key], key).toBe(false));
    expect(nothing.breadth).toBe(0);

    const everything = readPolicy(
      "The authority shall fund the programme. A register of licensed operators must be kept, and " +
        "officers shall inspect premises and audit compliance. A penalty applies to an offence. " +
        "A transition period of six months applies. The authority shall monitor and evaluate, and " +
        "shall review the threshold within two years of commencement.",
      fin,
    );
    CLAUSE_KEYS.forEach((key) => expect(everything.clauses[key], key).toBe(true));
    expect(everything.breadth).toBeGreaterThan(40);
  });

  it("keeps the breadth inside its stated bounds", () => {
    expect(readPolicy("", fin).breadth).toBe(0);
    const huge = readPolicy(Array.from({ length: 40 }, (_, index) => `Party ${index} must comply.`).join(" "), fin);
    expect(huge.breadth).toBeLessThanOrEqual(100);
    expect(huge.actionSentences).toHaveLength(40);
  });
});
