/**
 * BATCH 0 — the register's storage fix, the once-per-run generated document, and the evidence card.
 *
 * Three defects, each caught by a gate here so it cannot come back:
 *  (a) the register used to keep each run's document TEXT, which could fill the browser's storage
 *      and make runs vanish with no error — it now keeps a reference and a fingerprint, and the
 *      text is read back from the library only when a run is built;
 *  (b) reopening a generated document used to pay for a SECOND call to the drafting service — it is
 *      now written once per run and reused;
 *  (c) the evidence card's number is READ from the register, never typed, so it cannot disagree
 *      with the library.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useMemo } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { findDepartment } from "@/config/departments";
import { DEFAULT_PLATFORM_CONFIG, OPENROUTER_CHAT_ENDPOINT, clearConfig, saveConfig } from "@/config/platform";
import { libraryHoldLine } from "@/config/runNotice";
import { clearSession, signInToDepartment } from "@/session/session";
import { buildSimulatedRun } from "@/services/assessment/AssessmentService";
import {
  RUNS_STORAGE_KEY,
  clearRuns,
  getRunRequest,
  saveRunRequest,
} from "@/services/assessment/runStore";
import { rehydrateStoredRun } from "@/services/assessment/runHydration";
import { runIdFor } from "@/services/assessment/seed";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import {
  addDepartmentDocument,
  departmentDocumentInputs,
  removeDepartmentDocument,
} from "@/services/documents/departmentDocuments";
import {
  GENERATED_DOCUMENTS_LIMIT,
  clearStoredDocuments,
  getStoredDocument,
  saveStoredDocument,
} from "@/services/documents/generatedDocumentStore";
import { useGeneratedDocument } from "@/services/documents/useGeneratedDocument";
import type { AssessmentRequest, GeneratedDocument } from "@/services/assessment/types";

/* The drafting service is mocked so a "call" can be counted. Nothing leaves the test. */
const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));
vi.mock("@/services/documents/remoteDraftingClient", () => ({
  remoteDraftingClient: () => ({ generate: generateMock }),
}));

const MATERIAL =
  "The Bill sets the tax bands and the duty on exports, and the ministry reviews the settlement rules each quarter.";

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

const addMaterial = (name: string, text: string, departmentId = "fin") =>
  addDepartmentDocument({
    departmentId: departmentId as "fin",
    name,
    sizeLabel: `${text.length} characters`,
    kind: "text",
    text,
    status: "Text added directly — read in full.",
  });

const aDocument = (title: string): GeneratedDocument => ({
  kind: "report",
  title,
  subtitle: "",
  fileStem: "doc",
  sections: [],
});

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

beforeEach(() => {
  window.localStorage.clear();
  clearConfig();
  clearRuns();
  clearStoredDocuments();
  clearSession();
  generateMock.mockReset();
});

afterEach(() => cleanup());

/* ------------------------------------------------------------------------- */
/* (a) the register keeps no document text                                     */
/* ------------------------------------------------------------------------- */

describe("Batch 0 (a) — the register keeps a reference and a fingerprint, never the text", () => {
  beforeEach(() => signInToDepartment("fin"));

  it("stores no document text, and rebuilds the very same run from what it kept", () => {
    addMaterial("Finance Bill notes", MATERIAL);
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      documents: departmentDocumentInputs("fin"),
    };
    const direct = buildSimulatedRun(request);
    const id = saveRunRequest(request);

    const raw = window.localStorage.getItem(RUNS_STORAGE_KEY) ?? "";
    expect(raw).not.toContain(MATERIAL); // the text is NOT kept
    expect(raw).not.toContain('"text"'); // ...and no document text property at all
    expect(raw).toContain("fingerprint"); // a fingerprint is, and it reproduces the run

    const rebuilt = buildSimulatedRun(rehydrateStoredRun(getRunRequest(id)!));
    expect(rebuilt.id).toBe(direct.id); // identity preserved
    expect(rebuilt.seed).toBe(direct.seed); // reproducibility preserved
    expect(rebuilt.summary).toBe(direct.summary);
    expect(rebuilt.documents?.map((d) => [d.id, d.name, d.characters, d.text])).toEqual(
      direct.documents?.map((d) => [d.id, d.name, d.characters, d.text]),
    );
  });

  it("says a document is no longer held rather than losing it, and the run's identity does not move", () => {
    const added = addMaterial("Finance Bill notes", MATERIAL);
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      documents: departmentDocumentInputs("fin"),
    };
    const id = saveRunRequest(request);
    removeDepartmentDocument(added.id); // the department removes it from its library

    const rebuilt = buildSimulatedRun(rehydrateStoredRun(getRunRequest(id)!));
    expect(rebuilt.id).toBe(id); // the run does not vanish or change
    expect(rebuilt.documents).toHaveLength(1);
    expect(rebuilt.documents![0].unavailable).toBe(true);

    const text = renderDocumentText(buildPolicyDraft(rebuilt, findDepartment("fin")!));
    expect(text).toContain("No longer held — recorded with the run");
  });

  it("drops document text an older build already stored, without changing the run", () => {
    const request: AssessmentRequest = {
      ...requestFor("fin"),
      documents: [{ id: "doc-old-1", name: "Older notes", text: MATERIAL }],
    };
    const id = runIdFor(request);
    // An older register entry that kept the text, written straight to storage.
    window.localStorage.setItem(
      RUNS_STORAGE_KEY,
      JSON.stringify([{ ...request, id, recordedAt: "2026-09-24T00:00:00.000Z" }]),
    );

    const stored = getRunRequest(id)!;
    expect(JSON.stringify(stored)).not.toContain(MATERIAL); // normalised on read
    expect(buildSimulatedRun(rehydrateStoredRun(stored)).id).toBe(id);
  });
});

/* ------------------------------------------------------------------------- */
/* (b) a generated document is written once per run                            */
/* ------------------------------------------------------------------------- */

function DraftProbe({ request }: { request: AssessmentRequest }) {
  // The run is memoised, exactly as the app's own `useRun` returns a stable value — an unstable
  // run would re-run the generating effect on every render.
  const run = useMemo(() => buildSimulatedRun(request), [request]);
  const department = findDepartment(request.departmentId);
  const { document } = useGeneratedDocument("policy-draft", run, department);
  return <span data-testid="draft-title">{document?.title ?? "none"}</span>;
}

describe("Batch 0 (b) — a generated document is written once per run", () => {
  beforeEach(() => {
    signInToDepartment("fin");
    // The drafting capability is live, so the hook would call the service — which is mocked.
    saveConfig({
      ...DEFAULT_PLATFORM_CONFIG,
      platformMode: "simulated",
      drafting: {
        mode: "live",
        // The platform's own default address — no address is written as a literal in the test.
        endpoint: OPENROUTER_CHAT_ENDPOINT,
        key: "test-key",
        model: "test/model",
      },
    });
  });

  it("calls the service once and reuses the saved document on a second visit", async () => {
    generateMock.mockResolvedValue(aDocument("Written once"));
    const request = requestFor("fin");
    const run = buildSimulatedRun(request);

    const first = render(<DraftProbe request={request} />);
    await waitFor(() => expect(screen.getByTestId("draft-title")).toHaveTextContent("Written once"));
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(getStoredDocument(run.id, "policy-draft")?.document.title).toBe("Written once");

    // Leaving the screen and coming back must NOT pay for a second call.
    first.unmount();
    render(<DraftProbe request={request} />);
    await waitFor(() => expect(screen.getByTestId("draft-title")).toHaveTextContent("Written once"));
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it("keeps only the newest documents, and forgets them when the register is cleared", () => {
    for (let index = 0; index < GENERATED_DOCUMENTS_LIMIT + 5; index += 1) {
      saveStoredDocument({
        runId: `run-${index}`,
        kind: "report",
        document: aDocument(`Report ${index}`),
        source: { producer: "configured-service", model: "test/model" },
      });
    }
    expect(getStoredDocument("run-0", "report")).toBeUndefined(); // the oldest are evicted
    const newest = `run-${GENERATED_DOCUMENTS_LIMIT + 4}`;
    expect(getStoredDocument(newest, "report")?.document.title).toBe(
      `Report ${GENERATED_DOCUMENTS_LIMIT + 4}`,
    );

    clearRuns();
    expect(getStoredDocument(newest, "report")).toBeUndefined();
  });
});

/* ------------------------------------------------------------------------- */
/* (c) the evidence card states the register's real count                      */
/* ------------------------------------------------------------------------- */

describe("Batch 0 (c) — the evidence card reads its number from the register", () => {
  it("shows the number the library really holds, and the wording comes from one home", () => {
    signInToDepartment("fin");
    const department = findDepartment("fin")!;
    const count = department.documents.length;

    renderAt("/app/documents");

    expect(screen.getByText("What this library holds")).toBeInTheDocument();
    // The exact line the one config home produces, with the register's own count.
    expect(screen.getByText(libraryHoldLine(department.shortName, count))).toBeInTheDocument();
  });
});