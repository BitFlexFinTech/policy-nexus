/**
 * SINGLE SOURCE OF TRUTH — the ZEPARI research session: who entered the research assistant, and how.
 *
 * Kept SEPARATE from the department session (`src/session/session.ts`) on purpose: a researcher is
 * not a department, and the two products must never share a session. One-click entry only for now;
 * a real sign-in replaces this module behind the same functions (see PRODUCTION_READINESS.md).
 *
 * DETERMINISM: nothing here reads the system clock.
 */

import { createKeyValueStore } from "@/lib/browserStorage";
import { getResearcher } from "@/config/research";

export const RESEARCH_SESSION_STORAGE_KEY = "nzwisiso.research.session.v1";

export interface ResearchSession {
  /** The researcher's stable id — a key into `RESEARCHERS`. */
  researcherId: string;
  name: string;
  role: string;
  /** `oneclick` is the simulated entry the platform ships with. */
  mode: "oneclick";
}

/** The shared browser adapter, so the fallback behaviour is defined in one place. */
const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isResearchSessionPersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToResearchSession = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Parse a stored value defensively — a corrupt entry, or one naming a researcher who is no longer
 * listed, is treated as signed out. The name and role are re-read from the config, so a stored
 * record can never present a name the configuration does not hold.
 */
const parseSession = (raw: string | null): ResearchSession | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ResearchSession> | null;
    if (!value || typeof value.researcherId !== "string") return null;
    const known = getResearcher(value.researcherId);
    if (!known) return null;
    return { researcherId: known.id, name: known.name, role: known.role, mode: "oneclick" };
  } catch {
    return null;
  }
};

let cachedRaw: string | null | undefined;
let cachedSession: ResearchSession | null = null;

export const getResearchSession = (): ResearchSession | null => {
  const raw = storage.read(RESEARCH_SESSION_STORAGE_KEY);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = parseSession(raw);
  return cachedSession;
};

export const getResearchSessionSnapshot = getResearchSession;
export const getResearchSessionServerSnapshot = (): ResearchSession | null => null;

/** Enter the research assistant as one of the named researchers. */
export const signInResearcher = (researcherId: string): ResearchSession | null => {
  const researcher = getResearcher(researcherId);
  if (!researcher) return null;
  const session: ResearchSession = {
    researcherId: researcher.id,
    name: researcher.name,
    role: researcher.role,
    mode: "oneclick",
  };
  storage.write(RESEARCH_SESSION_STORAGE_KEY, JSON.stringify(session));
  emit();
  return session;
};

/** Leave the research assistant. */
export const clearResearchSession = (): void => {
  storage.remove(RESEARCH_SESSION_STORAGE_KEY);
  emit();
};