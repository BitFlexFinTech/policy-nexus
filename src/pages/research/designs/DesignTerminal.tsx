import { ConceptFrame } from "./parts";
import { useDesignSample } from "./useDesignSample";

/**
 * OPTION 2 — "The Analyst's Terminal" (dark, dense, data-forward).
 *
 * The idea: a dark navy instrument panel. The institute's own figures sit in a dense column on the
 * left, the research note holds the centre, and the sources are pinned to the right. Monospace
 * figures throughout, so a value never has to be re-read.
 *
 * The content is the assistant's OWN demonstration sample, read live from its stores: real published
 * figures, each naming its publisher, and the real library extracts it ships with.
 */
const DEMO_QUESTION =
  "How concentrated is mineral revenue, and what should the fiscal framework do about it?";

const snippet = (text: string, limit = 200) =>
  text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

export default function DesignTerminal() {
  const { documents, readings, findings, counts } = useDesignSample();
  const sources = documents.slice(0, 2);

  const ledger = [
    { label: "Documents", value: counts.documents },
    { label: "Data sources", value: counts.sources },
    { label: "Indicators", value: counts.indicators },
    { label: "Findings", value: counts.findings },
  ];

  return (
    <ConceptFrame skin="terminal" active="Ask">
      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)_270px]">
        <section className="rounded-md border border-zp-term-line bg-zp-term-panel">
          <header className="flex items-center justify-between border-b border-zp-term-line px-3 py-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zp-term-muted">
              Economic Barometer
            </h2>
            <span className="font-mono text-[10px] text-zp-gold-soft">{readings.length} readings</span>
          </header>
          <ul className="divide-y divide-zp-term-line">
            {readings.map((reading) => (
              <li key={reading.id} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-zp-term-text">{reading.indicator}</span>
                  <span className="font-mono text-[11px] text-zp-gold-soft">
                    {reading.value}
                    {reading.unit ? ` ${reading.unit}` : ""}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-zp-term-muted">
                  {reading.period} · {reading.source}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <article className="rounded-md border border-zp-term-line bg-zp-term-panel p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zp-sky">Ask › research note</p>
          <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-zp-term-text sm:text-2xl">
            {DEMO_QUESTION}
          </h1>
          <div className="mt-4 h-px w-full bg-zp-gold-soft" />

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-zp-term-muted">
            Matched passages
          </p>
          <ul className="mt-2 space-y-3">
            {sources.map((document, index) => (
              <li key={document.id} className="rounded border border-zp-term-line bg-zp-term-bg p-3">
                <p className="font-mono text-[10px] text-zp-term-muted">
                  [{index + 1}] {document.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zp-term-muted">{snippet(document.text)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded border border-zp-term-line bg-zp-term-bg p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zp-gold-soft">
              No answer model is connected
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zp-term-muted">
              The assistant shows the passages it matched and writes no words of its own until the institute
              connects its research model.
            </p>
          </div>

          {findings.length > 0 && (
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zp-term-muted">
                Findings in the sample
              </p>
              <ul className="mt-2 space-y-2">
                {findings.map((finding) => (
                  <li key={finding.id} className="text-xs leading-relaxed text-zp-term-text">
                    — {finding.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <aside className="space-y-4">
          <section className="rounded-md border border-zp-term-line bg-zp-term-panel p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zp-term-muted">Sources</h2>
            <ol className="mt-2 space-y-1.5 font-mono text-[10px] leading-relaxed text-zp-term-muted">
              {sources.map((document, index) => (
                <li key={document.id}>
                  [{index + 1}] {document.name}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-md border border-zp-term-line bg-zp-term-panel p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zp-term-muted">
              In the library
            </h2>
            <dl className="mt-2 space-y-1.5 font-mono text-[11px]">
              {ledger.map((entry) => (
                <div key={entry.label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-zp-term-muted">{entry.label}</dt>
                  <dd className="text-zp-term-text">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-md border border-zp-gold-soft/40 bg-zp-term-panel p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zp-gold-soft">
              Not covered
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-zp-term-muted">
              This demonstration reads two extracts only. The institute's full library is not yet loaded.
            </p>
          </section>
        </aside>
      </div>
    </ConceptFrame>
  );
}
