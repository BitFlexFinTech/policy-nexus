/**
 * THE SUPPORT SEAM — where cases (support tickets) are kept.
 *
 * Mock-first, exactly like the document library and every other capability. Today this is
 * the SIMULATED desk: cases are kept in THIS browser with the shared browser adapter, and
 * the screens say plainly that they are not shared with anyone. There is no server and no
 * network call. When a support server exists, only this module changes — no screen reads
 * storage directly, so connecting the real desk is a change here and nowhere else.
 *
 * DETERMINISM: a case's `openedAt`/`updatedAt` are the real moments they happened, written
 * through the one clock file (src/lib/clock.ts) as metadata — exactly like a run's
 * `recordedAt`. Nothing else here reads the clock or randomness; case numbers are a plain
 * counter (CASE-0001, CASE-0002 …) derived from the cases already stored, so the same set
 * of cases always yields the same next number.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import { isDepartmentId } from "@/config/departments";
import {
  SUPPORT_CASE_STORAGE_KEY,
  SUPPORT_STATUSES,
  type SupportCategory,
  type SupportStatus,
} from "@/config/support";

/** A case as it is stored. */
export interface SupportCase {
  /** CASE-0001 … — a plain counter, so it is readable and reproducible. */
  id: string;
  departmentId: string;
  subject: string;
  category: SupportCategory;
  description: string;
  status: SupportStatus;
  /** The support representative the case is delegated to, or null while unassigned. */
  assignee: string | null;
  /** Who opened it, when the officer recorded a name. */
  openedBy: string | null;
  /** The real moment it was opened, and the last time it changed. Metadata, not a figure. */
  openedAt: string;
  updatedAt: string;
}

/** Everything but the fields the store fills in. */
export type SupportCaseInput = Pick<
  SupportCase,
  "departmentId" | "subject" | "category" | "description"
> & {
  openedBy?: string | null;
};

/* ------------------------------------------------------------------------- */
/* Storage adapter — the shared browser adapter (src/lib/browserStorage.ts).   */
/* ------------------------------------------------------------------------- */

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isSupportStorePersistent = () => storage.isPersistent();

/* ------------------------------------------------------------------------- */
/* Snapshot + subscription                                                     */
/* ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToSupportCases = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly SupportCase[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseCases = (raw: string | null): readonly SupportCase[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const cases = value.filter((entry): entry is SupportCase => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<SupportCase>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.departmentId === "string" &&
        isDepartmentId(candidate.departmentId) &&
        typeof candidate.subject === "string" &&
        SUPPORT_STATUSES.includes(candidate.status as SupportStatus)
      );
    });
    return cases.length ? cases : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedCases: readonly SupportCase[] = EMPTY;

/** Stable snapshot reference, required by `useSyncExternalStore`. */
export const getSupportCasesSnapshot = (): readonly SupportCase[] => {
  const raw = storage.read(SUPPORT_CASE_STORAGE_KEY);
  if (raw === cachedRaw) return cachedCases;
  cachedRaw = raw;
  cachedCases = parseCases(raw);
  return cachedCases;
};

/** Server snapshot — there are no cases before hydration. */
export const getSupportCasesServerSnapshot = (): readonly SupportCase[] => EMPTY;


/* ------------------------------------------------------------------------- */
/* Actions                                                                     */
/* ------------------------------------------------------------------------- */

/** Every case, newest first. */
export const listSupportCases = (): readonly SupportCase[] => getSupportCasesSnapshot();

/** One department's cases, newest first. */
export const listSupportCasesFor = (departmentId: string): readonly SupportCase[] =>
  getSupportCasesSnapshot().filter((entry) => entry.departmentId === departmentId);

/** The next readable case number, derived from what is already stored. */
const nextCaseId = (cases: readonly SupportCase[]): string => {
  const highest = cases.reduce((max, entry) => {
    const n = Number.parseInt(entry.id.replace(/^CASE-/, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `CASE-${String(highest + 1).padStart(4, "0")}`;
};

/**
 * Open a case. Returns the stored case, or null when the subject or department is missing —
 * an empty case is never created.
 */
export const openSupportCase = (input: SupportCaseInput): SupportCase | null => {
  const subject = input.subject.trim();
  if (!subject || !isDepartmentId(input.departmentId)) return null;
  const current = getSupportCasesSnapshot();
  const moment = nowIso();
  const record: SupportCase = {
    id: nextCaseId(current),
    departmentId: input.departmentId,
    subject,
    category: input.category,
    description: input.description.trim(),
    status: "open",
    assignee: null,
    openedBy: input.openedBy?.trim() || null,
    openedAt: moment,
    updatedAt: moment,
  };
  writeCases([record, ...current]);
  return record;
};

/** Change a case's state. Unknown ids are ignored; the state is validated against the list. */
export const setSupportCaseStatus = (id: string, status: SupportStatus): void => {
  if (!SUPPORT_STATUSES.includes(status)) return;
  const current = getSupportCasesSnapshot();
  writeCases(
    current.map((entry) => (entry.id === id ? { ...entry, status, updatedAt: nowIso() } : entry)),
  );
};

/** Delegate a case to a support representative, or clear the assignment with a blank name. */
export const assignSupportCase = (id: string, assignee: string): void => {
  const name = assignee.trim();
  const current = getSupportCasesSnapshot();
  writeCases(
    current.map((entry) =>
      entry.id === id ? { ...entry, assignee: name || null, updatedAt: nowIso() } : entry,
    ),
  );
};

/** Remove every case. Used by the administration screen's clear action. */
export const clearSupportCases = (): void => {
  storage.remove(SUPPORT_CASE_STORAGE_KEY);
  cachedRaw = undefined;
  cachedCases = EMPTY;
  emit();
};

const writeCases = (cases: readonly SupportCase[]): void => {
  storage.write(SUPPORT_CASE_STORAGE_KEY, JSON.stringify(cases));
  cachedRaw = storage.read(SUPPORT_CASE_STORAGE_KEY);
  cachedCases = cases.length ? cases : EMPTY;
  emit();
};
