import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConceptFrame } from "./parts";
import { useDesignSample } from "./useDesignSample";

/**
 * OPTION 3 — "The Evidence Lab" (light dashboard, charts first).
 *
 * The idea: a dashboard. The headline figures come first, the chart is the hero, and the note and its
 * evidence sit below it in a grid. Everything is drawn from the assistant's OWN demonstration sample,
 * read live from its stores — real published figures, each naming its publisher.
 *
 * The chart deliberately plots ONE unit only (counts of what the institute has loaded), so the bars
 * compare fairly; a chart mixing percentages with dollar billions would mislead, so it is not drawn.
 */
const DEMO_QUESTION =
  "How concentrated is mineral revenue, and what should the fiscal framework do about it?";

const snippet = (text: string, limit = 170) =>
  text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

const BAR_COLORS = [
  "hsl(var(--zp-navy))",
  "hsl(var(--zp-blue))",
  "hsl(var(--zp-sky))",
  "hsl(var(--zp-gold))",
];

export default function DesignLab() {
  const { documents, readings, counts } = useDesignSample();
  const sources = documents.slice(0, 2);

  const metrics = [
    { label: "Documents", value: counts.documents },
    { label: "Data sources", value: counts.sources },
    { label: "Indicators", value: counts.indicators },
    { label: "Findings", value: counts.findings },
  ];
  const chart = metrics.map((metric) => ({ name: metric.label, value: metric.value }));

  return (
    <ConceptFrame skin="lab" active="Overview">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <li key={metric.label} className="rounded-lg border border-zp-line bg-zp-surface p-4">
            <span className="font-mono text-3xl font-bold tracking-tight text-zp-navy">{metric.value}</span>
            <span className="mt-1 block text-[11px] uppercase tracking-wide text-zp-ink-muted">
              {metric.label}
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-lg border border-zp-line bg-zp-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-zp-navy">The evidence base at a glance</h2>
          <p className="text-[11px] text-zp-ink-muted">
            One unit only, so the bars compare fairly.
          </p>
        </div>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 4 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--zp-ink-muted))" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--zp-ink-muted))" }}
                width={100}
              />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={20} isAnimationActive={false}>
                {chart.map((entry, index) => (
                  <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zp-line bg-zp-surface p-5">
          <h2 className="text-sm font-semibold tracking-tight text-zp-navy">Latest published figures</h2>
          <p className="mt-0.5 text-[11px] text-zp-ink-muted">
            Every figure names the body that published it.
          </p>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-zp-ink-muted">
                <th className="pb-2 font-medium">Indicator</th>
                <th className="pb-2 text-right font-medium">Figure</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id} className="border-t border-zp-line align-top">
                  <td className="py-2 pr-3">
                    <span className="text-xs text-zp-ink">{reading.indicator}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-zp-ink-muted">
                      {reading.period} · {reading.source}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-xs font-semibold whitespace-nowrap text-zp-navy">
                    {reading.value}
                    {reading.unit ? ` ${reading.unit}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-zp-line bg-zp-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zp-navy">Ask · research note</p>
          <h2 className="mt-1 text-lg font-bold leading-snug tracking-tight text-zp-navy">{DEMO_QUESTION}</h2>
          <ul className="mt-3 space-y-2">
            {sources.map((document, index) => (
              <li key={document.id} className="rounded border border-zp-line bg-zp-canvas p-3">
                <span className="font-mono text-[10px] text-zp-ink-muted">
                  [{index + 1}] {document.name}
                </span>
                <p className="mt-1 text-[11px] leading-relaxed text-zp-ink-muted">{snippet(document.text)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded border border-zp-line bg-zp-canvas p-3">
            <p className="text-xs font-semibold text-zp-navy">No answer model is connected</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zp-ink-muted">
              The assistant shows the sources it matched and writes no words of its own until the institute
              connects its model.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-zp-ink-muted">
        <span className="font-semibold text-zp-ink">Not covered:</span> this demonstration reads two extracts
        and the sample figures only. The institute's full library is not yet loaded.
      </p>
    </ConceptFrame>
  );
}
