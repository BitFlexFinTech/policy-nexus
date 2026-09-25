import { File, FileText } from "lucide-react";
import { findDepartment } from "@/config/departments";
import { formatReferenceDate } from "@/config/reference";
import { useSession } from "@/session/useSession";

/**
 * Document Library — the full department document register, with each document's
 * stated kind, size, date and purpose. Every declared document is listed.
 */
export default function Documents() {
  const session = useSession();
  const department = findDepartment(session?.departmentId);

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
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-start gap-3 rounded-md border bg-card px-3 py-2">
            {doc.kind === "pdf" ? (
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <File className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-foreground">{doc.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {doc.kind.toUpperCase()} · {doc.sizeLabel} · {formatReferenceDate(doc.date)}
              </span>
              <span className="text-[10px] text-muted-foreground">{doc.note}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
