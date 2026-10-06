import { useSyncExternalStore } from "react";
import {
  assignSupportCase,
  clearSupportCases,
  getSupportCasesServerSnapshot,
  getSupportCasesSnapshot,
  openSupportCase,
  setSupportCaseStatus,
  subscribeToSupportCases,
} from "./supportStore";

/**
 * Every support case as React state, kept live through useSyncExternalStore — the same
 * pattern as `useSession` and `usePlatformConfig`. Returns an empty list when nothing is
 * stored, so a screen never has to handle "no store".
 */
export const useSupportCases = () =>
  useSyncExternalStore(
    subscribeToSupportCases,
    getSupportCasesSnapshot,
    getSupportCasesServerSnapshot,
  );

/**
 * Support-case actions. Held as plain functions, so a future support server can replace the
 * implementation without any screen change.
 */
export const supportCaseActions = {
  openSupportCase,
  setSupportCaseStatus,
  assignSupportCase,
  clearSupportCases,
};
