import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { DepartmentId } from "@/config/departments";
import { describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { assessmentService, peekRun } from "./AssessmentService";
import { getRunsServerSnapshot, getRunsSnapshot, subscribeToRuns } from "./runStore";
import type { AssessmentRun } from "./types";

/** What a screen needs to know while runs are being read. */
export interface RunsResult {
  runs: AssessmentRun[];
  /** True only while a live service is answering. Always false while simulated. */
  pending: boolean;
  /** A plain-language reason when a live service could not answer. */
  error: string | null;
}

/** The same, for a single run. */
export interface RunResult {
  run: AssessmentRun | undefined;
  pending: boolean;
  error: string | null;
}

const reasonFor = (error: unknown): string =>
  error instanceof Error ? error.message : "The assessment service could not be reached.";

/**
 * The department's recorded runs, live across components.
 *
 * With nothing configured this is SYNCHRONOUS: the simulated engine answers in the
 * same render, so the workspace looks exactly as it always has — no spinner and no
 * flicker. The moment an administrator switches the assessment capability on, it
 * waits instead and reports what is happening.
 */
export const useAssessmentRuns = (departmentId?: DepartmentId | null): RunsResult => {
  const requests = useSyncExternalStore(subscribeToRuns, getRunsSnapshot, getRunsServerSnapshot);
  const config = usePlatformConfig();
  const live = describeCapability(config, "assessment").state === "live";

  const [fetched, setFetched] = useState<RunsResult | null>(null);

  useEffect(() => {
    if (!live) {
      setFetched(null);
      return;
    }
    if (!departmentId) {
      setFetched({ runs: [], pending: false, error: null });
      return;
    }
    let active = true;
    setFetched((previous) => ({ runs: previous?.runs ?? [], pending: true, error: null }));
    assessmentService
      .listRuns(departmentId)
      .then((runs) => {
        if (active) setFetched({ runs, pending: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setFetched({ runs: [], pending: false, error: reasonFor(error) });
      });
    return () => {
      active = false;
    };
  }, [live, departmentId]);

  const simulated = useMemo(
    () =>
      requests
        .filter((request) => !departmentId || request.departmentId === departmentId)
        .map((request) => peekRun(request.id))
        .filter((run): run is AssessmentRun => run !== undefined),
    [requests, departmentId],
  );

  if (!live) return { runs: simulated, pending: false, error: null };
  return fetched ?? { runs: [], pending: true, error: null };
};

/** One recorded run by id. Synchronous while simulated, waiting while live. */
export const useRun = (runId: string | undefined): RunResult => {
  const config = usePlatformConfig();
  const live = describeCapability(config, "assessment").state === "live";

  const [fetched, setFetched] = useState<
    { id: string; run?: AssessmentRun; error?: string } | null
  >(null);

  useEffect(() => {
    if (!live || !runId) {
      setFetched(null);
      return;
    }
    let active = true;
    assessmentService
      .getRun(runId)
      .then((run) => {
        if (active) setFetched({ id: runId, run });
      })
      .catch((error: unknown) => {
        if (active) setFetched({ id: runId, error: reasonFor(error) });
      });
    return () => {
      active = false;
    };
  }, [live, runId]);

  if (!live) {
    return { run: runId ? peekRun(runId) : undefined, pending: false, error: null };
  }
  if (fetched && fetched.id === runId) {
    return { run: fetched.run, pending: false, error: fetched.error ?? null };
  }
  return { run: undefined, pending: true, error: null };
};
