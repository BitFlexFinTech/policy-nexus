import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ResearchShell } from "@/components/research/ResearchShell";
import { RESEARCH_CONFIDENTIALITY, RESEARCH_NAME, RESEARCH_PARTS } from "@/config/research";
import { ResearchLibraryPanel } from "@/components/research/ResearchLibraryPanel";
import { ResearchDataSourcesPanel } from "@/components/research/ResearchDataSourcesPanel";
import { researchSessionActions, useResearchSession } from "@/session/useResearchSession";

/**
 * The ZEPARI research assistant's workspace home at `/research/app`, reached only with a research
 * session. It states who is signed in, repeats the confidentiality promise, and lists the parts the
 * assistant will hold with their HONEST status — nothing here is presented as built before it is.
 */
export default function ResearchWorkspace() {
  const navigate = useNavigate();
  const session = useResearchSession();

  const leave = () => {
    researchSessionActions.clearResearchSession();
    navigate("/research");
  };

  return (
    <ResearchShell>
      <section aria-labelledby="research-workspace-heading" className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Research workspace
        </p>
        <h1
          id="research-workspace-heading"
          className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {RESEARCH_NAME}
        </h1>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Signed in
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {session?.name} — {session?.role}
          </span>
          <span className="text-[10px] text-muted-foreground">Entry: one-click (Mock)</span>
        </div>
        <Button size="sm" variant="outline" onClick={leave}>
          Leave the research assistant
        </Button>
      </section>

      <section aria-labelledby="research-workspace-confidentiality" className="mt-6 rounded-lg border bg-card p-5 sm:p-6">
        <h2
          id="research-workspace-confidentiality"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          {RESEARCH_CONFIDENTIALITY.heading}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
          {RESEARCH_CONFIDENTIALITY.body}
        </p>
      </section>

      <div className="mt-6">
        <ResearchLibraryPanel />
      </div>

      <div className="mt-6">
        <ResearchDataSourcesPanel />
      </div>

      <section aria-labelledby="research-workspace-parts" className="mt-6 rounded-lg border bg-card p-5 sm:p-6">
        <h2
          id="research-workspace-parts"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          What this assistant will hold
        </h2>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          The research tools are being built one at a time. Each is shown with its real status, so
          nothing here is presented as finished before it is.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {RESEARCH_PARTS.map((part) => (
            <li key={part.id} className="rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {part.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {part.built ? "Ready" : "Not built yet"}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{part.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </ResearchShell>
  );
}