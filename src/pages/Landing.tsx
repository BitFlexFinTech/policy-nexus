import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, FileText, Play, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { BRAND, DISCLAIMER, VOCABULARY } from "@/config/brand";
import { COVERAGE } from "@/lib/coverage";

/** What the platform does — four capabilities, in the order a user meets them. */
const CAPABILITIES = [
  {
    icon: Users,
    title: "Model the national picture",
    body: "Every department carries its own stated priorities, published reference indicators, stakeholder groups and prepared policy drafts, so a measure is read against the context it actually lands in.",
  },
  {
    icon: Play,
    title: "Simulate before you commit",
    body: "The simulation core models how each stakeholder group responds and where the pressure points sit. The same department and the same draft always reproduce the identical result.",
  },
  {
    icon: ClipboardCheck,
    title: "Read the assessment",
    body: "A short executive summary for decisions, a full assessment for the detail, and a long-form report that records the working behind every figure.",
  },
  {
    icon: FileText,
    title: "Draft the policy itself",
    body: "The run also drafts the instrument: operative measures, risk mitigation, engagement, transitional and monitoring provisions — editable, and exportable to Word, PDF or print.",
  },
];

/** The three steps of a run, matching the journey in the workspace. */
const STEPS = [
  {
    title: "Provide the draft policy",
    body: "Paste the text, start from a draft the department has already prepared, or upload a PDF, DOCX or TXT file.",
  },
  {
    title: "Run the simulation",
    body: "The simulation core models every stakeholder group the department defines, over a stated horizon, from a seeded and reproducible process.",
  },
  {
    title: "Read the result and draft the policy",
    body: "Open the executive summary, the full assessment or the long-form report — then edit the drafted policy and export it.",
  },
];

/**
 * The public landing page. It introduces the platform and hands off to the
 * department chooser — it deliberately holds no department grid and no session
 * state, so it stays a landing page rather than a second copy of the workspace
 * entry. Would-be entry happens once, through the single primary action below.
 */
export default function Landing() {
  return (
    <PublicPageShell>
      <section aria-labelledby="landing-proposition">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {BRAND.workspaceLabel}
        </span>
        <h1
          id="landing-proposition"
          className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          {BRAND.tagline}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {BRAND.summary}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Bring a policy draft, and the{" "}
          <span className="font-medium text-foreground">{VOCABULARY.simulationCore}</span> models how
          stakeholder groups respond, what the fiscal and currency effects look like, and where the
          risks sit — before the measure is finalised. Every run then produces an assessment and a
          drafted policy you can edit.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button asChild size="lg" className="h-11 px-5 text-sm">
            <Link to="/start">
              Choose your Department
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Link
            to="/#capabilities"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            See what the platform does
          </Link>
        </div>

        <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">
          {DISCLAIMER.short} You will choose the department you are preparing policy for on the next
          screen.
        </p>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-heading" className="mt-16 scroll-mt-6">
        <h2
          id="capabilities-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          What this platform does
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One workspace for the whole policy cycle: prepare the draft, test how it lands, read the
          assessment, and take away the instrument itself.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((capability) => (
            <article
              key={capability.title}
              className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
                <capability.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">
                {capability.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{capability.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="coverage-heading" className="mt-16 rounded-lg border bg-card p-5">
        <h2
          id="coverage-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Platform coverage
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.departments}
            </dd>
            <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Departments
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.groups}
            </dd>
            <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Stakeholder groups modelled
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.indicators}
            </dd>
            <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Reference indicators
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.drafts}
            </dd>
            <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Prepared policy drafts
            </dt>
          </div>
        </dl>
        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
          Counts are read directly from the department reference configuration, so this page cannot
          claim more coverage than the platform holds.
        </p>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="mt-16 scroll-mt-6">
        <h2
          id="how-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border bg-card p-4">
              <span className="font-mono text-xs font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="deterministic-heading"
        className="mt-16 rounded-lg border border-l-4 border-border border-l-primary bg-card p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="deterministic-heading"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Deterministic, local, and reproducible
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              The same policy draft, submitted for the same department over the same horizon, always
              reproduces the identical run and the identical documents. Results are computed locally in
              scenario mode (Mock): no policy text and no result is sent to any external service.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-primary/25 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Ready to test a policy draft?
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Choose the department you are preparing policy for, and the workspace loads its
              indicators, prepared drafts and reference documents.
            </p>
          </div>
          <Button asChild size="lg" className="h-11 px-5 text-sm">
            <Link to="/start">
              Choose your Department
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicPageShell>
  );
}
