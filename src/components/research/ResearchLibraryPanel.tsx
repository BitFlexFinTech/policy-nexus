import { useState, useSyncExternalStore } from "react";
import { FilePlus2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatReferenceDate } from "@/config/reference";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import { extractPolicyFile, isAcceptedPolicyFile } from "@/services/extraction/extractPolicyText";
import {
  getResearchDocumentsServerSnapshot,
  getResearchDocumentsSnapshot,
  isResearchDocumentStorePersistent,
  subscribeToResearchDocuments,
} from "@/services/research/researchDocuments";
import { researchDocumentStoreFor } from "@/services/research/researchDocumentStore";

/**
 * ZEPARI's research library (ZEPARI Batch C).
 *
 * The owner's decision: the research assistant keeps ZEPARI's own documents, stored on the servers
 * ZEPARI holds. Until that server is connected the documents are kept in THIS BROWSER, and the panel
 * says so plainly. Files are read in the browser through the platform's existing extraction seam
 * (`.txt`, `.docx` and `.xlsx` in full; a `.pdf` is recorded by name and marked not read), and text
 * can be pasted for a document that cannot be uploaded. Every add and remove goes through the seam,
 * so connecting ZEPARI's server later is a configuration change and nothing else.
 */
export function ResearchLibraryPanel() {
  const config = usePlatformConfig();
  const store = researchDocumentStoreFor(config);
  // The subscription keeps this panel live; the seam reads the same browser copy it holds.
  useSyncExternalStore(
    subscribeToResearchDocuments,
    getResearchDocumentsSnapshot,
    getResearchDocumentsServerSnapshot,
  );
  const documents = store.list();

  const [isReading, setIsReading] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  const readFiles = async (files: File[]) => {
    const accepted = files.filter((file) => isAcceptedPolicyFile(file.name, file.type));
    if (accepted.length === 0) {
      setNotices(["No readable file was chosen. This build reads .txt, .docx and .xlsx files."]);
      return;
    }
    setIsReading(true);
    const messages: string[] = [];
    for (const file of accepted) {
      const extracted = await extractPolicyFile(file);
      try {
        await store.add({
          name: extracted.name,
          sizeLabel: extracted.sizeLabel,
          kind: extracted.kind,
          // Only text that was really read is stored: a file recorded by name keeps an empty text,
          // so the surface can never claim it read something it could not.
          text: extracted.extracted ? extracted.text : "",
          status: extracted.status,
        });
        messages.push(`${extracted.name} — ${extracted.status}`);
      } catch (error) {
        messages.push(
          `${extracted.name} — this browser kept it, but the research library server did not accept it (${
            error instanceof Error ? error.message : "unknown error"
          }).`,
        );
      }
    }
    setNotices(messages);
    setIsReading(false);
  };

  const addPasted = async () => {
    const title = pastedTitle.trim();
    const text = pastedText.trim();
    if (!title || !text) {
      setNotices(["A pasted document needs both a title and its text."]);
      return;
    }
    try {
      await store.add({
        name: title,
        sizeLabel: `${text.length} characters`,
        kind: "text",
        text,
        status: "Text added directly — read in full.",
      });
      setPastedTitle("");
      setPastedText("");
      setNotices([`${title} — added and read in full.`]);
    } catch (error) {
      setNotices([
        `${title} — this browser kept it, but the research library server did not accept it (${
          error instanceof Error ? error.message : "unknown error"
        }).`,
      ]);
    }
  };

  const reportLibraryFailure = (error: unknown) =>
    setNotices([
      `This browser updated the list, but the research library server did not accept the change (${
        error instanceof Error ? error.message : "unknown error"
      }).`,
    ]);

  return (
    <section aria-labelledby="research-library-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-library-heading"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Research library
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        ZEPARI's own research documents. Files added here are read by this browser and kept for the
        research assistant. {documents.length}{" "}
        {documents.length === 1 ? "document has" : "documents have"} been added.
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Kept on: {store.label}.</span> {store.limitation}
        {isResearchDocumentStorePersistent()
          ? ""
          : " This browser refused to keep data between visits, so they last only until this page is closed."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/60">
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
          {isReading ? "Reading…" : "Add a document"}
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".txt,.docx,.xlsx,text/plain"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) void readFiles(files);
            }}
          />
        </label>
        <span className="text-[10px] text-muted-foreground">
          .txt, .docx and .xlsx are read in full; .pdf is recorded by name and not read in this build.
        </span>
        {documents.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px]"
            onClick={() => void store.clear().catch(reportLibraryFailure)}
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
            placeholder="e.g. Economic Barometer 2026 Q1"
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
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void addPasted()}>
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
                    ? `${document.status} ${document.text.length} characters are kept.`
                    : `${document.status} Nothing of this file was read.`}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 shrink-0 text-[10px]"
                aria-label={`Remove ${document.name}`}
                onClick={() => void store.remove(document.id).catch(reportLibraryFailure)}
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
