/**
 * SINGLE SOURCE OF TRUTH — "everything this platform saved in this browser".
 *
 * The owner's instruction (2026-10-06): a reset control on the administration screen, so that if
 * data left behind by an earlier build ever causes trouble the administrator can clear it in one
 * click. Rather than listing the storage keys a second time here (which would drift out of step with
 * the stores that own them), this module asks each store to forget through that store's OWN seam —
 * the same behaviour its own screen uses — and then sweeps any remaining key that carries the
 * platform's shared prefix. A store added later is therefore cleared too, without anyone having to
 * remember to add it here.
 *
 * Two calls do specific jobs: `clearSession` signs the officer out, and `clearSsoAttempt` forgets a
 * sign-in that was left half-finished.
 *
 * The administrator's confirmation for this browser tab (`nzwisiso.admin.ack.v1`, in session
 * storage) is deliberately NOT cleared: it is a per-tab "yes, I am the administrator" answer, not
 * saved work, and keeping it means the administrator still sees this screen — and the result of the
 * reset — instead of being asked the question again mid-action.
 *
 * There is no clock and no randomness here: forgetting is a pure removal.
 */

import { clearContent } from "@/config/content";
import { clearConfig } from "@/config/platform";
import { clearSession } from "@/session/session";
import { clearSsoAttempt } from "@/session/sso";
import { clearRuns } from "@/services/assessment/runStore";
import { clearSupportCases } from "@/services/support/supportStore";
import { clearAllDepartmentDocuments } from "@/services/documents/departmentDocuments";
import { clearAllDrafts } from "@/services/documents/draftStore";
import { clearAllPolicyInput } from "@/services/documents/policyInputStore";

/**
 * Every key this platform writes begins with this prefix. The sweep below relies on it, so a key a
 * future store adds is still cleared by the one-click reset even if nobody updates this file.
 */
export const BROWSER_DATA_PREFIX = "nzwisiso.";

/** Remove every key under the platform's prefix from one storage area. */
const sweep = (area: Storage): void => {
  try {
    const doomed: string[] = [];
    for (let index = 0; index < area.length; index += 1) {
      const key = area.key(index);
      if (key && key.startsWith(BROWSER_DATA_PREFIX)) doomed.push(key);
    }
    doomed.forEach((key) => area.removeItem(key));
  } catch {
    // Storage refused by browser policy: the named forget-behaviours above are the record for
    // this visit, and there is nothing persisted here to sweep.
  }
};

/**
 * Forget everything this browser holds for the platform: capability credentials and content
 * overrides, the department session, every recorded run, every added document, every officer draft
 * and typed note, every support case, and a half-finished sign-in attempt.
 */
export const clearAllBrowserData = (): void => {
  clearConfig();
  clearContent();
  clearRuns();
  clearSupportCases();
  clearAllDepartmentDocuments();
  clearAllDrafts();
  clearAllPolicyInput();
  clearSession();
  clearSsoAttempt();

  // The catch-all: remove any other key the platform wrote, so a store added later is not left
  // behind. Local storage holds every persistent record; the two session-storage keys are handled
  // explicitly above (the sign-in attempt) or kept on purpose (the administrator's tab answer).
  sweep(window.localStorage);
};
