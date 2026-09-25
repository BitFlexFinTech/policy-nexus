import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunNotFound } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { buildPolicyDraft, renderDocumentText } from "@/services/assessment/documents";
import { useRun } from "@/services/assessment/useAssessmentRuns";

/**
 * The drafted policy — the policy text itself, produced from the simulation
 * rather than a report about it. The submitted draft becomes the operative
 * measures; the modelled risks, reactions and recommendations become the
 * engagement, mitigation and monitoring provisions.
 *
 * The draft is editable in place. Unedited it is fully deterministic (the same
 * run always yields the same text); editing is local state only, and whatever is
 * in the box is exactly what Print / Save as PDF / Download Word / Share export.
 * No network call is made.
 */
export default function PolicyDraft() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const run = useRun(runId);

  const department = useMemo(() => (run ? findDepartment(run.departmentId) : undefined), [run]);
  const generated = useMemo(
    () => (run && department ? buildPolicyDraft(run, department) : null),
    [run, department],
  );
  const generatedText = useMemo(
    () => (generated ? renderDocumentText(generated) : ""),
    [generated],
  );

  // null means "still the generated text". A string means the officer has edited it.
  const [edited, setEdited] = useState<string | null>(null);

  if (!run || !department || !generated) return <RunNotFound heading="Drafted policy" />;

  const isEdited = edited !== null;
  const text = edited ?? generatedText;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Drafted policy</h2>
          <p className="text-xs text-muted-foreground">
            {run.reference} · {run.departmentName} · {run.horizonLabel} · drafted from the modelled run
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
          Draft for review
        </span>
      </header>

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.short} This document is a starting text for the responsible officer to edit — it is
        not an adopted instrument. It was generated locally by the {VOCABULARY.simulationCore} (Mock).
      </div>

      <DocumentActions
        document={{ title: generated.title, text, fileStem: generated.fileStem }}
      />

      <div className="flex flex-wrap items-center gap-2" data-print="hide">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setEdited(isEdited ? null : text)}
        >
          {isEdited ? "Preview generated version" : "Edit draft wording"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={!isEdited}
          onClick={() => setEdited(null)}
        >
          Reset to generated
        </Button>
        {isEdited && (
          <span className="text-[10px] font-medium text-primary">
            Edited — the export buttons above use your wording.
          </span>
        )}
      </div>

      {isEdited ? (
        <textarea
          value={text}
          onChange={(event) => setEdited(event.target.value)}
          aria-label="Drafted policy text"
          className="h-[60vh] w-full resize-y rounded-lg border bg-background p-3 font-mono-code text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <GeneratedDocumentView document={generated} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}`}>Back to executive summary</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/report`}>Full report</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/app/assessments/${encodeURIComponent(run.id)}/full`}>Full assessment</Link>
        </Button>
      </div>
    </div>
  );
}
