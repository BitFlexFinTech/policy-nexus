import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ResearchHeader } from "@/components/research/ResearchHeader";
import { ResearchNav } from "@/components/research/ResearchNav";
import { PROMOTER } from "@/config/brand";
import { seedResearchSample } from "@/services/research/researchSample";

/**
 * The ONE research workspace shell. Every `/research/app/**` screen renders inside it, so the header,
 * the section navigation and the promoter line exist once. It mirrors the department workspace shell
 * (`h-screen` + `flex-col` + `overflow-hidden`) so the two products share one rhythm but keep their
 * own identity. The demonstration sample is seeded on first open, so the workspace is never empty.
 */
export function ResearchWorkspaceLayout() {
  useEffect(() => {
    seedResearchSample();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <ResearchHeader />
      <ResearchNav />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>
      <footer className="flex items-center justify-center border-t bg-primary px-4 py-2">
        <span className="text-center text-[10px] tracking-wide text-primary-foreground/80">
          {PROMOTER.line}
        </span>
      </footer>
    </div>
  );
}