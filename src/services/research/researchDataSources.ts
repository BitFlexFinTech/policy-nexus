/**
 * SINGLE SOURCE OF TRUTH — the data sources ZEPARI's research assistant can read from.
 *
 * The owner's decision (ZEPARI Batch D): the research assistant reads figures from the institute's
 * own data sources. This store records those sources — the ones ZEPARI's own administrator enters
 * (a name, the source's address, and what it provides). It keeps NO figures: nothing is read from a
 * source until the institute's server is connected, and the surface says so plainly. So the platform
 * never invents a source and never invents a figure.
 *
 * Determinism: a source's id is a pure function of its name and address, so adding the same source
 * twice replaces its entry; the added moment is read through `src/lib/clock.ts`.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import { hashString, toSeedHex } from "@/lib/prng";

export const RESEARCH_DATA_SOURCES_KEY = "nzwisiso.research-data-sources.v1";

/** One data source ZEPARI can read from. */
export interface ResearchDataSource {
  id: string;
  /** What the source is called, e.g. "ZEPARI Economic Barometer database". */
  name: string;
  /** The source's address, as the institute's administrator enters it. */
  address: string;
  /** One line on what it provides, in the institute's own words. */
  provides: string;
  addedAt: string;
}

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isResearchDataSourceStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToResearchDataSources = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly ResearchDataSource[] = Object.freeze([]);

/** Defensive parse — a malformed entry is dropped rather than crashing a screen. */
const parseSources = (raw: string | null): readonly ResearchDataSource[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const sources = value.filter((entry): entry is ResearchDataSource => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<ResearchDataSource>;
      return typeof candidate.id === "string" && typeof candidate.name === "string";
    });
    return sources.length ? sources : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedSources: readonly ResearchDataSource[] = EMPTY;

export const getResearchDataSourcesSnapshot = (): readonly ResearchDataSource[] => {
  const raw = storage.read(RESEARCH_DATA_SOURCES_KEY);
  if (raw === cachedRaw) return cachedSources;
  cachedRaw = raw;
  cachedSources = parseSources(raw);
  return cachedSources;
};

export const getResearchDataSourcesServerSnapshot = (): readonly ResearchDataSource[] => EMPTY;

const write = (next: readonly ResearchDataSource[]): void => {
  storage.write(RESEARCH_DATA_SOURCES_KEY, JSON.stringify(next));
  cachedRaw = storage.read(RESEARCH_DATA_SOURCES_KEY);
  cachedSources = parseSources(cachedRaw);
  emit();
};

/** Every data source, newest first. */
export const listResearchDataSources = (): readonly ResearchDataSource[] =>
  getResearchDataSourcesSnapshot();

/** The stable id for one source — a pure function of its name and address. */
export const researchDataSourceId = (name: string, address: string): string =>
  `rsrc-${toSeedHex(hashString(`${name}::${address}`))}`;

/** Keep a data source. Adding the same source again replaces its entry. */
export const addResearchDataSource = (
  source: Omit<ResearchDataSource, "id" | "addedAt">,
): ResearchDataSource => {
  const record: ResearchDataSource = {
    ...source,
    id: researchDataSourceId(source.name, source.address),
    addedAt: nowIso(),
  };
  const existing = getResearchDataSourcesSnapshot().filter((entry) => entry.id !== record.id);
  write([record, ...existing].slice(0, 60));
  return record;
};

/** Remove one data source by id. */
export const removeResearchDataSource = (id: string): void => {
  const existing = getResearchDataSourcesSnapshot();
  const next = existing.filter((source) => source.id !== id);
  if (next.length !== existing.length) write(next);
};

/** Remove every data source. Used by the panel's "Remove all" and the admin reset. */
export const clearAllResearchDataSources = (): void => {
  storage.remove(RESEARCH_DATA_SOURCES_KEY);
  cachedRaw = undefined;
  cachedSources = EMPTY;
  emit();
};