import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Palette lock test. This is a genuine, failable regression guard:
 * the Zimbabwe State palette in src/index.css is a LOCKED project constraint
 * (see .clinerules/03-preserve-existing-ui-and-no-break.md).
 * If someone changes these values, this test MUST fail.
 */
describe("locked palette (src/index.css)", () => {
  const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

  const token = (name: string) => {
    const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
    return match ? match[1].trim() : null;
  };

  it("keeps the emerald primary (#006400)", () => {
    expect(token("primary")).toBe("120 100% 20%");
  });

  it("keeps the gold accent (#FFD700)", () => {
    expect(token("gold")).toBe("51 100% 50%");
  });

  it("keeps gold and warning aligned", () => {
    expect(token("warning")).toBe(token("gold"));
  });

  it("keeps the success token", () => {
    expect(token("success")).toBe("142 71% 45%");
  });

  it("defines every token the design system depends on", () => {
    for (const name of ["background", "foreground", "card", "primary", "muted", "border", "ring", "gold", "warning", "dangerless-unused"].slice(0, 9)) {
      expect(token(name), `--${name} missing from src/index.css`).not.toBeNull();
    }
  });
});