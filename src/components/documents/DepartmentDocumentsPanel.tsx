import { useState, useSyncExternalStore } from "react";
import { FilePlus2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Department } from "@/config/departments";
import { formatReferenceDate } from "@/config/reference";
import { extractPolicyFile, isAcceptedPolicyFile } from "@/services/extraction/extractPolicyText";
import {
  addDepartmentDocument,
  clearDepartmentDocuments,
  getDepartmentDocumentsServerSnapshot,
  getDepartmentDocumentsSnapshot,
  isDepartmentDocumentStorePersistent,
  removeDepartmentDocument,
  subscribeToDepartmentDocuments,
} from "@/services/documents/departmentDocuments";

/**
 * A department's own documents (owner's item 3).
 *
 * The owner asked for "a section that allows each department to upload all the documents
 * they want so that the simulations produce better results". This is that section: files
 * added here are read in the browser, kept for this department, and handed to every
 * simulation the department runs — so the modelled position rests on the department's own
 * material as well as on the submitted draft.
 *
 * It says plainly what happened to each file. A `.txt` or `.docx` is read for real; a `.pdf`
 * is recorded by name and the entry says it was not read, because this build has no PDF
 * reader. A file that was not read contributes nothing to a run — the count of documents
 * read on an assessment only ever includes text that really exists.
 */
export function DepartmentDocumentsPanel({ department }: { department: Department }) {
  const stored = useSyncExternalStore(
    subscribeToDepartmentDocuments,
    getDepartmentDocumentsSnapshot,
    getDepartmentDocumentsServerSnapshot,
  );
  const documents = stored.filter((document) => document.departmentId === department.id);

  const [isReading, setIsReading] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  const readFiles = async (files: File[]) => {
    const accepted = files.filter((file) => isAcceptedPolicyFile(file.name, file.type));
    if (accepted.length === 0) {
      setNotices(["No readable file was chosen. This build reads .txt and .docx files."]);
      return;
    }
    setIsReading(true);
    const messages: string[] = [];
    for (const file of accepted) {
      const extracted = await extractPolicyFile(file);
      addDepartmentDocument({
        departmentId: department.id,
        name: extracted.name,
        sizeLabel: extracted.sizeLabel,
        kind: extracted.kind,
        // Only text that was really read is stored: a file recorded by name keeps an empty
        // text, so no run can count it as material it read.
        text: extracted.extracted ? extracted.text : "",
        status: extracted.status,
      });
      messages.push(`${extracted.name} — ${extracted.status}`);
    }
    setNotices(messages);
    setIsReading(false);
  };

  const addPasted = () => {
    const title = pastedTitle.trim();
    const text = pastedText.trim();
    if (!title || !text) {
      setNotices(["A pasted document needs both a title and its text."]);
      return;
    }
    addDepartmentDocument({
      departmentId: department.id,
      name: title,
      sizeLabel: `${text.length} characters`,
      kind: "text",
      text,
      status: "Text added directly — read in full.",
    });
    setPastedTitle("");
    setPastedText("");
    setNotices([`${title} — added and read in full.`]);
  };


  return (
    <section aria-labelledby="own-documents-heading" className="rounded-lg border bg-card p-4">
      <h3 id="own-documents-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        This department's own documents
      </h3>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Documents added here are read in this browser, kept for {department.shortName}, and handed to
        every simulation the department runs — so the modelled position rests on your department's own
        material as well as on the submitted draft. {documents.length}{" "}
        {documents.length === 1 ? "document has" : "documents have"} been added.
        {isDepartmentDocumentStorePersistent()
          ? " They are kept in this browser, for this department."
          : " This browser refused to keep data between visits, so they last only until this page is closed."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/60">
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
          {isReading ? "Reading…" : "Add documents"}
          <input
            type="file"
            multiple
            accept=".txt,.docx,.pdf"
            className="hidden"
            disabled={isReading}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) void readFiles(files);
            }}
          />
        </label>
        <span className="text-[10px] text-muted-foreground">
          .txt and .docx are read in full; .pdf is recorded by name and not read in this build.
        </span>
        {documents.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px]"
            onClick={() => clearDepartmentDocuments(department.id)}
          >
            Remove all
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Title</span>
          <Input
            value={pastedTitle}
            placeholder="e.g. National ICT Policy 2015"
            onChange={(event) => setPastedTitle(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Text (for a document you cannot upload)
          </span>
          <Input
            value={pastedText}
            placeholder="Paste the document's text here"
            onChange={(event) => setPastedText(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addPasted}>
          Add this document
        </Button>
      </div>

      {notices.length > 0 && (
        <ul className="mt-3 space-y-1" aria-live="polite">
          {notices.map((notice) => (
            <li key={notice} className="text-[10px] leading-relaxed text-muted-foreground">
              {notice}
            </li>
          ))}
        </ul>
      )}

      {documents.length > 0 && (
        <ul className="mt-3 space-y-1">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs text-foreground">{document.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {document.kind.toUpperCase()} · {document.sizeLabel} ·{" "}
                  {formatReferenceDate(document.addedAt)}
                </span>
                <span
                  className={
                    document.text ? "text-[10px] text-primary" : "text-[10px] text-muted-foreground"
                  }
                >
                  {document.text
                    ? `${document.status} ${document.text.length} characters will be read into every run.`
                    : `${document.status} Nothing of this file will be read into a run.`}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 shrink-0 text-[10px]"
                aria-label={`Remove ${document.name}`}
                onClick={() => removeDepartmentDocument(document.id)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
