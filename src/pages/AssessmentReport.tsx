import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunNotFound } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { buildLongReport, renderDocumentText } from "@/services/assessment/documents";
import { useRun } from "@/services/assessment/useAssessmentRuns";

/**
 * The long-form report — the "long version" of a completed run. Where the
 * executive summary states the position, this records the full narrative
 * working behind it, and is exported in the same way the assessment documents
 * are. Deterministic: the same run always renders this same report.
 */
export default function AssessmentReport() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const run = useRun(runId);

  if (!run) return <RunNotFound heading="Full report" />;

  const department = findDepartment(run.departmentId);
  if (!department) return <RunNotFound heading="Full report" />;

  const report = buildLongReport(run, department);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Full report</h2>
          <p className="text-xs text-muted-foreground">
            {run.reference} · {run.departmentName} · {run.policyTitle} · long-form narrative record
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Long version
        </span>
      </header>

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.long}
      </div>

      <DocumentActions
        document={{ title: report.title, text: renderDocumentText(report), fileStem: report.fileStem }}
      />

      <GeneratedDocumentView document={report} />

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}`}>Back to executive summary</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/full`}>Full assessment</Link>
        </Button>
        <Button asChild size="sm" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/policy-draft`}>
            Draft the policy
          </Link>
        </Button>
      </div>
    </div>
  );
}
