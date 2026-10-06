import { useSyncExternalStore } from "react";
import {
  clearConfig,
  getConfigServerSnapshot,
  getConfigSnapshot,
  saveConfig,
  setPlatformMode,
  subscribeToConfig,
  type PlatformConfig,
} from "./platform";

/**
 * Current platform configuration as React state, kept live through
 * useSyncExternalStore. Returns the all-simulated default when nothing is stored,
 * so a screen never has to handle "no configuration".
 */
export const usePlatformConfig = (): PlatformConfig =>
  useSyncExternalStore(subscribeToConfig, getConfigSnapshot, getConfigServerSnapshot);

/**
 * Configuration actions. Held as plain functions, so the administration screen
 * needs to know nothing about how the values are stored.
 */
export const platformConfigActions = {
  saveConfig,
  clearConfig,
  /** Set the whole platform to `simulated` or `live` in one step — the master switch. */
  setPlatformMode,
};
