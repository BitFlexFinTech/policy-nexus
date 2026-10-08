import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PROMOTER } from "@/config/brand";
import { RESEARCH_SERVICE_NOTICE } from "@/config/research";
import { formatClock, useNow } from "@/lib/clock";
import { ZepariMasthead } from "@/components/zepari/ZepariMasthead";

/**
 * The shell for the ZEPARI research assistant's screens. Its own masthead, so the research product
 * is presented as ZEPARI's, not as the Nzwisiso department workspace — the two products share the
 * platform but must never read as one. It carries the promoter line and the copyright, exactly as
 * the public shell does, and the SAME status band the public pages wear, worded for the research
 * product (owner's instruction, 2026-10-07) — see `RESEARCH_SERVICE_NOTICE`.
 *
 * The root carries the `.zepari` scope, so the research side wears ZEPARI's own blue + gold and the
 * department side's emerald palette is untouched.
 */
export function ResearchShell({ children }: { children: ReactNode }) {
  return (
    <div className="zepari flex min-h-screen flex-col bg-zp-canvas text-zp-ink">
      <ZepariMasthead>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zp-navy underline-offset-4 hover:underline"
        >
          ← Back to home
        </Link>
      </ZepariMasthead>

      <ResearchServiceNotice />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-zp-line bg-zp-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-center text-[10px] leading-relaxed text-zp-ink-muted">{PROMOTER.line}</p>
          <p className="mt-1 text-center text-[10px] leading-relaxed text-zp-ink-muted">
            {PROMOTER.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * THE ZEPARI STATUS BAND — the same band the home page and the policy tool's page wear, worded for
 * the research product (owner's instruction, 2026-10-07: the ZEPARI page was the only landing page
 * without it). It sits directly under the institute's masthead and is drawn in ZEPARI's OWN light
 * blue-and-gold, never in the department's green/gold or the home page's black.
 *
 * The live date is hidden on the narrowest phones only, exactly as the department band does, so the
 * landing page's primary action stays on a phone's first screen. There is no fiscal-year line: see
 * `RESEARCH_SERVICE_NOTICE` for why. The words themselves are NOT written here — they come from
 * `src/config/research.ts`, so the two bands can never be swapped by accident.
 */
function ResearchServiceNotice() {
  const now = useNow();
  return (
    <div data-testid="research-notice-strip" className="border-b border-zp-line bg-zp-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:px-6">
        <span className="rounded-sm border border-zp-navy/30 bg-card px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zp-navy">
          {RESEARCH_SERVICE_NOTICE.badge}
        </span>
        <span className="text-xs leading-relaxed text-zp-ink-muted">{RESEARCH_SERVICE_NOTICE.body}</span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wide text-zp-ink-muted">
          <span className="hidden sm:inline">
            Today <span className="font-semibold text-zp-ink">{formatClock(now)}</span>
          </span>
        </span>
      </div>
    </div>
  );
}