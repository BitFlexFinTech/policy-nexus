import { formatInstant } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { findDepartment } from "@/config/departments";
import { SUPPORT_DESK_LIMITATION, SUPPORT_STATUS_LABELS, type SupportStatus } from "@/config/support";
import { useSession } from "@/session/useSession";
import { useSupportCases } from "@/services/support/useSupportCases";
import { OpenCaseForm } from "@/components/support/OpenCaseForm";

const STATUS_CLASS: Record<SupportStatus, string> = {
  open: "bg-warning/15 text-warning",
  "in-progress": "bg-primary/10 text-primary",
  resolved: "bg-success/15 text-success",
};

function StatusPill({ status }: { status: SupportStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_CLASS[status],
      )}
    >
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * The officer's support screen. It opens a case and lists the cases opened for this
 * department. It uses the support seam — today the SIMULATED desk — so the honest limit is
 * stated at the top: cases are kept in this browser only until the support server exists.
 */
export default function Support() {
  const session = useSession();
  const cases = useSupportCases();
  const department = session ? findDepartment(session.departmentId) : undefined;
  const mine = department ? cases.filter((entry) => entry.departmentId === department.id) : [];

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="space-y-1 border-b pb-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Support
          </h1>
          <p className="text-xs text-muted-foreground">
            {department
              ? `Support cases for ${department.name}.`
              : "Support cases for this department."}
          </p>
        </header>

        <section className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
          {SUPPORT_DESK_LIMITATION}
        </section>

        <OpenCaseForm />

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-semibold tracking-tight text-foreground">
            Cases opened here ({mine.length})
          </h2>
          {mine.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              No cases opened for this department yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y">
              {mine.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      <span className="font-mono text-[10px] text-muted-foreground">{entry.id}</span>
                      {" · "}
                      {entry.subject}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.category} · opened {formatInstant(entry.openedAt)}
                      {entry.assignee ? ` · with ${entry.assignee}` : ""}
                    </p>
                  </div>
                  <StatusPill status={entry.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
