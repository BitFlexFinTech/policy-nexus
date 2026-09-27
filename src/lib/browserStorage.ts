/**
 * SINGLE SOURCE OF TRUTH — the browser key/value adapter used by every
 * client-side store in this build: the workspace session, the simulation
 * register, and the platform configuration.
 *
 * Local storage can be refused by browser policy (private windows, locked-down
 * profiles). Rather than throwing, the adapter falls back to memory for the
 * visit and reports that plainly through `isPersistent()`, so a screen can state
 * the limitation instead of silently losing data.
 *
 * There is no clock and no randomness here: reading and writing are pure
 * pass-throughs.
 */

export interface KeyValueStore {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
  /** False when the browser refused persistent storage and memory is in use. */
  isPersistent(): boolean;
}

/**
 * One adapter per store. Each keeps its own memory fallback, so one store being
 * refused persistent storage cannot silently affect another's reads.
 */
export const createKeyValueStore = (): KeyValueStore => {
  const memory = new Map<string, string>();
  let usingMemoryFallback = false;

  return {
    read(key) {
      if (usingMemoryFallback) return memory.get(key) ?? null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Local storage can be blocked by browser policy. This is a storage
        // capability fallback, not an error being hidden: the flag is exposed
        // through isPersistent() so the UI can state it plainly.
        usingMemoryFallback = true;
        return memory.get(key) ?? null;
      }
    },
    write(key, value) {
      memory.set(key, value);
      if (usingMemoryFallback) return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        usingMemoryFallback = true;
      }
    },
    remove(key) {
      memory.delete(key);
      if (usingMemoryFallback) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        usingMemoryFallback = true;
      }
    },
    isPersistent() {
      return !usingMemoryFallback;
    },
  };
};
