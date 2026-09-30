import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AssessmentRun } from "@/services/assessment/types";
import { DRAFTING_STEP_MS, draftingStepsFor } from "./draftingStageConfig";

/**
 * The drafting stage — the short sequence the officer sees after pressing "Draft the policy",
 * so the instrument is visibly DRAFTED FROM the assessment rather than appearing already
 * finished (owner's item 6, second half).
 *
 * Motion, and why it is built the way it is:
 * - This is a rare, first-time event, not something seen many times a day, so motion is
 *   allowed; the purpose is to show the state change (assessment → drafted policy) and to
 *   explain what the draft is based on.
 * - It uses the project's EXISTING `animate-slide-up-fade` keyframes (opacity + translate,
 *   0.15s ease-out) and the existing `Progress` bar. No new dependency, no new motion token.
 * - Every step is skippable ("Show the policy now"), and a reader who asked their system for
 *   reduced motion never sees the stage at all — the screen above decides that.
 * - Nothing is timed into the CONTENT: the steps are a pure function of the run, and only
 *   their reveal is paced, exactly like the simulation's own round reveal.
 */
export function DraftingStage({ run, onDone }: { run: AssessmentRun; onDone: () => void }) {
  const steps = useMemo(() => draftingStepsFor(run), [run]);
  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (revealed >= steps.length) onDone();
        else setRevealed((count) => count + 1);
      },
      DRAFTING_STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [revealed, steps.length, onDone]);

  const progress = Math.round((revealed / steps.length) * 100);

  return (
    <section
      aria-label="Drafting the policy"
      aria-live="polite"
      className="rounded-lg border border-primary/30 bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Drafting the policy from this assessment
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onDone}
          data-print="hide"
        >
          Show the policy now
        </Button>
      </div>

      <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-muted-foreground">
        The instrument is composed in this browser from the run above — this is the sequence it
        follows, shown (Mock) so the step is not hidden. Nothing leaves the machine.
      </p>

      <Progress value={progress} className="mt-3 h-1.5" aria-label="Drafting progress" />

      <ol className="mt-3 space-y-1.5">
        {steps.slice(0, revealed).map((step) => (
          <li
            key={step}
            className="animate-slide-up-fade flex items-start gap-2 text-xs leading-relaxed text-foreground"
          >
            <span aria-hidden="true" className="mt-0.5 text-primary">
              ▸
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
