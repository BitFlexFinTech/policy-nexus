import { test, expect, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { DEPARTMENTS, DEPARTMENT_COUNT, findDepartment } from "../src/config/departments";

/**
 * Phase H — the real in-browser end-to-end journey.
 *
 * This is the one thing a jsdom test cannot prove: that the built, production
 * preview bundle actually loads in a browser, that the whole journey is
 * clickable, and that the two hard runtime invariants hold for real — zero
 * console errors and zero requests that leave the origin (scenario mode is
 * local-only; no CDN, no AI API, no Puter).
 *
 * It runs against `vite preview` (the production build), configured in
 * playwright.config.ts, and it drives the real UI. It does not read the seeded
 * result out of the app's own modules: it asserts what a user can see.
 */

const BASE_URL = "http://127.0.0.1:4173";
const SESSION_KEY = "nzwisiso.session.v1";

/** The department the journey runs as. Its id is one of the 16 canonical ids. */
const DEPARTMENT = findDepartment("fin")!;
const PRESET = DEPARTMENT.policyTemplates[0];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Clipboard is only needed so the Share fallback (navigator.share is absent in
// headless Chromium) can succeed rather than being reported as unavailable.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("policy-nexus — the whole journey, in a real browser", () => {
  let consoleErrors: string[];
  let pageErrors: string[];
  let externalRequests: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];
    externalRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      if (!request.url().startsWith(BASE_URL)) externalRequests.push(request.url());
    });

    // The native print dialogue cannot open headless, so record the call instead
    // of letting it hang; the assertion is that the button really invokes print.
    // Installed on every navigation, before any app script runs.
    await page.addInitScript(() => {
      const target = window as unknown as { __printCalls: number };
      target.__printCalls = 0;
      window.print = () => {
        target.__printCalls += 1;
      };
    });
  });

  /** The journey is only clean if the browser stayed offline and quiet. */
  const expectCleanRuntime = () => {
    expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
    expect(externalRequests, `off-origin requests: ${externalRequests.join(" | ")}`).toEqual([]);
  };

  const departmentGroup = (page: Page) =>
    page.getByRole("group", {
      name: new RegExp(`Select a department — ${DEPARTMENT_COUNT} available`),
    });

  const enterWorkspace = async (page: Page) => {
    await departmentGroup(page)
      .getByRole("button", { name: new RegExp(escapeRegex(DEPARTMENT.shortName)) })
      .first()
      .click();
    await page.getByRole("button", { name: `Enter ${DEPARTMENT.shortName}` }).click();
    await expect(page).toHaveURL(/\/app$/);
  };

  test("home lists all 16 departments and one-click entry opens the workspace", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Understanding before action." })).toBeVisible();

    // Dataset completeness check: the canonical 16, never a silent subset.
    const options = departmentGroup(page).getByRole("button");
    await expect(options).toHaveCount(DEPARTMENT_COUNT);

    // Every department in the config is addressable on the screen.
    for (const department of DEPARTMENTS) {
      await expect(
        departmentGroup(page)
          .getByRole("button", { name: new RegExp(escapeRegex(department.shortName)) })
          .first(),
      ).toBeVisible();
    }

    // Select, then enter — the selection is visible before entry.
    await departmentGroup(page)
      .getByRole("button", { name: new RegExp(escapeRegex(DEPARTMENT.shortName)) })
      .first()
      .click();
    await expect(page.getByText(`Selected: ${DEPARTMENT.name}`)).toBeVisible();
    await page.getByRole("button", { name: `Enter ${DEPARTMENT.shortName}` }).click();

    // One-click entry signed in and labelled the workspace with the department.
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByText("Entry: one-click (Mock)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Simulation" })).toBeVisible();

    expectCleanRuntime();
  });

  test("department context survives navigation and a full reload", async ({ page }) => {
    await page.goto("/");
    await enterWorkspace(page);

    await page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("link", { name: "Simulation Register" })
      .click();
    await expect(page).toHaveURL(/\/app\/simulations$/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    // A real reload re-runs the app from scratch; the session is localStorage-backed.
    await page.reload();
    await expect(page).toHaveURL(/\/app\/simulations$/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByText(new RegExp(escapeRegex(DEPARTMENT.name))).first()).toBeVisible();

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
    expect(stored).toContain('"fin"');

    expectCleanRuntime();
  });

  test("paste a draft, run it, then read and export the assessment", async ({ page }) => {
    await page.goto("/");
    await enterWorkspace(page);

    // The paste path (not a preset).
    await page
      .getByPlaceholder(/Draft the policy text/)
      .fill("A simulated policy draft used to verify the end-to-end journey in a real browser.");

    await page.getByRole("button", { name: "Run Simulation" }).click();
    await expect(page).toHaveURL(/\/app\/simulations\//);
    await expect(page.getByText(/\d+ \/ \d+ rounds/)).toBeVisible();

    // Runs the seeded rounds to completion.
    await expect(page.getByRole("heading", { name: "Assessment Complete" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: "Open executive summary" }).click();
    await expect(page.getByRole("heading", { name: "Executive Summary" })).toBeVisible();

    // Interactivity check: a headline metric card opens to its explanation.
    const metricCards = page.locator("button[aria-expanded]");
    await expect(metricCards.first()).toBeVisible();
    await metricCards.first().click();
    await expect(metricCards.first()).toHaveAttribute("aria-expanded", "true");

    // Print and Save as PDF both invoke the browser print dialogue.
    await page.getByRole("button", { name: "Print" }).click();
    await page.getByRole("button", { name: "Save as PDF" }).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls))
      .toBe(2);

    // Word produces a real download with a real filename.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download Word" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/executive-summary\.doc$/);

    // Share falls back to the clipboard here and reports what it did.
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByText(/copied to the clipboard|Shared\./)).toBeVisible();

    // The full assessment opens and carries the method/limitations statement.
    await page.getByRole("link", { name: "Open full assessment" }).click();
    await expect(page.getByRole("heading", { name: "Full Assessment" })).toBeVisible();
    await expect(page.getByText("Method and limitations")).toBeVisible();
    await expect(page.getByText(PRESET.title, { exact: false })).toHaveCount(0);

    expectCleanRuntime();
  });

  test("upload a policy document and run it from the file input", async ({ page }) => {
    await page.goto("/");
    await enterWorkspace(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: "national-policy.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("An uploaded policy document used to verify the upload path."),
    });

    await expect(page.getByText("national-policy.txt")).toBeVisible();

    await page.getByRole("button", { name: "Run Simulation" }).click();
    await expect(page).toHaveURL(/\/app\/simulations\//);
    // The source says `upload` plainly — it does not imply the file was parsed.
    await expect(page.getByText(/source upload/)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Assessment Complete" })).toBeVisible({
      timeout: 30_000,
    });

    expectCleanRuntime();
  });
});
