import { Link } from "react-router-dom";
import { findDepartment } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
import { REFERENCE_DATE_LABEL, getTimeHorizon } from "@/config/reference";
import { useSession } from "@/session/useSession";

/**
 * Simulation Register — the department's scenario register. No simulation has
 * been run yet in scenario mode, so this is an explicit empty state plus the
 * register of prepared drafts. It never shows a fabricated result figure.
 */
export default function Simulations() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

  if (!department) return null;

  const drafts = department.policyTemplates;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Simulation Register</h2>
        <p className="text-xs text-muted-foreground">
          {department.name} · {drafts.length} prepared drafts · 0 runs
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          No simulation has been run for this department yet. Each row below is a policy draft prepared for the{" "}
          {VOCABULARY.simulationCore}; results appear in this register once a draft is run.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border bg-card">
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
