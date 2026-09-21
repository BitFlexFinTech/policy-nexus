import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SCENARIOS, type PolicyDocument, type ScenarioId } from "@/data/documents";
import { setPendingSimulation } from "@/lib/policyStore";
import { cn } from "@/lib/utils";

interface PolicyInputProps {
  draft: string;
  setDraft: (v: string) => void;
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  selectedDoc?: PolicyDocument;
}

export function PolicyInput({ draft, setDraft, scenario, setScenario, selectedDoc }: PolicyInputProps) {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRun = () => {
    if (!draft.trim()) return;
    setPendingSimulation({ policy: draft, scenario, documentId: selectedDoc?.id });
    navigate("/simulation");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = [".pdf", ".docx", ".txt"];
    const newFiles = Array.from(files)
      .filter((f) => accepted.some((ext) => f.name.toLowerCase().endsWith(ext)))
      .map((f) => ({ name: f.name, size: formatFileSize(f.size) }));

    if (newFiles.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Deterministic parse progress: fixed 10% steps every 120ms.
    setIsParsing(true);
    setParseProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setParseProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsParsing(false), 400);
      }
    }, 120);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Policy Ingestion Hub
        </span>
        <Button
          size="sm"
          onClick={handleRun}
          disabled={!draft.trim()}
          className="h-7 text-xs bg-primary hover:bg-primary/90"
        >
          Run Simulation
        </Button>
      </div>

      {/* Scenario selector */}
      <div className="border-b px-3 py-2 space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Use Case Scenario
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={cn(
                "flex flex-col rounded-md border px-2 py-1 text-left transition-colors",
                scenario === s.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/40 hover:bg-muted"
              )}
            >
              <span className="font-mono text-[10px] font-bold text-primary">{s.code}</span>
              <span className="text-[10px] font-medium leading-tight text-foreground">{s.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected source document */}
      {selectedDoc && (
        <div className="border-b bg-muted/30 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Source Document
          </span>
          <p className="text-[11px] font-medium text-foreground leading-tight">{selectedDoc.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {selectedDoc.publisher} · {selectedDoc.year}
          </p>
        </div>
      )}

      {/* Text area */}
      <div className="flex-1 p-3 min-h-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            "Select a document on the left, or draft your policy text here…\n\nExample: \"Adjustment of ZiG mandatory tax settlement for exporters with revenue allocated to the National AI Fund…\""
          }
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
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30"
          )}
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

        {isParsing && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Document Parsing & Knowledge Graph Extraction
            </span>
            <Progress value={parseProgress} className="h-1.5" />
          </div>
        )}

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
