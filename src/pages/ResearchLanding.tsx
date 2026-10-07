import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Link2,
  MessageSquareText,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchShell } from "@/components/research/ResearchShell";
import {
  RESEARCH_BILLING,
  RESEARCH_BOUNDARY,
  RESEARCH_CONFIDENTIALITY,
  RESEARCH_INSTITUTION,
  RESEARCH_NAME,
  RESEARCH_PURPOSE,
  RESEARCHERS,
} from "@/config/research";
import { researchSessionActions, useResearchSession } from "@/session/useResearchSession";

/** What the assistant does, one line each — the six parts, in the order a researcher meets them. */
const CAPABILITIES = [
  { icon: FileText, title: "Research library", body: "ZEPARI's own documents, kept on ZEPARI's servers." },
  { icon: Link2, title: "Data sources", body: "Figures read from the institute's own sources, each with its publisher." },
  { icon: MessageSquareText, title: "Grounded chat", body: "A question answered from the library, with the passages it used shown." },
  { icon: ClipboardCheck, title: "Policy brief", body: "A short brief drafted from the library, with its structure and sources." },
  { icon: TrendingUp, title: "Economic Barometer", body: "The institute's indicators tracked over time, every figure sourced." },
  { icon: Send, title: "Findings", body: "Findings routed to the departments they concern." },
] as const;

/**
 * The ZEPARI research assistant's landing page at `/research`.
 *
 * It introduces the product to ZEPARI, states the confidentiality promise, and carries the TWO
 * one-click entries (Dr. Gibson Chigumira and Dr. Jesimen Chipika). One-click entry is the simulated
 * mode this demonstration ships with; a real sign-in replaces it behind the same seam.
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
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Policy research assistant
          </p>
          <h1
            id="research-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {RESEARCH_NAME}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {RESEARCH_PURPOSE}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {RESEARCH_INSTITUTION}. A working demonstration, ready to open now — a small research
            library, a few cited figures and two findings are loaded so you can see how it works.
          </p>
          {session && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
              <span className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Signed in
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {session.name} — {session.role}
                </span>
              </span>
              <Button size="sm" onClick={() => navigate("/research/app")}>
                Continue
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <aside
          aria-labelledby="research-confidentiality-heading"
          className="rounded-xl border bg-primary-tint p-5"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2
              id="research-confidentiality-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
            >
              {RESEARCH_CONFIDENTIALITY.heading}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {RESEARCH_CONFIDENTIALITY.body}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{RESEARCH_BILLING}</p>
        </aside>
      </section>

      <section aria-labelledby="research-entry-heading" className="mt-10">
        <h2
          id="research-entry-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Enter the research assistant
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One-click entry, for this demonstration. Choosing a name opens the assistant for that
          researcher; a real sign-in replaces it when the institute's identity provider is connected.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {RESEARCHERS.map((researcher) => (
            <li
              key={researcher.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {researcher.name}
                </span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {researcher.role}
                </span>
              </span>
              <Button size="sm" className="shrink-0" onClick={() => enter(researcher.id)}>
                Enter as {researcher.name}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="research-what-heading" className="mt-10">
        <h2
          id="research-what-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          What the assistant does
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <li key={capability.title} className="rounded-lg border bg-card p-4">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="mt-2 block text-sm font-semibold tracking-tight text-foreground">
                  {capability.title}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                  {capability.body}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-10 border-t pt-5 text-[11px] leading-relaxed text-muted-foreground">
        {RESEARCH_BOUNDARY}
      </p>
    </ResearchShell>
  );
}