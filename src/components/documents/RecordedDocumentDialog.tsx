import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND } from "@/config/brand";
import { citedInstrumentLabel } from "@/config/instruments";
import { formatReferenceDate } from "@/config/reference";
import type { DepartmentDocument } from "@/config/departments";

/**
 * What the register knows about one department document.
 *
 * The register holds the record, not the file, and this build stores no document
 * content — so this states what the document is rather than pretending to open
 * it. Selecting a document therefore produces a real answer instead of a row that
 * looks clickable and does nothing.
 *
 * Where the document cites an instrument, this names it. The citation is DERIVED from
 * `CITED_INSTRUMENTS`, so the dialog and the rail can never show different titles.
 */
export function RecordedDocumentDialog({
  document,
  departmentName,
  open,
  onOpenChange,
}: {
  document: DepartmentDocument | null;
  departmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!document) return null;

  const rows: Array<[string, string]> = [
    ["Format", document.kind.toUpperCase()],
    ["Recorded size", document.sizeLabel],
    ["Recorded date", formatReferenceDate(document.date)],
  ];
  if (document.instrument) rows.push(["Prepared under", citedInstrumentLabel(document.instrument)]);
  rows.push(["Held by", departmentName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{document.name}</DialogTitle>
          <DialogDescription className="text-xs">{document.note}</DialogDescription>
        </DialogHeader>
        <dl className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0"
            >
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="text-xs text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          This platform holds the department's document register, not the files themselves. To work
          with a document's contents, upload it to the policy input — plain text is read in the
          browser. {BRAND.classification}.
        </p>
      </DialogContent>
    </Dialog>
  );
}
