import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const PRESETS = [
  "Adjustment of ZiG mandatory tax settlement for exporters.",
  "Implementation of the 2026 National Digital Regulatory Framework.",
  "Incentive program for the Mugove/Umqele/Isabelo National AI Fund.",
];

export function PolicyInput() {
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAnalyze = async () => {
    if (!draft.trim()) return;
    setIsProcessing(true);
    setAiSummary("");

    try {
      if (typeof window !== "undefined" && (window as any).puter?.ai) {
        const response = await (window as any).puter.ai.chat(
          `You are a policy analysis AI for the Nzwisiso National Policy Simulation Engine (Zimbabwe context, 2026). Analyze the following policy draft and provide:
1) Key stakeholders affected (use Zimbabwe-specific categories: Kombi Operators, A1/A2 Farmers, Civil Service Unions, Diaspora Remittance Group)
2) ZiG Currency Impact — predicted effect on ZiG stability
3) Predicted public sentiment
4) Risk factors
5) Collective Well-being Impact (Ubuntu Analysis) — assess social cohesion rather than just GDP

Be concise and structured.\n\nPolicy Draft:\n${draft}`
        );
        setAiSummary(typeof response === "string" ? response : response?.message?.content || "Analysis complete.");
      } else {
        setAiSummary("⚠ puter.js not loaded. In production, this triggers the OASIS simulation engine for full multi-agent analysis.");
      }
    } catch {
      setAiSummary("Error during analysis. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

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
      // Simulate parsing progress
      setIsParsing(true);
      setParseProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => setIsParsing(false), 500);
        }
        setParseProgress(Math.min(p, 100));
      }, 300);
    }
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy Ingestion Hub</span>
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={isProcessing || !draft.trim()}
          className="h-7 text-xs bg-primary hover:bg-primary/90"
        >
          {isProcessing ? "Analyzing…" : "Run Simulation"}
        </Button>
      </div>

      {/* Presets */}
      <div className="border-b px-3 py-2 space-y-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Policy Presets (2026)</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => setDraft(preset)}
              className="rounded-md border bg-muted/50 px-2 py-1 text-[10px] text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left leading-tight"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 p-3 min-h-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"Draft your policy text here…\n\nExample: \"Adjustment of ZiG mandatory tax settlement for exporters with revenue allocated to the Mugove/Umqele/Isabelo National AI Fund…\""}
          className="h-full w-full resize-none rounded-md border bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="border-t px-3 py-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30"
          }`}
        >
          <span className="text-xs text-muted-foreground mb-1">Drag & Drop PDF, DOCX, or TXT files</span>
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
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Document Parsing & Knowledge Graph Extraction</span>
            <Progress value={parseProgress} className="h-1.5" />
          </div>
        )}

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] text-foreground px-1">
                <span className="truncate">{f.name}</span>
                <span className="text-muted-foreground ml-2">{f.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="border-t p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">OASIS Analysis</div>
          <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-3 text-xs leading-relaxed text-foreground font-mono-code whitespace-pre-wrap">
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}
