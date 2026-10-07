import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RESEARCH_INSTITUTION, RESEARCH_NAME } from "@/config/research";
import { researchSessionActions, useResearchSession } from "@/session/useResearchSession";

/**
 * The research workspace header. It carries the institute's identity, who is signed in, the
 * one-click entry marker (mock-first rule), and the way out — so a researcher is always oriented
 * and can always leave, from wherever they are in the workspace.
 */
export function ResearchHeader() {
  const session = useResearchSession();
  const navigate = useNavigate();

  const leave = () => {
    researchSessionActions.clearResearchSession();
    navigate("/research");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary px-4 py-2 text-primary-foreground">
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
          {RESEARCH_INSTITUTION}
        </span>
        <h1 className="truncate text-sm font-semibold tracking-tight">{RESEARCH_NAME}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {session && (
          <span className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wide text-primary-foreground/75">
              Signed in
            </span>
            <span className="text-xs font-medium">{session.name}</span>
          </span>
        )}
        <span className="rounded border border-primary-foreground/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground/75">
          Entry: one-click (Mock)
        </span>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-[10px] uppercase tracking-wide"
          onClick={leave}
        >
          Leave
        </Button>
      </div>
    </header>
  );
}