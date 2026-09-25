import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/StatusPill";
import {
  FEED_SYSTEM_TONE,
  FEED_TAG_TONES,
  FEED_TYPE_ICONS,
  feedTimestamp,
} from "@/components/feedStyles";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { REFERENCE_DATE_LABEL } from "@/config/reference";
import { cn } from "@/lib/utils";
import { useRun } from "@/services/assessment/useAssessmentRuns";
import type { SimulationRound } from "@/services/assessment/types";

/** Presentation cadence only — the round content is fixed by the seed. */
const ROUND_TICK_MS = 320;

const toneClassFor = (round: SimulationRound, position: number) =>
  round.tone === "system"
    ? FEED_SYSTEM_TONE
    : FEED_TAG_TONES[position % FEED_TAG_TONES.length];

/**
 * Live deterministic simulation. The run is recomputed from its stored inputs,
 * then its rounds are revealed one at a time so the interaction is visible; the
 * final state is the same `AssessmentRun` the executive summary renders. No
 * round content depends on the timer — only the reveal order does.
 */
export default function SimulationRun() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const run = useRun(runId);

  const [revealed, setRevealed] = useState(0);
  const total = run?.rounds.length ?? 0;
  const resolvedRunId = run?.id;

  useEffect(() => {
    setRevealed(0);
  }, [resolvedRunId]);

  useEffect(() => {
    if (total === 0 || revealed >= total) return;
    const timer = window.setTimeout(
      () => setRevealed((count) => Math.min(count + 1, total)),
      ROUND_TICK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [revealed, total]);

  const visibleRounds = useMemo(() => (run ? run.rounds.slice(0, revealed) : []), [run, revealed]);
  const isComplete = total > 0 && revealed >= total;

  if (!run) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Simulation Run</h2>
        <div className="mt-3 rounded-lg border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          No recorded run matches this reference. A run is recorded in this browser when a policy
          draft is submitted, and the register on this device may since have been cleared.
          <div className="mt-3">
            <Link to="/app/simulations" className="font-medium text-primary hover:underline">
              Open the simulation register →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressValue = total === 0 ? 100 : Math.round((revealed / total) * 100);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {VOCABULARY.simulationCore} — {run.reference}
          </h2>
          <p className="text-xs text-muted-foreground">
            {run.departmentName} · {run.policyTitle} · horizon {run.horizonLabel} · source {run.source}
          </p>
        </div>
        <StatusPill
          label={VOCABULARY.simulationCore}
          status={isComplete ? "online" : "warning"}
          value={isComplete ? "Complete" : "Running"}
        />
      </header>

      <div className="space-y-1 rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{isComplete ? "Assessment complete" : "Running deterministic rounds"}</span>
          <span className="font-mono">
            {revealed} / {total} rounds
          </span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground">
          Seed <span className="font-mono">{run.seed}</span>. Scenario mode (Mock) — computed
          locally, no external request, same result on every run.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {VOCABULARY.agentFeed}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{visibleRounds.length} events</span>
        </div>
        <div className="space-y-0.5 p-2">
          {visibleRounds.map((round) => (
            <div
              key={round.index}
              className="animate-slide-up-fade flex items-start gap-2 rounded-md px-2 py-1.5"
            >
              <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-muted-foreground">
                {feedTimestamp(round.index - 1)}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  toneClassFor(round, round.index),
                )}
              >
                {round.actor}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {FEED_TYPE_ICONS[round.tone]}
              </span>
              <span className="font-mono-code text-xs leading-relaxed text-foreground">
                {round.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isComplete && (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Assessment Complete</h3>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Reference date {REFERENCE_DATE_LABEL}
            </span>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-foreground">{run.summary}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {run.metrics.map((metric) => (
              <div key={metric.id} className="rounded-md border bg-background p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-lg font-semibold leading-none text-foreground">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">{DISCLAIMER.short}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="h-7 text-xs">
              <Link to={`/app/assessments/${encodeURIComponent(run.id)}`}>
                Open executive summary
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to="/app/simulations">Simulation register</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
