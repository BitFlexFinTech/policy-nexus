import { useSyncExternalStore } from "react";
import {
  clearSession,
  getSessionServerSnapshot,
  getSessionSnapshot,
  signInToDepartment,
  subscribeToSession,
  type Session,
} from "./session";

/**
 * Current workspace session as React state, kept live across components through
 * useSyncExternalStore. Returns null when the user has not entered a department.
 */
export const useSession = (): Session | null =>
  useSyncExternalStore(subscribeToSession, getSessionSnapshot, getSessionServerSnapshot);

/**
 * Session actions. Held as plain functions so a future identity provider can
 * replace the implementation without any component change.
 */
export const sessionActions = {
  signInToDepartment,
  clearSession,
};