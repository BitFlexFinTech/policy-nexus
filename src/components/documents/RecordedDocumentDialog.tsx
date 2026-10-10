import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND } from "@/config/brand";
import type { DepartmentDocument } from "@/config/departments";

/**
 * What the register knows about one published document.
 *
 * Since Batch B4 the register holds real, published documents, so this states what the source itself
 * says: the body that published it, the date it states, how long the file is, whether its text could
 * really be read, and the address of the published file so an officer can check it. Nothing is
 * inferred from a filename and nothing is invented.
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
    ["Published by", document.publisher],
    ["Published", document.date],
    ["Length", `${document.pages} pages`],
    [
      "Text read",
      document.read
        ? `${document.characters} characters read from the published file`
        : "Not read — the published file is a picture-only scan",
    ],
    ["Held by", departmentName],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{document.title}</DialogTitle>
          <DialogDescription className="text-xs">
            {document.section} · {document.publisher}, {document.date}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0"
            >
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="text-right text-xs text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          The published file:{" "}
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-primary underline"
          >
            {document.url}
          </a>
        </p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          This platform holds the register of these documents, and the text of each published file as it
          was read from the body that published it. To work with your own file's contents, upload it to
          the policy input — plain text is read in the browser. {BRAND.classification}.
        </p>
      </DialogContent>
    </Dialog>
  );
}
