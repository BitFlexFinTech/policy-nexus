import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { findDepartment } from "@/config/departments";
import { REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { assessmentService } from "@/services/assessment/AssessmentService";
import type { AssessmentRequest, AssessmentSource } from "@/services/assessment/types";
import {
  extractPolicyFile,
  isAcceptedPolicyFile,
  type ExtractedPolicyFile,
} from "@/services/extraction/extractPolicyText";
import { useSession } from "@/session/useSession";

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

  const [draft, setDraft] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedPolicyFile[]>([]);
  const [readProgress, setReadProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

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
    };
    // The seam always hands back a promise. While the platform is simulated it is
    // already resolved, so the officer waits for nothing — the run opens in the
    // same moment it does today. A live service takes as long as it takes, and a
    // failure is reported rather than swallowed.
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
  }, [department, draft, templateId, uploadedFiles, navigate]);

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
    <div className="flex h-full flex-col border-r bg-card">
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

      {runError && (
        <p className="border-b bg-destructive/5 px-3 py-2 text-[10px] leading-relaxed text-destructive">
          The run did not complete: {runError}
        </p>
      )}

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

      {/* Text area */}
      <div className="min-h-0 flex-1 p-3">
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
          <span className="mb-1 text-xs text-muted-foreground">Drag & Drop PDF, DOCX, or TXT files</span>
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            or browse files
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
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
    </div>
  );
}

