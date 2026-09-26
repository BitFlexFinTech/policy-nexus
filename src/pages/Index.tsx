import { KPICards } from "@/components/KPICards";
import { PolicyInput } from "@/components/PolicyInput";
import { AgentFeed } from "@/components/AgentFeed";
import { EngineStatus } from "@/components/EngineStatus";
import { HistoryTable } from "@/components/HistoryTable";
import { DocumentLibrary } from "@/components/DocumentLibrary";

/**
 * The department workspace body. The header, secondary navigation and sovereign
 * footer are supplied by `WorkspaceLayout`, so this component only renders the
 * dashboard itself and keeps the original fixed-viewport composition.
 */
const Index = () => {
  return (
    <>
      <KPICards />
      <div className="flex min-h-0 flex-1">
        {/* Left: Document Library */}
        <DocumentLibrary />
        {/* Center: Policy Ingestion Hub — flexible */}
        <div className="w-[38%] min-w-[300px]">
          <PolicyInput />
        </div>
        {/* Right: Engine Status + Agent Feed */}
        <div className="flex min-h-0 flex-1 flex-col">
          <EngineStatus />
          <div className="min-h-0 flex-1">
            <AgentFeed />
          </div>
        </div>
      </div>
      {/* Bottom: History Table */}
      <div className="max-h-[28%] overflow-y-auto">
        <HistoryTable />
      </div>
    </>
  );
};

export default Index;
