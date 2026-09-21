import { FileText, File, ChevronRight } from "lucide-react";
import { SCENARIOS, documentsByScenario, type PolicyDocument } from "@/data/documents";
import { cn } from "@/lib/utils";

interface DocumentLibraryProps {
  selectedId?: string;
  onSelect: (doc: PolicyDocument) => void;
}

export function DocumentLibrary({ selectedId, onSelect }: DocumentLibraryProps) {
  return (
    <div className="flex h-full flex-col border-r bg-card w-64 shrink-0">
      <div className="border-b px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Document Library
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="border-b last:border-0">
            <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-muted/70 px-3 py-1.5 backdrop-blur">
              <span className="font-mono text-[10px] font-bold text-primary">{scenario.code}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground leading-tight">
                {scenario.label}
              </span>
            </div>
            <div className="p-1.5 space-y-0.5">
              {documentsByScenario(scenario.id).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  title={doc.summary}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                    selectedId === doc.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60"
                  )}
                >
                  {doc.type === "pdf" ? (
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  ) : (
                    <File className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[11px] font-medium leading-tight text-foreground">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {doc.publisher}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {doc.year} · {doc.pages} pp · {doc.size}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
