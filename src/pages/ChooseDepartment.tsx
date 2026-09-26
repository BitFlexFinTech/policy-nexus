import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartmentGrid } from "@/components/departments/DepartmentGrid";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { findDepartment, type DepartmentId } from "@/config/departments";
import { sessionActions, useSession } from "@/session/useSession";

/**
 * Choose your Department — the public department chooser at `/start`.
 *
 * This is the ONLY way into the workspace: choosing a department signs the user
 * in (one-click, Mock) and opens `/app`. The choice is stored in the session, so
 * it survives navigation and a reload. It is deliberately a separate screen from
 * the landing page, which introduces the platform and holds no picker.
 */
export default function ChooseDepartment() {
  const navigate = useNavigate();
  const session = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const selectedId = pendingId ?? session?.departmentId ?? null;
  const selectedDepartment = findDepartment(selectedId ?? undefined);

  const enterWorkspace = (departmentId: DepartmentId) => {
    const created = sessionActions.signInToDepartment(departmentId);
    if (!created) return;
    navigate("/app");
  };

  return (
    <PublicPageShell>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Overview
      </Link>

      <section
        aria-labelledby="choose-heading"
        className="mt-4 rounded-lg border bg-card p-5 sm:p-6"
      >
        <h1
          id="choose-heading"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Choose your Department
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Choose the department whose policy you are preparing. Its reference indicators, prepared
          drafts and documents are loaded into the workspace, and you can change department at any
          time. The {VOCABULARY.simulationCore} is deterministic, so the same inputs always reproduce
          the same result.
        </p>

        {session && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Department session active
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {findDepartment(session.departmentId)?.name}
              </span>
            </div>
            <Button size="sm" onClick={() => navigate("/app")}>
              Continue to workspace
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="mb-3 mt-5 flex items-baseline justify-between gap-3 border-b pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select a department
          </h2>
          <span className="text-xs text-muted-foreground">
            {selectedDepartment ? `Selected: ${selectedDepartment.name}` : "No department selected"}
          </span>
        </div>

        <DepartmentGrid selectedId={selectedId} onSelect={setPendingId} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="max-w-2xl text-[10px] leading-relaxed text-muted-foreground">
            {DISCLAIMER.short}
          </p>
          <Button
            disabled={!selectedDepartment}
            onClick={() => selectedDepartment && enterWorkspace(selectedDepartment.id)}
          >
            Enter {selectedDepartment ? selectedDepartment.shortName : "workspace"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </PublicPageShell>
  );
}
