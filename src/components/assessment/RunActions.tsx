import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ReRunSimulationLink } from "./ReRunSimulationLink";
import { draftingPathFor } from "./draftingStageConfig";

/**
 * The five actions that follow a completed run, defined ONCE.
 *
 * The owner's instruction (2026-10-02): these actions must appear at the TOP of the run page as
 * well as at the bottom, so an officer does not have to scroll to the end of a long run to open
 * the paperwork. Two rows written out separately would drift apart, so both rows render this one
 * component, and the browser test asserts that BOTH are present.
 */
export function RunActions({ runId, className }: { runId: string; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <Button asChild size="sm" className="h-7 text-xs">
        <Link to={`/app/assessments/${encodeURIComponent(runId)}`}>Open executive summary</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
        <Link to={`/app/assessments/${encodeURIComponent(runId)}/report`}>Open full report</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
        <Link to={draftingPathFor(runId)}>Draft the policy</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
        <Link to="/app/simulations">Simulation register</Link>
      </Button>
      {/* Item 6 — take this run's own inputs back to the policy input, edit them and run
          again. Running them unchanged records the same run, not a duplicate. */}
      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
        <ReRunSimulationLink runId={runId} />
      </Button>
    </div>
  );
}