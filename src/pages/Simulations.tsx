import { Link } from "react-router-dom";
import { findDepartment } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
import { RevisionBadge } from "@/components/assessment/RevisionBadge";
import { ReRunSimulationLink } from "@/components/assessment/ReRunSimulationLink";
import { BackToOverview } from "@/components/assessment/BackToOverview";
import { REFERENCE_DATE_LABEL, getTimeHorizon } from "@/config/reference";
import { useSession } from "@/session/useSession";
import { useAssessmentRuns } from "@/services/assessment/useAssessmentRuns";

/**
 * Simulation Register — the department's scenario register. Completed runs are
 * listed first with their modelled result and open to their assessment; the
 * prepared drafts follow with an explicit status. Every figure shown is real
 * (a count or a modelled result), never a fabricated approval number.
 */
export default function Simulations() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const { runs } = useAssessmentRuns(session?.departmentId ?? null);

  if (!department) return null;

  const drafts = department.policyTemplates;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      {/* The owner's instruction (2026-10-02): one "← Back", always to the Overview. */}
      <BackToOverview />
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Simulation Register</h2>
        <p className="text-xs text-muted-foreground">
          {department.name} · {drafts.length} prepared drafts · {runs.length}{" "}
          {runs.length === 1 ? "run" : "runs"}
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          {runs.length > 0
            ? `Completed runs for this department are listed first; each opens to its executive summary. The ${VOCABULARY.simulationCore} is deterministic, so re-running identical inputs reproduces the same result.`
            : `No simulation has been run for this department yet. Each row below is a policy draft prepared for the ${VOCABULARY.simulationCore}; results appear in this register once a draft is run.`}
        </p>
        {runs.length > 0 && (
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Each run is one version of the department's policy. A draft taken back through the{" "}
            {VOCABULARY.simulationCore} is recorded as the next version, labelled beside its
            reference.
          </p>
        )}
        {runs.length >= 2 && (
          <p className="mt-2">
            <Link
              to={`/app/compare/${encodeURIComponent(runs[1].id)}/${encodeURIComponent(runs[0].id)}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Compare the two most recent runs →
            </Link>
          </p>
        )}
      </header>

      {runs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Completed runs
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {["Reference", "Policy", "Horizon", "Stakeholders", "Result", "Status"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b transition-colors duration-100 last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono font-medium text-primary">
                    {run.reference}
                    <RevisionBadge runId={run.id} className="ml-2 align-middle font-sans" />
                  </td>
                  <td className="max-w-xs truncate px-3 py-1.5 text-foreground">{run.policyTitle}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{run.horizonLabel}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-foreground">{run.reactions.length}</td>
                  <td className="px-3 py-1.5 font-mono text-foreground">{run.confidence}%</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/assessments/${encodeURIComponent(run.id)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:underline"
                      >
                        Complete
                      </Link>
                      {/* Item 6 — every completed run row can be taken back to the policy input
                          with its own inputs loaded. A prepared draft is not yet a run, so it
                          is not re-run from here. */}
                      <ReRunSimulationLink
                        runId={run.id}
                        className="inline-flex items-center rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Prepared drafts
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {["Reference", "Policy", "Horizon", "Stakeholders", "Status"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, index) => (
              <tr key={draft.id} className="border-b transition-colors duration-100 last:border-0 hover:bg-muted/30">
                <td className="px-3 py-1.5 font-mono font-medium text-primary">
                  {`${department.abbr}-${String(index + 1).padStart(2, "0")}`}
                </td>
                <td className="max-w-xs truncate px-3 py-1.5 text-foreground">{draft.title}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                  {getTimeHorizon(draft.timeHorizon).label}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-foreground">{draft.segments.length}</td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Draft
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Reference date {REFERENCE_DATE_LABEL}.{" "}
        <Link to="/app/policies" className="font-medium text-primary hover:underline">
          Review the policy register →
        </Link>
      </p>
    </div>
  );
}

