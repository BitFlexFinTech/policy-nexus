import { useState } from "react";
import { FileText } from "lucide-react";
import {
  documentsInReadingOrder,
  findDepartment,
  type DepartmentDocument,
} from "@/config/departments";
import { LIBRARY_EVIDENCE_TITLE, libraryEvidenceLines } from "@/config/runNotice";
import { useSession } from "@/session/useSession";
import { RecordedDocumentDialog } from "@/components/documents/RecordedDocumentDialog";
import { DepartmentDocumentsPanel } from "@/components/documents/DepartmentDocumentsPanel";

/**
 * Document Library — the department's real, published documents, in full.
 *
 * Since Batch B4 the register IS the department's published documents, so every row names the document
 * by the title the publishing body gives it, with its page count, the date the source states, and the
 * body that published it. Every declared document is listed, and every entry opens what the register
 * knows about it. A document whose text could not be read — the printed Constitution is a picture-only
 * scan — is listed and marked as such rather than dropped or faked.
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

      {/* Batch 0 — the evidence-status card. Its number is READ from the register above, never
          typed, so the card and the library can never disagree (a gate holds this). The wording
          lives in `src/config/runNotice.ts`, the single home shared with the before-you-run
          notice and the line above the upload control. */}
      <section
        aria-labelledby="library-evidence-title"
        className="max-w-3xl rounded-md border bg-primary/5 px-3 py-2"
      >
        <h3
          id="library-evidence-title"
          className="text-[10px] font-semibold uppercase tracking-wide text-foreground"
        >
          {LIBRARY_EVIDENCE_TITLE}
        </h3>
        <ul className="mt-1 space-y-1">
          {libraryEvidenceLines(department.shortName, documents.length).map((line) => (
            <li key={line} className="text-[10px] leading-relaxed text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <ul className="space-y-1">
        {documentsInReadingOrder(documents).map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => setSelected(doc)}
              className="flex w-full items-start gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs text-foreground">{doc.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  PDF · {doc.pages} pages · {doc.date}
                </span>
                <span className="text-[10px] text-muted-foreground">{doc.publisher}</span>
                {doc.read ? null : (
                  <span className="text-[10px] text-muted-foreground">
                    Recorded by name only — the published file is a picture-only scan, so its text
                    could not be read.
                  </span>
                )}
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

      {/* Owner's item 3 — the department's own documents, read into every run it makes. */}
      <DepartmentDocumentsPanel department={department} />
    </div>
  );
}
