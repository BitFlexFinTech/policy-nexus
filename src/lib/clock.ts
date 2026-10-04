/**
 * THE ONE PLACE THE REAL CLOCK IS READ.
 *
 * The platform now shows the *current* date and time, and every document is dated
 * when it was made. Both need the real clock — but only in two narrow places:
 *
 *  1. the display, so an officer can see "today" on the screen, and
 *  2. the single moment a run is recorded, which then travels WITH the run into
 *     every document it produces.
 *
 * Everything else receives a moment as data. The engine, the register and the
 * document builders never read the clock, so the same policy still produces the
 * same figures — only the date attached to a run is real. That is why the
 * determinism check in `scripts/validate.mjs` allows the clock in THIS file alone;
 * a `new Date(` anywhere else in the app still fails the build.
 */

import { useEffect, useState } from "react";
import { formatReferenceDate } from "@/config/reference";

/** How often the on-screen clock refreshes, in milliseconds. */
export const CLOCK_TICK_MS = 1000;

/** The current instant as an ISO string. Used when a record is written. */
export const nowIso = (): string => new Date().toISOString();

/** The current instant as a local `Date`. The one clock read in the app. */
export const nowDate = (): Date => new Date();

/** A `Date`'s local calendar date as `YYYY-MM-DD`, so the shared formatter can read it. */
const localDateIso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** A `Date`'s local time as `HH:MM`. */
const localTime = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/**
 * A moment written the way the platform writes every date — `4 October 2026 · 09:15`.
 *
 * The month name comes from `formatReferenceDate`, so the platform keeps ONE month
 * list rather than starting a second date parser here.
 */
export const formatClock = (date: Date): string =>
  `${formatReferenceDate(localDateIso(date))} · ${localTime(date)}`;

/**
 * Format a stored moment (an ISO string, either a plain date or a full instant) the
 * same way. A plain date — a run recorded before this change, or a run built in a
 * test with no recorded moment — prints exactly as it always did, so nothing about
 * an older run is rewritten. A full instant prints in the reader's own local time.
 */
export const formatInstant = (iso: string): string =>
  iso.length <= 10 ? formatReferenceDate(iso) : formatClock(new Date(iso));

/**
 * The current moment, refreshing on a timer so the display keeps moving while the
 * page is open. Safe to call at the top of any component.
 */
export const useNow = (): Date => {
  const [now, setNow] = useState<Date>(nowDate);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(nowDate()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};
