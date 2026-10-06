import { describe, expect, it } from "vitest";
import { formatInstant } from "@/lib/clock";

/**
 * The defect this guards against: an administration page blanked because a stored run from an
 * older version carried no recorded date, and formatting it threw. Formatting a missing or
 * malformed moment must never throw.
 */
describe("formatInstant", () => {
  it("does not throw on a missing or malformed moment", () => {
    expect(formatInstant(undefined)).toBe("date not recorded");
    expect(formatInstant(null)).toBe("date not recorded");
    expect(formatInstant("")).toBe("date not recorded");
    expect(formatInstant("not-a-real-date-value")).toBe("date not recorded");
  });

  it("still formats a real moment", () => {
    expect(formatInstant("2026-10-06")).toContain("2026");
    expect(formatInstant("2026-10-06T09:15:00.000Z")).toContain("2026");
  });
});
