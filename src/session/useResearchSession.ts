import { useSyncExternalStore } from "react";
import {
  clearResearchSession,
  getResearchSessionServerSnapshot,
  getResearchSessionSnapshot,
  signInResearcher,
  subscribeToResearchSession,
  type ResearchSession,
} from "./researchSession";

/**
 * Current ZEPARI research session as React state, kept live through useSyncExternalStore. Returns
 * null when no researcher is signed in, so a screen never has to handle "no session".
 */
export const useResearchSession = (): ResearchSession | null =>
  useSyncExternalStore(
    subscribeToResearchSession,
    getResearchSessionSnapshot,
    getResearchSessionServerSnapshot,
  );

/** Research-session actions, held as plain functions so a screen knows nothing about storage. */
export const researchSessionActions = {
  signInResearcher,
  clearResearchSession,
};