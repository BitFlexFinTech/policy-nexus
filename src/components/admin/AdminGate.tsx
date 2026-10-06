import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";
import { ADMIN_ROUTE } from "@/config/platform";
import { ADMIN_GUARD_STATEMENT } from "@/session/adminAccess";
import { adminAccessActions, useAdminAccess } from "@/session/useAdminAccess";

/**
 * The administrator gate for the platform administration screen.
 *
 * The screen holds the platform's connection settings, so before it is shown this asks one
 * plain question and remembers the answer for the browser tab. It is deliberately a plain
 * confirmation and the note says so in the platform's own words (`ADMIN_GUARD_STATEMENT`):
 * nothing here pretends to be real authorisation, which the funded server provides later.
 * The swap seam is described in `src/session/adminAccess.ts`.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const acknowledged = useAdminAccess();

  if (acknowledged) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-6">
        <header className="space-y-1 border-b pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Internal · not linked from any officer screen
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Administrator access
          </h1>
        </header>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {BRAND.productName} keeps its connection settings — the address and key each capability
          is reached with — on this screen. It is reached only by typing its address; nothing links
          to it.
        </p>

        <section className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
          <strong className="font-semibold">Are you the administrator?</strong> This asks for a
          plain confirmation before it will show the settings.
          <p className="mt-2 text-muted-foreground">{ADMIN_GUARD_STATEMENT}</p>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={adminAccessActions.acknowledgeAdministrator}
          >
            Yes, I am the administrator
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
            <Link to="/">Leave this screen</Link>
          </Button>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          The confirmation lasts for this browser tab only; a new tab asks again. The address is{" "}
          <span className="font-mono text-foreground">{ADMIN_ROUTE}</span>.
        </p>
      </section>
    </div>
  );
}
