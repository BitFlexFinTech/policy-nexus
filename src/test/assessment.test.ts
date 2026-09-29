import { describe, it, expect, beforeEach } from "vitest";
import { DEPARTMENTS, findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import type { AssessmentRequest } from "@/services/assessment/types";
import { clearRuns, getRunRequest, listRunRequests, listRunRequestsFor } from "@/services/assessment/runStore";

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
 * The deterministic engine. These are genuine, failable guards: the same request
 * must reproduce a byte-identical run, and the engine must cover every
 * stakeholder group and priority a department declares.
 */
describe("assessment engine — determinism and coverage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearRuns();
  });

  it("returns a byte-identical run for the same request", async () => {
    const request = requestFor("fin");
    const first = await assessmentService.buildRun(request);
    const second = await assessmentService.buildRun(request);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.seed).toBe(second.seed);
    expect(first.id).toBe(second.id);
  });

  it("ignores cosmetic whitespace and case in the policy text", async () => {
    const base = requestFor("agri");
    const messy: AssessmentRequest = {
      ...base,
      policyText: `  ${base.policyText.replace(/ /g, "\n  ").toUpperCase()}  `,
    };
    expect((await assessmentService.buildRun(messy)).id).toBe(
      (await assessmentService.buildRun(base)).id,
    );
  });

  it("produces a different run when the policy text actually changes", async () => {
    const base = requestFor("health");
    const changed: AssessmentRequest = { ...base, policyText: `${base.policyText} Additional clause.` };
    expect((await assessmentService.buildRun(changed)).id).not.toBe(
      (await assessmentService.buildRun(base)).id,
    );
  });

  it.each(DEPARTMENTS)("covers every modelled group and priority for $abbr", async (department) => {
    const run = await assessmentService.buildRun(requestFor(department.id));
    expect(run.reactions).toHaveLength(department.segments.length);
    expect(run.impacts).toHaveLength(department.priorities.length);
    expect(run.status).toBe("complete");
    expect(run.metrics).toHaveLength(5);
    expect(run.confidence).toBeGreaterThanOrEqual(56);
    expect(run.confidence).toBeLessThanOrEqual(92);
    run.reactions.forEach((reaction, index) => {
      expect(reaction.segmentId).toBe(department.segments[index]);
      expect(reaction.supportIndex).toBeGreaterThanOrEqual(0);
      expect(reaction.supportIndex).toBeLessThanOrEqual(100);
      expect(reaction.note.length).toBeGreaterThan(10);
    });
    run.rounds.forEach((round) => {
      expect(round.actor.length).toBeGreaterThan(0);
      expect(round.message.length).toBeGreaterThan(0);
    });
  });

  it("buildRun is pure — it does not record the run", async () => {
    await assessmentService.buildRun(requestFor("ict"));
    expect(listRunRequests()).toHaveLength(0);
  });

  it("run records the request and can be looked up again", async () => {
    const run = await assessmentService.run(requestFor("zida"));
    expect(listRunRequests()).toHaveLength(1);
    expect(getRunRequest(run.id)?.policyText).toBe(run.policyText);
    expect((await assessmentService.getRun(run.id))?.id).toBe(run.id);
    expect(listRunRequestsFor("zida")).toHaveLength(1);
    expect(listRunRequestsFor("opc")).toHaveLength(0);
    expect((await assessmentService.listRuns("zida"))[0].id).toBe(run.id);
  });

  it("re-running identical inputs replaces the register row instead of duplicating it", async () => {
    const request = requestFor("mines");
    await assessmentService.run(request);
    await assessmentService.run(request);
    expect(listRunRequests()).toHaveLength(1);
  });

  /**
   * GATE — the run feed is shown on screen, so it must never print the engine's starting
   * code, which contains the whole submitted policy text. The line used to read
   * "Seed <the entire draft>. Assessment complete", which put an officer's own draft into
   * the visible feed as one long machine string. This guard fails if that returns.
   */
  it("never prints the engine's starting code in the visible run feed", async () => {
    const run = await assessmentService.buildRun(requestFor("env"));
    expect(run.seed.length).toBeGreaterThan(20);
    for (const round of run.rounds) {
      expect(round.message).not.toContain(run.seed);
      expect(round.message).not.toMatch(/seed\s*[:—]/i);
    }
  });
});
