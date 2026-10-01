import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findDepartment } from "@/config/departments";
import { REFERENCE_DATE_LABEL } from "@/config/reference";
import { VOCABULARY } from "@/config/brand";
import { buildPolicyDraft, renderDocumentText, sliceDocumentSection } from "@/services/assessment/documents";
import {
  policyDraftPartPath,
  recommendationTarget,
} from "@/services/assessment/recommendationActions";
import { downloadAsWord } from "@/services/documents/documentExport";
import { DIRECTION_TONE, SEVERITY_TONE, SENTIMENT_TONE } from "./tone";
import type { AssessmentRun } from "@/services/assessment/types";
import { officerRecordLine } from "@/config/officer";
import { revisionNumber, revisionParentReference } from "@/services/assessment/revision";

export function AssessmentHeader({ run, title }: { run: AssessmentRun; title: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {run.reference} · {run.departmentName} · {run.policyTitle} · {run.horizonLabel} · source{" "}
          {run.source}
        </p>
      </div>
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        Complete
      </span>
    </header>
  );
}

/** Shown when an assessment id does not match a recorded run. */
export function RunNotFound({ heading }: { heading: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 rounded-lg border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        No recorded run matches this reference. A run is recorded in this browser when a policy draft
        is submitted, and the register on this device may since have been cleared.
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/app/simulations" className="font-medium text-primary hover:underline">
            Open the simulation register →
          </Link>
          <Link to="/app" className="font-medium text-primary hover:underline">
            Back to the workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown while a live service is answering. It never appears while the platform is
 * simulated, because the simulated engine answers in the same render.
 */
export function RunPending({ heading }: { heading: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 rounded-lg border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        Asking the configured service for this run. The simulated engine answers immediately; a live
        service takes as long as it takes.
      </div>
    </div>
  );
}

/**
 * Shown when a live service fails. A failure is reported as a failure — never
 * replaced by a made-up result.
 */
export function RunError({ heading, message }: { heading: string; message: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs leading-relaxed text-foreground">
        The configured service could not be reached: {message}
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/app/simulations" className="font-medium text-primary hover:underline">
            Open the simulation register →
          </Link>
          <Link to="/app" className="font-medium text-primary hover:underline">
            Back to the workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Headline metrics. Each card opens to the note explaining what the figure means
 * (the interactivity rule: a summary card must open to more detail, not sit as a
 * bare number).
 */
export function MetricCards({ run }: { run: AssessmentRun }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {run.metrics.map((metric) => {
        const open = openId === metric.id;
        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => setOpenId(open ? null : metric.id)}
            aria-expanded={open}
            className={cn(
              "rounded-md border bg-card p-2 text-left transition-colors hover:border-primary/40",
              open && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </div>
            <div className="text-lg font-semibold leading-none text-foreground">{metric.value}</div>
            {open && (
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{metric.note}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Section shell so every findings block shares one header treatment. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

export function ReactionList({ run }: { run: AssessmentRun }) {
  return (
    <Section title={`Modelled stakeholder reactions (${run.reactions.length})`}>
      {run.reactions.map((reaction) => (
        <div key={reaction.segmentId} className="flex flex-wrap items-start gap-2 px-4 py-2">
          <span className="w-44 shrink-0 text-xs font-medium text-foreground">{reaction.label}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              SENTIMENT_TONE[reaction.sentiment],
            )}
          >
            {reaction.sentiment}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            support {reaction.supportIndex}/100 · participation {reaction.participation}/100
          </span>
          <span className="w-full flex-1 text-[10px] leading-relaxed text-muted-foreground">
            {reaction.note}
          </span>
        </div>
      ))}
    </Section>
  );
}

export function ImpactList({ run }: { run: AssessmentRun }) {
  return (
    <Section title={`Modelled impact against stated priorities (${run.impacts.length})`}>
      {run.impacts.map((impact) => (
        <div key={impact.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
          <span className="w-44 shrink-0 text-xs font-medium text-foreground">{impact.label}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              DIRECTION_TONE[impact.direction],
            )}
          >
            {impact.direction}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${impact.score}%` }} />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{impact.score}/100</span>
          <span className="w-full flex-1 text-[10px] leading-relaxed text-muted-foreground">
            {impact.note}
          </span>
        </div>
      ))}
    </Section>
  );
}

/**
 * The assumptions the run was modelled under (BATCH E). Stated as its own block, in
 * the same words the run screen and every export use, so a figure can never be read
 * without knowing what was assumed to produce it.
 */
export function AssumptionList({ run }: { run: AssessmentRun }) {
  return (
    <Section title="Assumptions in force">
      {run.leverNotes.map((note) => (
        <p key={note} className="px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      ))}
    </Section>
  );
}

export function RiskList({ run }: { run: AssessmentRun }) {
  return (
    <Section title={`Risks modelled for this draft (${run.risks.length})`}>
      {run.risks.map((risk) => (
        <div key={risk.id} className="flex flex-wrap items-start gap-2 px-4 py-2">
          <span className="w-44 shrink-0 text-xs font-medium text-foreground">{risk.label}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              SEVERITY_TONE[risk.severity],
            )}
          >
            {risk.severity}
          </span>
          <span className="w-full flex-1 text-[10px] leading-relaxed text-muted-foreground">
            {risk.note}
          </span>
        </div>
      ))}
    </Section>
  );
}

export function RecommendationList({ run }: { run: AssessmentRun }) {
  const [status, setStatus] = useState<{ id: string; message: string } | null>(null);

  /**
   * Download the one part of the drafted policy that answers a step, as its own Word document.
   *
   * The drafted policy is built on the press — it is a pure function of the run, so this cannot show a
   * different figure from the assessment the officer is reading, and nothing is stored to keep in step.
   */
  const downloadPart = (recommendationId: string, sectionId: string) => {
    const department = findDepartment(run.departmentId);
    if (!department) {
      setStatus({ id: recommendationId, message: "This department's configuration could not be read." });
      return;
    }
    const part = sliceDocumentSection(buildPolicyDraft(run, department), sectionId);
    if (!part) {
      setStatus({
        id: recommendationId,
        message: "That part is not in this run's drafted policy, so nothing was downloaded.",
      });
      return;
    }
    setStatus({
      id: recommendationId,
      message: downloadAsWord({
        title: part.title,
        text: renderDocumentText(part),
        fileStem: part.fileStem,
      }),
    });
  };

  return (
    <Section title={`Recommended next steps (${run.recommendations.length})`}>
      <p className="px-4 pt-2 text-[10px] leading-relaxed text-muted-foreground">
        Each step below is already worked into the drafted policy. Use the action beside it to open the
        exact table or clause that answers it, or to download just that part to send on.
      </p>
      {run.recommendations.map((recommendation, index) => {
        const target = recommendationTarget(recommendation.id);
        return (
          <div key={recommendation.id} className="border-b border-dashed px-4 py-2 last:border-0">
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">{recommendation.label}</div>
                <div className="text-[10px] leading-relaxed text-muted-foreground">
                  {recommendation.note}
                </div>

                {/* The action. A link, because it takes the officer to a place; and a download, because
                    the whole point is to send that one part on without copying it out by hand. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Link
                    to={policyDraftPartPath(run.id, target.sectionId)}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    Open what answers this →
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => downloadPart(recommendation.id, target.sectionId)}
                  >
                    Download this part (Word)
                  </Button>
                </div>

                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Answered in <span className="text-foreground">{target.label}</span> — {target.use}
                </p>

                {status?.id === recommendation.id && (
                  <p className="mt-1 text-[10px] font-medium text-primary">{status.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </Section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed py-1 last:border-0">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("text-right text-[11px] text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

/** The exact inputs a run was derived from — shown on the full assessment. */
export function InputRecord({ run }: { run: AssessmentRun }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Run inputs
      </div>
      <dl className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <Row label="Reference date" value={REFERENCE_DATE_LABEL} />
        <Row label="Horizon" value={run.horizonLabel} />
        <Row label="Source" value={run.source} />
        <Row label="Version" value={String(revisionNumber(run.id))} />
        {/* Item 1 — the paper trail, on the run's own record. */}
        <Row
          label="Prepared by"
          value={officerRecordLine(run.preparedBy) ?? "Not recorded"}
        />
        {run.preparedBy?.source === "self-declared" && (
          <Row label="Name source" value="Self-declared at entry (sign-in not enabled)" />
        )}
        {run.revisionOf && (
          <Row
            label="Re-run from"
            value={revisionParentReference(run.id) ?? run.revisionOf}
            mono
          />
        )}
        <Row label="Seed" value={run.seed} mono />
        <Row label="Engine" value={`${VOCABULARY.simulationCore} (Mock)`} />
        <Row
          label="Uploaded files"
          value={run.fileNames.length ? run.fileNames.join(", ") : "None"}
        />
        {/* Owner's item 3 — what the department's own documents contributed to this run. */}
        <Row
          label="Departmental documents"
          value={
            run.documents && run.documents.length > 0
              ? `${run.documents.length} supplied · ${run.documents.filter((document) => document.characters > 0).length} read`
              : "None added for this department"
          }
        />
      </dl>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Policy text as submitted
        </div>
        <pre className="font-mono-code mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-2 text-[10px] leading-relaxed text-foreground">
          {run.policyText}
        </pre>
      </div>
    </div>
  );
}

