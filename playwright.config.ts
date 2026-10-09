import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // THE END-TO-END TESTS RUN AGAINST A BUILD THAT WITHHOLDS THE DEMONSTRATION KEYS. The published
    // build (`npm run build`) bakes both keys in, so the two assistants are live the moment the site
    // opens — the owner's strict rule. A test suite must never spend the owner's money or depend on an
    // answer arriving over the network, so the tests are served a build made with `--mode test` (which
    // withholds the keys and runs the offline paths), and it is written to its own folder so it can
    // never replace the published build in `dist/`.
    command: "npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
