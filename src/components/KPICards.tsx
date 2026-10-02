import { useState } from "react";
import { findDepartment, indicatorBasisLabel, type IndicatorTone } from "@/config/departments";
import { useSession } from "@/session/useSession";

interface KPICardProps {
  title: string;
  value: string;
  unit?: string;
  score: number;
  description: string;
  sourceLabel: string;
  color: IndicatorTone;
}

/**
 * One department reference indicator. The strip is a summary, so each card opens
 * to its plain-language meaning and its stated source rather than showing a
 * number with no drill-down.
 */
function KPICard({ title, value, unit, score, description, sourceLabel, color }: KPICardProps) {
  const [open, setOpen] = useState(false);

  const barColor = {
    primary: "bg-primary",
    gold: "bg-gold",
    success: "bg-success",
    warning: "bg-warning",
  }[color];

  return (
    <button
      type="button"
      onClick={() => setOpen((previous) => !previous)}
      aria-expanded={open}
      className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tracking-tight text-foreground">
          {value}
          {unit === "%" ? "%" : ""}
        </span>
        {unit && unit !== "%" && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      {open ? (
        <div className="space-y-0.5">
          <p className="text-[10px] leading-snug text-foreground">{description}</p>
          <p className="text-[10px] text-muted-foreground">Source: {sourceLabel}</p>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground">Open for detail</span>
      )}
    </button>
  );
}

/**
 * The KPI strip, read from the signed-in department's reference indicators.
 * Every indicator the department states is rendered — never a curated subset —
 * so the strip always matches `department.indicators`.
 */
export function KPICards() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

  if (!department) return null;

  const indicators = department.indicators;

  return (
    <div
      className="grid gap-3 border-b bg-card px-4 py-3"
      /* Responsive wrap (2026-10-02): departments now carry ten indicators each, and a
         fixed one-column-per-indicator row squeezed ten cards into ~130 px each. `auto-fit`
         keeps the SAME single row for a three- or four-card department (each card stays
         wider than its 150 px minimum, so the column count is unchanged) and wraps a
         ten-card department onto further rows. Only this strip is affected. */
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
    >
      {indicators.map((indicator) => (
        <KPICard
          key={indicator.id}
          title={indicator.label}
          value={indicator.value}
          unit={indicator.unit}
          score={indicator.score}
          description={indicator.note}
          sourceLabel={indicatorBasisLabel(indicator.basis)}
          color={indicator.tone}
        />
      ))}
    </div>
  );
}
