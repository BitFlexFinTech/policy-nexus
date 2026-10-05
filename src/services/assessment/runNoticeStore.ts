/**
 * SINGLE SOURCE OF TRUTH — which departments have already been shown the
 * "before you run" notice (the owner's item 5).
 *
 * The owner asked for a notification on Run Simulation. It says plainly that the drafted
 * policy is built from the real, published data the engine holds for the department, that
 * this data is currently limited, and that the department can make its policy longer and
 * better grounded by adding its own reports, spreadsheets and statistics to its Document
 * Library. The notice is shown ONCE per department and then remembered, so it informs
 * rather than nags; the small permanent note beside the Run Simulation button stays on
 * screen, so the message is never lost.
 *
 * The record is kept in this browser, through the same adapter every other store uses. If
 * the browser refuses persistent storage, the notice is simply shown again on the next
 * visit — it never blocks a run and never touches the officer's work.
 */

import { isDepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";

export const RUN_NOTICE_KEY = "nzwisiso.run-notice.v1";

const storage = createKeyValueStore();

/** The departments whose officer has already seen (and dismissed) the notice. */
type NoticeMap = Readonly<Record<string, true>>;

/** Read the record, keeping only well-formed entries, so a corrupted value cannot break a run. */
const parse = (raw: string | null): NoticeMap => {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const kept = Object.entries(value).filter(
      ([id, seen]) => isDepartmentId(id) && seen === true,
    );
    return Object.fromEntries(kept) as NoticeMap;
  } catch {
    return {};
  }
};

/** True once the officer has seen the notice for this department, so it is not shown again. */
export const hasSeenRunNotice = (departmentId: string | null | undefined): boolean => {
  if (!departmentId || !isDepartmentId(departmentId)) return false;
  return parse(storage.read(RUN_NOTICE_KEY))[departmentId] === true;
};

/** Remember that this department's officer has seen the notice. */
export const markRunNoticeSeen = (departmentId: string): void => {
  if (!isDepartmentId(departmentId)) return;
  const next: Record<string, true> = { ...parse(storage.read(RUN_NOTICE_KEY)), [departmentId]: true };
  storage.write(RUN_NOTICE_KEY, JSON.stringify(next));
};

/** Forget the notice for one department, or for every department when none is named. */
export const clearRunNotice = (departmentId?: string): void => {
  if (departmentId === undefined) {
    storage.remove(RUN_NOTICE_KEY);
    return;
  }
  const current = parse(storage.read(RUN_NOTICE_KEY));
  if (!(departmentId in current)) return;
  const next: Record<string, true> = { ...current };
  delete next[departmentId];
  storage.write(RUN_NOTICE_KEY, JSON.stringify(next));
};
