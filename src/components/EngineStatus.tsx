import { StatusPill } from "./StatusPill";

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
}

function Metric({ label, value, sub }: MetricProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tracking-tight text-foreground leading-none">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function EngineStatus() {
  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Engine Vitals</span>
        <div className="flex gap-1.5">
          <StatusPill label="OASIS" status="online" />
          <StatusPill label="GraphRAG" status="online" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 px-4 py-3">
        <Metric label="ASO Agents" value="10,240" sub="Active stakeholder objects" />
        <Metric label="Rounds" value="25/50" sub="Simulation progress" />
        <Metric label="ZiG Rate" value="13.56" sub="ZiG per USD" />
        <Metric label="Graph Nodes" value="128" sub="Knowledge entities" />
      </div>
    </div>
  );
}
