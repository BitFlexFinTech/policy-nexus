import { cn } from "@/lib/utils";

type StatusType = "online" | "warning" | "error" | "idle";

interface StatusPillProps {
  label: string;
  status: StatusType;
  value?: string;
}

const statusStyles: Record<StatusType, string> = {
  online: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
  idle: "bg-muted text-muted-foreground",
};

const dotStyles: Record<StatusType, string> = {
  online: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  idle: "bg-muted-foreground",
};

export function StatusPill({ label, status, value }: StatusPillProps) {
  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", dotStyles[status])} />
      <span className="tracking-tight">{label}</span>
      {value && <span className="opacity-70">({value})</span>}
    </div>
  );
}
