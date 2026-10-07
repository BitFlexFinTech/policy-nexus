import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PROMOTER } from "@/config/brand";
import { RESEARCH_INSTITUTION, RESEARCH_NAME } from "@/config/research";

/**
 * The shell for the ZEPARI research assistant's screens. Its own masthead, so the research product
 * is presented as ZEPARI's, not as the Nzwisiso department workspace — the two products share the
 * platform but must never read as one. It carries the promoter line, exactly as the public shell does.
 */
export function ResearchShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
              {RESEARCH_INSTITUTION}
            </span>
            <span className="text-base font-semibold leading-tight tracking-tight">
              {RESEARCH_NAME}
            </span>
          </div>
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/75 underline-offset-4 hover:underline"
          >
            All services
          </Link>
        </div>
        <div className="h-[3px] w-full bg-gold" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-[10px] leading-relaxed text-primary-foreground/75">{PROMOTER.line}</p>
        </div>
      </footer>
    </div>
  );
}