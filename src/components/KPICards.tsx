import { Progress } from "@/components/ui/progress";

interface KPICardProps {
  title: string;
  value: string;
  score: number;
  description: string;
  color: "primary" | "gold" | "success" | "warning";
}

function KPICard({ title, value, score, description, color }: KPICardProps) {
  const barColor = {
    primary: "bg-primary",
    gold: "bg-gold",
    success: "bg-success",
    warning: "bg-warning",
  }[color];

  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground">{description}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function KPICards() {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b bg-card">
      <KPICard
        title="ZiG Stability Forecast"
        value="73%"
        score={73}
        description="Currency volatility confidence"
        color="gold"
      />
      <KPICard
        title="Social Cohesion Index"
        value="81"
        score={81}
        description="Ubuntu collective well-being"
        color="primary"
      />
      <KPICard
        title="Agricultural Resilience"
        value="62%"
        score={62}
        description="El Niño/La Niña impact readiness"
        color="success"
      />
    </div>
  );
}
