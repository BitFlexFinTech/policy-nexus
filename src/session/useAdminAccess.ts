import { useSyncExternalStore } from "react";
import {
  acknowledgeAdministrator,
  getAdminAccessServerSnapshot,
  getAdminAccessSnapshot,
  lockAdminScreen,
  subscribeToAdminAccess,
} from "./adminAccess";

/**
 * Whether an administrator has confirmed on this browser tab, kept live across components
 * through useSyncExternalStore — the same pattern as `useSession`.
 */
export const useAdminAccess = (): boolean =>
  useSyncExternalStore(
    subscribeToAdminAccess,
    getAdminAccessSnapshot,
    getAdminAccessServerSnapshot,
  );

/**
 * Administrator-access actions. Held as plain functions so a future server check can replace
 * the implementation without any component change.
 */
export const adminAccessActions = {
  acknowledgeAdministrator,
  lockAdminScreen,
};
