/**
 * SINGLE SOURCE OF TRUTH — the officer's own wording for a drafted policy.
 *
 * The drafted policy is a starting text the officer is expected to edit before it is
 * circulated. Those edits used to live only in the screen's own state, so the moment
 * the officer opened the full report (or simply reloaded) their wording was gone —
 * "Edit draft wording" was a promise the platform did not keep. The working copy is
 * now kept in this browser, keyed by the run it belongs to.
 *
 * Only the officer's own text is stored. The generated draft is NOT stored: it is
 * derived from the run and recomputed, so the two can never drift (see
 * .clinerules/03-single-source-of-truth.md). Blank or whitespace-only text is treated
 * as "no working copy", so clearing the box restores the generated draft rather than
 * exporting an empty instrument.
 *
 * There is no backend in scenario mode: this is the durable store. It uses the shared
 * browser adapter, so a browser that refuses persistent storage falls back to memory
 * for the visit and reports that plainly through `isDraftStorePersistent()`.
 */

import { REFERENCE_DATE } from "@/config/reference";
import { createKeyValueStore } from "@/lib/browserStorage";

export const DRAFTS_STORAGE_KEY = "nzwisiso.policy-drafts.v1";

/** One working copy: the officer's text, and the date it was last written. */
export interface StoredDraft {
  text: string;
  savedAt: string;
}

type DraftMap = Readonly<Record<string, StoredDraft>>;

/* ------------------------------------------------------------------------- */
/* Storage adapter — the shared browser adapter (src/lib/browserStorage.ts).   */
/* ------------------------------------------------------------------------- */

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isDraftStorePersistent = () => storage.isPersistent();

/* ------------------------------------------------------------------------- */
/* Snapshot + subscription                                                     */
/* ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToDrafts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: DraftMap = Object.freeze({});

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseDrafts = (raw: string | null): DraftMap => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, StoredDraft] => {
        const candidate = entry[1] as Partial<StoredDraft> | null | undefined;
        return (
          !!candidate &&
          typeof candidate === "object" &&
          typeof candidate.text === "string" &&
          !!entry[0]
        );
      },
    );
    return entries.length ? Object.freeze(Object.fromEntries(entries)) : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedDrafts: DraftMap = EMPTY;

/**
 * Stable snapshot for `useSyncExternalStore`. The raw JSON is returned rather than a
 * parsed object because a string only changes when something is actually written — a
 * freshly parsed object would be a new reference on every render and would loop.
 */
export const getDraftsSnapshot = (): string | null => storage.read(DRAFTS_STORAGE_KEY);

/** Server snapshot — there is no working copy before hydration. */
export const getDraftsServerSnapshot = (): string | null => null;

/** Every working copy, parsed once per change. */
export const listDrafts = (): DraftMap => {
  const raw = getDraftsSnapshot();
  if (raw === cachedRaw) return cachedDrafts;
  cachedRaw = raw;
  cachedDrafts = parseDrafts(raw);
  return cachedDrafts;
};

/** One recorded working copy, or undefined when the officer has not written one. */
export const getDraft = (runId: string): StoredDraft | undefined => listDrafts()[runId];

/** The officer's wording for one run, or null when there is none. */
export const getDraftText = (runId: string): string | null => getDraft(runId)?.text ?? null;

/**
 * The officer's wording for one run, read out of a snapshot that has already been
 * fetched. Screens use this with `getDraftsSnapshot` so the value is derived from the
 * exact string they subscribed to, rather than from a second read of storage.
 */
export const draftTextIn = (raw: string | null, runId: string): string | null =>
  parseDrafts(raw)[runId]?.text ?? null;

/* ------------------------------------------------------------------------- */
/* Actions                                                                     */
/* ------------------------------------------------------------------------- */

const write = (next: Record<string, StoredDraft>): void => {
  storage.write(DRAFTS_STORAGE_KEY, JSON.stringify(next));
  cachedRaw = storage.read(DRAFTS_STORAGE_KEY);
  cachedDrafts = parseDrafts(cachedRaw);
  emit();
};

/** Keep the officer's wording for this run. Blank text clears the working copy. */
export const saveDraftText = (runId: string, text: string): void => {
  if (!runId) return;
  if (!text.trim()) {
    clearDraftText(runId);
    return;
  }
  write({ ...listDrafts(), [runId]: { text, savedAt: REFERENCE_DATE } });
};

/** Forget the working copy, so the generated draft is shown again. */
export const clearDraftText = (runId: string): void => {
  const current = listDrafts();
  if (!(runId in current)) return;
  const next: Record<string, StoredDraft> = { ...current };
  delete next[runId];
  write(next);
};
