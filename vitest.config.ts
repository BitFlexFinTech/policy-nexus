import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    /**
     * 20 seconds per test, not vitest's default of 5.
     *
     * Why (measured 2026-10-02): several test files render the whole application (router, query
     * client, Radix providers) and the 46 files run in parallel, so a first render that takes
     * 1.3 seconds on its own can take longer than 5 under load. `src/test/scenario-levers.test.tsx`
     * timed out that way once ("Test timed out in 5000ms", 5,764 ms in the full run, 1,271 ms when
     * the file runs alone) while every assertion in it was passing. The limit was the problem, not
     * the test — so the limit moved, and the assertions stayed exactly as they were.
     */
    testTimeout: 20_000,
    environmentOptions: {
      // jsdom gives an opaque origin (and therefore no local storage) unless a
      // real URL is set. The session module is storage-backed, so it needs one.
      jsdom: { url: "http://localhost/" },
    },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
