import { useSyncExternalStore } from "react";
import { PROMOTER } from "@/config/brand";
import { CAPABILITY_IDS, CAPABILITY_LABELS, describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { departmentLabel } from "@/config/departments";
import { COVERAGE } from "@/lib/coverage";
import { formatInstant } from "@/lib/clock";
import { SUPPORT_STATUS_LABELS } from "@/config/support";
import {
  getRunsServerSnapshot,
  getRunsSnapshot,
  subscribeToRuns,
} from "@/services/assessment/runStore";
import {
  getDepartmentDocumentsServerSnapshot,
  getDepartmentDocumentsSnapshot,
  subscribeToDepartmentDocuments,
} from "@/services/documents/departmentDocuments";
import { useSupportCases } from "@/services/support/useSupportCases";
import { ActivityPanel, BarPanel, SplitPanel } from "@/components/admin/PlatformCharts";
import {
  casesByCategory,
  casesByStatus,
  documentsByDepartment,
  indicatorSplit,
  runsByDate,
  runsByDepartment,
} from "@/services/admin/dashboardData";

const firstWords = (text: string, max = 70) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "(no text)";
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
};

/** Open · In progress · Resolved — the same token colours the status pills use. */
const STATUS_COLORS = ["hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--success))"];

/**
 * The administration dashboard. Every figure is DERIVED from real data the platform holds, so none
 * is invented; the server-only measures are shown as an explicit "connects with the server" panel
 * rather than a fake number. It says plainly that the figures are from THIS browser until the
 * platform is connected to its server.
 */
export function PlatformOverview() {
  const config = usePlatformConfig();
  const runs = useSyncExternalStore(subscribeToRuns, getRunsSnapshot, getRunsServerSnapshot);
  const documents = useSyncExternalStore(
    subscribeToDepartmentDocuments,
    getDepartmentDocumentsSnapshot,
    getDepartmentDocumentsServerSnapshot,
  );
  const cases = useSupportCases();

  const liveCount = CAPABILITY_IDS.filter(
    (id) => describeCapability(config, id).state === "live",
  ).length;
  const activeDepartments = new Set(runs.map((run) => run.departmentId)).size;

  const stats: ReadonlyArray<{ label: string; value: string | number }> = [
    { label: "Simulation runs recorded", value: runs.length },
    { label: "Department documents added", value: documents.length },
    { label: "Support cases", value: cases.length },
    { label: "Departments with activity", value: activeDepartments },
  ];

  return (
    <section className="space-y-4">
      <header className="space-y-0.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Platform overview</h2>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Every figure here is derived from real platform data and read from THIS browser only —
          site-wide figures need the server.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-3">
            <p className="text-lg font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarPanel
          title="Simulation runs by department"
          note="Recorded in this browser."
          data={runsByDepartment(runs)}
          emptyLabel="No runs recorded yet."
        />
        <ActivityPanel data={runsByDate(runs)} />
        <BarPanel
          title="Department documents by department"
          note="Added to the Document Library in this browser."
          data={documentsByDepartment(documents)}
          color="hsl(var(--gold))"
          emptyLabel="No documents added yet."
        />
        <SplitPanel
          title="Support cases by state"
          data={casesByStatus(cases)}
          colors={STATUS_COLORS}
        />
        <BarPanel
          title="Support cases by category"
          data={casesByCategory(cases)}
          emptyLabel="No cases opened yet."
        />
        <SplitPanel
          title="Reference figures: published vs modelled"
          note="How much of the reference data stands on a published source."
          data={indicatorSplit()}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold tracking-tight text-foreground">Recent runs</h3>
          {runs.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">No runs recorded yet.</p>
          ) : (
            <ul className="mt-2 divide-y">
              {runs.slice(0, 6).map((run) => (
                <li key={run.id} className="py-1.5">
                  <p className="text-xs text-foreground">{departmentLabel(run.departmentId)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {firstWords(run.policyText)} · {formatInstant(run.recordedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold tracking-tight text-foreground">
            Recent support cases
          </h3>
          {cases.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">No cases opened yet.</p>
          ) : (
            <ul className="mt-2 divide-y">
              {cases.slice(0, 6).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="truncate text-xs text-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground">{entry.id}</span>{" "}
                    · {entry.subject}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {SUPPORT_STATUS_LABELS[entry.status]}
                    {entry.assignee ? ` · ${entry.assignee}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Connections
        </h3>
        <ul className="mt-1">
          {CAPABILITY_IDS.map((id) => {
            const status = describeCapability(config, id);
            return (
              <li key={id} className="border-b py-1.5 last:border-b-0">
                <p className="text-xs text-foreground">{CAPABILITY_LABELS[id]}</p>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{status.detail}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {liveCount === 0
            ? `All ${CAPABILITY_IDS.length} connections are simulated.`
            : `${liveCount} of ${CAPABILITY_IDS.length} connections live.`}
        </p>
      </section>

      <section className="rounded-lg border border-warning/40 bg-warning/5 p-4">
        <h3 className="text-xs font-semibold text-foreground">What still needs the server</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          These can only be known from a server, so nothing is shown rather than an invented figure.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Active users & sign-ins",
            "Visits & geography",
            "Model/token usage & cost",
            "Uptime & error rate",
          ].map((label) => (
            <div key={label} className="rounded-lg border border-dashed bg-background p-3">
              <p className="text-sm font-semibold text-muted-foreground">Connects with the server</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Support runs with {PROMOTER.name}.
        </p>
      </section>

      <p className="text-[10px] text-muted-foreground">
        {COVERAGE.departments} departments · {COVERAGE.groups} stakeholder groups ·{" "}
        {COVERAGE.indicators} reference indicators · scenario (no-network) mode.
      </p>
    </section>
  );
}
