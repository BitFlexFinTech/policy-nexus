/**
 * SINGLE SOURCE OF TRUTH — the answers only the department can give.
 *
 * The drafted policy and the Implementation pack both print the working matrices, and both leave an
 * office, a calendar date, a funding source, an amount, a monitoring target and a review frequency as a
 * marked blank. Before this store there was nowhere to put those answers: an officer finished the job in
 * Word, and the platform's own copy stayed permanently incomplete.
 *
 * The officer types each answer ONCE, here, keyed by the run it belongs to. Both documents print it, so
 * the two can never show different offices for the same measure.
 *
 * WHAT IS KEPT: only what the officer typed. Nothing is generated, and a row the officer leaves alone
 * keeps printing the marked blank — the platform never fills a gap with a guess.
 *
 * There is no server in scenario mode: this is the durable store, in this browser only. A browser that
 * refuses to keep data falls back to memory for the visit and says so through `isImplementationStorePersistent()`.
 *
 * Determinism: plain entered text, no clock and no randomness.
 */

import { createKeyValueStore } from "@/lib/browserStorage";
import type { DocumentFills, FillField } from "@/services/assessment/matrices";

export const IMPLEMENTATION_FILLS_KEY = "nzwisiso.implementation-fills.v1";

type FillsByRun = Readonly<Record<string, DocumentFills>>;

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isImplementationStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToImplementationFills = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: FillsByRun = Object.freeze({});

/** Stable snapshot for `useSyncExternalStore` — the raw JSON, which only changes on a write. */
export const getImplementationFillsSnapshot = (): string | null =>
  storage.read(IMPLEMENTATION_FILLS_KEY);

/** Server snapshot — nothing is entered before hydration. */
export const getImplementationServerSnapshot = (): string | null => null;

/**
 * The answers for one run, read out of a snapshot that has already been fetched, so a screen derives
 * them from the exact string it subscribed to rather than from a second read of storage.
 */
export const fillsIn = (raw: string | null, runId: string): DocumentFills =>
  parseFills(raw)[runId] ?? EMPTY_FOR_RUN;

const EMPTY_FOR_RUN: DocumentFills = Object.freeze({});

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseFills = (raw: string | null): FillsByRun => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([runId, rows]) => !!runId && rows !== null && typeof rows === "object" && !Array.isArray(rows))
      .map(([runId, rows]) => {
        const cleaned: Record<string, Record<string, string>> = {};
        Object.entries(rows as Record<string, unknown>).forEach(([key, fields]) => {
          if (!key || !fields || typeof fields !== "object" || Array.isArray(fields)) return;
          const kept: Record<string, string> = {};
          Object.entries(fields as Record<string, unknown>).forEach(([field, text]) => {
            if (typeof text === "string" && text.trim()) kept[field] = text;
          });
          if (Object.keys(kept).length > 0) cleaned[key] = kept;
        });
        return [runId, cleaned] as const;
      })
      .filter(([, rows]) => Object.keys(rows).length > 0);
    return entries.length ? Object.freeze(Object.fromEntries(entries)) : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cached: FillsByRun = EMPTY;

const read = (): FillsByRun => {
  const raw = getImplementationFillsSnapshot();
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = parseFills(raw);
  return cached;
};

const write = (next: Record<string, DocumentFills>): void => {
  storage.write(IMPLEMENTATION_FILLS_KEY, JSON.stringify(next));
  cachedRaw = storage.read(IMPLEMENTATION_FILLS_KEY);
  cached = parseFills(cachedRaw);
  emit();
};

/** The answers entered for one run. */
export const getImplementationFills = (runId: string | null | undefined): DocumentFills =>
  runId ? read()[runId] ?? EMPTY_FOR_RUN : EMPTY_FOR_RUN;

/** Every run with entered answers. */
export const listImplementationFills = (): FillsByRun => read();

/**
 * Record one answer. An empty value REMOVES the answer, so clearing a box restores the marked blank
 * rather than storing an empty string that looks like an answer.
 */
export const saveImplementationFill = (
  runId: string,
  rowKey: string,
  field: FillField,
  value: string,
): void => {
  if (!runId || !rowKey) return;
  const current = read();
  const forRun: Record<string, Record<string, string>> = { ...(current[runId] as object) };
  const row: Record<string, string> = { ...(forRun[rowKey] as object) };

  if (value.trim()) row[field] = value;
  else delete row[field];

  if (Object.keys(row).length > 0) forRun[rowKey] = row;
  else delete forRun[rowKey];

  const next: Record<string, DocumentFills> = { ...current };
  if (Object.keys(forRun).length > 0) next[runId] = forRun;
  else delete next[runId];
  write(next);
};

/** Forget every answer entered for one run. */
export const clearImplementationFills = (runId: string): void => {
  const current = read();
  if (!(runId in current)) return;
  const next: Record<string, DocumentFills> = { ...current };
  delete next[runId];
  write(next);
};
