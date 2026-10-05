import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { clearSession, signInToDepartment } from "@/session/session";
import { clearRuns, listRunRequestsFor } from "@/services/assessment/runStore";
import {
  clearRunNotice,
  hasSeenRunNotice,
  markRunNoticeSeen,
} from "@/services/assessment/runNoticeStore";
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
 * points the department at its Document Library. It is shown ONCE per department and then
 * remembered, and a permanent note stays beside the button. These tests pin all of that.
 */
describe("the Run-Simulation notice — shown once per department, then remembered", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
    clearRuns();
    clearRunNotice();
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

  it("opens on the first run, runs when told to, and is not shown again", async () => {
    renderAt("/app");
    typeDraft("A draft used to check the one-time notice.");

    // First run: the notice appears, and the run has NOT started yet.
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    expect(screen.getByRole("heading", { name: NOTICE_TITLE })).toBeInTheDocument();
    expect(listRunRequestsFor("fin")).toHaveLength(0);

    // Choosing to run starts it exactly as an ordinary press does.
    fireEvent.click(screen.getByRole("button", { name: "Run with the data I have" }));
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));
    expect(listRunRequestsFor("fin")).toHaveLength(1);
    expect(hasSeenRunNotice("fin")).toBe(true);

    // Second run: it is remembered, so the run starts straight away with no notice.
    cleanup();
    renderAt("/app");
    typeDraft("A second draft used to check the notice is remembered.");
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    expect(screen.queryByRole("heading", { name: NOTICE_TITLE })).toBeNull();
    await waitFor(() => expect(window.location.pathname).toContain("/app/simulations/"));
  });

  it("goes to the Document Library when the officer chooses that, and remembers the notice", async () => {
    renderAt("/app");
    typeDraft("A draft used to check the library route from the notice.");

    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    fireEvent.click(screen.getByRole("button", { name: "Open the Document Library" }));

    await waitFor(() => expect(window.location.pathname).toBe(DOCUMENT_LIBRARY_PATH));
    expect(hasSeenRunNotice("fin")).toBe(true);
    // No run was made — the officer chose to add the department's own documents first.
    expect(listRunRequestsFor("fin")).toHaveLength(0);
  });

  it("shows for a department whose officer has not seen it, even after another department has", async () => {
    markRunNoticeSeen("fin");
    signInToDepartment("health");
    renderAt("/app");
    typeDraft("A draft used to check the notice is kept per department.");

    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
    expect(screen.getByRole("heading", { name: NOTICE_TITLE })).toBeInTheDocument();
  });

  it("remembers per department, ignores an unknown id, and can be forgotten", () => {
    expect(hasSeenRunNotice("fin")).toBe(false);
    markRunNoticeSeen("fin");
    expect(hasSeenRunNotice("fin")).toBe(true);
    expect(hasSeenRunNotice("health")).toBe(false);

    clearRunNotice("fin");
    expect(hasSeenRunNotice("fin")).toBe(false);

    // An id that is not one of the 16 departments is never remembered and never throws.
    markRunNoticeSeen("not-a-department");
    expect(hasSeenRunNotice("not-a-department")).toBe(false);
  });
});
