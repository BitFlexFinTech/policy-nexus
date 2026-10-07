import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchShell } from "@/components/research/ResearchShell";
import {
  RESEARCH_BILLING,
  RESEARCH_BOUNDARY,
  RESEARCH_CONFIDENTIALITY,
  RESEARCH_NAME,
  RESEARCH_PURPOSE,
  RESEARCHERS,
} from "@/config/research";
import { researchSessionActions, useResearchSession } from "@/session/useResearchSession";

/**
 * The ZEPARI research assistant's landing page at `/research`.
 *
 * It states what the research assistant is, the confidentiality promise, who pays for the AI usage,
 * and the boundary between the two products — and it carries the TWO one-click entries (Dr. Gibson
 * Chigumira and Dr. Jesimen Chipika). One-click entry is the simulated mode this demonstration
 * ships with; a real sign-in replaces it behind the same seam.
 */
export default function ResearchLanding() {
  const navigate = useNavigate();
  const session = useResearchSession();

  const enter = (researcherId: string) => {
    const created = researchSessionActions.signInResearcher(researcherId);
    if (!created) return;
    navigate("/research/app");
  };

  return (
    <ResearchShell>
      <section aria-labelledby="research-heading" className="max-w-3xl">
        <h1
          id="research-heading"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {RESEARCH_NAME}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{RESEARCH_PURPOSE}</p>
      </section>

      <section aria-labelledby="research-entry-heading" className="mt-6 rounded-lg border bg-card p-5 sm:p-6">
        <h2
          id="research-entry-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Enter the research assistant
        </h2>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          One-click entry, for this demonstration. Choosing a name opens the research assistant for
          that researcher; a real sign-in replaces it when the institute's identity provider is connected.
        </p>

        {session && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Signed in
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {session.name} — {session.role}
              </span>
            </div>
            <Button size="sm" onClick={() => navigate("/research/app")}>
              Continue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {RESEARCHERS.map((researcher) => (
            <li key={researcher.id} className="rounded-md border bg-background p-4">
              <p className="text-sm font-semibold tracking-tight text-foreground">{researcher.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{researcher.role}</p>
              <Button size="sm" className="mt-3" onClick={() => enter(researcher.id)}>
                Enter as {researcher.name}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="research-confidentiality-heading" className="mt-6 rounded-lg border bg-card p-5 sm:p-6">
        <h2
          id="research-confidentiality-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          {RESEARCH_CONFIDENTIALITY.heading}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
          {RESEARCH_CONFIDENTIALITY.body}
        </p>
        <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          {RESEARCH_BILLING}
        </p>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          {RESEARCH_BOUNDARY}
        </p>
      </section>
    </ResearchShell>
  );
}