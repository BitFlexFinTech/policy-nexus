import { StatusPill } from "./StatusPill";

export function HeaderBar() {
  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          MiroFish<span className="text-primary"> OASIS</span>
        </h1>
        <span className="text-xs text-muted-foreground">National Policy Dashboard</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill label="Engine" status="online" value="Ready" />
        <StatusPill label="GraphRAG" status="online" value="128 nodes" />
        <StatusPill label="CPU" status="warning" value="67%" />
        <StatusPill label="Memory" status="online" value="4.2 GB" />
      </div>
    </header>
  );
}
