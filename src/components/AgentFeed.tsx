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
  "GraphRAG": "bg-primary text-primary-foreground",
  "OASIS": "bg-gold text-gold-foreground",
  "KombiOps": "bg-warning text-warning-foreground",
  "A1A2Farmers": "bg-success text-success-foreground",
  "CivilUnions": "bg-destructive text-destructive-foreground",
  "Diaspora": "bg-primary text-primary-foreground",
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
  { id: 1, timestamp: "14:23:01", agent: "System", type: "system", message: "Nzwisiso OASIS engine initialized. v2.1.0 — Sovereign Compute Node active." },
  { id: 2, timestamp: "14:23:02", agent: "GraphRAG", type: "info", message: "Knowledge graph loaded: 128 entities, 342 relations from Zimbabwe policy corpus." },
  { id: 3, timestamp: "14:23:03", agent: "OASIS", type: "action", message: "Simulation parameters: population=10000, rounds=50, ZiG exchange model enabled." },
  { id: 4, timestamp: "14:23:05", agent: "KombiOps", type: "info", message: "ASO initialized: Kombi Operators & Informal Traders — Urban Logistics/Pricing model loaded." },
  { id: 5, timestamp: "14:23:06", agent: "A1A2Farmers", type: "info", message: "ASO initialized: A1/A2 Resettled Farmers — Agrarian Policy with El Niño variables." },
  { id: 6, timestamp: "14:23:07", agent: "CivilUnions", type: "info", message: "ASO initialized: Civil Service Unions — Wage/Fiscal Policy impact model." },
  { id: 7, timestamp: "14:23:08", agent: "Diaspora", type: "info", message: "ASO initialized: Diaspora Remittance Group — Capital Inflows via ZiG corridor." },
  { id: 8, timestamp: "14:23:12", agent: "KombiOps", type: "result", message: "Round 5/50 — Fuel pricing impact: 62% of operators forecast fare increase under policy." },
  { id: 9, timestamp: "14:23:15", agent: "GraphRAG", type: "info", message: "Dynamic temporal memory updated. 24 new interaction edges added to knowledge graph." },
  { id: 10, timestamp: "14:23:18", agent: "A1A2Farmers", type: "warning", message: "Round 12/50 — Drought cascade: La Niña probability 68%, crop yield models adjusted." },
];

const streamMessages: AgentMessage[] = [
  { id: 11, timestamp: "14:23:30", agent: "CivilUnions", type: "action", message: "Round 25/50 — Wage adjustment model: ZiG purchasing power decline triggers union response." },
  { id: 12, timestamp: "14:23:35", agent: "OASIS", type: "info", message: "Resource allocation balanced. Vultr Harare Node: CPU 72%, Memory 4.8GB." },
  { id: 13, timestamp: "14:23:40", agent: "GraphRAG", type: "result", message: "Subgraph analysis complete. 3 emergent stakeholder communities identified." },
  { id: 14, timestamp: "14:23:45", agent: "Diaspora", type: "action", message: "Remittance corridor simulation: ZiG inflows projected at ZiG 2.4B quarterly." },
  { id: 15, timestamp: "14:23:50", agent: "KombiOps", type: "warning", message: "Round 35/50 — Fuel subsidy removal impact: informal sector contraction risk 34%." },
  { id: 16, timestamp: "14:23:55", agent: "A1A2Farmers", type: "result", message: "Updated prediction: maize output resilience at 54% under El Niño stress scenario." },
  { id: 17, timestamp: "14:24:00", agent: "CivilUnions", type: "action", message: "Round 50/50 — Simulation complete. Ubuntu Analysis: Social cohesion maintained at 78%." },
  { id: 18, timestamp: "14:24:05", agent: "System", type: "result", message: "Final report ready. Collective Well-being Impact (Ubuntu Analysis) included. 3 scenarios, 12 risk factors." },
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ASO Agent Feed</span>
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
