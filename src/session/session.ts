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
import { cleanOfficer, type OfficerIdentity } from "@/config/officer";
import { findDepartment, isDepartmentId, type DepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";

export const SESSION_STORAGE_KEY = "nzwisiso.session.v1";

/**
 * How the session began. `oneclick` is the simulated entry the platform ships
 * with; `sso` is real sign-in, reachable only once an identity provider is
 * configured in platform administration.
 */
export type SessionMode = "oneclick" | "sso";

export interface Session {
  departmentId: DepartmentId;
  mode: SessionMode;
  /** ISO date the session began. Always REFERENCE_DATE in scenario mode. */
  signedInAt: string;
  /** The identity the provider returned. Present only for an SSO session. */
  subject?: string;
  /**
   * Who is preparing policy in this workspace, as a paper trail for every document they
   * produce. Optional, so every session stored before this existed keeps working. The
   * identity carries how it was established; see `src/config/officer.ts`.
   */
  officer?: OfficerIdentity;
}

/**
 * Storage adapter — the shared browser adapter, so the fallback behaviour is
 * defined in exactly one place (src/lib/browserStorage.ts).
 */
const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isSessionPersistent = () => storage.isPersistent();

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
      // Anything unrecognised falls back to the simulated entry, so a corrupt or
      // older stored session can never be read as a real sign-in.
      mode: value.mode === "sso" ? "sso" : "oneclick",
      signedInAt: typeof value.signedInAt === "string" ? value.signedInAt : REFERENCE_DATE,
      subject: typeof value.subject === "string" ? value.subject : undefined,
      // A stored identity is re-cleaned on read, so a hand-edited or half-written record
      // can never present itself as a name the officer did not give.
      officer: cleanOfficer(value.officer ?? {}),
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
    // Changing department does not change who is working, so a recorded preparer is
    // carried over rather than silently dropped.
    officer: getSession()?.officer,
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

/**
 * Record who is preparing policy. Returns the updated session, or null when nobody is
 * signed in — an identity without a department would be attached to nothing.
 *
 * The name is stored as given, with its `source` set from how the session began: a
 * one-click entry can only ever produce a self-declared name, and a real sign-in produces
 * a name the provider answered for. Blank input removes the identity entirely.
 */
export const setOfficer = (officer: Partial<OfficerIdentity>): Session | null => {
  const current = getSession();
  if (!current) return null;
  const cleaned = cleanOfficer({
    ...officer,
    source: current.mode === "sso" ? "sign-in" : "self-declared",
  });
  const next: Session = { ...current };
  if (cleaned) next.officer = cleaned;
  else delete next.officer;
  storage.write(SESSION_STORAGE_KEY, JSON.stringify(next));
  emit();
  return next;
};

/** Forget the recorded preparer, without leaving the workspace. */
export const clearOfficer = (): Session | null => setOfficer({});

/**
 * Enter the workspace from an identity provider's answer.
 *
 * Kept separate from `signInToDepartment` on purpose: the one-click demo entry
 * and a real sign-in must never be mistaken for each other, and the session
 * records which one happened so the workspace can say so.
 */
export const signInWithSso = (departmentId: string, subject: string): Session | null => {
  if (!isDepartmentId(departmentId)) return null;
  const session: Session = {
    departmentId,
    mode: "sso",
    signedInAt: REFERENCE_DATE,
    subject,
    // A provider answer establishes WHO signed in, not who is preparing the policy, so any
    // recorded preparer is carried over unchanged — its `source` still says where it came
    // from. Nothing here may upgrade a self-declared name to a verified one.
    officer: getSession()?.officer,
  };
  storage.write(SESSION_STORAGE_KEY, JSON.stringify(session));
  emit();
  return session;
};

/** The current department id, or null when signed out. */
export const getSessionDepartmentId = (): DepartmentId | null =>
  getSession()?.departmentId ?? null;