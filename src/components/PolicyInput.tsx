import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PolicyInput() {
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  const handleAnalyze = async () => {
    if (!draft.trim()) return;
    setIsProcessing(true);
    setAiSummary("");

    try {
      // Use puter.js for AI analysis
      if (typeof window !== "undefined" && (window as any).puter?.ai) {
        const response = await (window as any).puter.ai.chat(
          `You are a policy analysis AI agent for the MiroFish OASIS simulation engine. Analyze the following policy draft and provide a brief structured summary with: 1) Key stakeholders affected, 2) Predicted public sentiment, 3) Risk factors. Be concise.\n\nPolicy Draft:\n${draft}`
        );
        setAiSummary(typeof response === "string" ? response : response?.message?.content || "Analysis complete.");
      } else {
        setAiSummary("⚠ puter.js not loaded. In production, this would trigger MiroFish main.py for full multi-agent simulation.");
      }
    } catch (err) {
      setAiSummary("Error during analysis. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy Draft</span>
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={isProcessing || !draft.trim()}
          className="h-7 text-xs"
        >
          {isProcessing ? "Analyzing…" : "Run Simulation"}
        </Button>
      </div>
      <div className="flex-1 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Draft your policy text here…&#10;&#10;Example: &quot;Propose a 15% carbon tax on industrial emissions exceeding 500,000 tons annually, with revenue allocated to renewable energy subsidies…&quot;"
          className="h-full w-full resize-none rounded-md border bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {aiSummary && (
        <div className="border-t p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-engine mb-2">AI Analysis</div>
          <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-3 text-xs leading-relaxed text-foreground font-mono-code whitespace-pre-wrap">
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}
