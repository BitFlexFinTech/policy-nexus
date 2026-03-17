import { StatusPill } from "./StatusPill";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

export function HeaderBar() {
  return (
    <header className="flex items-center justify-between border-b bg-primary px-4 py-2">
      <div className="flex items-center gap-3">
        <img src={coatOfArms} alt="Zimbabwe Coat of Arms" className="h-8 w-8 object-contain" />
        <h1 className="text-sm font-semibold tracking-tight text-primary-foreground">
          Nzwisiso<span className="text-gold"> AI</span>
        </h1>
        <span className="text-xs text-primary-foreground/70">National Policy Dashboard</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill label="OASIS Engine" status="online" value="Ready" />
        <StatusPill label="GraphRAG" status="online" value="128 nodes" />
        <StatusPill label="ZiG Rate" status="warning" value="13.56/USD" />
      </div>
    </header>
  );
}
