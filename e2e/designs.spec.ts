import { test, expect } from "@playwright/test";

/**
 * The Stage D design options (docs/ZEPARI_BUILD_PLAN.md, §5).
 *
 * This writes a laptop and a phone screenshot of each direction — and of the "Built for Government"
 * page — so the owner can compare them side by side and choose. It fails on any console error, and on
 * sideways scroll at phone width, so a broken option cannot be presented as finished.
 */
const SHOTS = "/tmp/review-shots";

const PAGES: ReadonlyArray<[string, string]> = [
  ["designs", "/research/designs"],
  ["design-desk", "/research/designs/desk"],
  ["design-terminal", "/research/designs/terminal"],
  ["design-lab", "/research/designs/lab"],
  ["design-government", "/research/designs/government"],
];

test.describe("the Stage D design options", () => {
  for (const [slug, path] of PAGES) {
    test(`${slug} — laptop and phone, with no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      // Laptop.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/${slug}-laptop.png`, fullPage: true });

      // Phone: no sideways scroll.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "no sideways scroll on a phone").toBeLessThanOrEqual(1);
      await page.screenshot({ path: `${SHOTS}/${slug}-phone.png`, fullPage: true });

      expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
    });
  }
});
