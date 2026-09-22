import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HeaderBar } from "@/components/HeaderBar";
import { SovereignFooter } from "@/components/SovereignFooter";
import { DOCUMENTS, SCENARIOS, type ScenarioId } from "@/data/documents";
import { runSimulation, type ApprovalStatus } from "@/lib/simulation";
import { cn } from "@/lib/utils";

const statusStyle: Record<ApprovalStatus, string> = {
  Approved: "bg-success/15 text-success",
  Conditional: "bg-gold/20 text-gold-foreground",
  Pending: "bg-warning/20 text-warning-foreground",
  Objected: "bg-destructive/15 text-destructive",
};

const barStyle: Record<ApprovalStatus, string> = {
  Approved: "bg-success",
  Conditional: "bg-gold",
  Pending: "bg-warning",
  Objected: "bg-destructive",
};

const firstDocFor = (id: ScenarioId) => DOCUMENTS.find((d) => d.scenario === id)!;

const Compare = () => {
  const [picked, setPicked] = useState<Record<ScenarioId, string>>(() =>
    SCENARIOS.reduce(
      (acc, s) => ({ ...acc, [s.id]: firstDocFor(s.id).id }),
      {} as Record<ScenarioId, string>
    )
  );

  const columns = useMemo(
    () =>
      SCENARIOS.map((s) => {
        const doc = DOCUMENTS.find((d) => d.id === picked[s.id]) ?? firstDocFor(s.id);
        return { scenario: s, doc, report: runSimulation(doc.excerpt, s.id) };
      }),
    [picked]
  );

  const maxMilestones = Math.max(...columns.map((c) => c.report.tracker.milestones.length));

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar />

      <div className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div>
            <div className="text-sm font-semibold tracking-tight text-foreground">
              Scenario Comparison — Approval Timelines, Decision Gates & Milestone Outcomes
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deterministic side-by-side run of all four scenarios. Change the source document in any
              column to re-run that scenario.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(Object.keys(statusStyle) as ApprovalStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", barStyle[s])} />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-4 gap-3 border-b bg-card px-4 py-3">
        {columns.map(({ scenario, doc, report }) => (
          <div key={scenario.id} className="flex flex-col gap-2 rounded-lg border p-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-primary">{scenario.code}</span>
              <span className="truncate text-xs font-semibold text-foreground">{scenario.short}</span>
            </div>
            <select
              value={doc.id}
              onChange={(e) =>
                setPicked((p) => ({ ...p, [scenario.id]: e.target.value }))
              }
              className="w-full rounded-md border bg-background px-1.5 py-1 text-[10px] text-foreground"
            >
              {DOCUMENTS.filter((d) => d.scenario === scenario.id).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Approval</div>
                <div className="text-xl font-bold leading-none text-primary">{report.approval}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</div>
                <div className="text-sm font-semibold leading-none text-foreground">
                  {report.confidence}%
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  statusStyle[
                    report.tracker.milestones[report.tracker.milestones.length - 1].status
                  ]
                )}
              >
                {report.tracker.milestones[report.tracker.milestones.length - 1].status}
              </span>
            </div>
            <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
              {report.verdict}
            </p>
          </div>
        ))}
      </div>

      {/* Milestone-by-milestone comparison */}
      <div className="flex-1 space-y-3 p-3">
        <section className="rounded-lg border bg-card">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Approval Timeline & Decision Gates
          </div>
          <div className="divide-y">
            {Array.from({ length: maxMilestones }, (_, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 px-3 py-2">
                {columns.map(({ scenario, report }) => {
                  const m = report.tracker.milestones[i];
                  if (!m) return <div key={scenario.id} />;
                  return (
                    <div key={scenario.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium text-foreground">
                          <span className="font-mono text-[10px] text-muted-foreground">W{m.week} </span>
                          {m.name}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          {m.weightedApproval}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", barStyle[m.status])}
                          style={{ width: `${m.weightedApproval}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                            statusStyle[m.status]
                          )}
                        >
                          {m.status}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">{m.gate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stakeholder Outcomes at Final Milestone
          </div>
          <div className="grid grid-cols-4 gap-3 p-3">
            {columns.map(({ scenario, report }) => (
              <div key={scenario.id} className="space-y-1">
                {report.tracker.tracks.map((t) => {
                  const last = t.points[t.points.length - 1];
                  const first = t.points[0];
                  const shift = last.approval - first.approval;
                  return (
                    <div key={t.name} className="rounded-md border px-2 py-1.5">
                      <div className="truncate text-[10px] font-medium text-foreground">{t.name}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          {last.approval}%
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            shift > 0 ? "text-success" : shift < 0 ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {shift > 0 ? "+" : ""}
                          {shift} pts
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                            statusStyle[last.status]
                          )}
                        >
                          {last.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lead Risk per Scenario
          </div>
          <div className="grid grid-cols-4 gap-3 p-3">
            {columns.map(({ scenario, report }) => {
              const top = [...report.risks].sort((a, b) => b.likelihood - a.likelihood)[0];
              return (
                <div key={scenario.id} className="rounded-md border p-2">
                  <div className="text-[11px] font-medium text-foreground">{top.factor}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-foreground">{top.likelihood}%</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      {top.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    {top.mitigation}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <SovereignFooter />
    </div>
  );
};

export default Compare;
