import { StatusPill } from "./StatusPill";
import { findDepartment } from "@/config/departments";
import { VOCABULARY } from "@/config/brand";
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
  const runs = useAssessmentRuns(session?.departmentId ?? null);

  if (!department) return null;

  const zigRate = getReferenceRate("zig-usd");

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
        <Metric label="Stakeholder segments" value={String(department.segments.length)} sub="Modelled population groups" />
        <Metric label="Reference indicators" value={String(department.indicators.length)} sub="Published department measures" />
        <Metric label="Policy templates" value={String(department.policyTemplates.length)} sub="Prepared departmental drafts" />
        <Metric label={zigRate.label} value={String(zigRate.value)} sub={zigRate.unit} />
      </div>
    </div>
  );
}
