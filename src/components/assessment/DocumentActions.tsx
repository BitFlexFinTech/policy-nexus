import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND, DISCLAIMER } from "@/config/brand";
import { REFERENCE_DATE_LABEL } from "@/config/reference";
import type { AssessmentRun } from "@/services/assessment/types";

export type DocumentScope = "summary" | "full";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain-text rendering of a run, used for the clipboard share payload. */
const buildPlainText = (run: AssessmentRun, scope: DocumentScope): string => {
  const lines = [
    `${BRAND.productName}`,
    `${run.reference} — ${run.policyTitle}`,
    `${run.departmentName} · ${run.horizonLabel} · reference date ${REFERENCE_DATE_LABEL}`,
    "",
    run.summary,
    "",
    "Headline figures (simulated):",
    ...run.metrics.map((metric) => `- ${metric.label}: ${metric.value} — ${metric.note}`),
  ];
  if (scope === "full") {
    lines.push("", "Modelled stakeholder reactions:");
    run.reactions.forEach((reaction) => {
      lines.push(
        `- ${reaction.label} (${reaction.sentiment}): support ${reaction.supportIndex}/100, participation ${reaction.participation}/100 — ${reaction.note}`,
      );
    });
    lines.push("", "Modelled impact against stated priorities:");
    run.impacts.forEach((impact) => {
      lines.push(`- ${impact.label} (${impact.direction}, ${impact.score}/100) — ${impact.note}`);
    });
    lines.push("", "Risks:");
    run.risks.forEach((risk) => lines.push(`- ${risk.label} (${risk.severity}) — ${risk.note}`));
    lines.push("", "Recommendations:");
    run.recommendations.forEach((recommendation) =>
      lines.push(`- ${recommendation.label} — ${recommendation.note}`),
    );
  }
  lines.push("", DISCLAIMER.long);
  return lines.join("\n");
};

/** Word-compatible HTML. Namespaces are URNs — the document makes no network call. */
const buildWordHtml = (title: string, text: string): string => {
  const body = text
    .split("\n")
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<p>&nbsp;</p>"))
    .join("");
  return (
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:w="urn:schemas-microsoft-com:office:word" ` +
    `xmlns="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">` +
    `<title>${escapeHtml(title)}</title>` +
    `</head><body>${body}</body></html>`
  );
};

const fileNameFor = (run: AssessmentRun, scope: DocumentScope) =>
  `${run.reference}-${scope === "full" ? "full-assessment" : "executive-summary"}`;

/**
 * An explicitly supplied export payload. When a generated document (the
 * long-form report or the drafted policy) is exported, this supplies the title,
 * the exact text and the filename — the four actions are otherwise identical, so
 * there is still one place that knows how an assessment document is exported.
 */
export interface DocumentExportPayload {
  title: string;
  text: string;
  fileStem: string;
}

/**
 * Document actions for an assessment. Print and PDF use the browser's own
 * rendering so the printed page matches the screen exactly (the print rules in
 * `src/index.css` are scoped inside `@media print` and do not affect layout).
 * Word produces a real, downloadable document; share uses the native sheet
 * where available and the clipboard otherwise. Nothing here performs a network
 * request.
 */
export function DocumentActions({
  run,
  scope,
  document: supplied,
}: {
  /** The run the assessment document is built from. Omit when `document` is supplied. */
  run?: AssessmentRun;
  /** Which run-derived document to export. Defaults to the full assessment. */
  scope?: DocumentScope;
  /** An explicit payload — the long-form report or the drafted policy. */
  document?: DocumentExportPayload;
}) {
  const [status, setStatus] = useState<string | null>(null);

  // One place decides what is exported: either the supplied generated document
  // or the assessment derived from the run. The four actions below are identical
  // either way, so there is no second export path to keep in step.
  const payload = supplied
    ? supplied
    : run
      ? {
          title: `${run.reference} — ${run.policyTitle}`,
          text: buildPlainText(run, scope ?? "full"),
          fileStem: fileNameFor(run, scope ?? "full"),
        }
      : null;

  const handlePrint = () => {
    setStatus(null);
    window.print();
  };

  const handleWord = () => {
    if (!payload) return;
    try {
      const blob = new Blob([buildWordHtml(payload.title, payload.text)], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${payload.fileStem}.doc`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setStatus(`Word document downloaded: ${payload.fileStem}.doc`);
    } catch {
      setStatus("The Word download could not be prepared in this browser.");
    }
  };

  const handleShare = async () => {
    if (!payload) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: payload.title, text: payload.text });
        setStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(payload.text);
      setStatus(
        supplied ? "Document copied to the clipboard." : "Assessment summary copied to the clipboard.",
      );
    } catch {
      setStatus("Sharing was cancelled or is unavailable in this browser.");
    }
  };

  return (
    <div className="space-y-2" data-print="hide">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={handlePrint}>
          Print
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handlePrint}>
          Save as PDF
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleWord}>
          Download Word
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleShare}>
          Share
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Print and Save as PDF open the browser dialogue — choose “Save as PDF” as the destination to
        keep a copy. The export carries this assessment's disclaimer.
      </p>
      {status && <p className="text-[10px] font-medium text-primary">{status}</p>}
    </div>
  );
}
