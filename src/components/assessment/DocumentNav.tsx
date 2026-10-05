import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BackToOverview } from "./BackToOverview";
import { ReRunSimulationLink } from "./ReRunSimulationLink";
import { RevisionBadge } from "./RevisionBadge";
import { DOCUMENT_VIEWS } from "./documentViews";

/**
 * The one navigation strip shared by the four screens that make up a completed
 * run's paperwork: the executive summary, the full assessment, the full report
 * and the drafted policy.
 *
 * Before this existed, each of the four screens carried its own set of links to
 * the other three, so the same four destinations were written out four times and
 * had to be kept in step by hand. The destinations are now defined once, in
 * `documentViews.ts`, and every screen renders this strip (see
 * .clinerules/03-single-source-of-truth.md).
 *
 * `end` keeps "Executive summary" from staying marked while a deeper screen of the
 * same run is open. The current screen is marked by `NavLink` with
 * `aria-current="page"`, so the marker is announced by a screen reader instead of
 * being carried by colour alone.
 */
export function DocumentNav({ runId }: { runId: string }) {
  const base = `/app/assessments/${encodeURIComponent(runId)}`;

  return (
    <nav
      aria-label="Documents in this run"
      data-print="hide"
      className="flex items-center gap-1 overflow-x-auto rounded-lg border border-primary/30 bg-primary-tint px-2 py-1.5"
    >
      {/* The owner's instruction (2026-10-02): one "← Back", always to the Overview. It sits
          in this strip so every screen of a run carries it, from one definition. */}
      <BackToOverview />
      <span className="shrink-0 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        This run
      </span>
      {DOCUMENT_VIEWS.map((view) => (
        <NavLink
          key={view.label}
          to={view.segment ? `${base}/${view.segment}` : base}
          end={view.end}
          className={({ isActive }) =>
            cn(
              "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )
          }
        >
          {view.label}
        </NavLink>
      ))}
      <span className="ml-auto flex shrink-0 items-center gap-1">
        {/* The version of the policy these documents belong to, derived from the run's own
            lineage. A first run shows nothing. */}
        <RevisionBadge runId={runId} className="shrink-0" />
        {/* Item 6 — from any of the four documents, take this run's inputs back to the policy
            input so they can be edited and run again. */}
        <ReRunSimulationLink
          runId={runId}
          className="shrink-0 whitespace-nowrap rounded-md border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        />
      </span>
    </nav>
  );
}
