import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { DocumentNav } from "@/components/assessment/DocumentNav";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunError, RunNotFound, RunPending } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { renderDocumentText } from "@/services/assessment/documents";
import { useGeneratedDocument } from "@/services/documents/useGeneratedDocument";
import { useRun } from "@/services/assessment/useAssessmentRuns";

/**
 * The Implementation pack — the working companion to the drafted policy.
 *
 * It gathers the parts an office acts on: the implementation matrix, the cost categories to be costed,
 * the monitoring and evaluation matrix, the recommended steps and the stakeholder analysis. Every table
 * comes from the same builder the drafted policy uses, so the two cannot disagree about one policy.
 *
 * Deterministic: the same run always renders this same pack. Print, PDF, Word and share work exactly as
 * they do on the other documents, because it is the same export path.
 */
export default function ImplementationPack() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const { run, pending: runPending, error: runError } = useRun(runId);
  const department = useMemo(() => (run ? findDepartment(run.departmentId) : undefined), [run]);
  const {
    document: pack,
    pending: packPending,
    error: packError,
  } = useGeneratedDocument("implementation-pack", run, department);

  if (runPending) return <RunPending heading="Implementation pack" />;
  if (runError) return <RunError heading="Implementation pack" message={runError} />;
  if (!run) return <RunNotFound heading="Implementation pack" />;
  if (!department) return <RunNotFound heading="Implementation pack" />;
  if (packPending) return <RunPending heading="Implementation pack" />;
  if (packError) return <RunError heading="Implementation pack" message={packError} />;
  if (!pack) return <RunNotFound heading="Implementation pack" />;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Implementation pack</h2>
          <p className="text-xs text-muted-foreground">
            {run.reference} · {run.departmentName} · {run.policyTitle} · working record for the department
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          For records
        </span>
      </header>

      <DocumentNav runId={run.id} />

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.long}
      </div>

      <p className="max-w-3xl text-[10px] leading-relaxed text-muted-foreground">
        This pack holds the working parts of the policy — the matrices an office carries the policy out
        with — and nothing else. Every table is the same table the drafted policy carries. Where a value
        is the department's own to decide, the cell is marked rather than filled with a guess: the
        department completes it in the copy it exports. The platform asks for nothing on this screen.
      </p>

      <DocumentActions
        document={{ title: pack.title, text: renderDocumentText(pack), fileStem: pack.fileStem }}
      />

      <GeneratedDocumentView document={pack} />
    </div>
  );
}
