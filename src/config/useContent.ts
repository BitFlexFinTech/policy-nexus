import { useSyncExternalStore } from "react";
import {
  clearContent,
  getContentServerSnapshot,
  getContentSnapshot,
  saveContent,
  subscribeToContent,
  type ContentOverride,
} from "./content";

/**
 * The current landing-page override as React state, kept live through
 * useSyncExternalStore. Returns the empty override (the wording the platform
 * ships with) when nothing is stored, so a screen never has to handle "no
 * content".
 */
export const useContent = (): ContentOverride =>
  useSyncExternalStore(subscribeToContent, getContentSnapshot, getContentServerSnapshot);

/**
 * Content actions. Plain functions, so a screen needs to know nothing about how
 * the override is stored.
 */
export const contentActions = {
  saveContent,
  clearContent,
};
