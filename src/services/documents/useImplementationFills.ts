import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { DocumentFills, FillField } from "@/services/assessment/matrices";
import {
  clearImplementationFills,
  fillsIn,
  getImplementationFillsSnapshot,
  getImplementationServerSnapshot,
  isImplementationStorePersistent,
  saveImplementationFill,
  subscribeToImplementationFills,
} from "./implementationStore";

export interface ImplementationFillsState {
  /** Every answer entered for this run. */
  fills: DocumentFills;
  /** Record one answer. An empty value restores the marked blank. */
  setField: (rowKey: string, field: FillField, value: string) => void;
  /** Forget every answer entered for this run. */
  clear: () => void;
  /** False when the browser refused to keep data between visits. */
  persistent: boolean;
  /** How many answers have been entered, so a screen can say what remains. */
  answered: number;
}

/**
 * The answers the department has entered for one run, kept in this browser and shared by every document
 * that prints them.
 *
 * Subscribing to the stored JSON means a write re-renders every screen showing that run's matrices, so
 * the drafted policy and the Implementation pack update together rather than drifting apart.
 */
export const useImplementationFills = (runId: string): ImplementationFillsState => {
  const raw = useSyncExternalStore(
    subscribeToImplementationFills,
    getImplementationFillsSnapshot,
    getImplementationServerSnapshot,
  );
  const fills = useMemo(() => fillsIn(raw, runId), [raw, runId]);

  const setField = useCallback(
    (rowKey: string, field: FillField, value: string) =>
      saveImplementationFill(runId, rowKey, field, value),
    [runId],
  );
  const clear = useCallback(() => clearImplementationFills(runId), [runId]);

  const answered = useMemo(
    () =>
      Object.values(fills).reduce(
        (total, row) =>
          total +
          Object.values(row).filter((value) => typeof value === "string" && value.trim()).length,
        0,
      ),
    [fills],
  );

  return { fills, setField, clear, persistent: isImplementationStorePersistent(), answered };
};
