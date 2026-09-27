import { useState } from "react";
import { File, FileText } from "lucide-react";
import { findDepartment, type DepartmentDocument } from "@/config/departments";
import { formatReferenceDate } from "@/config/reference";
import { useSession } from "@/session/useSession";
import { RecordedDocumentDialog } from "@/components/documents/RecordedDocumentDialog";

/**
 * Department document rail. Reads the signed-in department's document register
 * rather than a shared hardcoded list, and shows every document it declares.
 *
 * Selecting a document opens what the register knows about it, so the row's hover
 * and pointer styling is honoured by a real action (it previously advertised a
 * click and did nothing).
 */
export function DocumentLibrary() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const [selected, setSelected] = useState<DepartmentDocument | null>(null);

  if (!department) return null;

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document Library</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {department.documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setSelected(doc)}
            title={doc.note}
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {doc.kind === "pdf" ? (
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <File className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-foreground">{doc.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {doc.sizeLabel} · {formatReferenceDate(doc.date)}
              </span>
            </div>
          </button>
        ))}
      </div>
      <RecordedDocumentDialog
        document={selected}
        departmentName={department.name}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
