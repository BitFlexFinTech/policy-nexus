import type { ScenarioId } from "@/data/documents";

const KEY = "nzwisiso.pending-simulation";

export interface PendingSimulation {
  policy: string;
  scenario: ScenarioId;
  documentId?: string;
}

export function setPendingSimulation(p: PendingSimulation) {
  sessionStorage.setItem(KEY, JSON.stringify(p));
}

export function getPendingSimulation(): PendingSimulation | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingSimulation) : null;
  } catch {
    return null;
  }
}
