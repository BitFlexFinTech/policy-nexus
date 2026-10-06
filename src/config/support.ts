/**
 * SINGLE SOURCE OF TRUTH — the support desk (cases / tickets).
 *
 * An officer can open a case from the workspace, and the platform administration screen
 * shows every case and lets an administrator set its state and delegate it to a support
 * representative. The categories, the states and the wording live here and nowhere else,
 * so a screen cannot invent its own list.
 *
 * MOCK-FIRST, exactly like every other connection in this platform. Today the desk is
 * SIMULATED: a case is kept in THIS browser by `src/services/support/supportStore.ts`, and
 * the screens say so in plain words. There is no server and no network call. When the
 * platform is connected to its support server, the same screens carry real, cross-machine
 * cases — the store is the only thing that changes, because no screen knows how a case is
 * kept.
 *
 * DETERMINISM: the moment a case is opened is the real moment, written through the one
 * clock file (`src/lib/clock.ts`), exactly like the moment a run is recorded. It is
 * metadata on the case; it never changes what the screens compute.
 */

/** Where the simulated cases are kept in this browser. */
export const SUPPORT_CASE_STORAGE_KEY = "nzwisiso.support.cases.v1";

/** What a case is about. A short, fixed list — an officer picks one. */
export const SUPPORT_CATEGORIES = ["Access", "Data", "Simulation", "Report", "Other"] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** A case's state. Open → In progress → Resolved. */
export const SUPPORT_STATUSES = ["open", "in-progress", "resolved"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  resolved: "Resolved",
};

/**
 * The ONE honest statement of what this desk is today. It is shown wherever cases are,
 * so nobody mistakes a simulated case for one another machine can see.
 */
export const SUPPORT_DESK_LIMITATION =
  "Simulated support desk. A case is kept in THIS browser only, so it is not seen on another " +
  "officer's screen or another machine, and nothing is sent anywhere. Real, cross-machine cases " +
  "arrive when the platform is connected to its support server.";
