/**
 * THE ECONOMIC BAROMETER SEAM — where ZEPARI's indicator readings are kept.
 *
 * Mock-first, like the platform's other seams. Today the readings are recorded in THIS BROWSER by the
 * **Local** client, and that is the state the platform ships in. When ZEPARI's own server is connected,
 * a platform administrator enters its address and key on the administration screen (nothing else), and
 * the SAME surface uses the **Shared** client — no code change anywhere.
 *
 * Every reading carries the body that published it, so the barometer never shows a figure without its
 * source, even before a server exists.
 */

import {
  describeCapability,
  getConfig,
  type CapabilityConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addBarometerReading,
  clearAllBarometerReadings,
  listBarometerReadings,
  removeBarometerReading,
  type BarometerReading,
} from "./researchBarometer";

/** A reading on its way in — everything but the id and the date, which the store adds. */
export type BarometerReadingInputRecord = Omit<BarometerReading, "id" | "addedAt">;

/** Which surface the readings are kept on. */
export type ResearchBarometerMode = "local" | "shared";

export interface ResearchBarometerStore {
  readonly mode: ResearchBarometerMode;
  readonly label: string;
  readonly limitation: string;
  list(): readonly BarometerReading[];
  add(record: BarometerReadingInputRecord): Promise<BarometerReading>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/* ------------------------------------------------------------------------- */
/* Local — the mock. This is what runs today.                                  */
/* ------------------------------------------------------------------------- */

export const LOCAL_RESEARCH_BAROMETER_LABEL = "This browser (Local)";
export const LOCAL_RESEARCH_BAROMETER_LIMITATION =
  "Recorded in this browser, for the research assistant only. Shared with nobody — not another researcher, not another machine — and lost if this browser's stored data is cleared. Once ZEPARI's own server is connected, the readings are held there instead.";

export const LOCAL_RESEARCH_BAROMETER_STORE: ResearchBarometerStore = {
  mode: "local",
  label: LOCAL_RESEARCH_BAROMETER_LABEL,
  limitation: LOCAL_RESEARCH_BAROMETER_LIMITATION,
  list: () => listBarometerReadings(),
  add: async (record) => addBarometerReading(record),
  remove: async (id) => {
    removeBarometerReading(id);
  },
  clear: async () => {
    clearAllBarometerReadings();
  },
};

/* ------------------------------------------------------------------------- */
/* Shared — the real client. Used only when a server is completely configured. */
/* ------------------------------------------------------------------------- */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const createSharedResearchBarometerStore = (
  config: CapabilityConfig,
): ResearchBarometerStore => {
  const base = trimTrailingSlash(config.endpoint.trim());
  const headers = (): Record<string, string> => ({
    "content-type": "application/json",
    Authorization: `Bearer ${config.key.trim()}`,
  });

  const call = async (path: string, init: RequestInit): Promise<void> => {
    const response = await fetch(`${base}${path}`, { ...init, headers: headers() });
    if (!response.ok) {
      throw new Error(`The barometer server answered ${response.status}.`);
    }
  };

  return {
    mode: "shared",
    label: "ZEPARI's shared barometer (server)",
    limitation:
      "Sent to ZEPARI's own server, so every researcher and every machine sees the same readings. This browser keeps a copy so the assistant still works with no connection.",
    list: () => listBarometerReadings(),
    add: async (record) => {
      const saved = addBarometerReading(record);
      await call("/research/barometer", { method: "POST", body: JSON.stringify({ reading: record }) });
      return saved;
    },
    remove: async (id) => {
      removeBarometerReading(id);
      await call(`/research/barometer/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clear: async () => {
      clearAllBarometerReadings();
      await call("/research/barometer", { method: "DELETE" });
    },
  };
};

/* ------------------------------------------------------------------------- */
/* The chooser                                                                 */
/* ------------------------------------------------------------------------- */

export const researchBarometerStoreFor = (config: PlatformConfig): ResearchBarometerStore =>
  describeCapability(config, "library").state === "live"
    ? createSharedResearchBarometerStore(config.library)
    : LOCAL_RESEARCH_BAROMETER_STORE;

export const getResearchBarometerStore = (): ResearchBarometerStore =>
  researchBarometerStoreFor(getConfig());