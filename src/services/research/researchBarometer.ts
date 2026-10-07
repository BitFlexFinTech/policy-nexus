/**
 * SINGLE SOURCE OF TRUTH — ZEPARI's Economic Barometer: the institute's own indicators, tracked over time.
 *
 * The owner's decision (ZEPARI Batch G): the barometer tracks the institute's own economic indicators.
 * A reading is one figure for one indicator in one period, and it MUST carry the body that published
 * it — so a figure can never be shown without its source (the platform's sourcing rule: real, named
 * figures only, never an invented one). The readings are ZEPARI's own records, entered by the
 * institute and kept in this browser for now (see the seam in `researchBarometerStore.ts`).
 *
 * Determinism: a reading's id is a pure function of its indicator, period, value and source, so adding
 * the same reading twice replaces its entry; the added moment is read through `src/lib/clock.ts`.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import { hashString, toSeedHex } from "@/lib/prng";

export const RESEARCH_BAROMETER_KEY = "nzwisiso.research-barometer.v1";

/** One reading: a figure for one indicator, in one period, from one named source. */
export interface BarometerReading {
  id: string;
  /** The indicator, e.g. "Headline inflation". */
  indicator: string;
  /** The period the figure is for, e.g. "2026 Q1". */
  period: string;
  /** The figure, as written, e.g. "12.4". Kept as text so a figure is never altered. */
  value: string;
  /** The unit, e.g. "%" or "US$m". May be empty. */
  unit: string;
  /** The body that published the figure, and the publication. Required — a figure is never unsourced. */
  source: string;
  addedAt: string;
}

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isResearchBarometerStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToResearchBarometer = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly BarometerReading[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseReadings = (raw: string | null): readonly BarometerReading[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const readings = value.filter((entry): entry is BarometerReading => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<BarometerReading>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.indicator === "string" &&
        typeof candidate.period === "string" &&
        typeof candidate.value === "string"
      );
    });
    return readings.length ? readings : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedReadings: readonly BarometerReading[] = EMPTY;

export const getResearchBarometerSnapshot = (): readonly BarometerReading[] => {
  const raw = storage.read(RESEARCH_BAROMETER_KEY);
  if (raw === cachedRaw) return cachedReadings;
  cachedRaw = raw;
  cachedReadings = parseReadings(raw);
  return cachedReadings;
};

export const getResearchBarometerServerSnapshot = (): readonly BarometerReading[] => EMPTY;

const write = (next: readonly BarometerReading[]): void => {
  storage.write(RESEARCH_BAROMETER_KEY, JSON.stringify(next));
  cachedRaw = storage.read(RESEARCH_BAROMETER_KEY);
  cachedReadings = parseReadings(cachedRaw);
  emit();
};

/** Every reading, newest first. */
export const listBarometerReadings = (): readonly BarometerReading[] => getResearchBarometerSnapshot();

/** The stable id for one reading — a pure function of its indicator, period, value and source. */
export const barometerReadingId = (
  indicator: string,
  period: string,
  value: string,
  source: string,
): string => `brom-${toSeedHex(hashString(`${indicator}::${period}::${value}::${source}`))}`;

/** Keep a reading. Adding the same reading again replaces its entry. */
export const addBarometerReading = (
  reading: Omit<BarometerReading, "id" | "addedAt">,
): BarometerReading => {
  const record: BarometerReading = {
    ...reading,
    id: barometerReadingId(reading.indicator, reading.period, reading.value, reading.source),
    addedAt: nowIso(),
  };
  const existing = getResearchBarometerSnapshot().filter((entry) => entry.id !== record.id);
  write([record, ...existing].slice(0, 300));
  return record;
};

/** Remove one reading by id. */
export const removeBarometerReading = (id: string): void => {
  const existing = getResearchBarometerSnapshot();
  const next = existing.filter((reading) => reading.id !== id);
  if (next.length !== existing.length) write(next);
};

/** Remove every reading. Used by the panel's "Remove all" and the admin reset. */
export const clearAllBarometerReadings = (): void => {
  storage.remove(RESEARCH_BAROMETER_KEY);
  cachedRaw = undefined;
  cachedReadings = EMPTY;
  emit();
};