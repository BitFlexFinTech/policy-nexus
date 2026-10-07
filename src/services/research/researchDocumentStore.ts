/**
 * THE RESEARCH LIBRARY SEAM — where ZEPARI's research documents are kept.
 *
 * Mock-first, exactly like every other capability in this platform, and like the department library
 * seam it mirrors. Today the documents are kept in THIS BROWSER by the **Local** client, and that is
 * the state the platform ships in and the state that needs no server. When ZEPARI's own document
 * server exists, a platform administrator enters its address and key on the administration screen
 * (nothing else), and the SAME screens start using the **Shared** client — no code change anywhere.
 *
 * HONEST ABOUT THE LIMIT: the Local client is browser-only. It is shared with nobody — not another
 * researcher, not another machine — and it says so in plain words on the surface that uses it. The
 * Shared client is the ONLY way research documents are shared, and there is no server yet, so the
 * platform never claims the library is shared while it is Local.
 *
 * The research library reuses the platform's ONE `library` capability for its server address and
 * key, so connecting ZEPARI's server later is the same configuration-only step.
 */

import {
  describeCapability,
  getConfig,
  type CapabilityConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addResearchDocument,
  clearAllResearchDocuments,
  listResearchDocuments,
  removeResearchDocument,
  type ResearchDocumentRecord,
} from "./researchDocuments";

/** A document on its way in — everything but the id and the date, which the store adds. */
export type ResearchDocumentInputRecord = Omit<ResearchDocumentRecord, "id" | "addedAt">;

/** Which surface the research documents are kept on. */
export type ResearchLibraryMode = "local" | "shared";

export interface ResearchDocumentStore {
  readonly mode: ResearchLibraryMode;
  readonly label: string;
  readonly limitation: string;
  list(): readonly ResearchDocumentRecord[];
  add(record: ResearchDocumentInputRecord): Promise<ResearchDocumentRecord>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/* ------------------------------------------------------------------------- */
/* Local — the mock. This is what runs today.                                  */
/* ------------------------------------------------------------------------- */

export const LOCAL_RESEARCH_LIBRARY_LABEL = "This browser (Local)";
export const LOCAL_RESEARCH_LIBRARY_LIMITATION =
  "Kept in this browser, for the research assistant only. Shared with nobody — not another researcher, not another machine — and lost if this browser's stored data is cleared. Once ZEPARI's own document server is connected, the same documents are held there instead.";

export const LOCAL_RESEARCH_LIBRARY_STORE: ResearchDocumentStore = {
  mode: "local",
  label: LOCAL_RESEARCH_LIBRARY_LABEL,
  limitation: LOCAL_RESEARCH_LIBRARY_LIMITATION,
  list: () => listResearchDocuments(),
  add: async (record) => addResearchDocument(record),
  remove: async (id) => {
    removeResearchDocument(id);
  },
  clear: async () => {
    clearAllResearchDocuments();
  },
};

/* ------------------------------------------------------------------------- */
/* Shared — the real client. Used only when a server is completely configured. */
/* ------------------------------------------------------------------------- */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

/**
 * The HTTP client for ZEPARI's shared research library. It is complete: it sends exactly the record
 * the Local client stores, and it treats any non-2xx answer as a failure rather than pretending the
 * document was kept. The browser copy is written first so the screen never blocks.
 */
export const createSharedResearchLibraryStore = (
  config: CapabilityConfig,
): ResearchDocumentStore => {
  const base = trimTrailingSlash(config.endpoint.trim());
  const headers = (): Record<string, string> => ({
    "content-type": "application/json",
    Authorization: `Bearer ${config.key.trim()}`,
  });

  const call = async (path: string, init: RequestInit): Promise<void> => {
    const response = await fetch(`${base}${path}`, { ...init, headers: headers() });
    if (!response.ok) {
      throw new Error(`The research library server answered ${response.status}.`);
    }
  };

  return {
    mode: "shared",
    label: "ZEPARI's shared research library (server)",
    limitation:
      "Sent to ZEPARI's research library server, so every researcher and every machine sees them. This browser keeps a copy so the assistant still works with no connection.",
    list: () => listResearchDocuments(),
    add: async (record) => {
      const saved = addResearchDocument(record);
      await call("/research", { method: "POST", body: JSON.stringify({ document: record }) });
      return saved;
    },
    remove: async (id) => {
      removeResearchDocument(id);
      await call(`/research/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clear: async () => {
      clearAllResearchDocuments();
      await call("/research", { method: "DELETE" });
    },
  };
};

/* ------------------------------------------------------------------------- */
/* The chooser                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * The store for the given configuration. The research library is only Shared when the `library`
 * capability is COMPLETELY configured (address and key); anything less falls back to Local rather
 * than half-working, exactly like the platform's other capabilities.
 */
export const researchDocumentStoreFor = (config: PlatformConfig): ResearchDocumentStore =>
  describeCapability(config, "library").state === "live"
    ? createSharedResearchLibraryStore(config.library)
    : LOCAL_RESEARCH_LIBRARY_STORE;

/** The store for the current configuration. */
export const getResearchDocumentStore = (): ResearchDocumentStore =>
  researchDocumentStoreFor(getConfig());