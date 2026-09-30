import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { DocumentNav } from "@/components/assessment/DocumentNav";
import { draftingPathFor } from "@/components/assessment/draftingStageConfig";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunError, RunNotFound, RunPending } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { renderDocumentText } from "@/services/assessment/documents";
import { useGeneratedDocument } from "@/services/documents/useGeneratedDocument";
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
  const { run, pending: runPending, error: runError } = useRun(runId);
  const department = useMemo(() => (run ? findDepartment(run.departmentId) : undefined), [run]);
  const {
    document: report,
    pending: reportPending,
    error: reportError,
  } = useGeneratedDocument("report", run, department);

  if (runPending) return <RunPending heading="Full report" />;
  if (runError) return <RunError heading="Full report" message={runError} />;
  if (!run) return <RunNotFound heading="Full report" />;
  if (!department) return <RunNotFound heading="Full report" />;
  if (reportPending) return <RunPending heading="Full report" />;
  if (reportError) return <RunError heading="Full report" message={reportError} />;
  if (!report) return <RunNotFound heading="Full report" />;

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

      <DocumentNav runId={run.id} />

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.long}
      </div>

      <DocumentActions
        document={{ title: report.title, text: renderDocumentText(report), fileStem: report.fileStem }}
      />

      <GeneratedDocumentView document={report} />

      <div className="flex flex-wrap items-center gap-3">
        {/* The other documents of this run live in the strip above; this row carries the
            one step that follows a report — drafting the instrument itself. */}
        <Button asChild size="sm" className="h-7 text-xs">
          <Link to={draftingPathFor(run.id)}>Draft the policy</Link>
        </Button>
      </div>
    </div>
  );
}
