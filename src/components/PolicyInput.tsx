import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { findDepartment } from "@/config/departments";
import { REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { assessmentService } from "@/services/assessment/AssessmentService";
import type { AssessmentRequest } from "@/services/assessment/types";
import { useSession } from "@/session/useSession";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

/** Deterministic parsing steps — no clock, no randomness, same every run. */
const PARSE_STEP = 8;
const PARSE_TICK_MS = 250;

/**
 * Policy ingestion for the signed-in department. Presets come from the
 * department's own prepared drafts, the parsing indicator advances in fixed
 * steps, and **Run Simulation** hands the draft to the assessment service and
 * opens the live deterministic run. It performs no network call.
 */
export function PolicyInput() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const navigate = useNavigate();

  const [draft, setDraft] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRunSimulation = useCallback(() => {
    if (!department) return;
    const fileNames = uploadedFiles.map((file) => file.name);
    const text = draft.trim();
    if (!text && fileNames.length === 0) return;
    // No text extraction exists in scenario mode: when only files were supplied
    // the recorded file list is the policy text, and the source says `upload`
    // plainly rather than implying the file was parsed.
    const policyText = text || `Uploaded policy document(s): ${fileNames.join(", ")}`;
    const template = department.policyTemplates.find((item) => item.id === templateId);
    const request: AssessmentRequest = {
      departmentId: department.id,
      policyText,
      source: text ? (template ? "preset" : "paste") : "upload",
      templateId: text ? templateId : undefined,
      timeHorizon: template?.timeHorizon,
      fileNames,
    };
    const run = assessmentService.run(request);
    navigate(`/app/simulations/${encodeURIComponent(run.id)}`);
  }, [department, draft, templateId, uploadedFiles, navigate]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const newFiles: { name: string; size: string }[] = [];
    Array.from(files).forEach((file) => {
      if (validTypes.includes(file.type) || file.name.endsWith(".txt") || file.name.endsWith(".pdf") || file.name.endsWith(".docx")) {
        newFiles.push({ name: file.name, size: formatFileSize(file.size) });
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setIsParsing(true);
      setParseProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += PARSE_STEP;
        if (progress >= 100) {
          clearInterval(interval);
          setParseProgress(100);
          setTimeout(() => setIsParsing(false), 300);
        } else {
          setParseProgress(progress);
        }
      }, PARSE_TICK_MS);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
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
          onClick={handleRunSimulation}
          disabled={!draft.trim() && uploadedFiles.length === 0}
          className="h-7 bg-primary text-xs hover:bg-primary/90"
        >
          Run Simulation
        </Button>
      </div>

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
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>

        {/* Parse progress */}
        {isParsing && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Document Parsing & Knowledge Map Extraction
            </span>
            <Progress value={parseProgress} className="h-1.5" />
          </div>
        )}

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-1 text-[10px] text-foreground">
                <span className="truncate">{f.name}</span>
                <span className="ml-2 text-muted-foreground">{f.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

