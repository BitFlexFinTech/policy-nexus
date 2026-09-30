import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DraftingStage } from "@/components/assessment/DraftingStage";
import { DRAFTING_QUERY_PARAM, prefersReducedMotion } from "@/components/assessment/draftingStageConfig";
import { DocumentActions } from "@/components/assessment/DocumentActions";
import { DocumentNav } from "@/components/assessment/DocumentNav";
import { GeneratedDocumentView } from "@/components/assessment/GeneratedDocumentView";
import { RunError, RunNotFound, RunPending } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { OFFICER_SELF_DECLARED_NOTE, officerRecordLine } from "@/config/officer";
import { findDepartment } from "@/config/departments";
import { assessmentService } from "@/services/assessment/AssessmentService";
import { renderDocumentText } from "@/services/assessment/documents";
import { CITATIONS_ANNEX } from "@/services/assessment/documentStructure";
import { revisionNumber, revisionRequestFromRun } from "@/services/assessment/revision";
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
 * The draft is editable in place, and the officer's wording is kept in this browser,
 * keyed by the run, so it survives leaving the screen. Unedited it is fully
 * deterministic (the same run always yields the same text). Whatever is in the box —
 * the officer's wording or the generated text — is exactly what Print / Save as PDF /
 * Download Word / Share export, and exactly what the simulation is run on when the
 * officer takes the draft back through it (see `revisionRequestFromRun`).
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

  // The drafting stage: the drafted policy is run again as the department's next version.
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const runRevision = useCallback(async () => {
    if (!run) return;
    const request = revisionRequestFromRun(run.id, draft.text);
    if (!request) {
      setRevisionError(
        "This run is no longer in this browser's register, so it cannot be re-run from here.",
      );
      return;
    }
    setIsRunning(true);
    setRevisionError(null);
    try {
      // The seam answers in the same breath while the platform is simulated; a live
      // service takes as long as it takes, and a failure is reported rather than hidden.
      const next = await assessmentService.run(request);
      navigate(`/app/simulations/${encodeURIComponent(next.id)}`);
    } catch (error) {
      setRevisionError(
        error instanceof Error ? error.message : "The assessment service could not be reached.",
      );
    } finally {
      setIsRunning(false);
    }
  }, [run, draft.text, navigate]);

  // Item 6 — the drafting stage. It plays when the officer ARRIVES from "Draft the policy"
  // (the address carries `?drafting=1`), not on every visit or reload, so returning to the
  // document later is instant. The parameter is removed once read, so a reload does not
  // replay the stage. A reader who asked their system for reduced motion never sees it.
  const [searchParams, setSearchParams] = useSearchParams();
  const [stageFinished, setStageFinished] = useState(false);
  // Captured ONCE. The parameter is removed from the address on mount (below), so reading it
  // again on a later render would report "no stage" and the stage would vanish mid-play.
  const [stageRequested] = useState(() => searchParams.get(DRAFTING_QUERY_PARAM) === "1");
  useEffect(() => {
    if (searchParams.has(DRAFTING_QUERY_PARAM)) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const finishStage = useCallback(() => setStageFinished(true), []);
  const showingStage =
    stageRequested && !stageFinished && !prefersReducedMotion() && Boolean(generated);

  if (runPending) return <RunPending heading="Drafted policy" />;
  if (runError) return <RunError heading="Drafted policy" message={runError} />;
  if (!run || !department) return <RunNotFound heading="Drafted policy" />;
  if (documentPending) return <RunPending heading="Drafted policy" />;
  if (documentError) return <RunError heading="Drafted policy" message={documentError} />;
  if (!generated) return <RunNotFound heading="Drafted policy" />;

  const isEdited = draft.isEdited;
  const text = draft.text;
  const version = revisionNumber(run.id);

  const provenanceRows: ReadonlyArray<[string, string]> = provenance
    ? [
        [
          "Produced by",
          source.producer === "local-generator"
            ? `The ${VOCABULARY.simulationCore} (Mock)`
            : `The configured drafting service — ${provenance.model}`,
        ],
        ["Run reference", provenance.reference],
        // Item 1 — the paper trail. The person the record names as the preparer, exactly as
        // the run records them, so a reviewer can see who this draft is attributed to.
        [
          "Prepared by",
          run.preparedBy
            ? officerRecordLine(run.preparedBy) ?? department.name
            : `Not recorded — attributed to ${department.name}`,
        ],
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

      {/* Item 6 — the drafting stage: when the officer arrived from "Draft the policy" the
          document is composed in front of them instead of already being finished. Every
          other way of reaching this screen (the strip, a reload, a bookmark) skips it. */}
      {showingStage ? (
        <DraftingStage run={run} onDone={finishStage} />
      ) : (
      <>
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

      {/* Item 1 — honesty about the paper trail. A recorded name is stated for what it is. */}
      {run.preparedBy?.source === "self-declared" && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {OFFICER_SELF_DECLARED_NOTE}
        </p>
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

      {/* The drafting stage. The instrument the platform drafted becomes the policy the
          simulation is run on, and the run that comes out is recorded as the next version
          of this one, so the register reads as a chain of drafts rather than unrelated
          runs. The wording in the box — the officer's own, or the generated text — is what
          is run, exactly as it is what the export buttons above produce. */}
      <div className="flex flex-wrap items-center gap-3" data-print="hide">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={isRunning}
          onClick={() => {
            void runRevision();
          }}
        >
          {isRunning ? "Running the simulation…" : "Run the simulation on this wording"}
        </Button>
        <span className="text-[10px] text-muted-foreground">
          This is version {version} of the department's policy. Running this wording records
          version {version + 1}.
        </span>
      </div>
      {revisionError && (
        <p className="text-[10px] leading-relaxed text-destructive" data-print="hide">
          The run did not complete: {revisionError}
        </p>
      )}
      </>
      )}
    </div>
  );
}
