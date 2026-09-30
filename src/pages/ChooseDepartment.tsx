import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DepartmentGrid } from "@/components/departments/DepartmentGrid";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { OFFICER_SELF_DECLARED_NOTE, cleanOfficer } from "@/config/officer";
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
  /**
   * Item 1 — the paper trail. The officer's own name and post, kept in the session so every
   * document they prepare names them. Held here as draft input as well, because the fields
   * are filled in BEFORE a session exists: whatever is typed is stored the moment the
   * officer enters a department.
   */
  const [officerDraft, setOfficerDraft] = useState({
    firstName: "",
    surname: "",
    position: "",
  });

  const selectedId = pendingId ?? session?.departmentId ?? null;
  const selectedDepartment = findDepartment(selectedId ?? undefined);

  const recordedOfficer = session?.officer;
  const shownOfficer = {
    firstName: recordedOfficer?.firstName ?? officerDraft.firstName,
    surname: recordedOfficer?.surname ?? officerDraft.surname,
    position: recordedOfficer?.position ?? officerDraft.position,
  };

  /** Write one field through to the session when there is one, and keep it for entry. */
  const changeOfficer = (key: "firstName" | "surname" | "position", value: string) => {
    const next = { ...shownOfficer, [key]: value };
    setOfficerDraft(next);
    if (session) sessionActions.setOfficer(next);
  };

  const enterWorkspace = (departmentId: DepartmentId) => {
    const created = sessionActions.signInToDepartment(departmentId);
    if (!created) return;
    // The name typed before entering is recorded now, so the paper trail starts with the
    // first document rather than the second.
    if (cleanOfficer(shownOfficer)) sessionActions.setOfficer(shownOfficer);
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

        {/* Item 1 — the paper trail starts at entry, because the drafted policy names the
            person who prepared it. Nothing here is required: an officer can enter with the
            fields empty, and the document then names the department instead. */}
        <div className="mt-5 rounded-md border bg-background p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Prepared by — paper trail
            </span>
            {session?.officer && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() => sessionActions.clearOfficer()}
              >
                Clear name
              </Button>
            )}
          </div>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-muted-foreground">
            Recorded on every policy you prepare here, so a reviewer can see who drafted a document.{" "}
            {OFFICER_SELF_DECLARED_NOTE}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(
              [
                { key: "firstName", label: "First name", placeholder: "e.g. Tendai" },
                { key: "surname", label: "Surname", placeholder: "e.g. Moyo" },
                { key: "position", label: "Position", placeholder: "e.g. Director, Policy Development" },
              ] as const
            ).map((field) => (
              <label key={field.key} className="block">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </span>
                <Input
                  value={shownOfficer[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) => changeOfficer(field.key, event.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </label>
            ))}
          </div>
        </div>

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
