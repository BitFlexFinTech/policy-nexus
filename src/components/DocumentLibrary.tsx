import { useState } from "react";
import { FileText } from "lucide-react";
import {
  documentsInReadingOrder,
  findDepartment,
  type DepartmentDocument,
} from "@/config/departments";
import { useSession } from "@/session/useSession";
import { RecordedDocumentDialog } from "@/components/documents/RecordedDocumentDialog";

/**
 * Department document rail. Reads the signed-in department's document register and shows every
 * document it holds.
 *
 * Since Batch B4 the register IS the department's real, published documents — its governing law, its
 * sector policy, the parliamentary committees' reports on it and the audits of it — so each row names
 * the document by the title the publishing body gives it, with its page count, the date the source
 * states, and the body that published it. Nothing here is invented: the register is generated from the
 * published corpora on our own site, and `npm run validate` fails the build if the two ever disagree.
 *
 * Selecting a document opens what the register knows about it, so the row's hover and pointer styling
 * is honoured by a real action.
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
        {documentsInReadingOrder(department.documents).map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setSelected(doc)}
            title={`${doc.title} — ${doc.publisher}, ${doc.date}`}
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-foreground">{doc.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {doc.pages} pages · {doc.date}
              </span>
              <span
                className="truncate text-[10px] text-muted-foreground"
                title={doc.publisher}
              >
                {doc.publisher}
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
