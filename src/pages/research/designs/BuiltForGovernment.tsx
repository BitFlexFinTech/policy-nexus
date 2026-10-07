import { Link } from "react-router-dom";
import { ZepariMark } from "@/components/zepari/ZepariMark";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";
import { GOVERNMENT_PAGE } from "@/config/research";

/**
 * "Built for Government" (ZEPARI build plan, §3) — its own page on the site.
 *
 * It ties the two assistants to Vision 2030 and to the Ministry of ICT's own published material, and
 * states the rules that keep the two sides apart. Every fact here comes from the Ministry's own
 * documents (verified 2026-10-07); nothing is invented.
 */
export default function BuiltForGovernment() {
  const page = GOVERNMENT_PAGE;

  return (
    <div className="zepari min-h-screen bg-zp-canvas text-zp-ink">
      <header className="bg-zp-navy text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <ZepariMark />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">Built for Government</span>
          </div>
          <nav className="flex items-center gap-4" aria-label="Page">
            <Link
              to="/research/designs"
              className="text-[11px] uppercase tracking-[0.16em] text-white/70 underline-offset-4 hover:underline"
            >
              All three options
            </Link>
          </nav>
        </div>
        <div className="h-[3px] w-full bg-zp-gold-soft" />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zp-navy">{page.eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-zp-navy sm:text-4xl">
          {page.hero}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-zp-ink-muted">{page.standfirst}</p>

        <figure className="mt-8 border-l-4 border-zp-gold py-1 pl-5">
          <blockquote className="max-w-3xl text-lg font-semibold leading-relaxed tracking-tight text-zp-navy">
            “{page.ministryVision}”
          </blockquote>
          <figcaption className="mt-2 text-[11px] uppercase tracking-[0.14em] text-zp-ink-muted">
            {page.ministryVisionBy}
          </figcaption>
        </figure>

        <section aria-labelledby="gov-assistants" className="mt-10">
          <h2 id="gov-assistants" className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            Two assistants, one purpose
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            <li className="rounded-lg border border-zp-line bg-zp-surface p-5">
              <img src={coatOfArms} alt="The Coat of Arms of the Republic of Zimbabwe" className="h-10 w-10" />
              <span className="mt-3 block text-sm font-semibold tracking-tight text-zp-navy">
                {page.assistants[0].name}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-zp-ink-muted">
                {page.assistants[0].role}
              </span>
            </li>
            <li className="rounded-lg border border-zp-line bg-zp-surface p-5">
              <ZepariMark />
              <span className="mt-3 block text-sm font-semibold tracking-tight text-zp-navy">
                {page.assistants[1].name}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-zp-ink-muted">
                {page.assistants[1].role}
              </span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="gov-together" className="mt-10">
          <h2 id="gov-together" className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            How they work together
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {page.together.map((point, index) => (
              <li key={point} className="rounded-lg border border-zp-line bg-zp-surface p-4">
                <span className="font-mono text-xs text-zp-navy">0{index + 1}</span>
                <span className="mt-2 block text-sm leading-relaxed text-zp-ink">{point}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-4 space-y-1.5">
            {page.rules.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm leading-relaxed text-zp-ink-muted">
                <span aria-hidden="true" className="text-zp-gold">
                  —
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="gov-why" className="mt-10">
          <h2 id="gov-why" className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            Why it serves Government
          </h2>
          <ul className="mt-4 space-y-2">
            {page.alignment.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-zp-ink">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 border-t border-zp-line pt-5 text-[11px] leading-relaxed text-zp-ink-muted">
          A design option for ZEPARI's review. The research assistant and the policy-simulation engine are
          kept apart: no figure from the research side is ever fed into the simulation engine.
        </p>
      </main>
    </div>
  );
}
