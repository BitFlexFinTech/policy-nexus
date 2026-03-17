import { FileText, File } from "lucide-react";

const recentDocs = [
  { name: "ZiG_Tax_Framework_2026.pdf", size: "2.4 MB", date: "2026-03-17", type: "pdf" },
  { name: "Digital_Regulatory_Draft.docx", size: "1.1 MB", date: "2026-03-16", type: "docx" },
  { name: "AI_Fund_Proposal.txt", size: "48 KB", date: "2026-03-15", type: "txt" },
  { name: "ElNino_AgriReport.pdf", size: "5.2 MB", date: "2026-03-14", type: "pdf" },
  { name: "Diaspora_Remittance_Study.pdf", size: "3.8 MB", date: "2026-03-12", type: "pdf" },
];

export function DocumentLibrary() {
  return (
    <div className="flex h-full flex-col border-r bg-card w-56 shrink-0">
      <div className="border-b px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document Library</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {recentDocs.map((doc, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
          >
            {doc.type === "pdf" ? (
              <FileText className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            ) : (
              <File className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-foreground truncate">{doc.name}</span>
              <span className="text-[10px] text-muted-foreground">{doc.size} · {doc.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
