import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { DocumentNav } from "@/components/assessment/DocumentNav";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunError, RunNotFound, RunPending } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { findDepartment } from "@/config/departments";
import { renderDocumentText } from "@/services/assessment/documents";
import { CITATIONS_ANNEX } from "@/services/assessment/documentStructure";
import { buildDraftingProvenance, verifyDocumentCitations } from "@/services/documents/drafting";
import { useGeneratedDocument } from "@/services/documents/useGeneratedDocument";
import { usePolicyDraft } from "@/services/documents/usePolicyDraft";
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
 *
 * AB-4: the screen also states the draft's provenance — who produced it, from what
 * inputs, and whether every citation it lists was checked against the platform's
 * cited-instrument table. With nothing configured, no network call is made.
 */
export default function PolicyDraft() {
  const params = useParams();
  const runId = params.id ? decodeURIComponent(params.id) : undefined;
  const { run, pending: runPending, error: runError } = useRun(runId);

  const department = useMemo(() => (run ? findDepartment(run.departmentId) : undefined), [run]);
  const {
    document: generated,
    pending: documentPending,
    error: documentError,
    source,
  } = useGeneratedDocument("policy-draft", run, department);
  const generatedText = useMemo(
    () => (generated ? renderDocumentText(generated) : ""),
    [generated],
  );

  const verification = useMemo(
    () => (generated && department ? verifyDocumentCitations(generated, department) : null),
    [generated, department],
  );
  const provenance = useMemo(
    () =>
      run && department && verification
        ? buildDraftingProvenance(run, department, verification, source)
        : null,
    [run, department, verification, source],
  );

  // The officer's working copy is kept in this browser, keyed by this run, so leaving
  // the screen no longer throws their wording away. `editing` is only about which view
  // is on screen; the text itself lives in the store (src/services/documents/).
  const draft = usePolicyDraft(run?.id ?? "", generatedText);
  const [editing, setEditing] = useState(false);

  if (runPending) return <RunPending heading="Drafted policy" />;
  if (runError) return <RunError heading="Drafted policy" message={runError} />;
  if (!run || !department) return <RunNotFound heading="Drafted policy" />;
  if (documentPending) return <RunPending heading="Drafted policy" />;
  if (documentError) return <RunError heading="Drafted policy" message={documentError} />;
  if (!generated) return <RunNotFound heading="Drafted policy" />;

  const isEdited = draft.isEdited;
  const text = draft.text;

  const provenanceRows: ReadonlyArray<[string, string]> = provenance
    ? [
        [
          "Produced by",
          source.producer === "local-generator"
            ? `The ${VOCABULARY.simulationCore} (Mock)`
            : `The configured drafting service — ${provenance.model}`,
        ],
        ["Run reference", provenance.reference],
        // The engine's starting code is deliberately NOT shown. It is built from the whole
        // submitted policy text, so the row displayed an officer's entire draft as one long
        // machine string underneath the run reference that already identifies the run. The
        // raw code stays on the internal "exact inputs" record, not on an officer's screen.
        ["Reference date", provenance.referenceDate],
        [
          "Grounded in",
          `${provenance.groupsModelled} modelled groups · ${provenance.indicatorsUsed} reference indicators`,
        ],
        [
          "Citations",
          `${provenance.instrumentsCited} listed in ${CITATIONS_ANNEX} — ${
            provenance.citationsVerified
              ? "every one checked against the instrument table"
              : "some could not be verified"
          }`,
        ],
      ]
    : [];

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

      <DocumentNav runId={run.id} />

      <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
        {DISCLAIMER.short} This document is a starting text for the responsible officer to edit — it is
        not an adopted instrument.{" "}
        {source.producer === "local-generator"
          ? `It was generated locally by the ${VOCABULARY.simulationCore} (Mock).`
          : `It was produced by the configured drafting service (${provenance?.model}).`}
      </div>

      {provenance && (
        <section className="rounded-lg border bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Provenance
          </h3>
          <dl className="mt-1.5 grid gap-1 sm:grid-cols-2">
            {provenanceRows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1 text-[10px] last:border-0"
              >
                <dt className="uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="text-right text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <DocumentActions
        document={{ title: generated.title, text, fileStem: generated.fileStem }}
      />

      <div className="flex flex-wrap items-center gap-2" data-print="hide">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setEditing((previous) => !previous)}
        >
          {editing ? "Preview generated version" : "Edit draft wording"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={!isEdited}
          onClick={() => {
            draft.reset();
            setEditing(false);
          }}
        >
          Reset to generated
        </Button>
        {isEdited && (
          <span className="text-[10px] font-medium text-primary">
            Edited — the export buttons above use your wording.
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground" data-print="hide">
        {draft.persistent
          ? "Your wording is kept in this browser, for this run, so it is still here when you come back to this screen."
          : "This browser refused to keep data between visits, so your wording lasts only until this page is closed."}
      </p>

      {editing ? (
        <textarea
          value={text}
          onChange={(event) => draft.setText(event.target.value)}
          aria-label="Drafted policy text"
          className="h-[60vh] w-full resize-y rounded-lg border bg-background p-3 font-mono-code text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <GeneratedDocumentView document={generated} />
      )}

      {/* The other three documents of this run are reached from the strip at the top of
          this screen, so this row no longer repeats them. */}
    </div>
  );
}
