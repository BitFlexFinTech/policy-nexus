import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearSession, signInToDepartment } from "@/session/session";
import { clearRuns } from "@/services/assessment/runStore";
import {
  POLICY_INPUT_KEY,
  POLICY_INPUT_TEXT_LIMIT,
  clearPolicyInput,
  getPolicyInput,
  savePolicyInput,
} from "@/services/documents/policyInputStore";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const draftBox = () => screen.getByPlaceholderText(/Draft the policy text/);

/**
 * Owner's item 7 — *"lets assume the user wants to go back and add some text into the text
 * field where they also uploaded their documents, they should be able to go back, of which
 * right now they cant do that."*
 *
 * These tests gate the two halves: the working state really reaches this browser's storage,
 * and the screen really comes back with it — plus the honest limit when a file's text is too
 * large to keep.
 */
describe("item 7 — the policy input remembers the officer's work", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("keeps the typed wording, the assumptions and the uploaded files", () => {
    savePolicyInput({
      departmentId: "fin",
      text: "A draft the officer is still working on.",
      templateId: "fin-education-reform",
      levers: { funding: "within-budget", capacity: "needs-support", enforcement: "strict", phaseInMonths: 6 },
      files: [
        {
          name: "evidence.txt",
          sizeLabel: "1.0 KB",
          kind: "text",
          extracted: true,
          text: "The department's own evidence.",
          status: "Text extracted.",
        },
      ],
    });

    const stored = getPolicyInput("fin")!;
    expect(stored.text).toBe("A draft the officer is still working on.");
    expect(stored.templateId).toBe("fin-education-reform");
    expect(stored.levers.phaseInMonths).toBe(6);
    expect(stored.files).toHaveLength(1);
    expect(stored.files[0].text).toBe("The department's own evidence.");
    expect(stored.filesReadable).toBe(true);
  });

  it("refuses an untouched screen, and clears the record when the screen is emptied", () => {
    savePolicyInput({
      departmentId: "fin",
      text: "",
      levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 },
      files: [],
    });
    // Nothing was typed and nothing was set, so nothing is kept — and no key is written.
    expect(getPolicyInput("fin")).toBeUndefined();
    expect(window.localStorage.getItem(POLICY_INPUT_KEY)).toBeNull();

    // With something in it, a record exists; emptying it again removes the record.
    savePolicyInput({
      departmentId: "fin",
      text: "Something.",
      levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 },
      files: [],
    });
    expect(getPolicyInput("fin")).toBeDefined();
    clearPolicyInput("fin");
    expect(getPolicyInput("fin")).toBeUndefined();
  });

  it("keeps a file by name when its text is too large, and says the text was not kept", () => {
    savePolicyInput({
      departmentId: "fin",
      text: "",
      levers: { funding: "unstated", capacity: "unstated", enforcement: "standard", phaseInMonths: 0 },
      files: [
        {
          name: "huge.txt",
          sizeLabel: "2.0 MB",
          kind: "text",
          extracted: true,
          text: "x".repeat(POLICY_INPUT_TEXT_LIMIT + 1),
          status: "Text extracted.",
        },
      ],
    });

    const stored = getPolicyInput("fin")!;
    expect(stored.filesReadable).toBe(false);
    expect(stored.files[0].name).toBe("huge.txt");
    expect(stored.files[0].extracted).toBe(false);
    expect(stored.files[0].text).toBe("");
    expect(stored.files[0].status).toMatch(/too large to store/);
  });

  it("brings the officer's wording back when they leave the screen and return", () => {
    const wording = "Wording that must survive a trip to the register and back.";

    renderAt("/app");
    fireEvent.change(draftBox(), { target: { value: wording } });
    fireEvent.click(screen.getByRole("button", { name: "Inside the current budget" }));
    expect(getPolicyInput("fin")!.text).toBe(wording);

    // Leave the screen for the register…
    cleanup();
    renderAt("/app/simulations");
    expect(screen.getByRole("heading", { name: "Simulation Register" })).toBeInTheDocument();

    // …and come back: the wording and the assumption are still in place.
    cleanup();
    renderAt("/app");
    expect(draftBox()).toHaveValue(wording);
    expect(screen.getByRole("button", { name: "Inside the current budget" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/kept in this browser for this department/)).toBeInTheDocument();
  });
});
