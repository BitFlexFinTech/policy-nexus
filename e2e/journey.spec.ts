import { test, expect, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { DEPARTMENTS, DEPARTMENT_COUNT, findDepartment } from "../src/config/departments";
import { BRAND } from "../src/config/brand";
import { citedInstrumentLabel } from "../src/config/instruments";

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

  /**
   * The journey is only clean if the browser stayed offline and quiet.
   *
   * This holds because NOTHING is configured in platform administration: every
   * capability is simulated, so no request may leave the origin. If an
   * administrator ever switches a capability on, this assertion is the thing that
   * will report it — which is exactly what it is for.
   */
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
    await expect(page.getByText(BRAND.poweredBy, { exact: true }).first()).toBeVisible();
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
    // strip and the schematic — one source, two renderings, so the count is two.
    await expect(behind.getByRole("term")).toHaveCount(5);
    await expect(behind.getByText("Simulated agents", { exact: true })).toBeVisible();
    // The figure is now a MODELLED count rather than a placeholder, and it is read
    // in the real DOM: a real number in the thousands, appearing exactly twice —
    // once in the strip, once under the schematic's graph.
    const agentFigure = (await behind.getByRole("term").first().textContent())?.trim() ?? "";
    expect(agentFigure).toMatch(/^\d{1,3}(,\d{3})+$/);
    expect(Number(agentFigure.replace(/,/g, ""))).toBeGreaterThanOrEqual(2000);
    await expect(behind.getByText(agentFigure, { exact: true })).toHaveCount(2);
    // And the field those agents are drawn as: the marks nested inside the group
    // marks, counted in the real DOM. A handful of circles would fail here. The marks
    // are found by their own class rather than by element name, because the group
    // marks themselves are no longer all circles — a priority is a square and a
    // document a diamond.
    expect(await behind.locator("svg g[role='button'] .graph-agent-mark").count()).toBeGreaterThan(
      50,
    );

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
    // The authority line — the proposal status, the championing Minister and the
    // ministry. It must open the page, above the main heading: a Minister reading
    // this page meets it before anything else, and only the top of the page travels
    // in a screenshot. Asserted by real geometry, not by styling.
    await expect(
      page.getByRole("heading", {
        name: "A proposed national digital innovation initiative",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("Hon. Tatenda A. Mavetera, MP", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ministerial champion", exact: true })).toBeVisible();
    const authorityTop =
      (
        await page
          .getByRole("heading", {
            name: "A proposed national digital innovation initiative",
            exact: true,
          })
          .boundingBox()
      )?.y ?? -1;
    const heroTop =
      (
        await page
          .getByRole("heading", { level: 1, name: "Zimbabwe AI Policy Intelligence Initiative" })
          .boundingBox()
      )?.y ?? -1;
    expect(authorityTop).toBeGreaterThan(0);
    expect(authorityTop).toBeLessThan(heroTop);
    // The initiative is named exactly once — as the single level-one heading, directly
    // under the authority line. It is deliberately not repeated inside the line itself.
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
  /**
   * The primary action must be reachable without scrolling on the phone, because the
   * Minister's first look at this page may well be a link opened on a phone. The
   * authority line was compacted (two short columns instead of four stacked lines)
   * rather than trimmed, and this test measures the result at a real width instead of
   * trusting the classes.
   */
  test("the primary action is above the fold on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const action = page.getByRole("link", { name: "Choose your Department" }).first();
    await expect(action).toBeVisible();

    const box = await action.boundingBox();
    expect(box, "the primary action has a box").not.toBeNull();
    const viewportHeight = page.viewportSize()?.height ?? 844;
    const bottom = (box?.y ?? 0) + (box?.height ?? 0);
    console.log(`PHONE-FOLD: primary action bottom edge at ${Math.round(bottom)}px of ${viewportHeight}px`);
    expect(bottom, "the primary action sits within the first screen of a phone").toBeLessThanOrEqual(
      viewportHeight,
    );
  });


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
    // The modelled figure, read from the page rather than hard-coded — the strip and
    // the diagram both carry it, and it is a real number in the thousands.
    await expect(behind.getByRole("term").first()).toHaveText(/^\d{1,3}(,\d{3})+$/);
    // The agent field is drawn on the compact card too, which is what makes the
    // claim visible on the page the Minister is most likely to see first. The marks
    // are found by class, since the group marks are no longer all circles.
    expect(
      await behind.locator("svg g[role='button'] .graph-agent-mark").count(),
    ).toBeGreaterThan(50);
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

/**
 * THE DRAWING AT THREE WIDTHS — measured in a real browser, not asserted from the code.
 *
 * This is the guard for the "low quality" report. The old drawing expressed every
 * stroke in the 1000×750 virtual space and then multiplied it by the card's scale, so
 * as the card shrank the outline did too: at roughly a 0.3 scale a 1.5-unit outline
 * painted about 0.45 of a pixel and anti-aliased into grey. Nothing about that can be
 * caught by a jsdom test, because jsdom has no layout and no scale.
 *
 * So the numbers are MEASURED here: the card's real rendering scale, and what each
 * stroke actually paints in device pixels (a `non-scaling-stroke` paints its own width;
 * an unpinned stroke is multiplied by the scale, which is exactly the old defect). Every
 * assertion prints all three widths in its message, so a failure says what was measured.
 */
test("the drawing stays crisp at three card widths", async ({ page }) => {
  await page.goto("/");

  const measure = () =>
    page.evaluate(() => {
      // Found from a mark outwards: the page's first `svg` is an icon in the header,
      // not the graph, so the surface is identified by what it draws.
      const mark = document.querySelector(".graph-mark") as SVGElement;
      const svg = mark.closest("svg") as SVGSVGElement;
      const edge = svg.querySelector("line") as SVGLineElement;
      const agent = svg.querySelector(".graph-agent-mark") as SVGCircleElement;
      // The mark of the group that carries that field — a group's mark outline, which is
      // the lightest stroke on the surface and therefore the one that used to disappear.
      const group = agent.closest("g[role='button']") as SVGGElement;
      const groupMark = group.querySelector(":scope > .graph-mark") as SVGElement;

      const scale = Math.hypot(mark.getScreenCTM()!.a, mark.getScreenCTM()!.b);
      const paintedPx = (element: SVGElement) => {
        const width = Number(element.getAttribute("stroke-width"));
        if (element.getAttribute("vector-effect") === "non-scaling-stroke") return width;
        return width * Math.hypot(element.getScreenCTM()!.a, element.getScreenCTM()!.b);
      };

      return {
        scale: Number(scale.toFixed(3)),
        ringPx: Number(paintedPx(mark).toFixed(2)),
        outlinePx: Number(paintedPx(groupMark).toFixed(2)),
        edgePx: Number(paintedPx(edge).toFixed(2)),
        agentMarkPx: Number((2 * Number(agent.getAttribute("r")) * scale).toFixed(2)),
        marksPinned: svg.querySelectorAll(".graph-mark[vector-effect='non-scaling-stroke']").length,
        marksTotal: svg.querySelectorAll(".graph-mark").length,
        edgesPinned: svg.querySelectorAll("line[vector-effect='non-scaling-stroke']").length,
        edgesTotal: svg.querySelectorAll("line").length,
      };
    });

  const measured: Array<{ width: number } & Awaited<ReturnType<typeof measure>>> = [];
  for (const width of [1280, 900, 640]) {
    await page.setViewportSize({ width, height: 900 });
    measured.push({ width, ...(await measure()) });
  }

  const report = measured
    .map(
      (entry) =>
        `${entry.width}px → scale ${entry.scale}, ring ${entry.ringPx}px, ` +
        `outline ${entry.outlinePx}px, edge ${entry.edgePx}px, agent mark ${entry.agentMarkPx}px`,
    )
    .join(" | ");

  measured.forEach((entry) => {
    // The card really is rendered at a fraction of its virtual size — which is the
    // condition that used to thin the drawing, so it must really be happening.
    expect(entry.scale, report).toBeGreaterThan(0);
    // Pinned: each stroke paints a whole pixel at EVERY width.
    expect(entry.ringPx, report).toBeGreaterThanOrEqual(1);
    expect(entry.ringPx, report).toBeLessThanOrEqual(3);
    expect(entry.outlinePx, report).toBeGreaterThanOrEqual(1);
    expect(entry.outlinePx, report).toBeLessThanOrEqual(3);
    expect(entry.edgePx, report).toBeGreaterThanOrEqual(1);
    expect(entry.edgePx, report).toBeLessThanOrEqual(3);
    // Every stroke on the surface is pinned, none left in the old scaled form.
    expect(entry.marksPinned, report).toBe(entry.marksTotal);
    expect(entry.edgesPinned, report).toBe(entry.edgesTotal);
    // And an agent mark never becomes a sub-pixel dot. The compact card is the smallest
    // surface the platform draws, and it measured 3.4–6.1px across these three widths.
    expect(entry.agentMarkPx, report).toBeGreaterThanOrEqual(2);
  });

  // The scale really does change between the widths — the landing page reflows its own
  // column at its breakpoints, so this is not one measurement taken three times. It is
  // deliberately NOT asserted to rise or fall with the viewport: the column is wider at
  // 900px than at either 1280px (two-column) or 640px, and a test that assumed otherwise
  // would be asserting a layout opinion rather than a fact.
  const scales = measured.map((entry) => entry.scale);
  expect(Math.max(...scales) - Math.min(...scales), report).toBeGreaterThan(0.1);

  // THE GUARD ITSELF: the scale changes, and the painted stroke weight does NOT. Before
  // the fix these three values fell as the card shrank, which is exactly the grey,
  // sub-pixel outline that was reported.
  (
    [
      ["the draft's ring", "ringPx"],
      ["a group's outline", "outlinePx"],
      ["an edge", "edgePx"],
    ] as const
  ).forEach(([what, key]) => {
    const painted = new Set(measured.map((entry) => entry[key]));
    expect(painted.size, `${what} changed weight across the three widths: ${report}`).toBe(1);
  });

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

  test("the registers are actionable: a document opens and a draft loads", async ({ page }) => {
    await page.goto("/");
    await enterWorkspace(page);

    // Nothing is configured, so the workspace must show no "live services" notice
    // at all — the demo looks exactly as it always has.
    await expect(page.getByText(/Live services in use/)).toHaveCount(0);

    // The document rail used to advertise a click with no handler behind it.
    const document = DEPARTMENT.documents[0];
    expect(document.instrument).toBeTruthy();
    const citation = citedInstrumentLabel(document.instrument!);

    // E-4: the rail states the instrument the document is prepared under.
    await expect(
      page.getByRole("button", { name: new RegExp(escapeRegex(document.name)) }).getByText(citation),
    ).toBeVisible();

    await page
      .getByRole("button", { name: new RegExp(escapeRegex(document.name)) })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(document.note)).toBeVisible();
    // E-4: and the dialog names it too — the same derived text.
    await expect(dialog.getByText("Prepared under")).toBeVisible();
    await expect(dialog.getByText(citation)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // The policy register leads to the workspace and actually loads the draft.
    await page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("link", { name: "Policy Register" })
      .click();
    await expect(page.getByRole("heading", { name: "Policy Register" })).toBeVisible();

    const preset = DEPARTMENT.policyTemplates[0];
    await page.getByRole("link", { name: /Use this draft/ }).first().click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByPlaceholder(/Draft the policy text/)).toHaveValue(preset.policyText);

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

    // Word produces a real download: a `.docx`, which is a ZIP container, so the
    // first two bytes must be the ZIP signature `PK`.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download Word" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/executive-summary\.docx$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const signature = readFileSync(downloadPath as string).subarray(0, 2).toString("latin1");
    expect(signature).toBe("PK");

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

  test("the relationship graph grows with the run, and answers the pointer", async ({ page }) => {
    // The reveal is deliberately long (one round at a time), and this test drives
    // the graph while it runs, so it is given room rather than being rushed.
    test.setTimeout(90_000);

    await page.goto("/");
    await enterWorkspace(page);
    await page
      .getByPlaceholder(/Draft the policy text/)
      .fill("A draft used to watch the relationship graph build up during a run.");

    await page.getByRole("button", { name: "Run Simulation" }).click();
    await expect(page).toHaveURL(/\/app\/simulations\//);

    // The graph is a real part of the run view, named as the card it is.
    await expect(
      page.getByRole("region", { name: "Graph Relationship Visualization" }),
    ).toBeVisible();

    const entityCount = async () => {
      const text = (await page.getByText(/\d+ \/ \d+ entities/).first().textContent()) ?? "";
      const match = text.match(/(\d+) \/ (\d+) entities/);
      return { drawn: Number(match?.[1] ?? -1), total: Number(match?.[2] ?? -1) };
    };

    // It starts incomplete: the marks are the run's own structure, so they can
    // only appear as far as the run has actually got.
    const opening = await entityCount();
    expect(opening.total).toBeGreaterThan(1);
    expect(opening.drawn).toBeLessThan(opening.total);

    // And it grows, on its own, while the rounds are revealed.
    await expect
      .poll(async () => (await entityCount()).drawn, { timeout: 25_000 })
      .toBeGreaterThan(opening.drawn);

    // A mark can be chosen, and its relationships are then stated as text — the
    // graph is never the only way to read it.
    const graphCard = page.getByRole("region", { name: "Graph Relationship Visualization" });
    const group = page.getByRole("button", { name: /Civil servants, Stakeholder group,/ }).first();
    await expect(group).toBeVisible({ timeout: 20_000 });

    // The mark declares how many relationships it carries; selecting it must state
    // exactly that many, with something written on each one.
    const declared = Number(
      ((await group.getAttribute("aria-label")) ?? "").match(/(\d+) relationships/)?.[1] ?? -1,
    );
    expect(declared).toBeGreaterThan(0);

    await group.click();
    const rows = graphCard.getByRole("listitem");
    await expect(rows).toHaveCount(declared);
    await expect(rows.first()).not.toBeEmpty();
    await expect(graphCard).toContainText("Civil servants");

    // The relations on the edges are off by default and can be asked for.
    const edgeLabels = page.getByRole("switch", { name: /edge labels/i });
    await expect(edgeLabels).not.toBeChecked();
    await edgeLabels.click();
    await expect(edgeLabels).toBeChecked();
    await edgeLabels.click();

    // A mark can be dragged, and it stays where the pointer put it. The drag aims
    // at the mark itself (the painted circle), not at the group's box centre,
    // which can fall in the gap between the mark and its label.
    const before = await group.getAttribute("transform");
    // Direct children only: the agent field is drawn as circles inside a nested
    // group around the mark, and the drag must aim at the mark itself. The mark is
    // found by its own class, because it is a circle for a group but a square for a
    // priority and a diamond for a document.
    const mark = group.locator(":scope > .graph-mark").last();
    // Scrolled in first: a pointer event aimed below the fold lands nowhere, and
    // this page is taller than the viewport.
    await mark.scrollIntoViewIfNeeded();
    const box = (await mark.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 70, { steps: 8 });
    const during = await group.getAttribute("transform");
    await page.mouse.up();
    expect(during).not.toBe(before);

    // The run still finishes, and the graph is complete when it does.
    await expect(page.getByRole("heading", { name: "Assessment Complete" })).toBeVisible({
      timeout: 40_000,
    });
    const finished = await entityCount();
    expect(finished.drawn).toBe(finished.total);

    // The field the platform promises is really drawn: the modelled groups are
    // ringed by the agents they stand for, counted in the real DOM. This is the
    // guard that stops the page saying "thousands of agents" over a handful of
    // circles ever again.
    const agentMarks = await graphCard.locator("svg g[role='button'] .graph-agent-mark").count();
    expect(agentMarks).toBeGreaterThan(100);
    // And the card says in words what each mark stands for, so the density is never
    // mistaken for one mark per agent.
    await expect(graphCard.getByText(/Each mark stands for about \d+ agents/)).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "Republic of Zimbabwe", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Table of contents", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "5. Policy measures", exact: true })).toBeVisible();
    // A policy is read by its matrices, so the M&E matrix is a real table on the page.
    await expect(page.getByText("Table 6 — Monitoring and evaluation matrix", { exact: true })).toBeVisible();

    // Batch A item 5 — the four paperwork screens share one strip, in a real browser too,
    // and the screen the reader is on is the one marked as current.
    const strip = page.getByRole("navigation", { name: "Documents in this run" });
    await expect(strip).toBeVisible();
    await expect(strip.getByRole("link", { name: "Executive summary" })).toBeVisible();
    await expect(strip.getByRole("link", { name: "Full assessment" })).toBeVisible();
    await expect(strip.getByRole("link", { name: "Full report" })).toBeVisible();
    await expect(strip.getByRole("link", { name: "Drafted policy" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("button", { name: "Edit draft wording" }).click();
    const box = page.getByLabel("Drafted policy text");
    await expect(box).toBeVisible();
    await expect(box).toHaveValue(/Draft policy —/);
    await box.fill("Officer-edited wording for the browser journey.");
    await expect(box).toHaveValue("Officer-edited wording for the browser journey.");

    // Batch A item 7 — the working copy is kept in the browser, so leaving the screen
    // and reloading the page must not lose the officer's wording.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Drafted policy", exact: true })).toBeVisible();
    await expect(page.getByText(/Your wording is kept in this browser, for this run/)).toBeVisible();
    await page.getByRole("button", { name: "Edit draft wording" }).click();
    await expect(page.getByLabel("Drafted policy text")).toHaveValue(
      "Officer-edited wording for the browser journey.",
    );

    // "Reset to generated" forgets it, so a reload after a reset shows the generated draft.
    await page.getByRole("button", { name: "Reset to generated" }).click();
    await expect(page.getByRole("button", { name: "Edit draft wording" })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Edit draft wording" }).click();
    await expect(page.getByLabel("Drafted policy text")).toHaveValue(/Draft policy —/);

    // Batch A item 6 — the drafting stage: the drafted policy is taken back through the
    // simulation as the department's next version, and the version is labelled wherever
    // the run is named.
    await expect(page.getByText(/This is version 1 of the department's policy/)).toBeVisible();
    await page
      .getByLabel("Drafted policy text")
      .fill("The officer's own wording for version two.");
    await page.getByRole("button", { name: "Run the simulation on this wording" }).click();
    await expect(page).toHaveURL(/\/app\/simulations\//);
    await expect(page.getByText("Version 2", { exact: true })).toBeVisible();

    // The register now holds two versions of this department's policy, the second labelled.
    await page.getByRole("link", { name: "Simulation Register" }).click();
    await expect(page.getByText(/\b2 runs\b/)).toBeVisible();
    await expect(page.getByText("Version 2", { exact: true })).toHaveCount(1);

    expectCleanRuntime();
  });
});
