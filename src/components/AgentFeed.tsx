import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AgentMessage {
  id: number;
  timestamp: string;
  agent: string;
  type: "info" | "action" | "result" | "warning" | "system";
  message: string;
}

const agentColors: Record<string, string> = {
  "GraphRAG": "bg-engine text-engine-foreground",
  "OASIS": "bg-primary text-primary-foreground",
  "ReportAgent": "bg-success text-success-foreground",
  "EnvAgent": "bg-warning text-warning-foreground",
  "SimAgent": "bg-destructive text-destructive-foreground",
  "System": "bg-muted text-muted-foreground",
};

const typeIcons: Record<string, string> = {
  info: "ℹ",
  action: "▶",
  result: "✓",
  warning: "⚠",
  system: "⚙",
};

const initialMessages: AgentMessage[] = [
  { id: 1, timestamp: "14:23:01", agent: "System", type: "system", message: "MiroFish OASIS engine initialized. v2.1.0" },
  { id: 2, timestamp: "14:23:02", agent: "GraphRAG", type: "info", message: "Knowledge graph loaded: 128 entities, 342 relations extracted from seed data." },
  { id: 3, timestamp: "14:23:03", agent: "EnvAgent", type: "action", message: "Environment configuration injected. Simulation parameters: population=10000, rounds=50, sentiment_model=GPT-4o." },
  { id: 4, timestamp: "14:23:05", agent: "OASIS", type: "info", message: "Parallel simulation started on dual platforms. Thread pool: 8 workers." },
  { id: 5, timestamp: "14:23:08", agent: "SimAgent", type: "action", message: "Round 1/50 — Agents initialized with persona profiles and long-term memory." },
  { id: 6, timestamp: "14:23:12", agent: "SimAgent", type: "result", message: "Round 5/50 — Public sentiment divergence detected. Group A: 62% favorable, Group B: 38% opposed." },
  { id: 7, timestamp: "14:23:15", agent: "GraphRAG", type: "info", message: "Dynamic temporal memory updated. 24 new interaction edges added to knowledge graph." },
  { id: 8, timestamp: "14:23:18", agent: "SimAgent", type: "warning", message: "Round 12/50 — Cascade event detected: viral misinformation spread in Cluster C." },
  { id: 9, timestamp: "14:23:22", agent: "ReportAgent", type: "action", message: "Intermediate analysis triggered. Querying simulation environment with tool suite." },
  { id: 10, timestamp: "14:23:25", agent: "ReportAgent", type: "result", message: "Preliminary report generated. Key finding: policy has 71% predicted approval under current conditions." },
];

const streamMessages: AgentMessage[] = [
  { id: 11, timestamp: "14:23:30", agent: "SimAgent", type: "action", message: "Round 25/50 — Mid-simulation checkpoint. Saving state to SQLite." },
  { id: 12, timestamp: "14:23:35", agent: "OASIS", type: "info", message: "Resource allocation balanced. CPU: 72%, Memory: 4.8GB." },
  { id: 13, timestamp: "14:23:40", agent: "GraphRAG", type: "result", message: "Subgraph analysis complete. 3 emergent communities identified." },
  { id: 14, timestamp: "14:23:45", agent: "EnvAgent", type: "action", message: "Injecting perturbation variable: economic downturn scenario (-2% GDP)." },
  { id: 15, timestamp: "14:23:50", agent: "SimAgent", type: "warning", message: "Round 35/50 — Significant sentiment shift detected after perturbation." },
  { id: 16, timestamp: "14:23:55", agent: "ReportAgent", type: "result", message: "Updated prediction: approval drops to 54% under economic stress scenario." },
  { id: 17, timestamp: "14:24:00", agent: "SimAgent", type: "action", message: "Round 50/50 — Simulation complete. Final state snapshot saved." },
  { id: 18, timestamp: "14:24:05", agent: "ReportAgent", type: "result", message: "Final report ready. 3 scenario comparisons, 12 risk factors identified." },
];

export function AgentFeed() {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [streamIdx, setStreamIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamIdx >= streamMessages.length) return;
    const timer = setTimeout(() => {
      setMessages((prev) => [...prev, streamMessages[streamIdx]]);
      setStreamIdx((i) => i + 1);
    }, 3000 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [streamIdx, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agent Feed</span>
        <span className="text-xs text-muted-foreground font-mono">{messages.length} events</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 animate-slide-up-fade">
            <span className="mt-0.5 text-xs text-muted-foreground font-mono shrink-0 w-16">{msg.timestamp}</span>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", agentColors[msg.agent] || "bg-muted text-muted-foreground")}>
              {msg.agent}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{typeIcons[msg.type]}</span>
            <span className="text-xs text-foreground leading-relaxed font-mono-code">{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
