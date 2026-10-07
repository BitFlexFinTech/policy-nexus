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
});