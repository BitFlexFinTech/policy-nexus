import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ZepariMark } from "@/components/zepari/ZepariMark";
import {
  RESEARCH_HEADLINE,
  RESEARCH_INSTITUTION,
  RESEARCH_LOOP,
  RESEARCH_NAME,
  RESEARCH_STANDFIRST,
  RESEARCH_TRUST,
} from "@/config/research";
import { DESIGN_OPTIONS } from "./options";

/**
 * The chooser the owner picks from at Stage D (docs/ZEPARI_BUILD_PLAN.md, §5).
 *
 * It states the product's landing direction once (headline, standfirst, the four moves, the promises
 * every option keeps), then offers the three UI directions. It is deliberately plain: the decision
 * being made is which direction to BUILD, not which decoration to keep.
 */
export default function DesignOptions() {
  return (
    <div className="zepari min-h-screen bg-zp-canvas text-zp-ink">
      <header className="bg-zp-navy text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <ZepariMark />
            <span className="hidden flex-col sm:flex">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/70">
                {RESEARCH_INSTITUTION}
              </span>
              <span className="text-sm font-semibold tracking-tight">{RESEARCH_NAME}</span>
            </span>
          </div>
          <Link
            to="/research"
            className="text-[11px] uppercase tracking-[0.16em] text-white/70 underline-offset-4 hover:underline"
          >
            The live product
          </Link>
        </div>
        <div className="h-[3px] w-full bg-zp-gold-soft" />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zp-navy">
          Design options — choose one
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-zp-navy sm:text-4xl">
          {RESEARCH_HEADLINE}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-zp-ink-muted">{RESEARCH_STANDFIRST}</p>

        <ol className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {RESEARCH_LOOP.map((move, index) => (
            <li key={move} className="flex items-center gap-2">
              <span className="font-mono text-xs text-zp-gold">0{index + 1}</span>
              <span className="text-sm font-semibold tracking-tight text-zp-navy">{move}</span>
            </li>
          ))}
        </ol>

        <section aria-labelledby="designs-heading" className="mt-10">
          <h2 id="designs-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            Three directions
          </h2>
          <ul className="mt-4 grid gap-4 lg:grid-cols-3">
            {DESIGN_OPTIONS.map((option) => (
              <li key={option.id}>
                <Link
                  to={option.to}
                  className="group flex h-full flex-col rounded-lg border border-zp-line bg-zp-surface p-5 transition-colors hover:border-zp-blue"
                >
                  <span className="flex gap-1.5" aria-hidden="true">
                    {option.swatch.map((colour) => (
                      <span
                        key={colour}
                        className="h-5 w-5 rounded-sm border border-black/10"
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </span>
                  <span className="mt-4 text-lg font-bold tracking-tight text-zp-navy">{option.name}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zp-blue">
                    {option.tagline}
                  </span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-zp-ink-muted">{option.body}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zp-navy">
                    Open this option
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="trust-heading" className="mt-8 rounded-lg border border-zp-line bg-zp-surface p-5">
          <h2 id="trust-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            The promises every option keeps
          </h2>
          <ul className="mt-3 space-y-1.5">
            {RESEARCH_TRUST.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-relaxed text-zp-ink">
                <span aria-hidden="true" className="text-zp-gold">
                  —
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zp-line bg-zp-surface p-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zp-navy">Built for Government</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zp-ink-muted">
              The page that ties both assistants to Vision 2030 and to the Ministry of ICT's own published
              material.
            </p>
          </div>
          <Link
            to="/research/designs/government"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zp-navy"
          >
            Open the page <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>

        <p className="mt-8 border-t border-zp-line pt-5 text-[11px] leading-relaxed text-zp-ink-muted">
          These three directions share one platform, one content set and the institute's own blue + gold.
          They differ only in how a researcher meets the evidence. Pick the one to build; the other two are
          discarded.
        </p>
      </main>
    </div>
  );
}
