import { describe, it, expect, beforeEach } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { getStakeholderSegment, segmentWeight } from "@/config/reference";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { readPolicy } from "@/services/assessment/policyReading";
import type { AssessmentRequest, AssessmentRun } from "@/services/assessment/types";
import { clearRuns } from "@/services/assessment/runStore";

const requestWith = (
  departmentId: string,
  policyText: string,
  source: AssessmentRequest["source"] = "paste",
): AssessmentRequest => ({
  departmentId: departmentId as AssessmentRequest["departmentId"],
  policyText,
  source,
});

const presetFor = (departmentId: string): AssessmentRequest => {
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

const build = (request: AssessmentRequest): Promise<AssessmentRun> =>
  assessmentService.buildRun(request);

/**
 * The engine reads the draft (BATCH A), weights the figures by what each group
 * stands for (BATCH B), and derives its risks and recommendations from the run
 * rather than printing a fixed bank (BATCH C). These gates fail if any of that
 * stops being true. The old engine would have failed every one of them, because it
 * never opened the policy text and averaged 51,478 researchers together with
 * 7,891,035 women.
 */
describe("simulation power — the draft drives the run, and the weights are real", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearRuns();
  });

  /* ------------------------------- BATCH A ------------------------------- */

  it("A — the same department gives a DIFFERENT run for a different draft, and says so on the screen", async () => {
    const women = await build(
      requestWith(
        "fin",
        "Informal traders in urban markets must be registered, and a transition period of twelve months applies before the register opens.",
      ),
    );
    const nobody = await build(
      requestWith("fin", "This measure restates the reporting cycle already in force."),
    );

    // `fin` models informal traders (it models no women's group), so this is the group
    // the two drafts must treat differently.
    const addressedNote = women.reactions.find(
      (reaction) => reaction.segmentId === "informal-traders",
    )!;
    const ignoredNote = nobody.reactions.find(
      (reaction) => reaction.segmentId === "informal-traders",
    )!;
    expect(addressedNote.note).toContain("The draft's own words address this group");
    expect(ignoredNote.note).toContain("do not address this group");

    // The engine and the reader must agree exactly: every reaction's note says whether
    // the draft addresses that group, and it says so for precisely the groups the
    // reading found. This fails if the engine stops honouring the reading.
    const reading = readPolicy(
      "Informal traders in urban markets must be registered, and a transition period of twelve months applies before the register opens.",
      findDepartment("fin")!,
    );
    women.reactions.forEach((reaction) => {
      const addressed = reading.concernedSegmentIds.includes(reaction.segmentId);
      expect(
        reaction.note.includes("words address this group"),
        `${reaction.segmentId} is marked addressed only if the reader found it`,
      ).toBe(addressed);
    });

    // The reading reaches the screen as its own round, before any figure is shown.
    const readRound = women.rounds.find((round) => round.message.startsWith("Draft read:"));
    expect(readRound, "the run states what it read").toBeTruthy();
    expect(readRound!.message).toContain("sentence");
    expect(readRound!.message).toContain("modelled groups named");

    expect(women.summary).toContain("population-weighted support index");
    expect(women.summary).toContain("its own reach is");
  });

  it("A — flags an instrument the draft names from OUTSIDE the department's register", async () => {
    const reading = readPolicy(
      "The Public Health Act [Chapter 15:17] governs inspection of premises.",
      findDepartment("fin")!,
    );
    expect(reading.outsideInstrumentTitles.length).toBeGreaterThan(0);

    const run = await build(
      requestWith(
        "fin",
        "The Public Health Act [Chapter 15:17] governs inspection of premises, and each licensee must register.",
      ),
    );
    const warning = run.rounds.find(
      (round) => round.tone === "warning" && /outside this department's register/.test(round.message),
    );
    expect(warning, "the run warns about the outside instrument").toBeTruthy();
    expect(run.risks.map((risk) => risk.id)).toContain("risk-outside-instrument");
  });

  it("A — every department's own prepared draft is read, and the reading is deterministic", async () => {
    for (const department of DEPARTMENTS) {
      const request = presetFor(department.id);
      const run = await build(request);
      expect(
        run.rounds.some((round) => round.message.startsWith("Draft read:")),
        `${department.id} states what it read`,
      ).toBe(true);
      const metric = run.metrics.find((item) => item.id === "metric-draft-reach")!;
      expect(metric.value, `${department.id} states the draft's reach`).toMatch(/\d+ of \d+ groups/);
      // The metric must report the REAL reading, not an empty one: this fails if the
      // engine ever stops passing the draft to the reader.
      const reading = readPolicy(request.policyText, department);
      expect(reading.actionSentences.length, `${department.id} draft has actions`).toBeGreaterThan(0);
      expect(metric.note, `${department.id} states the real action count`).toContain(
        `assigns ${reading.actionSentences.length} `,
      );
      const again = await build(request);
      expect(JSON.stringify(again), `${department.id} replays identically`).toBe(JSON.stringify(run));
    }
  });

  /* ------------------------------- BATCH B ------------------------------- */

  it("B — the support index is the population-weighted mean, and the equal-weight figure is stated beside it", async () => {
    const run = await build(presetFor("fin"));
    const weights = run.reactions.map((reaction) => segmentWeight(reaction.segmentId));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weighted = Math.round(
      run.reactions.reduce((sum, reaction, index) => sum + reaction.supportIndex * weights[index], 0) /
        totalWeight,
    );
    const equal = Math.round(
      run.reactions.reduce((sum, reaction) => sum + reaction.supportIndex, 0) /
        run.reactions.length,
    );

    const metric = run.metrics.find((item) => item.id === "metric-support")!;
    expect(metric.value).toBe(`${weighted} / 100`);
    expect(metric.note).toContain(`${equal}/100`);
    // The weighting is not decoration: the two figures actually differ for this run.
    expect(weighted).not.toBe(equal);
  });

  it("B — the weights are the researched shares: published where one exists, neutral where none does", async () => {
    const run = await build(presetFor("fin"));
    const shares = run.reactions.map((reaction) => getStakeholderSegment(reaction.segmentId).share);
    expect(shares.some((share) => share !== null), "a published share is in play").toBe(true);
    expect(shares.some((share) => share === null), "a Modelled group is in play").toBe(true);
    run.reactions.forEach((reaction) => {
      expect(
        segmentWeight(reaction.segmentId),
        `${reaction.segmentId} carries its published share or the neutral weight`,
      ).toBeGreaterThan(0);
    });
  });

  it("B — giving one group a heavier weight pulls the index toward that group's own position", async () => {
    const run = await build(presetFor("fin"));
    const weights = run.reactions.map((reaction) => segmentWeight(reaction.segmentId));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weighted = Math.round(
      run.reactions.reduce((sum, reaction, index) => sum + reaction.supportIndex * weights[index], 0) /
        totalWeight,
    );
    // Weight one group a thousand times heavier. The index must move TOWARD that group's
    // position — it cannot land on it exactly, because the other groups still carry weight.
    const highest = run.reactions.reduce(
      (best, reaction, index) =>
        reaction.supportIndex > run.reactions[best].supportIndex ? index : best,
      0,
    );
    const target = run.reactions[highest].supportIndex;
    const heaviest = weights.map((weight, index) => (index === highest ? weight * 1000 : weight));
    const totalHeaviest = heaviest.reduce((sum, weight) => sum + weight, 0);
    const shifted = Math.round(
      run.reactions.reduce(
        (sum, reaction, index) => sum + reaction.supportIndex * heaviest[index],
        0,
      ) / totalHeaviest,
    );
    expect(Math.abs(shifted - target)).toBeLessThan(Math.abs(weighted - target));
    expect(Math.abs(shifted - target)).toBeLessThanOrEqual(2);
    expect(shifted).not.toBe(weighted);
  });

  /* ------------------------------- BATCH C ------------------------------- */

  it("C — no action raises 'Intent without an action'; many actions raise absorption", async () => {
    const intentOnly = await build(
      requestWith("fin", "This policy notes the importance of a stable currency."),
    );
    expect(intentOnly.risks.map((risk) => risk.id)).toContain("risk-intent-only");
    expect(intentOnly.risks.map((risk) => risk.id)).not.toContain("risk-absorption");
    expect(intentOnly.risks.find((risk) => risk.id === "risk-intent-only")!.severity).toBe("high");

    const manyActions = await build(
      requestWith(
        "fin",
        "Each bank must register. Each bureau must report monthly. Each dealer must file a return. " +
          "The authority must inspect premises. Every branch must publish its charges. Each agent must keep records.",
      ),
    );
    expect(manyActions.risks.map((risk) => risk.id)).toContain("risk-absorption");
    expect(manyActions.risks.map((risk) => risk.id)).not.toContain("risk-intent-only");
  });

  it("C — 'Transition support' is raised only when the draft carries no transition period", async () => {
    const without = await build(
      requestWith("fin", "Each taxpayer must file a return. Each bank must register."),
    );
    expect(without.risks.map((risk) => risk.id)).toContain("risk-transition");

    const carried = await build(
      requestWith(
        "fin",
        "Each taxpayer must file a return, and a transition period of twelve months applies before obligations begin. " +
          "A register of licensed dealers must be kept.",
      ),
    );
    expect(carried.risks.map((risk) => risk.id)).not.toContain("risk-transition");
    // and the advice that would answer it is gone too
    expect(carried.recommendations.map((item) => item.id)).not.toContain("rec-phase");
  });

  it("C — no run prints advice for a problem it did not find", async () => {
    for (const department of DEPARTMENTS) {
      const run = await build(presetFor(department.id));
      expect(run.risks.length, `${department.id} raises at least one risk`).toBeGreaterThan(0);
      expect(
        run.recommendations.length,
        `${department.id} never advises more than it found`,
      ).toBeLessThanOrEqual(run.risks.length + 2); // at most two clause-gap remedies
      expect(
        new Set(run.risks.map((risk) => risk.id)).size,
        `${department.id} risks are distinct`,
      ).toBe(run.risks.length);
      expect(
        new Set(run.recommendations.map((item) => item.id)).size,
        `${department.id} advice is distinct`,
      ).toBe(run.recommendations.length);
      run.risks.forEach((risk) => expect(["low", "medium", "high"]).toContain(risk.severity));
    }
  });

  it("C — a complete draft raises fewer risks than a bare one", async () => {
    const bare = await build(requestWith("fin", "Each bank must register."));
    const complete = await build(
      requestWith(
        "fin",
        "Each bank must register by 31 January. A transition period of twelve months applies before the register opens. " +
          "The Treasury shall fund the register from the consolidated revenue fund. The authority shall monitor and evaluate, " +
          "and shall review the threshold annually. A penalty applies to an offence, and officers shall inspect premises to " +
          "audit compliance. Women traders, youth and smallholder farmers must be briefed on the new register.",
      ),
    );
    expect(complete.risks.length).toBeLessThan(bare.risks.length);
    expect(complete.risks.map((risk) => risk.id)).not.toContain("risk-funding");
    expect(complete.risks.map((risk) => risk.id)).not.toContain("risk-transition");
    expect(complete.risks.map((risk) => risk.id)).not.toContain("risk-scope");
  });
});
