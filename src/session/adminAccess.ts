/**
 * SINGLE SOURCE OF TRUTH — administrator access to the platform administration screen.
 *
 * The screen at `ADMIN_ROUTE` holds the platform's connection settings (the address and key
 * each capability is reached with). It is hidden by design — nothing links to it — but being
 * hidden is not the same as being protected, so it asks one plain question before it will
 * show the settings.
 *
 * TODAY (this build) that question is a plain confirmation, remembered for the browser tab.
 * THIS IS NOT REAL SECURITY, and the screen says so in the same words used here: the whole
 * platform runs in the browser, so anyone who reaches the address can confirm the question
 * too. It stops a visitor who merely guessed the address; it does not stop a determined one.
 *
 * LATER (the funded server and sign-in — see *NEXT PHASE* item 3) the same question is
 * answered by the server rather than the browser. When that happens only this module's two
 * exported behaviours change (`isAdminAcknowledged` and the acknowledge/lock actions): no
 * other file knows how the answer is decided, so no other file changes. This is the same
 * mock-first seam the sign-in and document-library connections use.
 *
 * DETERMINISM: nothing here reads the clock or randomness. The answer is either present or
 * absent, so a visit is reproducible.
 */

/** The one honest statement of what this guard does — and does not — do. */
export const ADMIN_GUARD_STATEMENT =
  "This is a plain confirmation, not real protection: the whole platform runs in your browser, " +
  "so anyone who reaches this address can confirm it too. Real protection arrives when the " +
  "platform is connected to a Government server and sign-in.";

/**
 * The acknowledgement lives in session storage, so it lasts for one browser tab and a new tab
 * asks again. Session storage can be refused by browser policy (private windows, locked-down
 * profiles); the in-memory fallback keeps the screen usable for the visit rather than throwing,
 * exactly as the shared browser adapter does for local storage.
 */
const ACK_KEY = "nzwisiso.admin.ack.v1";
const ACK_VALUE = "confirmed";

let memoryAck: string | null = null;

const readAck = (): boolean => {
  try {
    return window.sessionStorage.getItem(ACK_KEY) === ACK_VALUE;
  } catch {
    return memoryAck === ACK_VALUE;
  }
};

const writeAck = (value: string | null): void => {
  memoryAck = value;
  try {
    if (value === null) window.sessionStorage.removeItem(ACK_KEY);
    else window.sessionStorage.setItem(ACK_KEY, value);
  } catch {
    // Refused session storage: the memory fallback above is the whole record for this visit.
  }
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Subscribe to changes (used by useSyncExternalStore). */
export const subscribeToAdminAccess = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Whether an administrator has confirmed on this browser tab. */
export const isAdminAcknowledged = (): boolean => readAck();

/** Stable snapshot for useSyncExternalStore. */
export const getAdminAccessSnapshot = (): boolean => readAck();

/** Server snapshot for useSyncExternalStore — nothing is confirmed before hydration. */
export const getAdminAccessServerSnapshot = (): boolean => false;

/** Confirm that the person at the screen is the administrator, for this browser tab. */
export const acknowledgeAdministrator = (): void => {
  writeAck(ACK_VALUE);
  emit();
};

/** Forget the confirmation, so the question is asked again. */
export const lockAdminScreen = (): void => {
  writeAck(null);
  emit();
};
