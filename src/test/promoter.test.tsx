import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { BRAND, PROMOTER } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/** The pixel size a class asks for, read out of the class list — the technique the
 *  landing test already uses for the attribution/classification pair. */
const sizeOf = (node: HTMLElement) => {
  const match = node.className.match(/text-\[(\d+)px\]/);
  return match ? Number(match[1]) : NaN;
};

/**
 * The project promoter credit. The user asked for it to be ON THE SITE but SMALL, and
 * subordinate to the Ministry's own attribution — so the tests here pin three things:
 * it is present in both footers, it is never larger than the attribution, and the
 * company name is written in exactly one place so it can never be retyped into a page.
 */
describe("the project promoter credit", () => {
  beforeEach(() => {
    clearSession();
  });

  it("appears in the public footer, never larger than the Ministry's attribution", () => {
    renderAt("/");
    const footer = screen.getByRole("contentinfo");
    const credit = screen.getByText(PROMOTER.line);
    const attribution = screen.getByText(BRAND.attribution);

    expect(footer.contains(credit)).toBe(true);
    expect(Number.isNaN(sizeOf(credit))).toBe(false);
    expect(Number.isNaN(sizeOf(attribution))).toBe(false);
    expect(sizeOf(credit)).toBeLessThanOrEqual(sizeOf(attribution));
  });

  it("appears in the workspace footer as well", () => {
    signInToDepartment(findDepartment("fin")!.id);
    renderAt("/app");
    expect(screen.getByText(PROMOTER.line)).toBeInTheDocument();
  });

  it("is written in one place only — no file under src/ outside brand.ts names the promoter", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return walk(path);
        return /\.(ts|tsx)$/.test(path) ? [path] : [];
      });

    const offenders = walk("src")
      .filter((path) => !path.endsWith(join("config", "brand.ts")))
      .filter((path) => readFileSync(path, "utf8").includes(PROMOTER.name));

    expect(offenders).toEqual([]);
  });
});
