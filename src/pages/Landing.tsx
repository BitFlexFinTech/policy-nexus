import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Scale, ShieldCheck, Upload, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AgentPopulationDiagram, ProcessPipeline, SIMULATION_SCALE } from "@/components/public/SimulationVisuals";
import { BRAND, DISCLAIMER, ENGINE_EXPLANATION, GOVERNANCE, MINISTER_STATEMENT, PROCESS_LABEL, SERVICE_POSITION, SUPPORTED_INITIATIVE } from "@/config/brand";
import { COVERAGE } from "@/lib/coverage";
import { contentText } from "@/config/content";
import { useContent } from "@/config/useContent";

/**
 * What the platform does — three capabilities, in the order a user meets them.
 * `lead` is optional: it renders as an emphasised phrase inside the same
 * paragraph, so a card can name its subject without becoming taller than its
 * neighbours and without adding a second heading to the card.
 */
/**
 * The three capability cards. Their icon is fixed presentation; their wording is
 * editable and lives in `src/config/content.ts`, read below through `contentText`.
 */
const CAPABILITY_ICONS: LucideIcon[] = [Upload, Users, ClipboardCheck];

/** The three steps of a run, matching the journey in the workspace. */
/**
 * The three ways this workspace supports the Government's own campaign — one line each, and
 * each one a fact about what this platform does, not a claim about what the campaign has done.
 */
const INITIATIVE_SUPPORT = [
  {
    title: "Capability",
    body: "Officials learn the technology by using it on their own department's drafts, which is how internal capability is built rather than bought.",
  },
  {
    title: "Demonstration",
    body: "Every run produces a real assessment and a drafted policy — the practical demonstration the campaign calls for, inside Government.",
  },
  {
    title: "Trust",
    body: "Nothing leaves the officer's machine, every figure is published-with-its-source or labelled Modelled, and a human decides.",
  },
];

/** The three "How it works" steps; their wording lives in the content registry. */
const HOW_STEP_IDS = ["step1", "step2", "step3"] as const;

/**
 * The three steps from a draft to a structured assessment, as the landing page
 * states them. Deliberately NOT headings: this is one panel's contents, not a
 * document section, so the heading outline stays h1 → section h2 and no step name
 * competes with a section name. The full six-step journey is unchanged in the
 * workspace itself.
 */
/** The three steps in the assessment card; their wording lives in the content registry. */
const ASSESSMENT_STEP_IDS = ["step1", "step2", "step3"] as const;

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
  const content = useContent();
  return (
    <PublicPageShell>
      {/* THE CHOICE AT THE DOOR (owner's decision, 2026-10-06): opening the platform presents the
          two services before either product's detail — the policy-simulation assistant
          (departments) and the ZEPARI policy-research assistant. It sits first for that reason. */}
      <section
        aria-labelledby="service-choice-heading"
        className="mb-4 rounded-lg border bg-card p-4 sm:mb-6 sm:p-5"
      >
        <h2
          id="service-choice-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Choose a service
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col rounded-md border bg-background p-4">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {BRAND.name} — policy simulation
            </p>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">
              Assess a department's policy draft against the groups it reaches, before implementation.
            </p>
            <Button asChild size="sm" className="mt-3 self-start">
              <Link to="/start">
                Choose a department
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col rounded-md border bg-background p-4">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              ZEPARI — policy research
            </p>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">
              Research and policy analysis for ZEPARI's own evidence-based policy work.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3 self-start">
              <Link to="/research">
                Enter the research assistant
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The authority line — the first thing on the page, and therefore the first
          thing in any screenshot or link a colleague opens. Every government
          artefact opens by stating what it is and whose it is; that is the whole
          reason the proposal status, the championing Minister and the ministry sit
          here rather than at the foot of the page.

          Deliberately NOT a proposal: this platform is the working demonstration,
          and the proposal itself is a separate document. Deliberately WITHOUT the
          initiative's own name, too — that name is the page's <h1> immediately
          below, and printing the same name twice inside one screen reads as a
          mistake. */}
      <section
        aria-labelledby="authority-heading"
        className="mb-4 rounded-lg border bg-primary-tint p-3 sm:mb-10 sm:p-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-8">
          <div>
            <SectionRule />
            <h2
              id="authority-heading"
              className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:mt-3"
            >
              {BRAND.proposalLabel}
            </h2>
            <p className="mt-2 max-w-xl text-pretty text-xs leading-relaxed text-foreground sm:text-base">
              {BRAND.initiativeDescription}
            </p>
          </div>
          {/* On a phone the four lines below are laid out in two short columns rather
              than stacked, so the line costs about half the height it used to without
              losing a word. Removing any of it was never an option: the Minister is
              the reason the line is here at all. */}
          <div className="sm:border-l sm:border-border sm:pl-8">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:block">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
                  Ministerial champion
                </h3>
                <p className="mt-1 text-xs font-semibold text-foreground sm:mt-1.5 sm:text-sm">
                  {BRAND.ministerialChampion}
                </p>
              </div>
              <div>
                <p className="mt-0 text-[10px] leading-snug text-muted-foreground sm:mt-0.5 sm:text-xs">
                  {BRAND.entityCustodian}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground sm:mt-2 sm:text-xs">
                  {BRAND.poweredBy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
            className="mt-3 text-balance text-[1.875rem] font-bold uppercase leading-[1.1] tracking-[0.02em] text-foreground sm:leading-[1.15] sm:text-[2.25rem]"
          >
            {BRAND.initiative}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">{BRAND.poweredBy}</p>
          {/* The primary supporting statement, then what the platform provides. */}
          <p className="mt-3 max-w-xl text-pretty text-lg font-medium leading-relaxed text-foreground sm:mt-5 sm:text-xl">
            {BRAND.summary}
          </p>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3">
            {BRAND.description}
          </p>

          {/* The address and the audience are in the notice strip at the very top of the page,
              and the full relationship statement is in the initiative section below. Nothing is
              added here: this gap decides whether the primary action stays on a phone's first
              screen, which the browser test measures. */}

          {/* ONE primary action. The secondary link that used to sit beside it was
              removed: two side-by-side actions left the page without an obvious next
              step. The section it pointed at is still linked from the footer nav.

              On a phone the gap above it is tighter, because the first screen is the
              only screen a reader is guaranteed to see. */}
          <div className="mt-4 sm:mt-8">
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

          {/* THE MINISTER-FACING LINE — the owner's locked item 6, wording approved 2026-10-06.
              One honest sentence: the assessment is only as good as the real information a department
              provides, and it provides it through its Document Library. It sits BELOW the primary
              action on purpose — the phone browser test measures the action's distance from the fold,
              and anything added above it would push the action off the first screen. */}
          <p className="mt-3 max-w-xl text-pretty text-xs leading-relaxed text-muted-foreground">
            {MINISTER_STATEMENT}
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
            {contentText(content, "assessment.label")}
          </p>
          {/* A short gold rule — the institutional mark, drawn in the rule token
              rather than the fill gold, which is invisible on a light surface. */}
          <div aria-hidden="true" className="mt-3 h-[3px] w-10 rounded-full bg-gold-rule" />
          <h2
            id="landing-assessment-heading"
            className="mt-3 text-base font-semibold tracking-tight text-foreground"
          >
            {contentText(content, "assessment.heading")}
          </h2>
          <ol className="mt-4">
            {ASSESSMENT_STEP_IDS.map((stepId, index) => (
              <li key={stepId} className="relative flex gap-3 pb-4 last:pb-0">
                {/* The rail is decorative — the step number and title carry the meaning. */}
                {index < ASSESSMENT_STEP_IDS.length - 1 ? (
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
                    {contentText(content, `assessment.${stepId}.title`)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {contentText(content, `assessment.${stepId}.body`)}
                  </p>
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
          {contentText(content, "capabilities.heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {contentText(content, "capabilities.intro")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITY_ICONS.map((Icon, index) => {
            const key = `card${index + 1}`;
            const lead = contentText(content, `capabilities.${key}.lead`);
            return (
              <article
                key={key}
                className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold uppercase leading-snug tracking-wide text-foreground">
                  {contentText(content, `capabilities.${key}.title`)}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {lead ? <span className="font-medium text-foreground">{lead} </span> : null}
                  {contentText(content, `capabilities.${key}.body`)}
                </p>
              </article>
            );
          })}
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
              {PROCESS_LABEL}
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {contentText(content, "process.note")}
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
          {contentText(content, "how.heading")}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_STEP_IDS.map((stepId, index) => (
            <li key={stepId} className="rounded-lg border bg-card p-4">
              <span className="font-mono text-xs font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                {contentText(content, `how.${stepId}.title`)}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {contentText(content, `how.${stepId}.body`)}
              </p>
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
              {contentText(content, "repeatable.heading")}
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              {contentText(content, "repeatable.body")}
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
          {contentText(content, "coverage.heading")}
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
          {contentText(content, "coverage.note")}
        </p>
      </section>

      {/* How this workspace relates to the Government's own campaign: three lines, each mapped
          to what the campaign says it is for, with the citation underneath so a reader can check
          it. The boundary is repeated here on purpose — it belongs wherever the relationship is
          stated, not only at the top of the page. */}
      <section aria-labelledby="initiative-heading" className="mt-16">
        <SectionRule />
        <h2
          id="initiative-heading"
          className="mt-4 text-lg font-semibold tracking-tight text-foreground"
        >
          How this supports the {SUPPORTED_INITIATIVE.campaign} initiative
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {SUPPORTED_INITIATIVE.strategy} names {SUPPORTED_INITIATIVE.campaign} as one of its
          flagship initiatives — a national campaign {SUPPORTED_INITIATIVE.campaignPurpose}. This
          workspace is the internal counterpart to that work.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {SUPPORTED_INITIATIVE.relationship}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
          {SERVICE_POSITION.dataPath} {SERVICE_POSITION.hosting}
        </p>
        <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary">
            {SERVICE_POSITION.audience}
          </span>{" "}
          Proposed address{" "}
          <span className="font-mono text-foreground">{SERVICE_POSITION.proposedAddress}</span> (
          {SERVICE_POSITION.addressStatus}).
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {INITIATIVE_SUPPORT.map((item) => (
            <li key={item.title} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {SUPPORTED_INITIATIVE.citation} · {SUPPORTED_INITIATIVE.strategyPublisher}.{" "}
          <strong className="font-medium text-foreground">{SUPPORTED_INITIATIVE.boundary}</strong>
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

      {/* The proposal block and its ministerial champion used to sit here. They now
          open the page instead — see the authority line at the top of this
          component — because the Minister reads the top of a page, and only the top
          of a screenshot, travels. Nothing was lost: every line moved verbatim. */}

      <section className="mt-16 rounded-lg border border-primary/25 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <SectionRule />
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
              {contentText(content, "closing.heading")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {contentText(content, "closing.body")}
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
