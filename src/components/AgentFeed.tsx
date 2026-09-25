import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { findDepartment, type Department } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
import { REFERENCE_DATE_LABEL, getStakeholderSegment } from "@/config/reference";
import { useSession } from "@/session/useSession";
import {
  FEED_SYSTEM_TONE,
  FEED_TAG_TONES,
  FEED_TYPE_ICONS,
  feedTimestamp,
} from "@/components/feedStyles";

interface AgentMessage {
  id: number;
  timestamp: string;
  agent: string;
  type: "info" | "action" | "result" | "warning" | "system";
  message: string;
  /** Tailwind tone classes for the agent tag. */
  tone: string;
}

/**
 * Build the department's stakeholder agent feed from its own configuration:
 * one entry per modelled segment, framed by the scenario opening and closing
 * lines. No vendor terminology and no generated figures.
 */
const buildFeed = (department: Department): AgentMessage[] => {
  const entries: Array<{ agent: string; type: AgentMessage["type"]; message: string }> = [
    {
      agent: "System",
      type: "system",
      message: `${VOCABULARY.simulationCore} prepared for ${department.name}. Scenario mode — every figure is simulated, not live data.`,
    },
    {
      agent: "Corpus",
      type: "info",
      message: `${VOCABULARY.knowledgeMap} loaded: ${department.indicators.length} reference indicators and ${department.documents.length} department documents.`,
    },
  ];

  department.segments.forEach((segmentId) => {
    const segment = getStakeholderSegment(segmentId);
    entries.push({
      agent: segment.label,
      type: "info",
      message: `${VOCABULARY.agentMemory} initialised: ${segment.label} — ${segment.note}.`,
    });
  });

  entries.push({
    agent: "System",
    type: "system",
    message: `${VOCABULARY.scenarioEngine} ready. Prepared drafts: ${department.policyTemplates.length}. Reference date ${REFERENCE_DATE_LABEL}.`,
  });

  const toneByAgent = new Map<string, string>();
  let toneIndex = 0;

  return entries.map((entry, index) => {
    let tone = FEED_SYSTEM_TONE;
    if (entry.agent !== "System") {
      const existing = toneByAgent.get(entry.agent);
      if (existing) {
        tone = existing;
      } else {
        tone = FEED_TAG_TONES[toneIndex % FEED_TAG_TONES.length];
        toneByAgent.set(entry.agent, tone);
        toneIndex += 1;
      }
    }
    return {
      id: index + 1,
      timestamp: feedTimestamp(index),
      agent: entry.agent,
      type: entry.type,
      message: entry.message,
      tone,
    };
  });
};

/**
 * Stakeholder agent feed. Replaces the previous hardcoded, randomly streamed
 * vendor feed: the entries now derive from the department's modelled segments
 * and are byte-identical for the same department on every render.
 */
export function AgentFeed() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const messages = useMemo(() => (department ? buildFeed(department) : []), [department]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!department) return null;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{VOCABULARY.agentFeed}</span>
        <span className="text-xs font-mono text-muted-foreground">{messages.length} events</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-up-fade flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
            <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-muted-foreground">{msg.timestamp}</span>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", msg.tone)}>
              {msg.agent}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{FEED_TYPE_ICONS[msg.type]}</span>
            <span className="font-mono-code text-xs leading-relaxed text-foreground">{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
