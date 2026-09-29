import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  clearDraftText,
  draftTextIn,
  getDraftsServerSnapshot,
  getDraftsSnapshot,
  isDraftStorePersistent,
  saveDraftText,
  subscribeToDrafts,
} from "./draftStore";

export interface PolicyDraftState {
  /** What the officer sees: their own wording when there is one, otherwise the generated draft. */
  text: string;
  /** True once the officer has written wording of their own, so the screen can say so. */
  isEdited: boolean;
  /** Write the officer's wording to this browser. */
  setText: (next: string) => void;
  /** Forget the working copy and fall back to the generated draft. */
  reset: () => void;
  /** False when the browser refused to keep data between visits. */
  persistent: boolean;
}

/**
 * The officer's working copy of one run's drafted policy, kept in this browser so
 * leaving the screen no longer discards it.
 *
 * Subscribing to the stored JSON means a write re-renders every screen showing that
 * draft, which is what keeps two tabs of the same draft in step.
 */
export const usePolicyDraft = (runId: string, generatedText: string): PolicyDraftState => {
  const raw = useSyncExternalStore(subscribeToDrafts, getDraftsSnapshot, getDraftsServerSnapshot);
  const stored = useMemo(() => draftTextIn(raw, runId), [raw, runId]);

  const setText = useCallback((next: string) => saveDraftText(runId, next), [runId]);
  const reset = useCallback(() => clearDraftText(runId), [runId]);

  return {
    text: stored ?? generatedText,
    isEdited: stored !== null,
    setText,
    reset,
    persistent: isDraftStorePersistent(),
  };
};
