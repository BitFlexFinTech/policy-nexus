import { cn } from "@/lib/utils";
import { revisionNumber } from "@/services/assessment/revision";

/**
 * The version label for one run. A first run carries none — a "Version 1" on every
 * screen would be noise — and a re-run says which version it is.
 *
 * The number is derived from the run's own lineage (`revisionNumber`), so a badge can
 * never disagree with the register it sits in.
 */
export function RevisionBadge({ runId, className }: { runId: string; className?: string }) {
  const revision = revisionNumber(runId);
  if (revision < 2) return null;

  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground",
        className,
      )}
    >
      Version {revision}
    </span>
  );
}
