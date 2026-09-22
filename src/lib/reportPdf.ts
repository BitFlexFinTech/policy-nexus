import { jsPDF } from "jspdf";
import type { SimulationReport } from "@/lib/simulation";

/**
 * Deterministic PDF report: approval timeline, milestones, stakeholder
 * decisions and risk summary. No timestamps — same report in, same file out.
 */
export function exportReportPdf(report: SimulationReport) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 40;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = M;

  const ensure = (needed = 18) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const heading = (text: string) => {
    ensure(30);
    y += 10;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(0, 100, 0);
    doc.text(text.toUpperCase(), M, y);
    y += 6;
    doc.setDrawColor(0, 100, 0).setLineWidth(0.8).line(M, y, W - M, y);
    y += 12;
    doc.setTextColor(20, 20, 20);
  };

  const body = (text: string, size = 9) => {
    doc.setFont("helvetica", "normal").setFontSize(size);
    for (const line of doc.splitTextToSize(text, W - M * 2) as string[]) {
      ensure(13);
      doc.text(line, M, y);
      y += 12;
    }
  };

  const row = (cells: string[], cols: number[], bold = false) => {
    ensure(15);
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(8.5);
    cells.forEach((c, i) => {
      const x = M + cols.slice(0, i).reduce((a, b) => a + b, 0);
      const w = cols[i] - 6;
      const txt = (doc.splitTextToSize(c, w) as string[])[0] ?? "";
      doc.text(txt, x, y);
    });
    y += 13;
    doc.setDrawColor(225).setLineWidth(0.4).line(M, y - 9, W - M, y - 9);
  };

  // Cover block
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(0, 0, 0);
  doc.text("Nzwisiso AI — Policy Simulation Report", M, y);
  y += 20;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(70);
  doc.text(`Scenario ${report.scenario.code} — ${report.scenario.label}`, M, y);
  y += 14;
  doc.text(report.documentTitle ?? "Custom policy draft", M, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(
    `Seed ${report.seed} · ${report.rounds} rounds · ${report.agents.toLocaleString()} ASO agents · Weighted approval ${report.approval}% · Model confidence ${report.confidence}%`,
    M,
    y
  );
  y += 8;
  doc.setTextColor(20);

  heading("Verdict");
  body(report.verdict, 10);

  heading("Approval Timeline & Decision Gates");
  const mCols = [150, 50, 80, 75, 165];
  row(["Milestone", "Week", "Weighted", "Status", "Decision gate"], mCols, true);
  report.tracker.milestones.forEach((m) =>
    row([m.name, `W${m.week}`, `${m.weightedApproval}%`, m.status, m.gate], mCols)
  );

  heading("Stakeholder Decisions Across Milestones");
  const names = report.tracker.milestones.map((m) => m.name);
  const sCols = [175, 68, 68, 68, 68, 68];
  row(["Stakeholder class", ...names.map((n) => n.split(" ")[0])], sCols, true);
  report.tracker.tracks.forEach((t) =>
    row([t.name, ...t.points.map((p) => `${p.approval}% ${p.status.slice(0, 4)}`)], sCols)
  );

  heading("Final Stakeholder Position");
  const fCols = [210, 90, 80, 135];
  row(["Stakeholder class", "Population", "Approval", "Sentiment"], fCols, true);
  report.stakeholders.forEach((s) =>
    row([s.name, s.population.toLocaleString(), `${s.approval}%`, s.sentiment], fCols)
  );

  heading("Risk Summary");
  const rCols = [170, 70, 70, 205];
  row(["Risk factor", "Likelihood", "Impact", "Mitigation"], rCols, true);
  report.risks.forEach((r) =>
    row([r.factor, `${r.likelihood}%`, r.impact, r.mitigation], rCols)
  );

  heading("Key Indicators");
  const kCols = [200, 70, 90, 155];
  row(["Indicator", "Value", "Change", "Note"], kCols, true);
  report.kpis.forEach((k) => row([k.label, k.value, k.delta, k.note], kCols));

  heading("Ubuntu Analysis — Collective Well-being");
  body(
    `Cohesion ${report.ubuntu.cohesion}% · Equity ${report.ubuntu.equity}% · Trust ${report.ubuntu.trust}%`
  );
  body(report.ubuntu.narrative);

  heading("Recommended Actions");
  report.recommendations.forEach((rec, i) => body(`${i + 1}. ${rec}`));

  ensure(40);
  y += 10;
  doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(110);
  body(
    "Sovereign Data Architecture: all simulations computed locally via the Ministry of ICT, Postal & Courier Services on the Vultr Harare/Singapore Node. All financial projections denominated in ZiG.",
    8
  );

  const slug = `${report.scenario.code}-${(report.documentTitle ?? "custom-draft")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}`;
  doc.save(`nzwisiso-report-${slug}-${report.seed}.pdf`);
}
