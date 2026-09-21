import { useState } from "react";
import { HeaderBar } from "@/components/HeaderBar";
import { PolicyInput } from "@/components/PolicyInput";
import { AgentFeed } from "@/components/AgentFeed";
import { EngineStatus } from "@/components/EngineStatus";
import { KPICards } from "@/components/KPICards";
import { HistoryTable } from "@/components/HistoryTable";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { SovereignFooter } from "@/components/SovereignFooter";
import type { PolicyDocument, ScenarioId } from "@/data/documents";

const Index = () => {
  const [draft, setDraft] = useState("");
  const [scenario, setScenario] = useState<ScenarioId>("public-opinion");
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | undefined>();

  const handleSelectDocument = (doc: PolicyDocument) => {
    setSelectedDoc(doc);
    setScenario(doc.scenario);
    setDraft(doc.excerpt);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderBar />
      <KPICards />
      <div className="flex flex-1 min-h-0">
        <DocumentLibrary selectedId={selectedDoc?.id} onSelect={handleSelectDocument} />
        <div className="w-[38%] min-w-[320px]">
          <PolicyInput
            draft={draft}
            setDraft={setDraft}
            scenario={scenario}
            setScenario={setScenario}
            selectedDoc={selectedDoc}
          />
        </div>
        <div className="flex flex-1 flex-col min-h-0">
          <EngineStatus />
          <div className="flex-1 min-h-0">
            <AgentFeed />
          </div>
        </div>
      </div>
      <div className="max-h-[28%] overflow-y-auto">
        <HistoryTable />
      </div>
      <SovereignFooter />
    </div>
  );
};

export default Index;
