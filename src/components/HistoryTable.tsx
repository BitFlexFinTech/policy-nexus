const historyData = [
  { id: "SIM-001", date: "2026-03-17", policy: "ZiG Mandatory Tax Settlement for Exporters", rounds: 50, agents: 10240, result: "71% Approval", status: "Complete" },
  { id: "SIM-002", date: "2026-03-16", policy: "National Digital Regulatory Framework 2026", rounds: 100, agents: 25000, result: "58% Approval", status: "Complete" },
  { id: "SIM-003", date: "2026-03-15", policy: "Mugove/Umqele/Isabelo National AI Fund Incentives", rounds: 75, agents: 15000, result: "83% Approval", status: "Complete" },
  { id: "SIM-004", date: "2026-03-14", policy: "Agricultural Resilience Program — El Niño Mitigation", rounds: 60, agents: 12000, result: "82% Approval", status: "Complete" },
  { id: "SIM-005", date: "2026-03-13", policy: "Diaspora Remittance ZiG Corridor Expansion", rounds: 80, agents: 20000, result: "64% Approval", status: "Complete" },
  { id: "SIM-006", date: "2026-03-12", policy: "Kombi Fare Stabilization & Fuel Subsidy Reform", rounds: 45, agents: 8000, result: "77% Approval", status: "Complete" },
  { id: "SIM-007", date: "2026-03-17", policy: "Civil Service Wage Adjustment — ZiG Parity", rounds: 30, agents: 10240, result: "—", status: "Running" },
];

export function HistoryTable() {
  return (
    <div className="flex flex-col border-t bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulation History</span>
        <span className="text-xs text-muted-foreground">{historyData.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {["ID", "Date", "Policy", "Rounds", "ASOs", "Result", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historyData.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-100">
                <td className="px-3 py-1.5 font-mono text-primary font-medium">{row.id}</td>
                <td className="px-3 py-1.5 text-muted-foreground font-mono">{row.date}</td>
                <td className="px-3 py-1.5 text-foreground max-w-xs truncate">{row.policy}</td>
                <td className="px-3 py-1.5 text-foreground font-mono text-right">{row.rounds.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-foreground font-mono text-right">{row.agents.toLocaleString()}</td>
                <td className="px-3 py-1.5 font-medium text-foreground">{row.result}</td>
                <td className="px-3 py-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    row.status === "Running"
                      ? "bg-gold/15 text-gold-foreground"
                      : "bg-success/15 text-success"
                  }`}>
                    {row.status === "Running" && <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
