import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Scale, ShieldCheck, Upload, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AgentPopulationDiagram, ProcessPipeline, SIMULATION_SCALE } from "@/components/public/SimulationVisuals";
import { BRAND, DISCLAIMER, ENGINE_EXPLANATION, GOVERNANCE } from "@/config/brand";
import { COVERAGE } from "@/lib/coverage";

/**
 * What the platform does — three capabilities, in the order a user meets them.
 * `lead` is optional: it renders as an emphasised phrase inside the same
 * paragraph, so a card can name its subject without becoming taller than its
 * neighbours and without adding a second heading to the card.
 */
type Capability = {
  icon: LucideIcon;
  title: string;
  body: string;
  lead?: string;
};

const CAPABILITIES: Capability[] = [
  {
    icon: Upload,
    title: "Policy input",
    body: "Upload or enter the proposed policy.",
  },
  {
    icon: Users,
    title: "Stakeholder simulation",
    lead: "Thousands of simulated agents.",
    body:
      "Nzwisiso creates a simulated population representing relevant stakeholder perspectives " +
      "and examines how those agents interact within the policy scenario.",
  },
  {
    icon: ClipboardCheck,
    title: "Policy assessment",
    body: "Review structured findings, potential risks and areas requiring further consideration.",
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
 * The three steps from a draft to a structured assessment, as the landing page
 * states them. Deliberately NOT headings: this is one panel's contents, not a
 * document section, so the heading outline stays h1 → section h2 and no step name
 * competes with a section name. The full six-step journey is unchanged in the
 * workspace itself.
 */
const ASSESSMENT_STEPS = [
  {
    title: "Add your policy",
    body: "Upload a document or enter a policy draft.",
  },
  {
    title: "Run simulation",
    body: "Explore potential responses across simulated stakeholder perspectives.",
  },
  {
    title: "Review assessment",
    body: "Examine potential concerns, risks and areas for further consideration.",
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
          <p className="mt-2 text-sm text-muted-foreground">{BRAND.poweredBy}</p>
          {/* The primary supporting statement, then what the platform provides. */}
          <p className="mt-5 max-w-xl text-pretty text-lg font-medium leading-relaxed text-foreground sm:text-xl">
            {BRAND.summary}
          </p>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {BRAND.description}
          </p>

          {/* ONE primary action. The secondary link that used to sit beside it was
              removed: two side-by-side actions left the page without an obvious next
              step. The section it pointed at is still linked from the footer nav. */}
          <div className="mt-8">
            <Button asChild size="lg" className="h-11 px-5 text-sm">
              <Link to="/start">
                Choose your Department
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {DISCLAIMER.short} You will choose the department you are preparing policy for on the next
            screen.
          </p>
        </div>

        {/* POLICY ASSESSMENT — three steps from a draft to a structured assessment.
            The six-step workspace journey that was listed here made the page read as
            an economic-modelling pipeline; this states the assessment the reader
            actually ends up with. The full journey is unchanged in the workspace. The
            tagline closes the card, where it reads as the principle behind the method
            rather than as a slogan. */}
        <aside
          aria-labelledby="landing-assessment-heading"
          className="rounded-lg border bg-primary-tint p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Policy assessment
          </p>
          {/* A short gold rule — the institutional mark, drawn in the rule token
              rather than the fill gold, which is invisible on a light surface. */}
          <div aria-hidden="true" className="mt-3 h-[3px] w-10 rounded-full bg-gold-rule" />
          <h2
            id="landing-assessment-heading"
            className="mt-3 text-base font-semibold tracking-tight text-foreground"
          >
            From policy draft to structured assessment
          </h2>
          <ol className="mt-4">
            {ASSESSMENT_STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                {/* The rail is decorative — the step number and title carry the meaning. */}
                {index < ASSESSMENT_STEPS.length - 1 ? (
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
          <p className="mt-1 border-t border-border pt-3 text-sm font-medium tracking-tight text-foreground">
            {BRAND.tagline}
          </p>
        </aside>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-heading" className="mt-16 scroll-mt-6">
        <SectionRule />
        <h2
          id="capabilities-heading"
          className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          A new capability for policy assessment
        </h2>
        <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Government policy can have complex effects across communities, institutions, industries and
          stakeholders. Nzwisiso provides an additional analytical lens for exploring those potential
          responses before implementation.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <article
              key={capability.title}
              className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
                <capability.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold uppercase leading-snug tracking-wide text-foreground">
                {capability.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {capability.lead ? (
                  <span className="font-medium text-foreground">{capability.lead} </span>
                ) : null}
                {capability.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* What the engine does with a draft — the section that answers "is this just a
          chat tool reading my document?": the draft opens a knowledge map, a
          simulated population of thousands of interacting agents, the interactions
          they produce, and only then an assessment. It sits between the capability
          cards and "How it works" so the page reads: what the platform does → what
          happens behind it → what the officer does.
          The heading, the supporting statement and the explanation are stated ONCE,
          at the top of the section where they are most prominent; the two columns
          below carry the pipeline and the population schematic. Deliberately not
          repeated in the right-hand column: printing the section's name twice on one
          page reads as a mistake. The transition line at the foot hands over to the
          officer's side of the same process. */}
      <section
        id="behind-the-assessment"
        aria-labelledby="behind-heading"
        className="mt-16 scroll-mt-6"
      >
        <SectionRule />
        <h2
          id="behind-heading"
          className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {ENGINE_EXPLANATION.heading}
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-foreground sm:text-xl">
          {ENGINE_EXPLANATION.statement}
        </p>
        <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {ENGINE_EXPLANATION.body}
        </p>

        {/* The five scale indicators. Conceptual figures, not measured counters, and
            the population figure is read from one constant so this strip and the
            diagram below cannot disagree about it. `dt` precedes `dd` here: the
            figure is the term and the label describes it. */}
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 rounded-lg border bg-primary-tint p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
          {SIMULATION_SCALE.map((indicator) => (
            <div key={indicator.label} className="border-t-2 border-primary/40 pt-3">
              {/* The figure reserves two lines of its own line-height whatever its
                  length, and sits on the baseline of that space. "Scenario-based" is
                  the one figure that wraps in a narrow cell; without the reserve its
                  label would drop 16px below the labels beside it and the strip would
                  read as misaligned. 4rem is exactly two lines at this font size's
                  line-height (the 2xl step sets 32px), so the wrap is covered — not
                  `leading-none`, which that step overrides. */}
              <dt className="flex min-h-[4rem] items-end font-mono text-xl font-semibold leading-none text-foreground sm:text-2xl">
                {indicator.figure}
              </dt>
              <dd className="mt-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {indicator.label}
              </dd>
            </div>
          ))}
        </dl>

        {/* Desktop: the process on the left, the simulated environment on the right.
            Narrower screens stack them in reading order — metrics, then the process,
            then the diagram. */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              The Nzwisiso process
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Each stage adds depth to the one before it: the draft is understood, mapped, populated,
              run and analysed before an assessment is produced for review.
            </p>
            <ProcessPipeline />
          </div>
          <AgentPopulationDiagram />
        </div>

        <p className="mt-6 max-w-3xl text-pretty text-sm font-medium leading-relaxed text-foreground">
          {ENGINE_EXPLANATION.transition}
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
              className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
            >
              Structured and repeatable
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              The same defined assessment process is applied consistently to each policy scenario,
              providing a controlled environment for examining potential stakeholder responses.
              Scenario results are generated locally from the defined policy scenario and reference
              configuration.
            </p>
          </div>
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

      {/* What the platform is for, and who decides. The second sentence is the
          initiative's governance position, asserted verbatim in the tests: the
          platform supports human judgement and does not make policy decisions.
          The heading now reads as a section label in the caps style the other
          labels on this page use — the DOM text is unchanged, so its accessible
          name and the exact-match assertions are unaffected. */}
      <section
        aria-labelledby="lens-heading"
        className="mt-16 rounded-lg border border-l-4 border-border border-l-primary bg-card p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
            <Scale className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="lens-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
            >
              From policy draft to policy intelligence
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {GOVERNANCE.lens}
            </p>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-foreground">
              {GOVERNANCE.humanJudgement}
            </p>
          </div>
        </div>
      </section>

      {/* The proposal and its ministerial champion. Visually important, deliberately
          not promotional: one restrained panel, no portrait, no party styling. The
          initiative name is deliberately NOT a second heading — the section heading
          is the proposal label, so the page still has exactly one <h1> and no
          duplicated heading names. */}
      <section
        aria-labelledby="positioning-heading"
        className="mt-16 rounded-lg border bg-primary-tint p-5 sm:p-6"
      >
        <SectionRule />
        <h2
          id="positioning-heading"
          className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
        >
          {BRAND.proposalLabel}
        </h2>
        <p className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {BRAND.initiative}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {BRAND.initiativeDescription}
        </p>
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Ministerial champion
          </h3>
          <p className="mt-2 text-sm font-semibold text-foreground">{BRAND.ministerialChampion}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{BRAND.entityCustodian}</p>
          <p className="mt-4 text-xs text-muted-foreground">{BRAND.poweredBy}</p>
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
