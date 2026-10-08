import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * THE FREE IN-BROWSER MODEL, PROVED IN A REAL BROWSER — the owner's decision of 2026-10-07: *"go with
 * free in-browser model we need the research engine to actually work for the demo presentation."*
 *
 * This is the gate that matters most, because three separate promises are only true if a real browser
 * says so:
 *   1. the assistant ANSWERS a question when no key is connected (it used to answer nothing at all);
 *   2. the answer names the document it came from (nothing is answered without its source);
 *   3. NOTHING is fetched from outside our own site — no huggingface.co, no CDN — which is the owner's
 *      own instruction ("local models … not chatboxes that are hosted outside Zimbabwe").
 *
 * It is SKIPPED, with a clear reason, when the model files are not on this machine: they are about
 * 118 MB of binary and are deliberately kept out of the code store. `npm run fetch:models` puts them
 * there, and `npm run build` copies them into the site.
 */
const ANSWER_MODEL_FILE = join(
  process.cwd(),
  "public",
  "models",
  "Xenova",
  "distilbert-base-uncased-distilled-squad",
  "onnx",
  "model_quantized.onnx",
);

test.describe("the free in-browser research model", () => {
  test.skip(
    !existsSync(ANSWER_MODEL_FILE),
    "the model files are not on this machine — run `npm run fetch:models` first",
  );

  test("answers from the documents, names its source, and touches nothing outside our own site", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const outside: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("http://127.0.0.1:4173") && !url.startsWith("data:") && !url.startsWith("blob:")) {
        outside.push(url);
      }
    });

    await page.goto("/research");
    await page.getByRole("button", { name: "Enter as Dr. Gibson Chigumira" }).click();
    await expect(page).toHaveURL(/\/research\/app$/);

    await page.goto("/research/app/ask");
    await page.getByLabel("Question").fill("How many pillars does the agriculture policy framework have?");
    await page.getByRole("button", { name: /^ask/i }).click();

    const panel = page
      .locator("section", { has: page.getByRole("heading", { name: /ask the research library/i }) })
      .first();

    // 1 and 2 — the answer itself, quoted, and attributed to the document it came from.
    await expect(panel.getByText(/read by the model running in this browser/i)).toBeVisible({
      timeout: 240_000,
    });
    await expect(panel.getByText(/Quoted from .*Agriculture/i)).toBeVisible();
    await expect(panel).toContainText("nine");

    // 3 — and not one request left our own address while it did that.
    expect(outside, `requests that left our own site: ${outside.join(" | ")}`).toEqual([]);

    // The files it read came from our own web root, not from a model host.
    const modelFiles = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => name.includes("/models/")),
    );
    expect(modelFiles.length, "the browser must have read the model from our own site").toBeGreaterThan(0);
    expect(
      modelFiles.every((name) => name.startsWith("http://127.0.0.1:4173/models/")),
      `every model file must come from our own site: ${modelFiles.join(" | ")}`,
    ).toBe(true);
  });
});