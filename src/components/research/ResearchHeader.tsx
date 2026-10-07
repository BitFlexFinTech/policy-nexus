import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ZepariMasthead } from "@/components/zepari/ZepariMasthead";
import { researchSessionActions, useResearchSession } from "@/session/useResearchSession";

/**
 * The research workspace header. It carries the institute's identity (the light ZEPARI masthead),
 * who is signed in, the one-click entry marker (mock-first rule), and the way out — so a researcher
 * is always oriented and can always leave, from wherever they are in the workspace.
 */
export function ResearchHeader() {
  const session = useResearchSession();
  const navigate = useNavigate();

  const leave = () => {
    researchSessionActions.clearResearchSession();
    navigate("/research");
  };

  return (
    <ZepariMasthead>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {session && (
          <span className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wide text-zp-ink-muted">Signed in</span>
            <span className="text-xs font-medium text-zp-navy">{session.name}</span>
          </span>
        )}
        <span className="rounded border border-zp-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zp-ink-muted">
          Entry: one-click (Mock)
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px] uppercase tracking-wide"
          onClick={leave}
        >
          Leave
        </Button>
      </div>
    </ZepariMasthead>
  );
}