import { findDepartment, indicatorBasisLabel } from "@/config/departments";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
import {
  getNamedSource,
  MODELLED_SHARE_LABEL,
  NAMED_SOURCES,
  NAMED_SOURCE_STATEMENT,
  REFERENCE_DATE_LABEL,
  REFERENCE_FISCAL_YEAR,
  REFERENCE_RATES,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
import { useSession } from "@/session/useSession";

/**
 * Reference — methodology and limitations. This is where the platform states its
 * reference inputs, the full canonical stakeholder list, its user-visible
 * vocabulary, and the decision-support disclaimer. Nothing here is computed.
 */
export default function Reference() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

  if (!department) return null;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Methodology and Limitations</h2>
        <p className="text-xs text-muted-foreground">
          {BRAND.productName} · reference date {REFERENCE_DATE_LABEL} · fiscal year {REFERENCE_FISCAL_YEAR}
        </p>
      </header>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department context</h3>
        <p className="mt-1 text-xs font-medium text-foreground">{department.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{department.mandate}</p>
      </section>

      {/* The owner's instruction, 2026-10-02: the department's indicators were a card strip
          at the top of the Overview, and they were removed from there. Every figure now lives
          here instead — all of them, never a subset — with the same source line the cards
          printed, so nothing is lost and nothing is re-worded by hand. */}
      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Department indicators ({department.indicators.length})
        </h3>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          This department's reference figures, all of them. Each one either names the body that
          publishes it, the publication it is taken from and the period it is for, or it is shown as{" "}
          {MODELLED_SHARE_LABEL} rather than estimated.
        </p>
        <ul className="mt-2 space-y-2">
          {department.indicators.map((indicator) => (
            <li key={indicator.id} className="border-b border-dashed pb-2 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{indicator.label}</span>
                <span className="font-mono text-xs text-foreground">
                  {indicator.value}
                  {indicator.unit === "%" ? "%" : indicator.unit ? ` ${indicator.unit}` : ""}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{indicator.note}</p>
              <p className="text-[10px] text-muted-foreground">
                Source: {indicatorBasisLabel(indicator.basis)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference inputs</h3>
        <table className="mt-2 w-full text-xs">
          <tbody>
            {REFERENCE_RATES.map((rate) => (
              <tr key={rate.id} className="border-b last:border-0">
                <td className="py-1.5 pr-3 align-top text-foreground">{rate.label}</td>
                <td className="py-1.5 pr-3 align-top whitespace-nowrap font-mono text-foreground">
                  {rate.value} {rate.unit}
                </td>
                <td className="py-1.5 align-top text-muted-foreground">
                  {rate.note}
                  <span className="block text-[10px]">
                    {getNamedSource(rate.sourceId).name} · {rate.sourceDetail} · as at {rate.asOf}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Named sources</h3>
        <p className="mt-1 text-xs leading-relaxed text-foreground">{NAMED_SOURCE_STATEMENT}</p>
        <ul className="mt-2 space-y-1.5">
          {NAMED_SOURCES.map((source) => (
            <li key={source.id} className="text-xs text-foreground">
              {source.name}
              <span className="block text-[10px] text-muted-foreground">
                {source.figures} · {source.publication}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Stakeholder groups modelled nationally ({STAKEHOLDER_SEGMENTS.length})
        </h3>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          The national list. Each department models its own set drawn from these — the dashboard shows
          how many that department uses — so this figure and the dashboard's are different quantities,
          not two answers to one question. Each group carries the share of the country it stands for,
          with the source the figure came from. Where no official figure exists, the share is labelled{" "}
          {MODELLED_SHARE_LABEL} rather than filled with a guess.
        </p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {STAKEHOLDER_SEGMENTS.map((segment) => (
            <li key={segment.id} className="text-xs text-foreground">
              {segment.label}
              <span className="text-muted-foreground"> — {segment.note}</span>
              <span className="block text-[10px] text-muted-foreground">
                {segment.share === null
                  ? `Share: ${segment.shareSource} — no official figure, so the modelling weight is not a published share`
                  : `Share: ${segment.share}% of ${segment.shareBase} · ${segment.shareSource}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform vocabulary</h3>
        <ul className="mt-2 space-y-0.5">
          {Object.entries(VOCABULARY).map(([key, label]) => (
            <li key={key} className="text-xs text-foreground">
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Decision-support disclaimer
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-foreground">{DISCLAIMER.long}</p>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sovereign data</h3>
        <p className="mt-1 text-xs leading-relaxed text-foreground">{SOVEREIGNTY_STATEMENT}</p>
      </section>
    </div>
  );
}
