import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import {
  AssessmentHeader,
  ImpactList,
  InputRecord,
  MetricCards,
  ReactionList,
  RecommendationList,
  RiskList,
  RunNotFound,
} from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { useRun } from "@/services/assessment/useAssessmentRuns";

/**
 * Full Assessment. Everything the executive summary shows, plus the complete
 * reaction record, the recommended next steps, and the exact inputs the run was
 * derived from — so a reader can reproduce it byte-for-byte.
 */
export default function FullAssessment() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const run = useRun(runId);

  if (!run) return <RunNotFound heading="Full Assessment" />;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <AssessmentHeader run={run} title="Full Assessment" />

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.long}
      </div>

      <DocumentActions run={run} scope="full" />

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
      <RecommendationList run={run} />
      <InputRecord run={run} />

      <div className="rounded-lg border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Method and limitations
        </div>
        The {VOCABULARY.simulationCore} derives this result from the submitted policy text, the
        department's published reference indicators and its modelled stakeholder groups, using a
        seeded deterministic process. The same inputs always produce the same result. Figures are
        modelled support indices and participation measures, not poll results, and are indicative
        only. Methodology and limitations are set out in full on the{" "}
        <Link to="/app/reference" className="font-medium text-primary hover:underline">
          reference page
        </Link>
        .
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}`}>
            Back to executive summary
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/report`}>Full report</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`}>
            Draft the policy
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/app/simulations">Simulation register</Link>
        </Button>
      </div>
    </div>
  );
}
