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

  /** The two-step entry introduced in Phase M: landing page → chooser. */
  const openChooser = async (page: Page) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Choose your Department" }).first().click();
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole("heading", { level: 1, name: "Choose your Department" })).toBeVisible();
  };

  const enterWorkspace = async (page: Page) => {
    await openChooser(page);
    await departmentGroup(page)
      .getByRole("button", { name: new RegExp(escapeRegex(DEPARTMENT.shortName)) })
      .first()
      .click();
    await page.getByRole("button", { name: `Enter ${DEPARTMENT.shortName}` }).click();
    await expect(page).toHaveURL(/\/app$/);
  };

  test("the landing page hands off to the chooser, which lists all 16 departments", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Zimbabwe AI Policy Intelligence Initiative" }),
    ).toBeVisible();

    // The landing page is pure: it must NOT carry the department picker.
    await expect(departmentGroup(page)).toHaveCount(0);

    // Its one primary action leads to the chooser.
    await page.getByRole("link", { name: "Choose your Department" }).first().click();
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole("heading", { level: 1, name: "Choose your Department" })).toBeVisible();

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

  test("homepage presents the platform and carries the official footer", async ({ page }) => {
    await page.goto("/");

    // Government-aesthetic structure: the initiative is the capability, the product
    // is credited beneath it, and the masthead names the initiative — not the
    // platform's internal workspace label.
    await expect(
      page.getByRole("heading", { level: 1, name: "Zimbabwe AI Policy Intelligence Initiative" }),
    ).toBeVisible();
    await expect(page.getByText("Powered by Nzwisiso AI®", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Zimbabwe AI Policy Intelligence", { exact: true })).toBeVisible();
    await expect(page.getByText("Policy Intelligence Platform", { exact: true })).toBeVisible();
    // The supporting statement and the description, in the hero.
    await expect(
      page.getByText("Explore potential policy responses before implementation.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/controlled AI-assisted environment/)).toBeVisible();
    // ONE primary action: the competing secondary link is gone for good.
    await expect(page.getByText("See what the platform does")).toHaveCount(0);
    // §13 — three capabilities under the new heading.
    await expect(
      page.getByRole("heading", { name: "A new capability for policy assessment", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Policy input", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Stakeholder simulation", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Policy assessment", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works", exact: true })).toBeVisible();

    // §2–§6 — what happens behind the assessment. The section that stops the page
    // reading as "upload a document, receive an answer": the draft is understood and
    // mapped, becomes a simulated population of thousands of agents, those agents
    // interact, and only then is an assessment produced. It must sit between the
    // capability cards and "How it works", so that ordering is asserted by position.
    const behind = page.locator("#behind-the-assessment");
    await expect(
      behind.getByRole("heading", { name: "What happens behind the assessment", exact: true }),
    ).toBeVisible();
    await expect(
      behind.getByText("One policy draft can generate a much larger analytical environment.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(behind.getByText(/moves beyond a single AI response/)).toBeVisible();
    const order = await page.evaluate(() => {
      const positionOf = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
      return {
        capabilities: positionOf("#capabilities"),
        behind: positionOf("#behind-the-assessment"),
        how: positionOf("#how-it-works"),
      };
    });
    expect(order.capabilities).toBeGreaterThan(0);
    expect(order.behind).toBeGreaterThan(order.capabilities);
    expect(order.how).toBeGreaterThan(order.behind);

    // The five approved indicators, and the population figure rendered in BOTH the
    // strip and the schematic — one constant, two renderings, so the count is two.
    await expect(behind.getByRole("term")).toHaveCount(5);
    await expect(behind.getByText("Simulated agents", { exact: true })).toBeVisible();
    await expect(behind.getByText("1,000+")).toHaveCount(2);

    // The eight-stage pipeline, in order, with its supporting lines.
    await expect(behind.locator("ol > li")).toHaveCount(8);
    await expect(behind.getByText("Policy understanding", { exact: true })).toBeVisible();
    await expect(
      behind.getByText("Entities • relationships • institutions • interests", { exact: true }),
    ).toBeVisible();
    await expect(behind.getByText("Thousands of individual agents", { exact: true })).toBeVisible();
    await expect(
      behind.getByText("Structured findings for human review", { exact: true }).first(),
    ).toBeVisible();
    // The schematic's own surface, so the diagram is really on the page and not only
    // described by it.
    await expect(behind.getByText("The simulated environment", { exact: true })).toBeVisible();
    // §14 — the hand-over to the officer's side of the same process.
    await expect(behind.getByText(/From the officer's perspective/)).toBeVisible();
    // §14 — the governance position, word for word.
    await expect(
      page.getByRole("heading", { name: "From policy draft to policy intelligence", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/does not replace policymakers or determine policy outcomes/)).toBeVisible();
    // §15 — the proposal and its ministerial champion.
    await expect(
      page.getByRole("heading", {
        name: "A proposed national digital innovation initiative",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("Hon. Tatenda A. Mavetera, MP", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ministerial champion", exact: true })).toBeVisible();
    // The initiative is named once as the h1 and once in the positioning panel —
    // never twice as a heading, which is asserted below by the single level-one.
    await expect(
      page.getByRole("heading", { level: 1, name: "Zimbabwe AI Policy Intelligence Initiative" }),
    ).toHaveCount(1);

    // The headline must RENDER in capitals. This reads the real computed style, which
    // is the only way to prove a visual requirement — and it also proves the caps come
    // from styling rather than from capital letters typed into the content.
    const headline = await page.evaluate(() => {
      const node = document.querySelector("h1");
      if (!node) return null;
      const style = getComputedStyle(node);
      const lineHeight = parseFloat(style.lineHeight);
      return {
        textTransform: style.textTransform,
        letterSpacing: parseFloat(style.letterSpacing),
        fontSize: parseFloat(style.fontSize),
        lines: Math.round(node.getBoundingClientRect().height / lineHeight),
        text: node.textContent?.trim() ?? "",
      };
    });
    expect(headline).not.toBeNull();
    expect(headline?.textTransform).toBe("uppercase");
    // Caps need positive tracking; the sentence-case display setting was negative.
    expect(headline?.letterSpacing ?? -1).toBeGreaterThan(0);
    expect(headline?.text).toBe("Zimbabwe AI Policy Intelligence Initiative");
    // A 44-character name at display size must still wrap as a headline, not as a
    // paragraph: at most three lines, and never so small it stops being a heading.
    expect(headline?.lines).toBeLessThanOrEqual(3);
    expect(headline?.fontSize ?? 0).toBeGreaterThanOrEqual(30);

    // The principle is a label ABOVE the heading and renders SMALLER than it. This
    // compares real computed font sizes in a real browser rather than class names.
    const principleSize = await page
      .getByText("Understanding before action", { exact: true })
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(Number.isNaN(principleSize)).toBe(false);
    expect(principleSize).toBeLessThan(headline?.fontSize ?? Number.NaN);

    // The hero card carries the three assessment steps and closes on the principle.
    // The full six-step workspace journey is not listed here any more — it made the
    // page read as an economic-modelling pipeline — but the reference frame a run is
    // read against is still on the page, in the notice strip above the hero, so no
    // figure is left unreadable against its own frame.
    const assessment = page.locator("aside[aria-labelledby='landing-assessment-heading']");
    await expect(
      assessment.getByRole("heading", {
        name: "From policy draft to structured assessment",
        exact: true,
      }),
    ).toBeVisible();
    await expect(assessment.getByRole("listitem")).toHaveCount(3);
    await expect(assessment.getByText("Add your policy", { exact: true })).toBeVisible();
    await expect(assessment.getByText("Review assessment", { exact: true })).toBeVisible();
    await expect(assessment.getByText("Understanding before action.", { exact: true })).toBeVisible();
    await expect(page.getByText(/Reference date\s+24 September 2026/).first()).toBeVisible();
    await expect(page.getByText(/Fiscal year\s+2026/).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ready to test a policy draft?", exact: true }),
    ).toBeVisible();
    // The landing page must NOT hold the picker — that is the chooser's job.
    await expect(departmentGroup(page)).toHaveCount(0);

    // Required footer strings, at the bottom of the page.
    const footer = page.locator("footer");
    await expect(footer.getByText("A Project by the Ministry of IT")).toBeVisible();
    await expect(footer.getByText("For Internal Use Only")).toBeVisible();

    // "For Internal Use Only" must render in strictly SMALLER text. This reads the
    // real computed font size, which is the only way to prove the visual requirement.
    const sizes = await page.evaluate(() => {
      const read = (text: string) => {
        const node = Array.from(document.querySelectorAll("footer p")).find(
          (candidate) => candidate.textContent?.trim() === text,
        );
        return node ? parseFloat(getComputedStyle(node).fontSize) : Number.NaN;
      };
      return {
        attribution: read("A Project by the Ministry of IT"),
        classification: read("For Internal Use Only"),
      };
    });
    expect(Number.isNaN(sizes.attribution)).toBe(false);
    expect(Number.isNaN(sizes.classification)).toBe(false);
    expect(sizes.classification).toBeLessThan(sizes.attribution);

    // The primary action hands off to the department chooser.
    await page.getByRole("link", { name: "Choose your Department" }).first().click();
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole("heading", { level: 1, name: "Choose your Department" })).toBeVisible();
    await expect(departmentGroup(page).getByRole("button")).toHaveCount(DEPARTMENT_COUNT);

    expectCleanRuntime();
  });

  /**
   * §20/§29 — the explanation has to work on a phone, and the page must not gain a
   * sideways scrollbar. A real viewport at a real width is the only honest way to
   * prove either: the classes compile whether or not they fit.
   */
  test("the engine explanation fits a phone viewport with no sideways scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const behind = page.locator("#behind-the-assessment");
    await expect(
      behind.getByRole("heading", { name: "What happens behind the assessment", exact: true }),
    ).toBeVisible();
    // The section stacks rather than shrinks: metrics, then the process, then the
    // schematic, all still present at phone width.
    await expect(behind.getByRole("term")).toHaveCount(5);
    await expect(behind.locator("ol > li")).toHaveCount(8);
    await expect(behind.getByText("1,000+").first()).toBeVisible();
    await expect(behind.getByText("The simulated environment", { exact: true })).toBeVisible();

    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);

    // And nothing inside the section may poke out past the viewport: a child can
    // overflow while the document still measures clean.
    const box = await behind.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, limit: document.documentElement.clientWidth };
    });
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(box.limit + 1);

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

  test("reads the long-form report and drafts the policy from the run", async ({ page }) => {
    await page.goto("/");
    await enterWorkspace(page);

    await page
      .getByPlaceholder(/Draft the policy text/)
      .fill("A simulated policy draft used to verify the long report and the drafted policy.");
    await page.getByRole("button", { name: "Run Simulation" }).click();
    await expect(page.getByRole("heading", { name: "Assessment Complete" })).toBeVisible({
      timeout: 30_000,
    });

    // The run screen now offers all three outputs, not just the summary.
    await expect(page.getByRole("link", { name: "Open executive summary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open full report" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Draft the policy" })).toBeVisible();

    // The long-form report (the "long version").
    await page.getByRole("link", { name: "Open full report" }).click();
    await expect(page.getByRole("heading", { name: "Full report", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Purpose and scope of this report" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reproducibility and run inputs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Limitations" })).toBeVisible();

    // The drafted policy, including in-place editing.
    await page.getByRole("link", { name: "Draft the policy" }).click();
    await expect(page.getByRole("heading", { name: "Drafted policy", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preamble", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "3. Policy measures", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Edit draft wording" }).click();
    const box = page.getByLabel("Drafted policy text");
    await expect(box).toBeVisible();
    await expect(box).toHaveValue(/Draft policy —/);
    await box.fill("Officer-edited wording for the browser journey.");
    await expect(box).toHaveValue("Officer-edited wording for the browser journey.");
    await page.getByRole("button", { name: "Reset to generated" }).click();
    await expect(page.getByRole("button", { name: "Edit draft wording" })).toBeVisible();

    expectCleanRuntime();
  });
});
