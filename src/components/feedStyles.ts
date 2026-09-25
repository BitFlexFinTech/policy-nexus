/**
 * Shared presentation tokens for the two deterministic feeds (the workspace
 * agent feed and the live simulation feed). They live here once so the two
 * renderers cannot drift apart (see .clinerules/03-single-source-of-truth.md).
 *
 * Every class is an existing palette token — no new colour literals.
 */

export const FEED_TAG_TONES = [
  "bg-primary text-primary-foreground",
  "bg-gold text-gold-foreground",
  "bg-success text-success-foreground",
  "bg-warning text-warning-foreground",
  "bg-destructive text-destructive-foreground",
] as const;

export const FEED_SYSTEM_TONE = "bg-muted text-muted-foreground";

export const FEED_TYPE_ICONS: Record<string, string> = {
  info: "ℹ",
  action: "▶",
  result: "✓",
  warning: "⚠",
  system: "⚙",
};

/**
 * Deterministic feed timestamp. The feed is a record of a scenario, so the clock
 * is derived from position, never from the system clock — the same department
 * always produces the same timestamps.
 */
export const feedTimestamp = (index: number): string => {
  const totalSeconds = index * 3;
  const minutes = 23 + Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `14:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
