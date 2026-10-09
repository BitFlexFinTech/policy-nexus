import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, Link2, TrendingUp, Send, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESEARCH_CONFIDENTIALITY, RESEARCH_INSTITUTION, RESEARCH_NAME } from "@/config/research";
import {
  getResearchDocumentsServerSnapshot,
  getResearchDocumentsSnapshot,
  subscribeToResearchDocuments,
} from "@/services/research/researchDocuments";
import {
  getResearchDataSourcesServerSnapshot,
  getResearchDataSourcesSnapshot,
  subscribeToResearchDataSources,
} from "@/services/research/researchDataSources";
import {
  getResearchBarometerServerSnapshot,
  getResearchBarometerSnapshot,
  subscribeToResearchBarometer,
} from "@/services/research/researchBarometer";
import {
  getResearchFindingsServerSnapshot,
  getResearchFindingsSnapshot,
  subscribeToResearchFindings,
} from "@/services/research/researchFindings";
import { resetResearchSample } from "@/services/research/researchSample";

/** One "try this" step — a numbered action that opens the screen it describes. */
const STEPS: ReadonlyArray<{ to: string; title: string; body: string }> = [
  { to: "/research/app/library", title: "Read the library", body: "ZEPARI's own published documents — every publication on their Policy Briefs, Research Studies and Economic Barometer listings." },
  { to: "/research/app/ask", title: "Ask a question", body: "A question is matched to the library and answered from it, with the passages it used shown as sources." },
  { to: "/research/app/brief", title: "Draft a brief", body: "A short policy brief on a topic, drawn from the library, with its fixed structure and sources shown." },
];

const COUNT_ICON = { documents: FileText, sources: Link2, indicators: TrendingUp, findings: Send } as const;

/**
 * The research workspace home. It orients the researcher, gives an obvious path to try, and shows
 * what is already here as clickable counts — so the assistant is never a set of empty boxes.
 */
export default function ResearchOverview() {
  const documents = useSyncExternalStore(
    subscribeToResearchDocuments,
    getResearchDocumentsSnapshot,
    getResearchDocumentsServerSnapshot,
  ).length;
  const sources = useSyncExternalStore(
    subscribeToResearchDataSources,
    getResearchDataSourcesSnapshot,
    getResearchDataSourcesServerSnapshot,
  ).length;
  const readings = useSyncExternalStore(
    subscribeToResearchBarometer,
    getResearchBarometerSnapshot,
    getResearchBarometerServerSnapshot,
  );
  const indicators = new Set(readings.map((reading) => reading.indicator)).size;
  const findings = useSyncExternalStore(
    subscribeToResearchFindings,
    getResearchFindingsSnapshot,
    getResearchFindingsServerSnapshot,
  ).length;

  const counts = [
    { key: "documents", to: "/research/app/library", label: "Documents", value: documents },
    { key: "sources", to: "/research/app/data", label: "Data sources", value: sources },
    { key: "indicators", to: "/research/app/barometer", label: "Indicators", value: indicators },
    { key: "findings", to: "/research/app/findings", label: "Findings", value: findings },
  ] as const;

  return (
    <div className="space-y-6">
      <section aria-labelledby="research-overview-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Overview</p>
        <h2
          id="research-overview-heading"
          className="mt-1 text-xl font-bold tracking-tight text-foreground"
        >
          {RESEARCH_NAME}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {RESEARCH_INSTITUTION}. ZEPARI's own published documents are the library — every publication on
          their Policy Briefs, Research Studies and Economic Barometer listings — and a small set of data
          sources, published economic indicators and findings is loaded so you can see how it works right
          away. Open a section to work, or reset the sample at any time.
        </p>
      </section>

      <section aria-labelledby="research-try-heading">
        <h3
          id="research-try-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Try this
        </h3>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.to}>
              <Link
                to={step.to}
                className="group flex h-full flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
                  {step.title}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {step.body}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="research-counts-heading">
        <h3
          id="research-counts-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          In the assistant
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((count) => {
            const Icon = COUNT_ICON[count.key];
            return (
              <li key={count.key}>
                <Link
                  to={count.to}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {count.value}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {count.label}
                    </span>
                  </span>
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="research-overview-confidentiality" className="rounded-lg border bg-card p-4 sm:p-5">
        <h3
          id="research-overview-confidentiality"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          {RESEARCH_CONFIDENTIALITY.heading}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
          {RESEARCH_CONFIDENTIALITY.body}
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-start gap-2">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            The demonstration sample is clearly marked wherever it appears. Reset it to start again from
            the loaded example.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => resetResearchSample()}>
          Reset the sample
        </Button>
      </section>
    </div>
  );
}
