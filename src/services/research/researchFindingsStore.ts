/**
 * THE FINDINGS SEAM — where ZEPARI's findings and their destinations are kept.
 *
 * Mock-first, like the platform's other seams. Today the findings are recorded in THIS BROWSER by the
 * **Local** client, and that is the state the platform ships in. When ZEPARI's own server is connected,
 * a platform administrator enters its address and key on the administration screen (nothing else), and
 * the SAME surface uses the **Shared** client — no code change anywhere.
 *
 * A finding is a note for a human reader. It is NEVER read by the simulation engine.
 */

import {
  describeCapability,
  getConfig,
  type CapabilityConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addResearchFinding,
  clearAllResearchFindings,
  listResearchFindings,
  removeResearchFinding,
  type ResearchFinding,
} from "./researchFindings";

/** A finding on its way in — everything but the id and the date, which the store adds. */
export type ResearchFindingInputRecord = Omit<ResearchFinding, "id" | "addedAt">;

/** Which surface the findings are kept on. */
export type ResearchFindingsMode = "local" | "shared";

export interface ResearchFindingsStore {
  readonly mode: ResearchFindingsMode;
  readonly label: string;
  readonly limitation: string;
  list(): readonly ResearchFinding[];
  add(record: ResearchFindingInputRecord): Promise<ResearchFinding>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/* ------------------------------------------------------------------------- */
/* Local — the mock. This is what runs today.                                  */
/* ------------------------------------------------------------------------- */

export const LOCAL_RESEARCH_FINDINGS_LABEL = "This browser (Local)";
export const LOCAL_RESEARCH_FINDINGS_LIMITATION =
  "Recorded in this browser, for the research assistant only. Shared with nobody — not another researcher, not another machine — and lost if this browser's stored data is cleared. Once ZEPARI's own server is connected, a routed finding reaches the department through the platform's own channels.";

export const LOCAL_RESEARCH_FINDINGS_STORE: ResearchFindingsStore = {
  mode: "local",
  label: LOCAL_RESEARCH_FINDINGS_LABEL,
  limitation: LOCAL_RESEARCH_FINDINGS_LIMITATION,
  list: () => listResearchFindings(),
  add: async (record) => addResearchFinding(record),
  remove: async (id) => {
    removeResearchFinding(id);
  },
  clear: async () => {
    clearAllResearchFindings();
  },
};

/* ------------------------------------------------------------------------- */
/* Shared — the real client. Used only when a server is completely configured. */
/* ------------------------------------------------------------------------- */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const createSharedResearchFindingsStore = (
  config: CapabilityConfig,
): ResearchFindingsStore => {
  const base = trimTrailingSlash(config.endpoint.trim());
  const headers = (): Record<string, string> => ({
    "content-type": "application/json",
    Authorization: `Bearer ${config.key.trim()}`,
  });

  const call = async (path: string, init: RequestInit): Promise<void> => {
    const response = await fetch(`${base}${path}`, { ...init, headers: headers() });
    if (!response.ok) {
      throw new Error(`The findings server answered ${response.status}.`);
    }
  };

  return {
    mode: "shared",
    label: "ZEPARI's shared findings (server)",
    limitation:
      "Sent to ZEPARI's own server, so every researcher and every machine sees the same findings and can route them. This browser keeps a copy so the assistant still works with no connection.",
    list: () => listResearchFindings(),
    add: async (record) => {
      const saved = addResearchFinding(record);
      await call("/research/findings", { method: "POST", body: JSON.stringify({ finding: record }) });
      return saved;
    },
    remove: async (id) => {
      removeResearchFinding(id);
      await call(`/research/findings/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clear: async () => {
      clearAllResearchFindings();
      await call("/research/findings", { method: "DELETE" });
    },
  };
};

/* ------------------------------------------------------------------------- */
/* The chooser                                                                 */
/* ------------------------------------------------------------------------- */

export const researchFindingsStoreFor = (config: PlatformConfig): ResearchFindingsStore =>
  describeCapability(config, "library").state === "live"
    ? createSharedResearchFindingsStore(config.library)
    : LOCAL_RESEARCH_FINDINGS_STORE;

export const getResearchFindingsStore = (): ResearchFindingsStore =>
  researchFindingsStoreFor(getConfig());