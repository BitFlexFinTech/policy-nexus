import type { ReactNode } from "react";
import { ZepariMark } from "@/components/zepari/ZepariMark";
import { RESEARCH_INSTITUTION, RESEARCH_NAME } from "@/config/research";

/**
 * THE ZEPARI MASTHEAD — a LIGHT header, the way the institute itself presents its identity.
 *
 * The owner's item 3 (2026-10-07): the logo "looks cheap" because a small 230×49 raster was being
 * enlarged on a dark bar. This masthead instead sets the mark at its real size on a light surface,
 * with the institute's name in navy beside it, and a thin gold rule beneath — exactly the register
 * zepari.co.zw uses. It is defined ONCE and worn by both research shells, so the landing page and
 * the workspace can never drift apart.
 *
 * `children` is the right-hand slot: the landing shell puts the "All services" way out there, and
 * the workspace header puts the signed-in researcher, the one-click marker and the way out.
 */
export function ZepariMasthead({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-zp-line bg-zp-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <ZepariMark className="h-8 shrink-0" />
          <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-zp-line sm:block" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-zp-ink-muted">
              {RESEARCH_INSTITUTION}
            </span>
            <span className="truncate text-sm font-semibold leading-tight tracking-tight text-zp-navy sm:text-base">
              {RESEARCH_NAME}
            </span>
          </div>
        </div>
        {children}
      </div>
      {/* The institute's own gold rule, drawn beneath the identity. */}
      <div aria-hidden="true" className="h-[2px] w-full bg-zp-gold" />
    </header>
  );
}
