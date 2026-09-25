import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { findDepartment } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
import { REFERENCE_FISCAL_YEAR, getStakeholderSegment } from "@/config/reference";
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
 * steps, and the scope review is a clearly-marked scenario preview of which
 * stakeholder groups the draft touches. It never claims a simulation has run.
 */
export function PolicyInput() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

  const [draft, setDraft] = useState("");
  const [scope, setScope] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleReviewScope = useCallback(() => {
    if (!department || !draft.trim()) return;
    const segments = department.segments
      .map((segmentId) => getStakeholderSegment(segmentId))
      .map((segment) => `• ${segment.label} — ${segment.note}.`)
      .join("\n");
    setScope(
      `Draft length: ${draft.trim().length} characters.\n` +
        `Modelled stakeholder groups for ${department.name}:\n${segments}\n\n` +
        `Scenario scope (Mock): this preview lists the population groups the draft ` +
        `touches. The full deterministic assessment is produced by the ` +
        `${VOCABULARY.simulationCore} when the draft is run.`,
    );
  }, [department, draft]);

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
          onClick={handleReviewScope}
          disabled={!draft.trim()}
          className="h-7 bg-primary text-xs hover:bg-primary/90"
        >
          Review scope
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
              onClick={() => setDraft(preset.policyText)}
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
          onChange={(e) => setDraft(e.target.value)}
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

      {/* Scenario scope preview */}
      {scope && (
        <div className="border-t p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {VOCABULARY.scenarioEngine} — scenario scope (Mock)
          </div>
          <div className="font-mono-code max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs leading-relaxed text-foreground">
            {scope}
          </div>
        </div>
      )}
    </div>
  );
}

