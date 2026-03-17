import { HeaderBar } from "@/components/HeaderBar";
import { PolicyInput } from "@/components/PolicyInput";
import { AgentFeed } from "@/components/AgentFeed";
import { EngineStatus } from "@/components/EngineStatus";
import { KPICards } from "@/components/KPICards";
import { HistoryTable } from "@/components/HistoryTable";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { SovereignFooter } from "@/components/SovereignFooter";

const Index = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderBar />
      <KPICards />
      <div className="flex flex-1 min-h-0">
        {/* Left: Document Library */}
        <DocumentLibrary />
        {/* Center: Policy Ingestion Hub — flexible */}
        <div className="w-[38%] min-w-[300px]">
          <PolicyInput />
        </div>
        {/* Right: Engine Status + Agent Feed */}
        <div className="flex flex-1 flex-col min-h-0">
          <EngineStatus />
          <div className="flex-1 min-h-0">
            <AgentFeed />
          </div>
        </div>
      </div>
      {/* Bottom: History Table */}
      <div className="max-h-[28%] overflow-y-auto">
        <HistoryTable />
      </div>
      <SovereignFooter />
    </div>
  );
};

export default Index;
