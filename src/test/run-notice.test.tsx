import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { clearSession, signInToDepartment } from "@/session/session";
import { clearRuns, listRunRequestsFor } from "@/services/assessment/runStore";
import { DOCUMENT_LIBRARY_PATH } from "@/config/runNotice";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

const typeDraft = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText(/Draft the policy text/), {
    target: { value: text },
  });
};

const NOTICE_TITLE = "Before this run — what the draft rests on";

/**
 * Owner's item 5 — the Run-Simulation notice. It states, honestly, that the drafted policy is
 * built from the real published data the engine holds for the department (which is limited), and
 * points the department at its Document Library. The owner made it a strict rule that it is
 * shown before EVERY run (revised 2026-10-06), and a permanent note stays beside the button.
 * These tests pin all of that.
 */
describe("the Run-Simulation notice — shown before every run", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    signInToDepartment("fin");
  });

  it("carries the permanent note beside the button, linking to the Document Library", () => {
    renderAt("/app");
    expect(
      screen.getByText(/Built from the real, published data the engine holds for/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Open the Document Library/ });
    expect(link).toHaveAttribute("href", DOCUMENT_LIBRARY_PATH);
  });

  it("opens on every run, and runs when told to", async () => {
    renderAt("/app");
    typeDraft("A draft used to check the notice appears on every run.");

    // First run: the notice appears, and the run has NOT started yet.
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    expect(screen.getByRole("heading", { name: NOTICE_TITLE })).toBeInTheDocument();
    expect(listRunRequestsFor("fin")).toHaveLength(0);

    // Choosing to run starts it exactly as an ordinary press does.
    fireEvent.click(screen.getByRole("button", { name: "Run with the data I have" }));
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));
    expect(listRunRequestsFor("fin")).toHaveLength(1);

    // Second run: the notice appears AGAIN — it is never remembered away (the owner rule).
    cleanup();
    renderAt("/app");
    typeDraft("A second draft used to check the notice appears again.");
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    expect(screen.getByRole("heading", { name: NOTICE_TITLE })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run with the data I have" }));
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));
    expect(listRunRequestsFor("fin")).toHaveLength(2);
  });

  it("goes to the Document Library when the officer chooses that", async () => {
    renderAt("/app");
    typeDraft("A draft used to check the library route from the notice.");

    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    fireEvent.click(screen.getByRole("button", { name: "Open the Document Library" }));

    await waitFor(() => expect(window.location.pathname).toBe(DOCUMENT_LIBRARY_PATH));
    // No run was made — the officer chose to add the department's own documents first.
    expect(listRunRequestsFor("fin")).toHaveLength(0);
  });

});
