import { test, expect } from "@playwright/test";

/**
 * The ZEPARI research assistant, in a real browser — the redesign's own proof.
 *
 * It walks the landing and every workspace section at desktop width, writes a screenshot of each to
 * /tmp/review-shots/, then checks the workspace on a phone for a clean layout with no sideways scroll.
 * It fails on any console error, so a broken screen cannot pass as finished.
 */
const SHOTS = "/tmp/review-shots";

test.describe("the ZEPARI research assistant — the redesigned workspace", () => {
  test("renders the landing and every section, desktop and phone, with no console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    // The landing.
    await page.goto("/research");
    await expect(
      page.getByRole("heading", { level: 1, name: "ZEPARI Policy Research Assistant" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter as Dr. Gibson Chigumira" })).toBeVisible();
    // The status band (owner's instruction, 2026-10-07): the ZEPARI landing page wears the same band
    // the other landing pages wear, worded for the research product — and never the simulation
    // sentence, which would be false here.
    const band = page.getByTestId("research-notice-strip");
    await expect(band).toBeVisible();
    await expect(band).toContainText("Internal service");
    await expect(band).toContainText("research library");
    await expect(band).not.toContainText("Simulation results are modelled");
    await page.screenshot({ path: `${SHOTS}/research-landing-desktop.png`, fullPage: true });

    // Enter, and the workspace home.
    await page.getByRole("button", { name: "Enter as Dr. Gibson Chigumira" }).click();
    await expect(page).toHaveURL(/\/research\/app$/);
    await expect(
      page.getByRole("navigation", { name: "Research assistant sections" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset the sample" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/research-overview-desktop.png`, fullPage: true });

    // Every section renders.
    const sections: ReadonlyArray<[string, string]> = [
      ["library", "/research/app/library"],
      ["data", "/research/app/data"],
      ["ask", "/research/app/ask"],
      ["brief", "/research/app/brief"],
      ["barometer", "/research/app/barometer"],
      ["findings", "/research/app/findings"],
    ];
    for (const [slug, path] of sections) {
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: "Research assistant sections" }),
      ).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/research-${slug}-desktop.png`, fullPage: true });
    }

    // The workspace on a phone: no sideways scroll.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/research/app");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "no sideways scroll on a phone").toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${SHOTS}/research-overview-phone.png`, fullPage: true });

    // The landing on a phone.
    await page.goto("/research");
    await page.screenshot({ path: `${SHOTS}/research-landing-phone.png`, fullPage: true });

    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  /**
   * THE RESEARCH SIDE WEARS ZEPARI'S COLOURS, NEVER THE DEPARTMENT'S EMERALD — measured, not asserted
   * from the source. The owner's report (2026-10-07): "the buttons on the research assistant are still
   * green, this is unacceptable". The Ask button really did compute to rgba(0, 102, 0, 0.9) = #006600.
   * This measures the Ask button's own colour AND the shared tokens inside the `.zepari` scope, and
   * then checks the department side still wears the State emerald — because the fix must not have
   * touched it.
   */
  test("the research side wears ZEPARI's colours, never the department's emerald", async ({ page }) => {
    const documentToken = (name: string) =>
      page.evaluate((token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(), name);

    // The research workspace — entered as a researcher, then the Ask section.
    await page.goto("/research");
    await page.getByRole("button", { name: "Enter as Dr. Gibson Chigumira" }).click();
    await expect(page).toHaveURL(/\/research\/app$/);
    await page.goto("/research/app/ask");
    await expect(page.getByRole("heading", { name: /ask the research library/i })).toBeVisible();

    const scope = page.locator(".zepari").first();
    const scopeToken = (name: string) =>
      scope.evaluate((el, token) => getComputedStyle(el).getPropertyValue(token).trim(), name);
    expect(await scopeToken("--primary"), "the research scope must not carry the State emerald").not.toBe(
      "120 100% 20%",
    );
    expect(await scopeToken("--ring"), "the research focus ring must not be the State emerald").not.toBe(
      "120 100% 20%",
    );

    const askColour = await page
      .getByRole("button", { name: /^ask/i })
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(askColour, `the Ask button is ${askColour}`).not.toContain("0, 102, 0");
    const channels = askColour.match(/\d+/g)?.map(Number) ?? [];
    expect(
      channels[2],
      `the Ask button must be a blue — red ${channels[0]}, green ${channels[1]}, blue ${channels[2]} (${askColour})`,
    ).toBeGreaterThan(channels[1]);

    // The DEPARTMENT side is untouched: the State emerald is still the platform's own primary there.
    await page.goto("/simulation");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await documentToken("--primary"),
      "the policy simulator must still wear the State emerald — the ZEPARI fix must not reach the department side",
    ).toBe("120 100% 20%");
  });
});