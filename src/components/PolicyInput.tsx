import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { findDepartment } from "@/config/departments";
import { REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { assessmentService, peekRun } from "@/services/assessment/AssessmentService";
import { RERUN_QUERY_PARAM, rerunInputsFrom } from "@/services/assessment/rerun";
import {
  CAPACITY_LEVERS,
  DEFAULT_LEVERS,
  ENFORCEMENT_LEVERS,
  FUNDING_LEVERS,
  isLeverValue,
  isNeutral,
  LEVER_CONTROLS,
  PHASE_IN_CHOICES,
  type ScenarioLevers,
} from "@/services/assessment/levers";
import type { AssessmentRequest, AssessmentSource } from "@/services/assessment/types";
import {
  classifyPolicyFile,
  extractPolicyFile,
  isAcceptedPolicyFile,
  type ExtractedPolicyFile,
} from "@/services/extraction/extractPolicyText";
import { useSession } from "@/session/useSession";
import { getSession } from "@/session/session";
import { departmentDocumentInputs } from "@/services/documents/departmentDocuments";
import {
  getPolicyInput,
  isPolicyInputStorePersistent,
  savePolicyInput,
} from "@/services/documents/policyInputStore";
import { hasSeenRunNotice, markRunNoticeSeen } from "@/services/assessment/runNoticeStore";
import { RunSimulationNotice, RunSimulationNote } from "@/components/RunSimulationNotice";

/**
 * Policy ingestion for the signed-in department. Presets come from the
 * department's own prepared drafts, an uploaded `.txt` file is read for real, and
 * **Run Simulation** hands the draft to the assessment service and opens the live
 * deterministic run. It performs no network call.
 */
export function PolicyInput() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const navigate = useNavigate();

  // Item 7 — the officer's working draft is kept in this browser, keyed by department, so
  // leaving the screen (for the register, a run, or anything else) and coming back no longer
  // throws away what they typed, what they uploaded and the assumptions they set. The stored
  // record is read ONCE, here, to seed the screen; everything after that is written back by
  // the effect below. See `src/services/documents/policyInputStore.ts`.
  const restored = getPolicyInput(department?.id);

  const [draft, setDraft] = useState(() => restored?.text ?? "");
  const [templateId, setTemplateId] = useState<string | undefined>(() => restored?.templateId);
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedPolicyFile[]>(
    () => restored?.files ?? [],
  );
  const [readProgress, setReadProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  // BATCH E — the assumptions the officer sets for this run. Neutral by default, so
  // the screen renders exactly as it did before until a lever is touched.
  const [levers, setLevers] = useState<ScenarioLevers>(() => restored?.levers ?? DEFAULT_LEVERS);
  const [searchParams, setSearchParams] = useSearchParams();
  // Item 6 — the run whose inputs were loaded by "Re-run simulation", so the screen can
  // say where the text came from instead of appearing to have invented it.
  const [loadedFrom, setLoadedFrom] = useState<{ runId: string; reference?: string } | null>(null);
  // The lineage the loaded run had, so running the same wording again reproduces it rather
  // than silently becoming a first version of the policy.
  const [revisionOf, setRevisionOf] = useState<string | undefined>(undefined);
  // Owner's item 5 — the "before you run" notice. It opens once per department (remembered in
  // `runNoticeStore`), so the first run explains where the draft's data comes from. The request
  // is held until the officer chooses to run, or to open the Document Library first.
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<AssessmentRequest | null>(null);

  /**
   * Set one lever. The value is checked against the lever's own allowed values, so a
   * control can never put the engine into a state it does not handle.
   */
  const setLever = useCallback((id: string, value: string) => {
    setLevers((previous) => {
      if (id === "funding") return isLeverValue(FUNDING_LEVERS, value) ? { ...previous, funding: value } : previous;
      if (id === "capacity") return isLeverValue(CAPACITY_LEVERS, value) ? { ...previous, capacity: value } : previous;
      if (id === "enforcement")
        return isLeverValue(ENFORCEMENT_LEVERS, value) ? { ...previous, enforcement: value } : previous;
      if (id === "phaseInMonths") {
        const months = Number(value);
        return Number.isFinite(months) ? { ...previous, phaseInMonths: Math.max(0, months) } : previous;
      }
      return previous;
    });
  }, []);

  /**
   * A prepared draft chosen elsewhere — the policy register or the simulation
   * history — arrives as `?draft=<template id>`. Seeding it here is what makes
   * "Use this draft" true, rather than a link that points at a screen which
   * ignores it. The parameter is then removed, so the address stays clean and a
   * reload cannot overwrite edits the officer has since made.
   */
  useEffect(() => {
    const requested = searchParams.get("draft");
    if (!requested || !department) return;
    const template = department.policyTemplates.find((item) => item.id === requested);
    if (!template) return;
    setDraft(template.policyText);
    setTemplateId(template.id);
    setSearchParams({}, { replace: true });
  }, [searchParams, department, setSearchParams]);

  /**
   * Item 6 — "Re-run simulation". The officer pressed the action against a recorded run,
   * which arrives here as `?rerun=<run id>`. The run's own stored inputs are loaded back
   * into this screen — its text, its preset, its uploaded file names and its four
   * assumptions — so they edit and press Run rather than retyping. The parameter is then
   * removed, exactly as `?draft` is, so the address stays clean and a reload cannot
   * overwrite the officer's edits.
   *
   * A run that is no longer in this browser's register loads nothing: the screen says so
   * rather than showing empty boxes that would look like a reset.
   */
  useEffect(() => {
    const requestedRun = searchParams.get(RERUN_QUERY_PARAM);
    if (!requestedRun || !department) return;
    const inputs = rerunInputsFrom(decodeURIComponent(requestedRun));
    setSearchParams({}, { replace: true });
    if (!inputs || inputs.departmentId !== department.id) {
      setRunError("That run is no longer in this browser's register, so its inputs cannot be loaded.");
      return;
    }
    // An upload run's text was its file names, not typed wording — putting that fallback
    // string in the box would turn the next run into a paste. The files are carried instead,
    // so re-running reproduces the same upload run.
    const isUploadRun = inputs.source === "upload";
    setDraft(isUploadRun ? "" : inputs.policyText);
    setTemplateId(inputs.templateId);
    setLevers(inputs.levers);
    setRevisionOf(inputs.revisionOf);
    setUploadedFiles(
      inputs.fileNames.map((name) => ({
        name,
        sizeLabel: "—",
        kind: classifyPolicyFile(name),
        extracted: false,
        text: "",
        status: "Carried over from the earlier run — not read again.",
      })),
    );
    setLoadedFrom({ runId: inputs.runId, reference: peekRun(inputs.runId)?.reference });
    setRunError(null);
  }, [searchParams, department, setSearchParams]);

  /**
   * Item 7 — write the officer's working state back to this browser whenever it changes, so
   * leaving the screen and returning finds it exactly as it was left. The store refuses an
   * untouched screen, so simply opening the workspace leaves no record behind.
   */
  useEffect(() => {
    if (!department) return;
    savePolicyInput({
      departmentId: department.id,
      text: draft,
      templateId,
      levers,
      files: uploadedFiles,
    });
  }, [department, draft, templateId, levers, uploadedFiles]);

  /**
   * Carry out a run: hand the request to the seam and open the live run. This is the ONE place
   * a run is performed, so the notice's "Run with the data I have" and an ordinary Run
   * Simulation press do exactly the same thing.
   */
  const performRun = useCallback(
    async (request: AssessmentRequest) => {
      setIsRunning(true);
      setRunError(null);
      try {
        const run = await assessmentService.run(request);
        navigate(`/app/simulations/${encodeURIComponent(run.id)}`);
      } catch (error) {
        setRunError(
          error instanceof Error ? error.message : "The assessment service could not be reached.",
        );
      } finally {
        setIsRunning(false);
      }
    },
    [navigate],
  );

  const handleRunSimulation = useCallback(async () => {
    if (!department) return;
    const fileNames = uploadedFiles.map((file) => file.name);
    const text = draft.trim();
    // Text read from an uploaded `.txt` file is the policy text when the officer
    // has not typed a draft of their own. The source stays `upload`, so the run
    // states where the text came from without implying that more was read than was.
    const uploadedText = uploadedFiles
      .filter((file) => file.extracted && file.text)
      .map((file) => file.text)
      .join("\n\n")
      .trim();
    if (!text && !uploadedText && fileNames.length === 0) return;
    const policyText =
      text || uploadedText || `Uploaded policy document(s): ${fileNames.join(", ")}`;
    const template = department.policyTemplates.find((item) => item.id === templateId);
    const source: AssessmentSource = text ? (template ? "preset" : "paste") : "upload";
    const request: AssessmentRequest = {
      departmentId: department.id,
      policyText,
      source,
      templateId: text ? templateId : undefined,
      timeHorizon: template?.timeHorizon,
      fileNames,
      // BATCH E — the officer's assumptions travel with the request, so they are part
      // of the stored run and part of its seed.
      levers,
      // Item 6 — when the officer arrived here from "Re-run simulation" on a run that
      // descended from an earlier one, that lineage is carried, so running the same
      // wording again reproduces the same run instead of quietly becoming a first version.
      revisionOf,
      // Item 1 — the paper trail. The officer named at entry travels with the request, so
      // the stored run, its seed and every document derived from it name the same person,
      // and the record states plainly that the name is self-declared today. Read from the
      // session at the moment of the run, so the freshest name is the one recorded.
      preparedBy: getSession()?.officer,
      // Owner's item 3 — the department's own documents are read into the run, so the
      // modelled position rests on departmental material as well as on the submitted draft.
      documents: departmentDocumentInputs(department.id),
    };
    // The seam always hands back a promise. While the platform is simulated it is
    // already resolved, so the officer waits for nothing — the run opens in the
    // same moment it does today. A live service takes as long as it takes, and a
    // failure is reported rather than swallowed.
    // Owner's item 5 — the first run in a department shows the notice once, then remembers it,
    // so the message informs rather than nags. It never blocks a run: the officer can run at
    // once, or go to the Document Library first.
    if (!hasSeenRunNotice(department.id)) {
      setPendingRequest(request);
      setNoticeOpen(true);
      return;
    }
    await performRun(request);
  }, [department, draft, templateId, uploadedFiles, levers, revisionOf, performRun]);

  /**
   * Owner's item 5 — the notice's two actions and its dismissal. All three remember the
   * department, so the notice is shown once and never again; the permanent note stays on screen.
   */
  const rememberNotice = useCallback(() => {
    if (department) markRunNoticeSeen(department.id);
  }, [department]);

  const runFromNotice = useCallback(() => {
    rememberNotice();
    setNoticeOpen(false);
    const request = pendingRequest;
    setPendingRequest(null);
    if (request) void performRun(request);
  }, [rememberNotice, pendingRequest, performRun]);

  const openLibraryFromNotice = useCallback(() => {
    rememberNotice();
    setNoticeOpen(false);
    setPendingRequest(null);
    navigate("/app/documents");
  }, [rememberNotice, navigate]);

  const handleNoticeOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      // Closed by the X, Escape or a click outside: that is a dismissal, so it is remembered.
      rememberNotice();
      setNoticeOpen(false);
      setPendingRequest(null);
    },
    [rememberNotice],
  );

  /**
   * Read each accepted file through the extraction seam, one at a time, and show
   * the real progress. Nothing is skipped silently: a file that cannot be read is
   * still listed, with a status line saying so.
   */
  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const accepted = Array.from(fileList).filter((file) =>
      isAcceptedPolicyFile(file.name, file.type),
    );
    if (accepted.length === 0) return;

    setIsReading(true);
    setReadProgress(0);
    const results: ExtractedPolicyFile[] = [];
    for (let index = 0; index < accepted.length; index += 1) {
      results.push(await extractPolicyFile(accepted[index]));
      setReadProgress(Math.round(((index + 1) / accepted.length) * 100));
    }
    setUploadedFiles((prev) => [...prev, ...results]);
    setIsReading(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      await handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  if (!department) return null;

  const presets = department.policyTemplates;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy Ingestion Hub</span>
        <Button
          size="sm"
          onClick={() => {
            void handleRunSimulation();
          }}
          disabled={isRunning || (!draft.trim() && uploadedFiles.length === 0)}
          className="h-7 bg-primary text-xs hover:bg-primary/90"
        >
          Run Simulation
        </Button>
      </div>

      {/* Owner's item 5 — the permanent note beside the button, and the one-time pop-up. */}
      <RunSimulationNote departmentName={department.shortName} />
      <RunSimulationNotice
        open={noticeOpen}
        departmentName={department.shortName}
        onOpenChange={handleNoticeOpenChange}
        onOpenLibrary={openLibraryFromNotice}
        onRun={runFromNotice}
      />

      {runError && (
        <p className="border-b bg-destructive/5 px-3 py-2 text-[10px] leading-relaxed text-destructive">
          The run did not complete: {runError}
        </p>
      )}

      {/* Item 6 — say where the loaded inputs came from, so the boxes never look as if the
          platform invented them. Running them unchanged records the same run; editing the
          wording records it as the next version of the same policy. */}
      {loadedFrom && !runError && (
        <p className="border-b bg-primary/5 px-3 py-2 text-[10px] leading-relaxed text-foreground">
          Loaded the inputs of{" "}
          <span className="font-mono font-medium text-primary">
            {loadedFrom.reference ?? loadedFrom.runId}
          </span>{" "}
          — its text, preset, documents and assumptions. Running them unchanged records the same
          run; edit the wording and it is recorded as the next version of this policy.
        </p>
      )}

      {/* Item 7 — say plainly that the officer's work survives leaving this screen, and be
          honest when the browser refused to keep anything. */}
      <p className="border-b px-3 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
        {isPolicyInputStorePersistent()
          ? "Your draft, your uploaded documents and your assumptions are kept in this browser for this department — they are still here when you come back to this screen."
          : "This browser refused to keep data between visits, so your draft lasts only until this page is closed."}
      </p>

      {/* Presets */}
      <div className="space-y-1 border-b px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Policy presets ({REFERENCE_FISCAL_YEAR})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setDraft(preset.policyText);
                setTemplateId(preset.id);
              }}
              title={preset.summary}
              className="rounded-md border bg-muted/50 px-2 py-1 text-left text-[10px] leading-tight text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text area. It keeps a usable minimum height, and the column above scrolls rather
          than letting the boxes below (the upload zone and the assumptions) be covered by
          the history table on a short viewport. */}
      <div className="min-h-[140px] flex-1 p-3">
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setTemplateId(undefined);
          }}
          placeholder={`Draft the policy text for ${department.shortName} here…\n\nOr choose one of the department's prepared presets above.`}
          className="h-full w-full resize-none rounded-md border bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="border-t px-3 py-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30"
          }`}
        >
          <span className="mb-1 text-xs text-muted-foreground">Drag & Drop PDF, DOCX, XLSX, or TXT files</span>
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            or browse files
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx,.txt"
              multiple
              onChange={(e) => {
                void handleFileUpload(e.target.files);
              }}
            />
          </label>
        </div>

        {/* Reading progress — real: one step per accepted file */}
        {isReading && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Reading uploaded files
            </span>
            <Progress value={readProgress} className="h-1.5" />
          </div>
        )}

        {/* Uploaded files, each with what actually happened to it */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="px-1 text-[10px] text-foreground">
                <div className="flex items-center justify-between">
                  <span className="truncate">{file.name}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">{file.sizeLabel}</span>
                </div>
                <span className={file.extracted ? "text-primary" : "text-muted-foreground"}>
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Scenario assumptions — BATCH E. Rendered from the lever definitions, so a
          control can never exist that the engine ignores. Neutral by default. */}
      <div className="space-y-2 border-t px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Scenario assumptions
          </span>
          {!isNeutral(levers) && (
            <button
              type="button"
              onClick={() => setLevers(DEFAULT_LEVERS)}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        {LEVER_CONTROLS.map((control) => (
          <div key={control.id} className="space-y-1">
            <span className="block text-[10px] text-foreground" title={control.note}>
              {control.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {control.options.map((option) => {
                const selected = String(levers[control.id]) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    title={control.note}
                    onClick={() => setLever(control.id, option.value)}
                    className={`rounded-md border px-2 py-0.5 text-[10px] leading-tight transition-colors ${
                      selected
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-1">
          <span className="block text-[10px] text-foreground">Phasing before duties begin</span>
          <div className="flex flex-wrap gap-1">
            {PHASE_IN_CHOICES.map((option) => {
              const selected = String(levers.phaseInMonths) === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLever("phaseInMonths", option.value)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] leading-tight transition-colors ${
                    selected
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/10"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

