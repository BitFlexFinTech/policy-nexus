import { Link } from "react-router-dom";
import { RERUN_LABEL, rerunPathFor } from "@/services/assessment/rerun";

/**
 * The one "Re-run simulation" control, used by every surface that offers it: the
 * finished run, every completed-run row of the Simulation Register, and the four
 * document screens. Each caller styles it for where it sits, but all of them point
 * at the same address and carry the same words (owner's item 6).
 *
 * It is a plain link, not a running action: pressing it does not start a run. It
 * takes the officer back to the policy input with that run's inputs loaded, so they
 * edit and press Run themselves.
 */
export function ReRunSimulationLink({
  runId,
  className,
}: {
  runId: string;
  className?: string;
}) {
  return (
    <Link to={rerunPathFor(runId)} className={className}>
      {RERUN_LABEL}
    </Link>
  );
}
