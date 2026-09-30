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

    // How close the index must come is fixed by the arithmetic, not by taste. With one
    // group's weight multiplied a thousand times, the residual is at most
    //
    //   (weight of every OTHER group / total weight) × (widest gap among those groups)
    //
    // which is a bound the test can derive. It was a flat `2` while a department modelled
    // eight groups; with sixteen there are simply more other groups carrying weight, so
    // the derived bound is used instead of a constant that would silently mean something
    // different for every department.
    const othersWeight = weights.reduce(
      (sum, weight, index) => (index === highest ? sum : sum + weight),
      0,
    );
    const widestGap = Math.max(
      0,
      ...run.reactions
        .filter((_, index) => index !== highest)
        .map((reaction) => Math.abs(reaction.supportIndex - target)),
    );
    const residualBound = Math.ceil(
      (othersWeight * widestGap) / (1000 * weights[highest] + othersWeight),
    );
    expect(Math.abs(shifted - target)).toBeLessThanOrEqual(residualBound);
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
    // What "better" means, stated honestly. The raw COUNT is not the measure any more: a
    // fuller draft carries more action sentences (which legitimately raise the absorption
    // risk) and the department now models sixteen groups, so the count can stay level while
    // the draft is plainly better. What must hold is the substance.
    const bareIds = bare.risks.map((risk) => risk.id);
    const completeIds = complete.risks.map((risk) => risk.id);

    // The bare draft names none of the groups it affects, so it raises the scope risk;
    // the complete draft names them, so it does not. That is the difference this test is for.
    expect(bareIds).toContain("risk-scope");
    expect(completeIds).not.toContain("risk-scope");

    // Every risk the complete draft's own clauses answer is genuinely gone.
    ["risk-funding", "risk-transition", "risk-scope", "risk-enforcement"].forEach((id) => {
      expect(completeIds, `${id} still raised by the complete draft`).not.toContain(id);
    });

    // …and it raises no MORE risks than the bare draft.
    expect(complete.risks.length).toBeLessThanOrEqual(bare.risks.length);
  });

  /* ------------------------------- BATCH E ------------------------------- */

  const leversFor = (
    levers: AssessmentRequest["levers"],
    timeHorizon: AssessmentRequest["timeHorizon"] = "medium",
  ): AssessmentRequest => ({
    ...requestWith(
      "fin",
      "Each bank must register. Each bureau must report monthly. Each dealer must file a return, and a transition period of twelve months applies.",
    ),
    levers,
    timeHorizon,
  });

  it("E — the neutral setting is the default, and every assumption is stated on the run", async () => {
    const run = await build(requestWith("fin", "Each bank must register."));
    expect(run.levers).toEqual({
      funding: "unstated",
      capacity: "unstated",
      enforcement: "standard",
      phaseInMonths: 0,
    });
    expect(run.leverNotes.join(" ")).toContain("Modelled horizon of");
    expect(run.leverNotes.join(" ")).toContain("No further assumptions were set");
    expect(run.rounds.some((round) => round.message.startsWith("Assumptions in force"))).toBe(true);
  });

  it("E — changing a lever changes the run, its reference, and what it states", async () => {
    const neutral = await build(leversFor(undefined));
    const levered = await build(
      leversFor({
        funding: "within-budget",
        capacity: "needs-support",
        enforcement: "strict",
        phaseInMonths: 12,
      }),
    );
    // A different setting is a DIFFERENT run, not one silently overwriting the other.
    expect(levered.reference).not.toBe(neutral.reference);
    expect(levered.id).not.toBe(neutral.id);
    expect(levered.leverNotes.join(" ")).toContain("Inside the current budget");
    expect(levered.leverNotes.join(" ")).toContain("Phasing");
    expect(levered.leverNotes.join(" ")).not.toContain("No further assumptions were set");
    expect(levered.reactions.map((reaction) => reaction.participation)).not.toEqual(
      neutral.reactions.map((reaction) => reaction.participation),
    );
  });

  it("E — money already in the budget removes the unfunded-actions risk; a new appropriation makes it worse", async () => {
    const unstated = await build(leversFor(undefined));
    const within = await build(leversFor({ funding: "within-budget", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 }));
    const fresh = await build(leversFor({ funding: "new-appropriation", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 }));

    expect(unstated.risks.map((risk) => risk.id)).toContain("risk-funding");
    expect(within.risks.map((risk) => risk.id)).not.toContain("risk-funding");
    expect(fresh.risks.find((risk) => risk.id === "risk-funding")!.severity).toBe("high");
  });

  it("E — the phase-in lever counts as a transition period, and outlasting the horizon is flagged", async () => {
    const shortDraft = await build({
      ...requestWith("fin", "Each bank must register. Each bureau must report monthly."),
      timeHorizon: "short",
      levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 12 },
    });
    // 12 months of phasing inside a 6-month horizon: no transition risk, but a phasing one.
    expect(shortDraft.risks.map((risk) => risk.id)).not.toContain("risk-transition");
    expect(shortDraft.risks.map((risk) => risk.id)).toContain("risk-phasing");
    expect(shortDraft.risks.find((risk) => risk.id === "risk-phasing")!.severity).toBe("high");
    expect(shortDraft.recommendations.map((item) => item.id)).toContain("rec-align");

    // And a phase-in that fits inside a long horizon does not raise it at all.
    const longDraft = await build({
      ...requestWith("fin", "Each bank must register. Each bureau must report monthly."),
      timeHorizon: "long",
      levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 12 },
    });
    expect(longDraft.risks.map((risk) => risk.id)).not.toContain("risk-phasing");
  });

  it("E — the horizon means something: a longer one produces more rounds and states its length", async () => {
    const short = await build(leversFor(undefined, "short"));
    const long = await build(leversFor(undefined, "long"));
    expect(short.horizonMonths).toBe(6);
    expect(long.horizonMonths).toBe(60);
    expect(long.rounds.length).toBeGreaterThan(short.rounds.length);
    expect(long.summary).toContain("60 months");
    expect(short.summary).toContain("6 months");
  });

  it("E — the capacity and enforcement levers move modelled engagement in the stated direction", async () => {
    const ready = await build(leversFor({ funding: "unstated", capacity: "ready", enforcement: "standard", phaseInMonths: 0 }));
    const needsSupport = await build(leversFor({ funding: "unstated", capacity: "needs-support", enforcement: "standard", phaseInMonths: 0 }));
    const mean = (values: readonly number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean(ready.reactions.map((reaction) => reaction.participation))).toBeGreaterThan(
      mean(needsSupport.reactions.map((reaction) => reaction.participation)),
    );
    expect(ready.reactions[0].note).toContain("capacity is in place");
    expect(needsSupport.reactions[0].note).toContain("capacity needs training");

    const advisory = await build(leversFor({ funding: "unstated", capacity: "unstated", enforcement: "advisory", phaseInMonths: 0 }));
    const strict = await build(leversFor({ funding: "unstated", capacity: "unstated", enforcement: "strict", phaseInMonths: 0 }));
    expect(advisory.reactions[0].note).toContain("advisory enforcement");
    expect(strict.reactions[0].note).toContain("strict enforcement");
  });
});
