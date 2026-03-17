import { HeaderBar } from "@/components/HeaderBar";
import { PolicyInput } from "@/components/PolicyInput";
import { AgentFeed } from "@/components/AgentFeed";
import { EngineStatus } from "@/components/EngineStatus";
import { HistoryTable } from "@/components/HistoryTable";

const Index = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderBar />
      <div className="flex flex-1 min-h-0">
        {/* Left: Policy Input — 40% */}
        <div className="w-[40%] min-w-[320px]">
          <PolicyInput />
        </div>
        {/* Right: Engine Status + Agent Feed — 60% */}
        <div className="flex flex-1 flex-col min-h-0">
          <EngineStatus />
          <div className="flex-1 min-h-0">
            <AgentFeed />
          </div>
        </div>
      </div>
      {/* Bottom: History Table */}
      <div className="max-h-[30%] overflow-y-auto">
        <HistoryTable />
      </div>
    </div>
  );
};

export default Index;
