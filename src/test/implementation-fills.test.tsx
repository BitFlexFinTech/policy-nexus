import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import { buildImplementationPack } from "@/services/assessment/implementationPack";
import {
  BLANK,
  fillableRows,
  indicatorRowKey,
  measureRowKey,
  recommendationRowKey,
} from "@/services/assessment/matrices";
import { clearRuns, saveRunRequest } from "@/services/assessment/runStore";
import {
  clearImplementationFills,
  getImplementationFills,
  saveImplementationFill,
} from "@/services/documents/implementationStore";
import type { AssessmentRequest, GeneratedDocument } from "@/services/assessment/types";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

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

const tableWithCaption = (doc: GeneratedDocument, caption: string) =>
  doc.sections.find((section) => section.table?.caption.startsWith(caption))?.table;

/**
 * Filling the working matrices — the owner's third part of this work.
 *
 * The promise is specific: the officer types each answer ONCE, and it appears in every document that
 * prints it. The gate that matters is therefore that the SAME answer reaches the drafted policy and the
 * Implementation pack — if it reached only one, a department would be working from two different versions
 * of its own plans.
 */
describe("completing the working matrices", () => {
  const department = findDepartment("fin")!;
  const run = buildSimulatedRun(requestFor("fin"));

  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("prints the department's answer in BOTH documents, in place of the blank", () => {
    const rowKey = recommendationRowKey(run.recommendations[0].id);
    saveImplementationFill(run.id, rowKey, "office", "Office of the Accountant-General");
    saveImplementationFill(run.id, rowKey, "funding", "Consolidated Revenue Fund");

    const fills = getImplementationFills(run.id);
    const packText = renderDocumentText(buildImplementationPack(run, department, fills));
    const policyText = renderDocumentText(buildPolicyDraft(run, department, fills));

    [packText, policyText].forEach((text) => {
      expect(text).toContain("Office of the Accountant-General");
      expect(text).toContain("Consolidated Revenue Fund");
    });
  });

  it("still prints the marked blank for a row the officer has not completed", () => {
    const rowKey = recommendationRowKey(run.recommendations[0].id);
    saveImplementationFill(run.id, rowKey, "office", "One office only");

    const pack = buildImplementationPack(run, department, getImplementationFills(run.id));
    const cells = tableWithCaption(pack, "Table 4")!.rows.flat();

    // The answer is there…
    expect(cells).toContain("One office only");
    // …and the rows nobody has touched still say so, rather than looking complete.
    expect(cells.filter((cell) => cell === BLANK).length).toBeGreaterThan(0);
  });

  it("clearing an answer restores the marked blank instead of printing an empty cell", () => {
    const rowKey = indicatorRowKey(department.indicators[0].id);
    saveImplementationFill(run.id, rowKey, "target", "3.0% by 2028");
    expect(getImplementationFills(run.id)[rowKey].target).toBe("3.0% by 2028");

    saveImplementationFill(run.id, rowKey, "target", "   ");
    expect(getImplementationFills(run.id)[rowKey]?.target).toBeUndefined();

    const pack = buildImplementationPack(run, department, getImplementationFills(run.id));
    expect(tableWithCaption(pack, "Table 6")!.rows.flat()).toContain(BLANK);
  });

  it("keeps each run's answers to that run", () => {
    const other = buildSimulatedRun({
      ...requestFor("fin"),
      policyText: "A different draft entirely, with a single measure in it.",
    });
    saveImplementationFill(
      run.id,
      recommendationRowKey(run.recommendations[0].id),
      "office",
      "Run A office",
    );

    expect(Object.keys(getImplementationFills(run.id)).length).toBeGreaterThan(0);
    expect(getImplementationFills(other.id)).toEqual({});

    clearImplementationFills(run.id);
    expect(getImplementationFills(run.id)).toEqual({});
  });

  it("offers a box for every row the documents leave blank, and says where the answers live", () => {
    const request = requestFor("fin");
    saveRunRequest(request);
    renderAt(`/app/assessments/${encodeURIComponent(run.id)}/implementation-pack`);

    // One clearly-labelled box per field of every fillable row — no row is missing a box.
    const expected = fillableRows(run, department).reduce((total, row) => total + row.fields.length, 0);
    expect(screen.getAllByPlaceholderText("To be confirmed")).toHaveLength(expected);

    // And the screen says plainly that what is typed is kept in this browser.
    expect(screen.getByText(/kept in this browser, for this run/)).toBeInTheDocument();
  });

  it("leaves both documents exactly as they were when nothing is entered", () => {
    // The blank is the baseline: no answers must mean no change to what the documents print.
    const withNoFills = renderDocumentText(buildPolicyDraft(run, department));
    expect(withNoFills).toContain(BLANK);
    expect(withNoFills).toBe(renderDocumentText(buildPolicyDraft(run, department, {})));
  });

  it("uses a stable row key per measure, so an answer follows its own row", () => {
    expect(measureRowKey(0)).toBe("m:0");
    expect(measureRowKey(7)).toBe("m:7");
    const keys = fillableRows(run, department).map((row) => row.key);
    expect(keys).toEqual([...new Set(keys)]);
  });
});

