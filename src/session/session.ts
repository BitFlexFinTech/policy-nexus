/**
 * SINGLE SOURCE OF TRUTH — workspace session.
 *
 * Stage 1 (this build) uses one-click department entry: there are no
 * credentials and no network call. The session is a small, deterministic record
 * written to local storage. The real identity provider replaces this module
 * behind the same functions — see PRODUCTION_READINESS.md §2.
 *
 * DETERMINISM: `signedInAt` is the fixed REFERENCE_DATE, never the system clock.
 */

import { REFERENCE_DATE } from "@/config/reference";
import { findDepartment, isDepartmentId, type DepartmentId } from "@/config/departments";

export const SESSION_STORAGE_KEY = "nzwisiso.session.v1";

/** Entry modes. `oneclick` is the current implementation; real SSO adds a value. */
export type SessionMode = "oneclick";

export interface Session {
  departmentId: DepartmentId;
  mode: SessionMode;
  /** ISO date the session began. Always REFERENCE_DATE in scenario mode. */
  signedInAt: string;
}

/**
 * Storage adapter. Falls back to memory when local storage is unavailable
 * (for example a locked-down browser profile), so the workspace still functions
 * for the duration of the visit instead of throwing.
 */
const memoryStore = new Map<string, string>();
let usingMemoryFallback = false;

const storage = {
  read(key: string): string | null {
    if (usingMemoryFallback) return memoryStore.get(key) ?? null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      // Local storage can be blocked by browser policy. This is a storage
      // capability fallback, not an error being hidden: the flag is exposed
      // through isSessionPersistent() so the UI can state it plainly.
      usingMemoryFallback = true;
      return memoryStore.get(key) ?? null;
    }
  },
  write(key: string, value: string) {
    memoryStore.set(key, value);
    if (usingMemoryFallback) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      usingMemoryFallback = true;
    }
  },
  remove(key: string) {
    memoryStore.delete(key);
    if (usingMemoryFallback) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      usingMemoryFallback = true;
    }
  },
};

/** False when the browser refused persistent storage and memory is in use. */
export const isSessionPersistent = () => !usingMemoryFallback;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Subscribe to session changes (used by useSyncExternalStore). */
export const subscribeToSession = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Parse a stored value defensively — a corrupt entry is treated as signed out. */
const parseSession = (raw: string | null): Session | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session> | null;
    if (!value || typeof value.departmentId !== "string" || !isDepartmentId(value.departmentId)) return null;
    return {
      departmentId: value.departmentId,
      mode: value.mode === "oneclick" ? "oneclick" : "oneclick",
      signedInAt: typeof value.signedInAt === "string" ? value.signedInAt : REFERENCE_DATE,
    };
  } catch {
    // A malformed stored value is not recoverable; treat it as absent.
    return null;
  }
};

/**
 * Read the current session. Returns null when no valid session is stored, or
 * when the stored department is no longer one of the 16 canonical departments.
 *
 * The result is cached against the raw stored string so that repeated calls
 * return an identical reference — required by React's useSyncExternalStore.
 */
let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

export const getSession = (): Session | null => {
  const raw = storage.read(SESSION_STORAGE_KEY);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  const parsed = parseSession(raw);
  cachedSession = parsed && findDepartment(parsed.departmentId) ? parsed : null;
  return cachedSession;
};

/** Stable snapshot for useSyncExternalStore. */
export const getSessionSnapshot = getSession;

/** Server snapshot for useSyncExternalStore — there is no session before hydration. */
export const getSessionServerSnapshot = (): Session | null => null;

/**
 * Enter the workspace for a department. Returns the stored session, or null if
 * the id is not one of the 16 canonical departments.
 */
export const signInToDepartment = (departmentId: string): Session | null => {
  if (!isDepartmentId(departmentId)) return null;
  const session: Session = {
    departmentId,
    mode: "oneclick",
    signedInAt: REFERENCE_DATE,
  };
  storage.write(SESSION_STORAGE_KEY, JSON.stringify(session));
  emit();
  return session;
};

/** Leave the workspace. */
export const clearSession = (): void => {
  storage.remove(SESSION_STORAGE_KEY);
  emit();
};

/** The current department id, or null when signed out. */
export const getSessionDepartmentId = (): DepartmentId | null =>
  getSession()?.departmentId ?? null;