import { cn } from "@/lib/utils";
import type { ApprovalStatus, ApprovalTrackerData } from "@/lib/simulation";

const statusStyle: Record<ApprovalStatus, string> = {
  Approved: "bg-success/15 text-success",
  Conditional: "bg-gold/20 text-gold-foreground",
  Pending: "bg-warning/20 text-warning-foreground",
  Objected: "bg-destructive/15 text-destructive",
};

const dotStyle: Record<ApprovalStatus, string> = {
  Approved: "bg-success",
  Conditional: "bg-gold",
  Pending: "bg-warning",
  Objected: "bg-destructive",
};

export function ApprovalTracker({ data }: { data: ApprovalTrackerData }) {
  const { milestones, tracks } = data;

  return (
    <section className="flex flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Policy Approval Tracker — Stakeholder Status Over Time
        </span>
        <div className="flex items-center gap-2">
          {(Object.keys(statusStyle) as ApprovalStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", dotStyle[s])} />
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Stakeholder Class
              </th>
              {milestones.map((m) => (
                <th key={m.name} className="px-3 py-1.5 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-foreground">{m.name}</div>
                  <div className="font-mono text-[10px] font-normal text-muted-foreground">Week {m.week}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="sticky left-0 bg-card px-3 py-1.5 text-[11px] font-medium text-foreground">{t.name}</td>
                {t.points.map((p, i) => {
                  const prev = i > 0 ? t.points[i - 1].approval : null;
                  const delta = prev === null ? null : p.approval - prev;
                  return (
                    <td key={p.milestone} className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotStyle[p.status])} />
                        <span className="font-mono text-[11px] font-semibold text-foreground">{p.approval}%</span>
                        {delta !== null && (
                          <span
                            className={cn(
                              "font-mono text-[10px]",
                              delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"
                            )}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-muted/40">
              <td className="sticky left-0 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-foreground">
                Weighted Decision Gate
              </td>
              {milestones.map((m) => (
                <td key={m.name} className="px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-foreground">{m.weightedApproval}%</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", statusStyle[m.status])}>
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{m.gate}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
