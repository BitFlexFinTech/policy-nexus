import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

/**
 * jsdom does not implement element scrolling. Components legitimately call
 * scrollTo() to keep a feed pinned to its newest entry, so the method is stubbed
 * here rather than removed from the component. Nothing about layout is asserted
 * in these tests; the stub exists so rendering a scrolling panel does not throw.
 */
Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

/**
 * Node defines its own experimental global `localStorage`, which is `undefined`
 * unless the process is started with `--localstorage-file`. Because vitest's
 * jsdom environment aliases `window` to `globalThis`, that Node global shadows
 * jsdom's working implementation and `window.localStorage` reads back as
 * `undefined` — which silently disables every storage-backed feature in tests.
 *
 * The shim below restores a real, functional Storage implementation so the
 * app's actual persistence path is the path under test, rather than the
 * in-memory fallback. It is deliberately NOT a no-op.
 */
const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
};

// Intentionally unguarded: if the platform refuses this definition the test run
// must fail loudly rather than quietly fall back to the memory store.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: createMemoryStorage(),
});
