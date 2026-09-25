import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import {
  AssessmentHeader,
  ImpactList,
  MetricCards,
  ReactionList,
  RiskList,
  RunNotFound,
} from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { useRun } from "@/services/assessment/useAssessmentRuns";

/**
 * Executive Summary. A compact, decision-ready rendering of a completed run:
 * the disclaimer first, then the headline figures, the modelled reactions,
 * impact and risks, with print/PDF/Word/share available on the document itself.
 */
export default function Assessment() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const run = useRun(runId);

  if (!run) return <RunNotFound heading="Executive Summary" />;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <AssessmentHeader run={run} title="Executive Summary" />

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.long}
      </div>

      <DocumentActions run={run} scope="summary" />

      <MetricCards run={run} />

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-foreground">{run.summary}</p>
      </div>

      <ReactionList run={run} />
      <ImpactList run={run} />
      <RiskList run={run} />

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/full`}>
            Open full assessment
          </Link>
        </Button>
        <span className="text-[10px] text-muted-foreground">
          The full assessment adds every modelled reaction, the exact run inputs and the recommended
          next steps. {VOCABULARY.simulationCore} (Mock) — simulated result, computed locally.
        </span>
      </div>
    </div>
  );
}
