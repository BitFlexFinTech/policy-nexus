import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ZepariMark } from "@/components/zepari/ZepariMark";
import { RESEARCH_INSTITUTION, RESEARCH_NAME } from "@/config/research";
import { DESIGN_SECTIONS, type DesignSkin } from "./options";

/**
 * The shared frame for a design option: the institute's masthead and the section rail. It wears the
 * direction's own skin, so the three options read as three different products while sharing one
 * structure — which is what the owner is being asked to choose between.
 */
export function ConceptFrame({
  skin,
  active,
  children,
}: {
  skin: DesignSkin;
  active: string;
  children: ReactNode;
}) {
  const dark = skin === "terminal";

  return (
    <div
      className={cn(
        "zepari flex min-h-screen flex-col",
        dark ? "bg-zp-term-bg text-zp-term-text" : "bg-zp-canvas text-zp-ink",
      )}
    >
      <header className={dark ? "bg-zp-term-bg" : "bg-zp-navy text-white"}>
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <ZepariMark on={dark ? "dark" : "light"} />
            <span className={cn("hidden flex-col sm:flex", !dark && "text-white")}>
              <span className={cn("text-[10px] uppercase tracking-[0.18em]", dark ? "text-zp-term-muted" : "text-white/70")}>
                {RESEARCH_INSTITUTION}
              </span>
              <span className={cn("text-sm font-semibold tracking-tight", dark && "text-zp-term-text")}>
                {RESEARCH_NAME}
              </span>
            </span>
          </div>
          <nav className="flex items-center gap-4" aria-label="Design option">
            <Link
              to="/research/designs"
              className={cn(
                "text-[11px] uppercase tracking-[0.16em] underline-offset-4 hover:underline",
                dark ? "text-zp-term-muted" : "text-white/70",
              )}
            >
              All three options
            </Link>
            <Link
              to="/research"
              className={cn(
                "text-[11px] uppercase tracking-[0.16em] underline-offset-4 hover:underline",
                dark ? "text-zp-term-muted" : "text-white/70",
              )}
            >
              The live product
            </Link>
          </nav>
        </div>
        <div className="h-[3px] w-full bg-zp-gold-soft" />
      </header>

      <SectionRail skin={skin} active={active} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className={cn("border-t", dark ? "border-zp-term-line bg-zp-term-panel" : "border-zp-line bg-zp-surface")}>
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <p className={cn("text-[10px] leading-relaxed", dark ? "text-zp-term-muted" : "text-zp-ink-muted")}>
            A design option for ZEPARI's review — shown with the assistant's own demonstration sample. The
            research assistant and the policy-simulation engine are kept apart.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** The workspace's section rail, worn in the direction's skin. */
export function SectionRail({ skin, active }: { skin: DesignSkin; active: string }) {
  const dark = skin === "terminal";
  return (
    <nav
      aria-label="Research assistant sections"
      className={cn(
        "flex items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6",
        dark ? "bg-zp-term-panel" : "bg-zp-surface",
      )}
    >
      {DESIGN_SECTIONS.map((section) => {
        const isActive = section === active;
        return (
          <span
            key={section}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium",
              isActive
                ? dark
                  ? "bg-zp-blue/20 text-white"
                  : "bg-zp-blue/10 text-zp-navy"
                : dark
                  ? "text-zp-term-muted"
                  : "text-zp-ink-muted",
            )}
          >
            {section}
          </span>
        );
      })}
    </nav>
  );
}
