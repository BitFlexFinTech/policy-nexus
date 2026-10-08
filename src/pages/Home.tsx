import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import Landing from "@/pages/Landing";
import ResearchLanding from "@/pages/ResearchLanding";
import {
  AI_STRATEGY,
  GOVERNANCE,
  MINISTER_STATEMENT,
  PLATFORM_HOME,
  SUPPORTED_INITIATIVE,
} from "@/config/brand";
import { GOVERNMENT_PAGE, RESEARCH_BOUNDARY } from "@/config/research";

/** Which tool's landing is being shown as a static picture, if any. */
type Preview = null | "simulation" | "zepari";

/**
 * The thin gold rule that opens a section — the same institutional mark the tool landings use. It
 * is drawn in `gold-rule` (the darker step), because the fill gold is a colour for dark surfaces and
 * is invisible as a hairline on a light one. Decorative, so hidden from assistive technology.
 */
function SectionRule() {
  return <div aria-hidden="true" className="h-[3px] w-10 rounded-full bg-gold-rule" />;
}

/**
 * TRUE only on a device that can hover with a precise pointer. This is what keeps the preview "off on
 * phones": a touch screen never fires a hover, and this guard makes that explicit rather than relying
 * on the absence of an event. A reader who has asked for reduced motion still SEES the preview — the
 * fade is simply skipped (see the `motion-safe` classes below), which is the behaviour MDN documents.
 */
function hoverPreviewAllowed(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * ONE door — the entrance to a tool, with a role line and exactly one action. The whole card is the
 * hover zone for the static preview; the card never moves, so the action inside it stays clickable.
 */
function Door({
  name,
  role,
  action,
  to,
  onEnter,
  onLeave,
}: {
  name: string;
  role: string;
  action: string;
  to: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex flex-col rounded-lg bg-gold-foreground p-3.5 ring-1 ring-inset ring-gold/40 transition-all hover:ring-gold/80"
    >
      <p className="text-sm font-semibold tracking-tight text-gold">{name}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-gold/80">{role}</p>
      <Button
        asChild
        size="sm"
        className="mt-2.5 self-start !bg-gold !text-gold-foreground hover:!bg-gold/90"
      >
        <Link to={to}>
          {action}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * THE PLATFORM HOMEPAGE — the address `/`.
 *
 * The owner's item 1 (2026-10-07): this page introduces the WHOLE platform — the national story and
 * both tools, readable end to end with no hovering — while each tool keeps its own landing page at
 * `/simulation` and `/research`. On a device that can hover, pointing at a door turns the page into a
 * static PICTURE of that tool's landing (its own colours and content, nothing clickable); moving away
 * reverts it; clicking the door opens the real tool. It is a flourish only — it changes nothing about
 * how either tool works. The picture is the tool's OWN landing component, rendered `aria-hidden` and
 * `pointer-events-none`, so it can never be interacted with and the doors stay clickable on top.
 */
export default function Home() {
  const [preview, setPreview] = useState<Preview>(null);
  const intent = useRef<number | null>(null);

  const clearIntent = () => {
    if (intent.current !== null) {
      window.clearTimeout(intent.current);
      intent.current = null;
    }
  };

  const show = (which: Exclude<Preview, null>) => {
    if (!hoverPreviewAllowed()) return;
    clearIntent();
    // A short intent delay: a pointer sweeping across the page to reach something else does not
    // flash the picture.
    intent.current = window.setTimeout(() => setPreview(which), 70);
  };

  const hide = () => {
    clearIntent();
    setPreview(null);
  };

  useEffect(() => clearIntent, []);

  return (
    <PublicPageShell
      accent="gold"
      hero={
        /* THE SERVICE BAR — the platform home's OWN identity (owner's instruction, 2026-10-07). It
           holds ONLY the two service doors, so it is the first thing on the page and never pushes the
           story below. It is the Zimbabwe flag's black with gold accents: the gold hairline the shell
           draws under the masthead, and two gold-bordered black cards. The owner's complaint about the
           previous build is exactly why gold is an accent here and never a big yellow field. */
        <section className="bg-gold-foreground text-primary-foreground">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
            {/* THE STATIC PICTURE — the hovered tool's own landing, shown behind the doors and never
                clickable (`aria-hidden` + `pointer-events-none`). Absent on touch screens; its fade
                is skipped under `prefers-reduced-motion` but the picture still appears. */}
            {preview && (
              <div
                data-testid="door-preview"
                data-preview={preview}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-background motion-safe:animate-[slide-up-fade_0.25s_ease-out]"
              >
                {preview === "zepari" ? <ResearchLanding /> : <Landing />}
              </div>
            )}

            {/* THE TWO DOORS — inside the bar, above the picture layer (z-50), so they stay visible
                and clickable while the rest of the page becomes the hovered tool's landing. */}
            <div className="relative z-50">
              <h2
                id="service-choice-heading"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/75"
              >
                {PLATFORM_HOME.tools.heading}
              </h2>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <Door
                  name={PLATFORM_HOME.tools.simulation.name}
                  role={PLATFORM_HOME.tools.simulation.role}
                  action={PLATFORM_HOME.tools.simulation.door}
                  to={PLATFORM_HOME.tools.simulation.to}
                  onEnter={() => show("simulation")}
                  onLeave={hide}
                />
                <Door
                  name={PLATFORM_HOME.tools.research.name}
                  role={PLATFORM_HOME.tools.research.role}
                  action={PLATFORM_HOME.tools.research.door}
                  to={PLATFORM_HOME.tools.research.to}
                  onEnter={() => show("zepari")}
                  onLeave={hide}
                />
              </div>
            </div>
          </div>
        </section>
      }
    >
      <div className="relative">

        {/* THE PAGE'S TITLE AND STANDFIRST — back in the page's own content, below the service bar
            (owner's instruction, 2026-10-07), so the two cards are the first thing on the page and
            the story is not pushed down by a coloured band. */}
        <section aria-labelledby="home-heading" className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {PLATFORM_HOME.eyebrow}
          </p>
          <h1
            id="home-heading"
            className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {PLATFORM_HOME.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {PLATFORM_HOME.standfirst}
          </p>
        </section>

        {/* The national commitments this platform is built to serve — each with its source. */}
        <section aria-labelledby="commitments-heading" className="relative z-10 mt-12">
          <h2
            id="commitments-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            The national commitments we serve
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {PLATFORM_HOME.commitments.map((commitment) => (
              <li key={commitment.label} className="rounded-lg border bg-card p-5">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  {commitment.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {commitment.body}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {commitment.source}
                </p>
              </li>
            ))}
          </ul>
        </section>


        {/* The national AI strategy — named, with its priority sectors and its own campaign. */}
        <section
          aria-labelledby="strategy-heading"
          className="relative z-10 mt-12 rounded-lg border border-l-4 border-border border-l-gold-rule bg-card p-5 sm:p-6"
        >
          <SectionRule />
          <h2
            id="strategy-heading"
            className="mt-4 text-lg font-semibold tracking-tight text-foreground"
          >
            {AI_STRATEGY.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The Government's own plan for artificial intelligence, which names{" "}
            {AI_STRATEGY.prioritySectors.join(", ")} as its priority sectors.{" "}
            {AI_STRATEGY.campaignNote}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {AI_STRATEGY.prioritySectors.map((sector) => (
              <li
                key={sector}
                className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground"
              >
                {sector}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {AI_STRATEGY.publisher}. {SUPPORTED_INITIATIVE.citation}.
          </p>
        </section>

        {/* How the two work together — the owner's own three lines, plus the strict boundary. */}
        <section aria-labelledby="together-heading" className="relative z-10 mt-12">
          <SectionRule />
          <h2
            id="together-heading"
            className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {PLATFORM_HOME.togetherHeading}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {GOVERNMENT_PAGE.together.map((line) => (
              <li
                key={line}
                className="rounded-lg border bg-card p-4 text-sm font-medium tracking-tight text-foreground"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {RESEARCH_BOUNDARY}
          </p>
        </section>


        {/* Governance and the minister-facing line — who decides, and what grounds the work. */}
        <section
          aria-labelledby="governance-heading"
          className="relative z-10 mt-12 rounded-lg border border-l-4 border-border border-l-gold-rule bg-card p-5"
        >
          <h2
            id="governance-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
          >
            How decisions are made
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {GOVERNANCE.lens}
          </p>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-foreground">
            {GOVERNANCE.humanJudgement}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {MINISTER_STATEMENT}
          </p>
        </section>

        {/* The closing call to action — both doors again, with names distinct from the section above
            so no action is announced twice. */}
        <section className="relative z-10 mt-12 rounded-lg border border-gold-rule/50 bg-card p-5 sm:p-6">
          <SectionRule />
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Start with either assistant
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each assistant has its own workspace. Open the one your task needs — or both, side by
            side.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 px-5 text-sm !bg-gold !text-gold-foreground hover:!bg-gold/90"
            >
              <Link to={PLATFORM_HOME.tools.simulation.to}>
                Open the policy simulation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-gold-rule px-5 text-sm text-foreground"
            >
              <Link to={PLATFORM_HOME.tools.research.to}>
                Go to the research assistant
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}

