import { findDepartment } from "@/config/departments";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
import {
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
                <td className="py-1.5 align-top text-muted-foreground">{rate.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Stakeholder segments modelled ({STAKEHOLDER_SEGMENTS.length})
        </h3>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {STAKEHOLDER_SEGMENTS.map((segment) => (
            <li key={segment.id} className="text-xs text-foreground">
              {segment.label}
              <span className="text-muted-foreground"> — {segment.note}</span>
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
