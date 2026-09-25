import { findDepartment } from "@/config/departments";
import { getStakeholderSegment, getTimeHorizon } from "@/config/reference";
import { useSession } from "@/session/useSession";

/**
 * Policy Register — the signed-in department's prepared policy drafts, with the
 * horizon and the stakeholder groups each one touches. Read-only: drafting and
 * running happen from the workspace and the simulation register.
 */
export default function Policies() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

  if (!department) return null;

  const drafts = department.policyTemplates;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Policy Register</h2>
        <p className="text-xs text-muted-foreground">
          {department.name} · {drafts.length} prepared drafts
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{department.mandate}</p>
      </header>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <article key={draft.id} className="rounded-lg border bg-card p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold text-foreground">{draft.title}</h3>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {getTimeHorizon(draft.timeHorizon).label}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{draft.summary}</p>
            <p className="font-mono-code mt-2 whitespace-pre-wrap rounded-md border bg-background p-3 text-[11px] leading-relaxed text-foreground">
              {draft.policyText}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {draft.segments.map((segmentId) => (
                <span key={segmentId} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {getStakeholderSegment(segmentId).label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
