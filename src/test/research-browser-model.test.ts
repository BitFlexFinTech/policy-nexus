import { describe, expect, it } from "vitest";
import { assembleBriefWithFindings } from "@/services/research/researchAssembly";
import { passagesFromSources } from "@/services/research/researchBrowserModel";
import { RESEARCH_BRIEF_SECTIONS } from "@/config/research";

/**
 * The parts of the free in-browser model that can be checked without a browser: how it is fed, and how
 * what it finds is written up. (Whether the model really answers is proved in a real browser by
 * `e2e/research-model.spec.ts`, because a unit test cannot run ONNX.)
 */
describe("the free in-browser research model", () => {
  it("is fed the document's FULL text, and falls back to the quoted passage if the text is gone", () => {
    const sources = [
      { id: "doc-1", name: "Agriculture framework", excerpt: "…into nine pillars…" },
      { id: "doc-2", name: "ICT policy", excerpt: "…universal access…" },
    ];

    const passages = passagesFromSources(sources, (id) =>
      id === "doc-1" ? "The framework groups the challenges into nine pillars." : undefined,
    );

    expect(passages[0].name).toBe("Agriculture framework");
    expect(passages[0].text).toContain("nine pillars");
    // No full text for the second one, so the passage the library quoted is used instead.
    expect(passages[1].text).toBe("…universal access…");
  });

  it("writes the model's findings into the brief's sections, and still refuses to invent a recommendation", () => {
    const brief = assembleBriefWithFindings(
      "agriculture pillars",
      [
        { text: "nine", sourceName: "National Agriculture Policy Framework (demonstration extract)" },
      ],
      RESEARCH_BRIEF_SECTIONS,
    );

    for (const section of RESEARCH_BRIEF_SECTIONS) {
      expect(brief).toContain(section);
    }
    // The finding is quoted and attributed...
    expect(brief).toContain("“nine”");
    expect(brief).toContain("National Agriculture Policy Framework");
    // ...and the section that needs a judgement still says plainly that it was not produced.
    expect(brief).toMatch(/Recommendations\nNot produced\./);
  });

  it("says plainly, in the brief, when no document answered a section", () => {
    const brief = assembleBriefWithFindings("an unheld subject", [], RESEARCH_BRIEF_SECTIONS);

    expect(brief).toContain("No passage in the research library answered this topic for this section.");
    expect(brief).toMatch(/Recommendations\nNot produced\./);
    // With nothing found, nothing may be presented as a finding.
    expect(brief).not.toContain("•");
  });
});