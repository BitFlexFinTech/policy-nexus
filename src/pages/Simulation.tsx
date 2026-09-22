import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/HeaderBar";
import { ApprovalTracker } from "@/components/ApprovalTracker";
import { SovereignFooter } from "@/components/SovereignFooter";
import { getPendingSimulation } from "@/lib/policyStore";
import { runSimulation } from "@/lib/simulation";
import { cn } from "@/lib/utils";

function Panel({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        {right}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

const typeIcon: Record<string, string> = { info: "ℹ", action: "▶", result: "✓", warning: "⚠" };

const Simulation = () => {
  const navigate = useNavigate();
  const pending = useMemo(() => getPendingSimulation(), []);
  const report = useMemo(
    () => (pending ? runSimulation(pending.policy, pending.scenario) : null),
    [pending]
  );

  if (!report) {
    return (
      <div className="flex h-screen flex-col">
        <HeaderBar />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">No simulation queued.</p>
          <Button size="sm" onClick={() => navigate("/")}>
            Return to dashboard
          </Button>
        </div>
        <SovereignFooter />
      </div>
    );
  }

  const bar = (score: number) =>
    score >= 66 ? "bg-success" : score >= 45 ? "bg-gold" : "bg-destructive";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderBar />

      {/* Report header */}
      <div className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-primary">{report.scenario.code}</span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {report.scenario.label}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {report.documentTitle ?? "Custom policy draft"} · seed{" "}
              <span className="font-mono text-foreground">{report.seed}</span> · {report.rounds} rounds ·{" "}
              {report.agents.toLocaleString()} ASO agents
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Weighted Approval</div>
            <div className="text-2xl font-bold leading-none tracking-tight text-primary">
              {report.approval}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Model Confidence</div>
            <div className="text-2xl font-bold leading-none tracking-tight text-foreground">
              {report.confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-2">
        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
          Verdict
        </span>
        <span className="text-xs font-medium text-foreground">{report.verdict}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 border-b bg-card px-4 py-3">
        {report.kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1.5 rounded-lg border p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {k.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">{k.value}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 font-mono text-[10px] font-semibold",
                  k.direction === "up" ? "text-success" : k.direction === "down" ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {k.direction === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : k.direction === "down" ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {k.delta}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", bar(k.score))} style={{ width: `${k.score}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{k.note}</span>
          </div>
        ))}
      </div>

      {/* Body grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="px-3 pt-3">
        <ApprovalTracker data={report.tracker} />
      </div>
      <div className="grid grid-cols-3 gap-3 p-3">
        <Panel
          title="Stakeholder Response"
          right={<span className="text-[10px] text-muted-foreground">{report.stakeholders.length} ASO classes</span>}
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {["Stakeholder Class", "Population", "Approval", "Sentiment"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.stakeholders.map((s) => (
                <tr key={s.name} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-1.5">
                    <div className="text-[11px] font-medium text-foreground">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.driver}</div>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {s.population.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 font-mono text-[11px] font-semibold text-foreground">{s.approval}%</span>
                      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <span className={cn("block h-full", bar(s.approval))} style={{ width: `${s.approval}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.sentiment === "Supportive"
                          ? "bg-success/15 text-success"
                          : s.sentiment === "Neutral"
                          ? "bg-gold/20 text-gold-foreground"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {s.sentiment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Risk Register">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {["Risk Factor", "Likelihood", "Impact"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.risks.map((risk) => (
                <tr key={risk.factor} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-1.5">
                    <div className="text-[11px] font-medium text-foreground">{risk.factor}</div>
                    <div className="text-[10px] text-muted-foreground">{risk.mitigation}</div>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-foreground">{risk.likelihood}%</td>
                  <td className="px-3 py-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        risk.impact === "Severe"
                          ? "bg-destructive/15 text-destructive"
                          : risk.impact === "High"
                          ? "bg-warning/20 text-warning-foreground"
                          : risk.impact === "Moderate"
                          ? "bg-gold/15 text-gold-foreground"
                          : "bg-success/15 text-success"
                      )}
                    >
                      {risk.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex min-h-0 flex-col gap-3">
          <Panel title="Simulation Trace" className="min-h-0 flex-1">
            <div className="space-y-0.5 p-2">
              {report.trace.map((e, i) => (
                <div key={i} className="flex items-start gap-2 rounded px-1.5 py-1 hover:bg-muted/50">
                  <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground">R{e.round}</span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {e.agent}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{typeIcon[e.type]}</span>
                  <span className="font-mono-code text-[11px] leading-relaxed text-foreground">{e.message}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ubuntu Analysis — Collective Well-being">
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Cohesion", v: report.ubuntu.cohesion },
                  { label: "Equity", v: report.ubuntu.equity },
                  { label: "Trust", v: report.ubuntu.trust },
                ].map((u) => (
                  <div key={u.label} className="rounded-md border p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{u.label}</div>
                    <div className="text-lg font-bold leading-none text-foreground">{u.v}%</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{report.ubuntu.narrative}</p>
            </div>
          </Panel>
        </div>
      </div>
      </div>

      {/* Recommendations */}
      <div className="border-t bg-card px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recommended Actions
        </span>
        <ol className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5">
          {report.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-foreground">
              <span className="font-mono font-semibold text-primary">{i + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ol>
      </div>

      <SovereignFooter />
    </div>
  );
};

export default Simulation;
