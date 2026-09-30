import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { ADMIN_ROUTE } from "@/config/platform";
import { GOVERNANCE } from "@/config/brand";
import { clearContent, getContent } from "@/config/content";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

beforeEach(() => {
  cleanup();
  clearContent();
});

/**
 * GATE — the administration screen is where the owner edits the landing page. It must
 * render, a change typed on it must reach the page after Save, and the fixed wording
 * must be genuinely unreachable from the screen (not merely labelled "read-only").
 */
describe("platform administration — landing page content", () => {
  it("renders the editor with the fixed wording present and read-only", () => {
    renderAt(ADMIN_ROUTE);
    expect(screen.getByRole("heading", { name: "Landing page content" })).toBeInTheDocument();

    const locked = document.getElementById("content-locked.governance") as HTMLTextAreaElement | null;
    expect(locked).not.toBeNull();
    expect(locked?.readOnly).toBe(true);
    expect(locked?.value).toBe(GOVERNANCE.humanJudgement);
  });

  it("saves a change from the screen, and the landing page shows it", () => {
    renderAt(ADMIN_ROUTE);

    const input = document.getElementById("content-how.heading") as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, { target: { value: "How the platform works" } });

    const save = screen.getByRole("button", { name: "Save content" });
    fireEvent.click(save);

    expect(getContent().text["how.heading"]).toBe("How the platform works");

    cleanup();
    renderAt("/");
    expect(screen.getByRole("heading", { name: "How the platform works" })).toBeInTheDocument();
  });
});
