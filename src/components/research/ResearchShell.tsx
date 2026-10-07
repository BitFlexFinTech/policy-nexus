import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PROMOTER } from "@/config/brand";
import { ZepariMasthead } from "@/components/zepari/ZepariMasthead";

/**
 * The shell for the ZEPARI research assistant's screens. Its own masthead, so the research product
 * is presented as ZEPARI's, not as the Nzwisiso department workspace — the two products share the
 * platform but must never read as one. It carries the promoter line and the copyright, exactly as
 * the public shell does.
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