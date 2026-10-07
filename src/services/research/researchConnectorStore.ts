/**
 * THE DATA-SOURCE CONNECTOR SEAM — where ZEPARI's data sources are recorded.
 *
 * Mock-first, like the platform's other seams. Today the sources are recorded in THIS BROWSER by the
 * **Local** client, and that is the state the platform ships in. When ZEPARI's own server is
 * connected, a platform administrator enters its address and key on the administration screen
 * (nothing else), and the SAME surface uses the **Shared** client — no code change anywhere.
 *
 * HONEST ABOUT WHAT THIS DOES: the seam records WHICH sources the assistant may read from. It reads
 * NO figures itself — reading a figure needs ZEPARI's server, and until it is connected the surface
 * says plainly that no figure is read. So the platform never invents a source and never invents a
 * figure.
 *
 * It reuses the platform's ONE `library` capability for the server address and key.
 */

import {
  describeCapability,
  getConfig,
  type CapabilityConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addResearchDataSource,
  clearAllResearchDataSources,
  listResearchDataSources,
  removeResearchDataSource,
  type ResearchDataSource,
} from "./researchDataSources";

/** A source on its way in — everything but the id and the date, which the store adds. */
export type ResearchDataSourceInputRecord = Omit<ResearchDataSource, "id" | "addedAt">;

/** Which surface the data sources are recorded on. */
export type ResearchConnectorMode = "local" | "shared";

export interface ResearchConnectorStore {
  readonly mode: ResearchConnectorMode;
  readonly label: string;
  readonly limitation: string;
  list(): readonly ResearchDataSource[];
  add(record: ResearchDataSourceInputRecord): Promise<ResearchDataSource>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/* ------------------------------------------------------------------------- */
/* Local — the mock. This is what runs today.                                  */
/* ------------------------------------------------------------------------- */

export const LOCAL_RESEARCH_CONNECTOR_LABEL = "This browser (Local)";
export const LOCAL_RESEARCH_CONNECTOR_LIMITATION =
  "Recorded in this browser, for the research assistant only. Shared with nobody — not another researcher, not another machine. No figures are read from these sources yet; reading starts when ZEPARI's own server is connected.";

export const LOCAL_RESEARCH_CONNECTOR_STORE: ResearchConnectorStore = {
  mode: "local",
  label: LOCAL_RESEARCH_CONNECTOR_LABEL,
  limitation: LOCAL_RESEARCH_CONNECTOR_LIMITATION,
  list: () => listResearchDataSources(),
  add: async (record) => addResearchDataSource(record),
  remove: async (id) => {
    removeResearchDataSource(id);
  },
  clear: async () => {
    clearAllResearchDataSources();
  },
};

/* ------------------------------------------------------------------------- */
/* Shared — the real client. Used only when a server is completely configured. */
/* ------------------------------------------------------------------------- */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const createSharedResearchConnectorStore = (
  config: CapabilityConfig,
): ResearchConnectorStore => {
  const base = trimTrailingSlash(config.endpoint.trim());
  const headers = (): Record<string, string> => ({
    "content-type": "application/json",
    Authorization: `Bearer ${config.key.trim()}`,
  });

  const call = async (path: string, init: RequestInit): Promise<void> => {
    const response = await fetch(`${base}${path}`, { ...init, headers: headers() });
    if (!response.ok) {
      throw new Error(`The research connector server answered ${response.status}.`);
    }
  };

  return {
    mode: "shared",
    label: "ZEPARI's shared data sources (server)",
    limitation:
      "Sent to ZEPARI's own server, so every researcher and every machine sees the same sources, and figures can be read from them. This browser keeps a copy so the assistant still works with no connection.",
    list: () => listResearchDataSources(),
    add: async (record) => {
      const saved = addResearchDataSource(record);
      await call("/research/sources", { method: "POST", body: JSON.stringify({ source: record }) });
      return saved;
    },
    remove: async (id) => {
      removeResearchDataSource(id);
      await call(`/research/sources/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clear: async () => {
      clearAllResearchDataSources();
      await call("/research/sources", { method: "DELETE" });
    },
  };
};

/* ------------------------------------------------------------------------- */
/* The chooser                                                                 */
/* ------------------------------------------------------------------------- */

export const researchConnectorStoreFor = (config: PlatformConfig): ResearchConnectorStore =>
  describeCapability(config, "library").state === "live"
    ? createSharedResearchConnectorStore(config.library)
    : LOCAL_RESEARCH_CONNECTOR_STORE;

export const getResearchConnectorStore = (): ResearchConnectorStore =>
  researchConnectorStoreFor(getConfig());