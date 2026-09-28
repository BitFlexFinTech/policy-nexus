import { useState } from "react";
import { File, FileText } from "lucide-react";
import {
  findDepartment,
  sortDocumentsByCitation,
  type DepartmentDocument,
} from "@/config/departments";
import { citedInstrumentLabel } from "@/config/instruments";
import { formatReferenceDate } from "@/config/reference";
import { useSession } from "@/session/useSession";
import { RecordedDocumentDialog } from "@/components/documents/RecordedDocumentDialog";

/**
 * Document Library — the full department document register, with each document's
 * stated kind, size, date and purpose, and the instrument it is prepared under.
 * Every declared document is listed, and every entry opens what the register
 * knows about it.
 *
 * The citation is DERIVED from `CITED_INSTRUMENTS` — the register holds a key, never the
 * citation text — so a title and its chapter cannot drift apart. Cited documents are
 * listed first, by the same rule the workspace rail uses.
 */
export default function Documents() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);
  const [selected, setSelected] = useState<DepartmentDocument | null>(null);

  if (!department) return null;

  const documents = department.documents;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Document Library</h2>
        <p className="text-xs text-muted-foreground">
          {department.name} · {documents.length} documents
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{department.description}</p>
      </header>

      <ul className="space-y-1">
        {sortDocumentsByCitation(documents).map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => setSelected(doc)}
              className="flex w-full items-start gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {doc.kind === "pdf" ? (
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <File className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs text-foreground">{doc.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {doc.kind.toUpperCase()} · {doc.sizeLabel} · {formatReferenceDate(doc.date)}
                </span>
                <span className="text-[10px] text-muted-foreground">{doc.note}</span>
                {doc.instrument ? (
                  <span className="text-[10px] text-muted-foreground">
                    Prepared under {citedInstrumentLabel(doc.instrument)}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

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
