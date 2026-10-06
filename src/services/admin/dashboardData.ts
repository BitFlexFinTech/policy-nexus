/**
 * The administration dashboard's figures — every one DERIVED from real data the platform
 * actually holds, so no chart can show a number the platform does not have. What a server
 * alone could know (visitors, geography, API/token usage) is deliberately NOT here; it is
 * shown as a clearly-marked "connects with the server" panel instead.
 *
 * The functions are pure: same data in, same chart out. No clock, no randomness.
 */

import { DEPARTMENTS, countIndicatorsByBasis } from "@/config/departments";
import { MODELLED_SHARE_LABEL, STAKEHOLDER_SEGMENTS } from "@/config/reference";
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, SUPPORT_STATUS_LABELS } from "@/config/support";
import type { StoredRun } from "@/services/assessment/runStore";
import type { DepartmentDocumentRecord } from "@/services/documents/departmentDocuments";
import type { SupportCase } from "@/services/support/supportStore";

export interface ChartDatum {
  name: string;
  value: number;
}

/** Runs recorded per department — all 16, so the chart shows the whole platform. */
export const runsByDepartment = (runs: readonly StoredRun[]): ChartDatum[] =>
  DEPARTMENTS.map((department) => ({
    name: department.shortName,
    value: runs.filter((run) => run.departmentId === department.id).length,
  }));

/** A department's own documents, per department. */
export const documentsByDepartment = (
  documents: readonly DepartmentDocumentRecord[],
): ChartDatum[] =>
  DEPARTMENTS.map((department) => ({
    name: department.shortName,
    value: documents.filter((document) => document.departmentId === department.id).length,
  }));

/** Runs grouped by the real day they were recorded — the platform's own activity over time. */
export const runsByDate = (runs: readonly StoredRun[]): ChartDatum[] => {
  const counts = new Map<string, number>();
  for (const run of runs) {
    const day = (run.recordedAt ?? "").slice(0, 10);
    if (!day) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
};

/** Support cases by state. */
export const casesByStatus = (cases: readonly SupportCase[]): ChartDatum[] =>
  SUPPORT_STATUSES.map((status) => ({
    name: SUPPORT_STATUS_LABELS[status],
    value: cases.filter((entry) => entry.status === status).length,
  }));

/** Support cases by category. */
export const casesByCategory = (cases: readonly SupportCase[]): ChartDatum[] =>
  SUPPORT_CATEGORIES.map((category) => ({
    name: category,
    value: cases.filter((entry) => entry.category === category).length,
  }));

/** How many reference indicators are published figures and how many are modelled. */
export const indicatorSplit = (): ChartDatum[] => {
  const totals = DEPARTMENTS.reduce(
    (acc, department) => {
      const t = countIndicatorsByBasis(department.indicators);
      acc.published += t.published;
      acc.modelled += t.modelled;
      return acc;
    },
    { published: 0, modelled: 0 },
  );
  return [
    { name: "Published", value: totals.published },
    { name: "Modelled", value: totals.modelled },
  ];
};

/** How many stakeholder groups stand on a published share and how many are modelled. */
export const groupSplit = (): ChartDatum[] => {
  const published = STAKEHOLDER_SEGMENTS.filter(
    (segment) => segment.shareSource !== MODELLED_SHARE_LABEL,
  ).length;
  return [
    { name: "Published", value: published },
    { name: "Modelled", value: STAKEHOLDER_SEGMENTS.length - published },
  ];
};
