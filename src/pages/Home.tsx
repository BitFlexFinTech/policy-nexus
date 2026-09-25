import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartmentGrid } from "@/components/departments/DepartmentGrid";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT } from "@/config/brand";
import { REFERENCE_DATE_LABEL, REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { findDepartment, type DepartmentId } from "@/config/departments";
import { sessionActions, useSession } from "@/session/useSession";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

/**
 * Public entry screen. Selecting a department enters the workspace for it; the
 * choice is stored in the session, so it survives navigation and reload.
 */
const Home = () => {
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-primary px-4 py-2">
        <div className="flex items-center gap-3">
          <img src={coatOfArms} alt="Zimbabwe Coat of Arms" className="h-8 w-8 object-contain" />
          <h1 className="text-sm font-semibold tracking-tight text-primary-foreground">
            {BRAND.name}
          </h1>
          <span className="hidden text-xs text-primary-foreground/70 sm:inline">
            {BRAND.productName}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-primary-foreground/70">
          {BRAND.entity}
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 border-b pb-6">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            National policy simulation workspace
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {BRAND.tagline}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {BRAND.summary} Bring a policy draft, and the{" "}
            <span className="font-medium text-foreground">simulation core</span> models how
            stakeholder groups respond, what the fiscal and currency effects look like, and where
            the risks sit — before the measure is finalised.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>
              Reference date: <span className="font-semibold text-foreground">{REFERENCE_DATE_LABEL}</span>
            </span>
            <span>
              Fiscal year: <span className="font-semibold text-foreground">{REFERENCE_FISCAL_YEAR}</span>
            </span>
            <span>
              Departments: <span className="font-semibold text-foreground">16</span>
            </span>
          </div>
        </div>

        {session && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
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

        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select a department
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedDepartment ? `Selected: ${selectedDepartment.name}` : "No department selected"}
          </span>
        </div>

        <DepartmentGrid selectedId={selectedId} onSelect={setPendingId} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
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
      </main>

      <footer className="border-t bg-primary px-4 py-2">
        <p className="text-center text-[10px] leading-relaxed tracking-wide text-primary-foreground/80">
          {SOVEREIGNTY_STATEMENT}
        </p>
      </footer>
    </div>
  );
};

export default Home;