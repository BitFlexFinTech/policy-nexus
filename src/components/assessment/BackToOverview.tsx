import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one "← Back" control.
 *
 * The owner's instruction (2026-10-02): a back control must exist on every screen a run opens to,
 * and it always returns to the Overview page (the workspace hub). It is defined once and used by
 * every screen that needs it, so the destination cannot differ from screen to screen — and
 * `src/test/journey.test.tsx` fails if a screen loses it.
 *
 * The visible word is "Back" — the owner's wording — and it is also the accessible name, so it
 * never collides with the "Overview" link in the workspace navigation (both lead to the same
 * page, and two links with names that overlap would be ambiguous for a screen reader and for a
 * test). The title says where it goes for anyone hovering.
 */
export function BackToOverview({ className }: { className?: string }) {
  return (
    <Link
      to="/app"
      title="Back to the Overview"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Back
    </Link>
  );
}