import { useNavigate } from "react-router-dom";
import { StatusPill } from "./StatusPill";
import { Button } from "@/components/ui/button";
import { findDepartment } from "@/config/departments";
import { sessionActions, useSession } from "@/session/useSession";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

/**
 * Workspace header. Reads the department session directly so the workspace is
 * always visibly labelled with the department it belongs to, and so the user can
 * leave or switch department from wherever they are in the workspace.
 *
 * Signed out, this renders exactly what it rendered before the session existed.
 */
export function HeaderBar() {
  const session = useSession();
  const navigate = useNavigate();
  const department = findDepartment(session?.departmentId);

  const signOut = () => {
    sessionActions.clearSession();
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between border-b bg-primary px-4 py-2">
      <div className="flex items-center gap-3">
        <img src={coatOfArms} alt="Zimbabwe Coat of Arms" className="h-8 w-8 object-contain" />
        <h1 className="text-sm font-semibold tracking-tight text-primary-foreground">
          Nzwisiso<span className="text-gold"> AI</span>
        </h1>
        {department ? (
          <>
            <span className="rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              {department.abbr}
            </span>
            <span className="hidden max-w-[46ch] truncate text-xs text-primary-foreground/70 xl:inline">
              {department.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-primary-foreground/70">National Policy Dashboard</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusPill label="OASIS Engine" status="online" value="Ready" />
        <StatusPill label="GraphRAG" status="online" value="128 nodes" />
        <StatusPill label="ZiG Rate" status="warning" value="13.56/USD" />
        {department && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-wide"
              onClick={() => navigate("/")}
            >
              Change department
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-wide"
              onClick={signOut}
            >
              Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
