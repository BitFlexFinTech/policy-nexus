import { StatusPill } from "./StatusPill";
import { countIndicatorsByBasis, findDepartment } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
import { STAKEHOLDER_SEGMENTS } from "@/config/reference";
import { getReferenceRate } from "@/config/reference";
import { useSession } from "@/session/useSession";
import { useAssessmentRuns } from "@/services/assessment/useAssessmentRuns";

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
}

function Metric({ label, value, sub }: MetricProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tracking-tight leading-none text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

/**
 * Engine vitals for the signed-in department. Every figure is a real count from
 * the department's own configuration, a recorded run, or a stated reference
 * input — nothing here is generated, and the engine pill always says plainly
 * that results are simulated.
 */
export function EngineStatus() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const { runs } = useAssessmentRuns(session?.departmentId ?? null);

  if (!department) return null;

  const zigRate = getReferenceRate("zig-usd");
  // Derived from the configuration: a screen may never state a split the platform
  // does not hold. While an indicator is modelled this says so, rather than calling
  // the set "published".
  const basis = countIndicatorsByBasis(department.indicators);

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Engine Vitals</span>
        <div className="flex gap-1.5">
          <StatusPill label={VOCABULARY.simulationCore} status="idle" value="Scenario (Mock)" />
          <StatusPill
            label={VOCABULARY.knowledgeMap}
            status="idle"
            value={`${department.documents.length} documents`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 px-4 py-3 md:grid-cols-5">
        <Metric
          label="Recorded runs"
          value={String(runs.length)}
          sub="Simulations recorded in this browser"
        />
        {/* Two different quantities must never share one label. The dashboard shows THIS
            department's modelled set; the Reference screen shows the national list. Before
            the owner's item 11 they both read "Stakeholder segments", so the dashboard's 8
            looked like a contradiction of the platform-wide 36 — that is exactly what the
            owner reported. Each now says which it is. */}
        <Metric
          label="Stakeholder groups modelled"
          value={String(department.segments.length)}
          sub={`This department's set · ${STAKEHOLDER_SEGMENTS.length} nationally`}
        />
        <Metric
          label="Reference indicators"
          value={String(department.indicators.length)}
          sub={`${basis.published} published · ${basis.modelled} modelled`}
        />
        <Metric label="Policy templates" value={String(department.policyTemplates.length)} sub="Prepared departmental drafts" />
        <Metric label={zigRate.label} value={String(zigRate.value)} sub={zigRate.unit} />
      </div>
    </div>
  );
}
