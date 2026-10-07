import { ConceptFrame } from "./parts";
import { useDesignSample } from "./useDesignSample";

/**
 * OPTION 1 — "The Research Desk" (light, editorial).
 *
 * The idea: one generous reading column, with the evidence kept beside it in a footnote rail — the
 * feel of the institute's own printed research bulletin, on the institute's blue + gold.
 *
 * The content is the assistant's OWN demonstration sample, read live from its stores: the passages are
 * the real extracts it ships with and the figures are real published values, each naming its
 * publisher. Nothing is invented to make the screen look full.
 */
const DEMO_QUESTION =
  "How concentrated is mineral revenue, and what should the fiscal framework do about it?";

/** The shape a note takes when a model IS connected — shown even when none is, so the answer is honest. */
const NOTE_SHAPE = [
  "Question",
  "Abstract",
  "Context",
  "Objectives and methods",
  "Findings",
  "Policy recommendations",
  "Sources",
];

const snippet = (text: string, limit = 240) =>
  text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

export default function DesignDesk() {
  const { documents, findings, counts } = useDesignSample();
  const sources = documents.slice(0, 2);

  const ledger = [
    { label: "Documents", value: counts.documents },
    { label: "Data sources", value: counts.sources },
    { label: "Indicators", value: counts.indicators },
    { label: "Findings", value: counts.findings },
  ];

  return (
    <ConceptFrame skin="desk" active="Ask">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zp-navy">Research note · Ask</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-snug tracking-tight text-zp-navy sm:text-3xl">
            {DEMO_QUESTION}
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-zp-ink-muted">
            Demonstration question · answered from the institute's own library
          </p>
          <div className="mt-5 h-px w-full bg-zp-gold" />

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
            The passages the library matched
          </h2>
          <ul className="mt-3 space-y-5">
            {sources.map((document, index) => (
              <li key={document.id} className="border-l-2 border-zp-gold pl-4">
                <p className="font-mono text-[11px] text-zp-ink-muted">
                  [{index + 1}] {document.kind.toUpperCase()} · {document.sizeLabel}
                </p>
                <p className="mt-1 text-sm font-semibold tracking-tight text-zp-ink">{document.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-zp-ink-muted">{snippet(document.text)}</p>
              </li>
            ))}
          </ul>

          <aside className="mt-7 rounded-md border border-zp-line bg-zp-surface p-4">
            <p className="text-sm font-semibold tracking-tight text-zp-navy">No answer model is connected</p>
            <p className="mt-1 text-sm leading-relaxed text-zp-ink-muted">
              Until the institute connects its research model, the assistant writes no words of its own —
              so nothing here can be invented. It shows the passages it matched and the shape the answer
              will take.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {NOTE_SHAPE.map((section, index) => (
                <span key={section} className="font-mono text-[11px] text-zp-ink-muted">
                  {String(index + 1).padStart(2, "0")} {section}
                </span>
              ))}
            </div>
          </aside>

          {findings.length > 0 && (
            <>
              <h2 className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
                Findings recorded in the sample
              </h2>
              <ul className="mt-3 space-y-2">
                {findings.map((finding) => (
                  <li key={finding.id} className="text-sm leading-relaxed text-zp-ink">
                    {finding.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>

        <aside className="space-y-7 lg:border-l lg:border-zp-line lg:pl-6">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">Sources</h2>
            <ol className="mt-3 space-y-2">
              {sources.map((document, index) => (
                <li key={document.id} className="font-mono text-[11px] leading-relaxed text-zp-ink-muted">
                  [{index + 1}] {document.name}
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-zp-line pt-3 text-[11px] leading-relaxed text-zp-ink-muted">
              <span className="font-semibold text-zp-ink">Not covered:</span> this demonstration reads two
              extracts only. The institute's full library is not yet loaded.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-ink-muted">
              In the library
            </h2>
            <dl className="mt-3 space-y-2">
              {ledger.map((entry) => (
                <div key={entry.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[11px] uppercase tracking-wide text-zp-ink-muted">{entry.label}</dt>
                  <dd className="font-mono text-lg font-semibold text-zp-navy">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </ConceptFrame>
  );
}
