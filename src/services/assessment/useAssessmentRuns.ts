import { useMemo, useSyncExternalStore } from "react";
import type { DepartmentId } from "@/config/departments";
import { assessmentService } from "./AssessmentService";
import { getRunsServerSnapshot, getRunsSnapshot, subscribeToRuns } from "./runStore";
import type { AssessmentRun } from "./types";

/**
 * Live list of recorded runs for a department, recomputed from their stored
 * inputs. Returns every run when no department is given. Re-renders the moment
 * a run is recorded, through `useSyncExternalStore` on the run store.
 */
export const useAssessmentRuns = (departmentId?: DepartmentId | null): AssessmentRun[] => {
  const requests = useSyncExternalStore(subscribeToRuns, getRunsSnapshot, getRunsServerSnapshot);
  return useMemo(
    () =>
      requests
        .filter((request) => !departmentId || request.departmentId === departmentId)
        .map((request) => assessmentService.buildRun(request)),
    [requests, departmentId],
  );
};

/** One recorded run by id, recomputed from its stored inputs. */
export const useRun = (runId: string | undefined): AssessmentRun | undefined =>
  useMemo(() => (runId ? assessmentService.getRun(runId) : undefined), [runId]);
