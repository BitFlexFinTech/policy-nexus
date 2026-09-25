import { Link } from "react-router-dom";
import { findDepartment } from "@/config/departments";
import { REFERENCE_DATE_LABEL, getTimeHorizon } from "@/config/reference";
import { useSession } from "@/session/useSession";
import { useAssessmentRuns } from "@/services/assessment/useAssessmentRuns";

/**
 * Simulation history for the signed-in department. Once a draft has been run it
 * appears here with its real modelled result and opens to its assessment; until
 * then the department's prepared drafts are listed with an explicit 0-run state
 * and no fabricated figure.
 */
export function HistoryTable() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const runs = useAssessmentRuns(session?.departmentId ?? null);

  if (!department) return null;

  const drafts = department.policyTemplates;

  return (
    <div className="flex flex-col border-t bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulation History</span>
        <span className="text-xs text-muted-foreground">
          {runs.length} {runs.length === 1 ? "run" : "runs"} · {drafts.length} prepared drafts
        </span>
      </div>
      <div className="overflow-x-auto">
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
            {runs.length > 0
              ? runs.map((run) => (
                  <tr key={run.id} className="border-b transition-colors duration-100 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono font-medium text-primary">{run.reference}</td>
                    <td className="max-w-xs truncate px-3 py-1.5 text-foreground">{run.policyTitle}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{run.horizonLabel}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">{run.reactions.length}</td>
                    <td className="px-3 py-1.5 font-mono text-foreground">{run.confidence}%</td>
                    <td className="px-3 py-1.5">
                      <Link
                        to={`/app/assessments/${encodeURIComponent(run.id)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:underline"
                      >
                        Complete
                      </Link>
                    </td>
                  </tr>
                ))
              : drafts.map((draft, index) => (
                  <tr key={draft.id} className="border-b transition-colors duration-100 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono font-medium text-primary">
                      {`${department.abbr}-${String(index + 1).padStart(2, "0")}`}
                    </td>
                    <td className="max-w-xs truncate px-3 py-1.5 text-foreground">{draft.title}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                      {getTimeHorizon(draft.timeHorizon).label}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">{draft.segments.length}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">—</td>
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
      <div className="flex flex-wrap items-center justify-between gap-1 border-t px-4 py-2">
        <span className="text-[10px] text-muted-foreground">
          {runs.length > 0
            ? `Result shown is the modelled composite confidence of the latest run. Reference date ${REFERENCE_DATE_LABEL}.`
            : `No simulation has been run for ${department.shortName} yet. Reference date ${REFERENCE_DATE_LABEL}.`}
        </span>
        <Link to="/app/simulations" className="text-[10px] font-medium text-primary hover:underline">
          Open the simulation register →
        </Link>
      </div>
    </div>
  );
}
