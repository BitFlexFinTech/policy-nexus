/**
 * SINGLE SOURCE OF TRUTH — ZEPARI's findings, and the departments each is routed to.
 *
 * The owner's decision (ZEPARI, the findings surface): a research finding is routed to the departments
 * it concerns. A finding is a NOTE for a human reader, never a figure fed into the simulation engine
 * (the platform's strict boundary: the research side never feeds a figure into the deterministic
 * engine). This store records the finding and the departments it is routed to; nothing here is read
 * by any simulation.
 *
 * Determinism: a finding's id is a pure function of its text and its destinations, so recording the
 * same finding twice replaces its entry; the recorded moment is read through `src/lib/clock.ts`.
 */

import { nowIso } from "@/lib/clock";
import { createKeyValueStore } from "@/lib/browserStorage";
import { hashString, toSeedHex } from "@/lib/prng";
import { isDepartmentId, type DepartmentId } from "@/config/departments";

export const RESEARCH_FINDINGS_KEY = "nzwisiso.research-findings.v1";

/** One finding, and the departments it concerns. */
export interface ResearchFinding {
  id: string;
  /** The finding, in ZEPARI's own words. */
  text: string;
  /** The departments this finding is routed to. At least one. */
  departments: DepartmentId[];
  addedAt: string;
}

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isResearchFindingStorePersistent = () => storage.isPersistent();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToResearchFindings = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: readonly ResearchFinding[] = Object.freeze([]);

/** Defensive parse — a malformed entry, or one naming no real department, is dropped. */
const parseFindings = (raw: string | null): readonly ResearchFinding[] => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return EMPTY;
    const findings = value
      .filter((entry): entry is ResearchFinding => {
        if (!entry || typeof entry !== "object") return false;
        const candidate = entry as Partial<ResearchFinding>;
        return typeof candidate.id === "string" && typeof candidate.text === "string";
      })
      .map((finding) => ({
        ...finding,
        departments: (Array.isArray(finding.departments) ? finding.departments : []).filter(
          (id): id is DepartmentId => typeof id === "string" && isDepartmentId(id),
        ),
      }))
      .filter((finding) => finding.departments.length > 0);
    return findings.length ? findings : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedFindings: readonly ResearchFinding[] = EMPTY;

export const getResearchFindingsSnapshot = (): readonly ResearchFinding[] => {
  const raw = storage.read(RESEARCH_FINDINGS_KEY);
  if (raw === cachedRaw) return cachedFindings;
  cachedRaw = raw;
  cachedFindings = parseFindings(raw);
  return cachedFindings;
};

export const getResearchFindingsServerSnapshot = (): readonly ResearchFinding[] => EMPTY;

const write = (next: readonly ResearchFinding[]): void => {
  storage.write(RESEARCH_FINDINGS_KEY, JSON.stringify(next));
  cachedRaw = storage.read(RESEARCH_FINDINGS_KEY);
  cachedFindings = parseFindings(cachedRaw);
  emit();
};

/** Every finding, newest first. */
export const listResearchFindings = (): readonly ResearchFinding[] => getResearchFindingsSnapshot();

/** The stable id for one finding — a pure function of its text and its destinations. */
export const researchFindingId = (text: string, departments: readonly string[]): string =>
  `rfnd-${toSeedHex(hashString(`${text}::${[...departments].sort().join(",")}`))}`;

/** Record a finding. Adding the same finding again replaces its entry. */
export const addResearchFinding = (
  finding: Omit<ResearchFinding, "id" | "addedAt">,
): ResearchFinding => {
  const departments = finding.departments.filter((id) => isDepartmentId(id));
  const record: ResearchFinding = {
    text: finding.text,
    departments,
    id: researchFindingId(finding.text, departments),
    addedAt: nowIso(),
  };
  const existing = getResearchFindingsSnapshot().filter((entry) => entry.id !== record.id);
  write([record, ...existing].slice(0, 200));
  return record;
};

/** Remove one finding by id. */
export const removeResearchFinding = (id: string): void => {
  const existing = getResearchFindingsSnapshot();
  const next = existing.filter((finding) => finding.id !== id);
  if (next.length !== existing.length) write(next);
};

/** Remove every finding. Used by the panel's "Remove all" and the admin reset. */
export const clearAllResearchFindings = (): void => {
  storage.remove(RESEARCH_FINDINGS_KEY);
  cachedRaw = undefined;
  cachedFindings = EMPTY;
  emit();
};