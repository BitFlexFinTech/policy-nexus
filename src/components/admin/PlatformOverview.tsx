import { useSyncExternalStore } from "react";
import { PROMOTER } from "@/config/brand";
import { CAPABILITY_IDS, CAPABILITY_LABELS, describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { COVERAGE } from "@/lib/coverage";
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

/**
 * The administration dashboard: what THIS installation holds right now, and the state of
 * every connection. It is deliberately honest — every figure is read from the local stores,
 * so it says plainly that these numbers are from this browser only, because there is no
 * server collecting site-wide figures yet. No figure here is invented.
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

  const stats: ReadonlyArray<{ label: string; value: string | number }> = [
    { label: "Simulation runs recorded", value: runs.length },
    { label: "Department documents added", value: documents.length },
    { label: "Support cases", value: cases.length },
    {
      label: "Departments · stakeholder groups",
      value: `${COVERAGE.departments} · ${COVERAGE.groups}`,
    },
  ];

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="space-y-0.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Platform overview</h2>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          What this installation holds right now, and the state of every connection. These figures
          are read from THIS browser only — site-wide figures need the server.
        </p>
      </header>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-background p-3">
            <p className="text-lg font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
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
            ? `All ${CAPABILITY_IDS.length} connections are simulated — the platform works end to end with nothing external.`
            : `${liveCount} of ${CAPABILITY_IDS.length} connections live — results may come from an external service.`}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-warning/40 bg-warning/5 p-3">
        <h3 className="text-xs font-semibold text-foreground">What still needs the server</h3>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
          <li>Site-wide figures for every department and officer, not just this browser.</li>
          <li>Reading PDF and DOCX documents (a browser cannot).</li>
          <li>Real sign-in, and real protection for this screen.</li>
          <li>
            Support cases shared across machines, and a live chat with {PROMOTER.name} support.
          </li>
        </ul>
      </div>
    </section>
  );
}
