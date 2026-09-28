import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { compareRuns } from "@/services/assessment/compare";
import { clearRuns } from "@/services/assessment/runStore";
import type { AssessmentRequest } from "@/services/assessment/types";
import { clearSession, signInToDepartment } from "@/session/session";

const request = (
  departmentId: string,
  policyText: string,
  levers?: AssessmentRequest["levers"],
): AssessmentRequest => ({
  departmentId: departmentId as AssessmentRequest["departmentId"],
  policyText,
  source: "paste",
  levers,
});

const thin = "Each bank must register. Each bureau must report monthly.";
const full =
  "Each bank must register. Each bureau must report monthly, and a transition period of twelve months applies before the duties begin.";

describe("comparing two drafts — what changed, and did it help", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
  });

  it("is deterministic, and reads the same in either order with the signs reversed", async () => {
    const a = await assessmentService.buildRun(request("fin", thin));
    const b = await assessmentService.buildRun(request("fin", full));
    const forward = compareRuns(a, b);
    const again = compareRuns(a, b);
    expect(again).toEqual(forward);
    expect(forward.status).toBe("compared");
    if (forward.status !== "compared") return;

    const backward = compareRuns(b, a);
    expect(backward.status).toBe("compared");
    if (backward.status !== "compared") return;
    // The same rows, with the two columns swapped and every delta reversed.
    forward.comparison.metrics.forEach((metric, index) => {
      expect(backward.comparison.metrics[index].label).toBe(metric.label);
      expect(backward.comparison.metrics[index].a).toBe(metric.b);
      expect(backward.comparison.metrics[index].b).toBe(metric.a);
    });
    forward.comparison.groups.forEach((group, index) => {
      expect(backward.comparison.groups[index].delta).toBe(-group.delta);
    });
    expect(backward.comparison.referenceA).toBe(forward.comparison.referenceB);
  });

  it("refuses to compare two different departments, in words", async () => {
    const finance = await assessmentService.buildRun(request("fin", thin));
    const health = await assessmentService.buildRun(request("health", thin));
    const result = compareRuns(finance, health);
    expect(result.status).toBe("refused");
    if (result.status !== "refused") return;
    expect(result.reason).toContain("different departments");
    expect(result.reason).toContain("same department");
  });

  it("reports the assumption changes when the two runs were set up differently", async () => {
    const a = await assessmentService.buildRun(request("fin", thin));
    const b = await assessmentService.buildRun(
      request("fin", thin, {
        funding: "within-budget",
        capacity: "unstated",
        enforcement: "standard",
        phaseInMonths: 12,
      }),
    );
    const result = compareRuns(a, b);
    expect(result.status).toBe("compared");
    if (result.status !== "compared") return;
    expect(result.comparison.assumptionChanges.join(" ")).toContain("funding: unstated → within-budget");
    expect(result.comparison.assumptionChanges.join(" ")).toContain("phasing: 0 → 12 months");
  });

  it("names the risks the second draft raised or cleared", async () => {
    const bare = await assessmentService.buildRun(
      request("fin", "Each bank must register. Each bureau must report monthly."),
    );
    const withTransition = await assessmentService.buildRun(
      request(
        "fin",
        "Each bank must register. Each bureau must report monthly, and a transition period of twelve months applies before the duties begin.",
      ),
    );
    const result = compareRuns(bare, withTransition);
    expect(result.status).toBe("compared");
    if (result.status !== "compared") return;
    expect(result.comparison.risksCleared).toContain("Transition support");
    // and the same comparison the other way round raises it
    const reverse = compareRuns(withTransition, bare);
    if (reverse.status !== "compared") return;
    expect(reverse.comparison.risksRaised).toContain("Transition support");
  });

  it("states a verdict naming both runs, and never claims a forecast", async () => {
    const a = await assessmentService.buildRun(request("fin", thin));
    const b = await assessmentService.buildRun(request("fin", full));
    const result = compareRuns(a, b);
    if (result.status !== "compared") return;
    expect(result.comparison.verdict).toContain(result.comparison.referenceA);
    expect(result.comparison.verdict).toContain(result.comparison.referenceB);
    expect(result.comparison.verdict).toContain("not a forecast");
  });

  it("renders the comparison screen for two real runs without throwing", async () => {
    signInToDepartment("fin");
    const a = await assessmentService.run(request("fin", thin));
    const b = await assessmentService.run(request("fin", full));
    window.history.pushState({}, "", `/app/compare/${encodeURIComponent(a.id)}/${encodeURIComponent(b.id)}`);
    render(<App />);

    expect(screen.getByRole("heading", { name: "Compare two drafts" })).toBeInTheDocument();
    expect(screen.getByText(/population-weighted support index/)).toBeInTheDocument();
    expect(screen.getByText("Headline figures")).toBeInTheDocument();
    expect(screen.getByText("Risks raised and cleared")).toBeInTheDocument();
    expect(screen.getByText(a.reactions[0].label)).toBeInTheDocument();
  });
});
