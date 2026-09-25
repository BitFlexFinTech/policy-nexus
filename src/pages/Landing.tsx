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
 * The route from a policy draft to a finished assessment, in the order the
 * workspace implements it. These titles are deliberately NOT headings — this is
 * one panel's contents, not a document section, so the heading outline stays
 * h1 → section h2 and no step name competes with a section name.
 */
const WORKFLOW = [
  {
    title: "Choose your department",
    body: "Each department brings its own priorities and indicators.",
  },
  {
    title: "Enter the workspace",
    body: "One click signs you in — no account, no form.",
  },
  {
    title: "Add the policy",
    body: "Paste the draft, or upload a PDF, DOCX or TXT.",
  },
  {
    title: "Run the simulation",
    body: "Models each stakeholder group and its pressure points.",
  },
  {
    title: "Read the assessment",
    body: "A summary for the decision, plus the full detail.",
  },
  {
    title: "Take away the drafted policy",
    body: "The instrument itself, editable and exportable.",
  },
];

/**
 * The thin gold rule that opens a section — the institutional mark, drawn in the
 * `gold-rule` token. The brand gold is a fill colour for dark surfaces; on a light
 * one it measures 1.38:1, so a hairline in it is invisible. This rule is
 * decorative and is hidden from assistive technology.
 */
function SectionRule() {
  return <div aria-hidden="true" className="h-[3px] w-10 rounded-full bg-gold-rule" />;
}

/**
 * The public landing page. It introduces the platform and hands off to the
 * department chooser — it deliberately holds no department grid and no session
 * state, so it stays a landing page rather than a second copy of the workspace
 * entry. Would-be entry happens once, through the single primary action below.
 */
export default function Landing() {
  return (
    <PublicPageShell>
      <section
        aria-labelledby="landing-heading"
        className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-10"
      >
        <div>
          {/* The service principle, as a restrained label above the heading. */}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {BRAND.eyebrow}
          </p>
          {/* The initiative is the government capability; Nzwisiso AI is the platform. */}
          <h1
            id="landing-heading"
            className="mt-3 text-balance text-[1.875rem] font-bold uppercase leading-[1.15] tracking-[0.02em] text-foreground sm:text-[2.25rem]"
          >
            {BRAND.initiative}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Powered by <span className="font-medium text-foreground">{BRAND.name}</span>
          </p>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {BRAND.summary}
          </p>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            Bring a draft, and the{" "}
            <span className="font-medium text-foreground">{VOCABULARY.simulationCore}</span> models how
            stakeholder groups respond, what the fiscal and currency effects look like, and where the
            risks sit — before the measure is finalised.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
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

          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {DISCLAIMER.short} You will choose the department you are preparing policy for on the next
            screen.
          </p>
        </div>

        {/* The policy-assessment workflow. The reference rates that used to sit here
            were economic inputs for the engine, not orientation for a visitor — and
            they are already stated where they are actually used, in the workspace
            header, engine-vitals panel and reference page. What a reader needs
            beside the proposition is the route from a draft to an assessment, and
            where that route ends. */}
        <aside
          aria-labelledby="landing-workflow-heading"
          className="rounded-lg border bg-primary-tint p-5"
        >
          <h2
            id="landing-workflow-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
          >
            How an assessment is produced
          </h2>
          {/* A short gold rule — the institutional mark, drawn in the rule token
              rather than the fill gold, which is invisible on a light surface. */}
          <div aria-hidden="true" className="mt-3 h-[3px] w-10 rounded-full bg-gold-rule" />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Six steps from a policy draft to a structured assessment you can act on.
          </p>
          <ol className="mt-4">
            {WORKFLOW.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                {/* The rail is decorative — the step number and title carry the meaning. */}
                {index < WORKFLOW.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-3 top-7 w-px bg-primary/25"
                  />
                ) : null}
                <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-card font-mono text-[11px] font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug tracking-tight text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-1 border-t border-border pt-3 text-xs leading-relaxed text-foreground">
            The run ends in a structured policy assessment. It informs the decision; it does not take
            it.
          </p>
        </aside>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-heading" className="mt-16 scroll-mt-6">
        <SectionRule />
        <h2
          id="capabilities-heading"
          className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          What this platform does
        </h2>
        <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
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

      <section
        aria-labelledby="coverage-heading"
        className="mt-16 rounded-lg border bg-primary-tint p-5"
      >
        <h2
          id="coverage-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
        >
          Platform coverage
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.departments}
            </dd>
            <dt className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Departments
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.groups}
            </dd>
            <dt className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Stakeholder groups modelled
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.indicators}
            </dd>
            <dt className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Reference indicators
            </dt>
          </div>
          <div>
            <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
              {COVERAGE.drafts}
            </dd>
            <dt className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Prepared policy drafts
            </dt>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Counts are read directly from the department reference configuration, so this page cannot
          claim more coverage than the platform holds.
        </p>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="mt-16 scroll-mt-6">
        <SectionRule />
        <h2
          id="how-heading"
          className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
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
            <SectionRule />
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
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
