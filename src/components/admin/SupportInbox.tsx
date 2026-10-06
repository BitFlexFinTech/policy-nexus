import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatInstant } from "@/lib/clock";
import { findDepartment } from "@/config/departments";
import {
  SUPPORT_STATUSES,
  SUPPORT_STATUS_LABELS,
  type SupportStatus,
} from "@/config/support";
import { supportCaseActions, useSupportCases } from "@/services/support/useSupportCases";
import type { SupportCase } from "@/services/support/supportStore";

/**
 * One case, with the two things an administrator does to it: set its state, and delegate it
 * to a support representative. The representative's name is committed when the field loses
 * focus or Enter is pressed, so typing is not interrupted by a save on every keystroke.
 */
function CaseRow({ entry }: { entry: SupportCase }) {
  const department = findDepartment(entry.departmentId);
  const [assignee, setAssignee] = useState(entry.assignee ?? "");

  useEffect(() => {
    setAssignee(entry.assignee ?? "");
  }, [entry.assignee]);

  const commitAssignee = () => {
    if ((entry.assignee ?? "") !== assignee.trim()) {
      supportCaseActions.assignSupportCase(entry.id, assignee);
    }
  };

  return (
    <li className="grid gap-2 border-b py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">
          <span className="font-mono text-[10px] text-muted-foreground">{entry.id}</span>{" "}
          · {entry.subject}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {department?.name ?? entry.departmentId} · {entry.category} · opened{" "}
          {formatInstant(entry.openedAt)}
          {entry.openedBy ? ` by ${entry.openedBy}` : ""}
          {entry.assignee ? ` · delegated to ${entry.assignee}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={entry.status}
          onValueChange={(value) =>
            supportCaseActions.setSupportCaseStatus(entry.id, value as SupportStatus)
          }
        >
          <SelectTrigger aria-label={`Status for ${entry.id}`} className="h-7 w-32 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {SUPPORT_STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          onBlur={commitAssignee}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitAssignee();
          }}
          placeholder="Assign to a representative"
          aria-label={`Assign ${entry.id}`}
          className="h-7 w-44 text-[10px]"
        />
      </div>
    </li>
  );
}

/**
 * The support inbox on the administration screen: every case, newest first, with its state
 * and the representative it is delegated to. It reads the support seam — today the SIMULATED
 * desk — and says so plainly at the top, so no administrator mistakes a local case for one
 * another machine can see.
 */
export function SupportInbox({ limitation }: { limitation: string }) {
  const cases = useSupportCases();

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-tight text-foreground">
          Support inbox ({cases.length})
        </h2>
      </header>
      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{limitation}</p>

      {cases.length === 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          No cases yet. An officer opens one from the Support screen in the workspace.
        </p>
      ) : (
        <ul className="mt-2">
          {cases.map((entry) => (
            <CaseRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
