import { Link, useParams } from "react-router-dom";
import { RunError, RunNotFound, RunPending } from "@/components/assessment/AssessmentSections";
import { DISCLAIMER, VOCABULARY } from "@/config/brand";
import { formatClock, useNow } from "@/lib/clock";
import { compareRuns } from "@/services/assessment/compare";
import { useRun } from "@/services/assessment/useAssessmentRuns";

const delta = (value: number) => (value === 0 ? "no change" : `${value > 0 ? "+" : ""}${value}`);

/** One shared table shell, so every block below has the same header treatment. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-x-auto rounded-lg border bg-card">
      <h3 className="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

const HEADINGS = (headings: string[]) => (
  <thead>
    <tr className="border-b bg-muted/50">
      {headings.map((heading) => (
        <th
          key={heading}
          className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {heading}
        </th>
      ))}
    </tr>
  </thead>
);

/**
 * Compare two drafts. Both runs must belong to the signed-in department; a comparison
 * across two departments is refused in words rather than shown, because the two mandates
 * are not the same question.
 */
export default function Compare() {
  const params = useParams();
  const first = useRun(params.a ? decodeURIComponent(params.a) : undefined);
  const second = useRun(params.b ? decodeURIComponent(params.b) : undefined);
  const now = useNow();

  if (first.pending || second.pending) return <RunPending heading="Compare two drafts" />;
  if (first.error) return <RunError heading="Compare two drafts" message={first.error} />;
  if (second.error) return <RunError heading="Compare two drafts" message={second.error} />;
  if (!first.run || !second.run) return <RunNotFound heading="Compare two drafts" />;

  const runA = first.run;
  const runB = second.run;
  const result = compareRuns(runA, runB);

  if (result.status === "refused") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Compare two drafts</h2>
        <div className="mt-3 rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
          {result.reason}
        </div>
        <Link to="/app/simulations" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
          Open the simulation register →
        </Link>
      </div>
    );
  }

  const c = result.comparison;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Compare two drafts</h2>
        <p className="text-xs text-muted-foreground">
          {c.departmentName} · {c.referenceA} against {c.referenceB} · modelled over {c.horizonMonthsA}{" "}
          and {c.horizonMonthsB} months
        </p>
      </header>

      <p className="rounded-lg border bg-card p-3 text-xs leading-relaxed text-foreground">{c.verdict}</p>

      {!c.sameHorizon && (
        <p className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
          The two runs were modelled over different horizons ({c.horizonMonthsA} and {c.horizonMonthsB}{" "}
          months), so part of the difference is the horizon rather than the draft. Re-run one of them
          over the same horizon to isolate the wording.
        </p>
      )}

      {c.assumptionChanges.length > 0 && (
        <Block title="Assumptions that differ">
          <ul className="divide-y">
            {c.assumptionChanges.map((change) => (
              <li key={change} className="px-3 py-1.5 font-mono text-[10px] text-foreground">
                {change}
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Block title="Headline figures">
        <table className="w-full text-xs">
          {HEADINGS(["Measure", c.referenceA, c.referenceB, "Change"])}
          <tbody>
            {c.metrics.map((metric) => (
              <tr key={metric.label} className="border-b last:border-0">
                <td className="px-3 py-1.5 text-foreground">{metric.label}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-foreground">{metric.a}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-foreground">{metric.b}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                  {metric.changed ? "differs" : "same"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block title={`Modelled groups (${c.groups.length})`}>
        <table className="w-full text-xs">
          {HEADINGS(["Group", "First", "Second", "Change", "Position"])}
          <tbody>
            {c.groups.map((group) => (
              <tr key={group.segmentId} className="border-b last:border-0">
                <td className="px-3 py-1.5 text-foreground">{group.label}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-foreground">{group.supportA}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-foreground">{group.supportB}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-muted-foreground">
                  {delta(group.delta)}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                  {group.changedSentiment ? `${group.sentimentA} → ${group.sentimentB}` : group.sentimentB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block title={`Stated priorities (${c.priorities.length})`}>
        <table className="w-full text-xs">
          {HEADINGS(["Priority", "First", "Second", "Change"])}
          <tbody>
            {c.priorities.map((priority) => (
              <tr key={priority.id} className="border-b last:border-0">
                <td className="px-3 py-1.5 text-foreground">{priority.label}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                  {priority.directionA} · {priority.scoreA}/100
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                  {priority.directionB} · {priority.scoreB}/100
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-muted-foreground">
                  {priority.changed ? "direction changed" : delta(priority.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block title="Risks raised and cleared">
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          {(
            [
              ["Raised by the second draft", c.risksRaised],
              ["Cleared by the second draft", c.risksCleared],
            ] as const
          ).map(([heading, labels]) => (
            <div key={heading}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {heading} ({labels.length})
              </span>
              <ul className="mt-1 space-y-0.5">
                {labels.length === 0 ? (
                  <li className="text-[10px] text-muted-foreground">None.</li>
                ) : (
                  labels.map((label) => (
                    <li key={label} className="text-[10px] text-foreground">
                      {label}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <p className="rounded-lg border bg-card p-3 text-[10px] leading-relaxed text-muted-foreground">
        {DISCLAIMER.long} Computed locally by the {VOCABULARY.simulationCore}; no external request was
        made. Today {formatClock(now)}.
      </p>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link
          to={`/app/assessments/${encodeURIComponent(runA.id)}`}
          className="font-medium text-primary hover:underline"
        >
          Open {c.referenceA} →
        </Link>
        <Link
          to={`/app/assessments/${encodeURIComponent(runB.id)}`}
          className="font-medium text-primary hover:underline"
        >
          Open {c.referenceB} →
        </Link>
        <Link to="/app/simulations" className="font-medium text-primary hover:underline">
          Back to the simulation register →
        </Link>
      </div>
    </div>
  );
}
