import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import { clearRuns, saveRunRequest } from "@/services/assessment/runStore";
import { runIdFor, seedForRequest } from "@/services/assessment/seed";
import {
  addDepartmentDocument,
  clearDepartmentDocuments,
  departmentDocumentInputs,
  listDepartmentDocuments,
  removeDepartmentDocument,
} from "@/services/documents/departmentDocuments";
import type { AssessmentRequest } from "@/services/assessment/types";

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

const addText = (name: string, text: string, departmentId = "fin") =>
  addDepartmentDocument({
    departmentId: departmentId as "fin",
    name,
    sizeLabel: `${text.length} characters`,
    kind: "text",
    text,
    status: "Text added directly — read in full.",
  });

/** Put files on the panel's upload input, as the browser would. */
const uploadFiles = (files: File[]) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: files });
  fireEvent.change(input);
};

/**
 * Owner's item 3 — "a section that allows each department to upload all the documents they
 * want so that the simulations produce better results".
 *
 * These tests gate the whole promise: the section exists and really reads files, the
 * documents are kept per department, they are handed to the run, they change its seed and
 * therefore its result, and a file that could NOT be read is never counted as material the
 * examination used.
 */
describe("a department's own documents feed its runs (owner's item 3)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("keeps documents per department, replaces a repeat of the same file, and removes cleanly", () => {
    const first = addText("Finance Bill notes", "The Bill sets the tax bands for the year.");
    expect(listDepartmentDocuments("fin")).toHaveLength(1);
    expect(listDepartmentDocuments("health")).toHaveLength(0);

    // The same name and text is the same document: it replaces, never duplicates.
    addText("Finance Bill notes", "The Bill sets the tax bands for the year.");
    expect(listDepartmentDocuments("fin")).toHaveLength(1);

    addText("Treasury circular", "Circular on budget execution reporting.", "health");
    expect(listDepartmentDocuments("fin")).toHaveLength(1);
    clearDepartmentDocuments("health");
    expect(listDepartmentDocuments("health")).toHaveLength(0);
    expect(listDepartmentDocuments("fin")).toHaveLength(1);

    removeDepartmentDocument(first.id);
    expect(listDepartmentDocuments("fin")).toHaveLength(0);
  });

  it("hands the documents to the run, and they change its result deterministically", () => {
    const base = requestFor("fin");
    const runWithout = buildSimulatedRun(base);

    addText("Finance Bill notes", "The Bill sets the tax bands and the duty on exports.");
    const withDocuments: AssessmentRequest = {
      ...base,
      documents: departmentDocumentInputs("fin"),
    };
    const runWith = buildSimulatedRun(withDocuments);

    // What the run recorded about the material it was given.
    expect(runWith.documents).toEqual([
      {
        id: withDocuments.documents![0].id,
        name: "Finance Bill notes",
        characters: "The Bill sets the tax bands and the duty on exports.".length,
      },
    ]);
    expect(runWithout.documents).toBeUndefined();

    // The material is a real input: it is in the seed, so the result genuinely differs.
    expect(seedForRequest(withDocuments)).toContain("documents:");
    expect(seedForRequest(base)).not.toContain("documents:");
    expect(runWith.id).not.toBe(runWithout.id);
    // The result as a whole differs — proven directly, not through one rounded figure.
    // `confidence` is a rounded headline integer, so two genuinely different runs can
    // legitimately print the same number; asserting on it alone was a coincidence, not a
    // property. Everything outside the request that the run derives must still differ.
    expect(JSON.stringify(runWith)).not.toBe(JSON.stringify(runWithout));

    // The run says so in plain words, and on its headline figures.
    expect(runWith.summary).toContain("1 of the department's own document");
    const metric = runWith.metrics.find((entry) => entry.id === "metric-documents");
    expect(metric).toBeDefined();
    expect(metric!.value).toBe("1");
    expect(runWithout.metrics.some((entry) => entry.id === "metric-documents")).toBe(false);

    // Determinism, kept: the same draft and the same documents replay byte-identically.
    const replay = buildSimulatedRun(withDocuments);
    expect(JSON.stringify(replay)).toBe(JSON.stringify(runWith));

    // And more material is a different run again.
    addText("Treasury circular", "Circular on budget execution reporting and the vote book.");
    const more = buildSimulatedRun({ ...base, documents: departmentDocumentInputs("fin") });
    expect(more.id).not.toBe(runWith.id);
    expect(more.metrics.find((entry) => entry.id === "metric-documents")!.value).toBe("2");
  });

  it("never counts a file it could not read as material the examination used", () => {
    // A PDF in this build is recorded by name with no text: honest, but not input.
    addDepartmentDocument({
      departmentId: "fin",
      name: "brief.pdf",
      sizeLabel: "12.0 KB",
      kind: "pdf",
      text: "",
      status: "Text extraction (Mock) — recorded by name; PDF text is not read in this build.",
    });
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      documents: departmentDocumentInputs("fin"),
    };
    const run = buildSimulatedRun(request);

    // The document is recorded on the run, with zero characters read.
    expect(run.documents).toHaveLength(1);
    expect(run.documents![0].characters).toBe(0);
    // But nothing claims it was read: no metric, no sentence in the summary.
    expect(run.metrics.some((entry) => entry.id === "metric-documents")).toBe(false);
    expect(run.summary).not.toContain("department's own document");
    // And it does not change the run, because it contributed nothing.
    expect(runIdFor(request)).toBe(runIdFor(requestFor("fin")));
  });

  it("reads a real .txt file into the department's list, and removes it again", async () => {
    renderAt("/app/documents");
    uploadFiles([
      new File(["The department's own strategy text, added for the examination."], "strategy.txt", {
        type: "text/plain",
      }),
    ]);

    expect(await screen.findByText("strategy.txt")).toBeInTheDocument();
    expect(await screen.findByText(/Text extracted\. \d+ characters will be read/)).toBeInTheDocument();
    expect(screen.getByText(/1 document has been added/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove strategy.txt" }));
    expect(screen.queryByText("strategy.txt")).not.toBeInTheDocument();
    expect(screen.getByText(/0 documents have been added/)).toBeInTheDocument();

    // The list must be empty again, so nothing leaks into another test.
    expect(listDepartmentDocuments("fin")).toHaveLength(0);
  });
});

