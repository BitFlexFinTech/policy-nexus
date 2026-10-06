import { Link } from "react-router-dom";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DOCUMENT_LIBRARY_PATH,
  RUN_NOTICE_TITLE,
  runNoticeBody,
  runNoticeNote,
} from "@/config/runNotice";

/**
 * The "before you run" notice (the owner's item 5).
 *
 * The owner asked for a notification on Run Simulation that says, honestly, that the drafted
 * policy is built from the real, published data the engine holds for the department — which is
 * currently limited — and that a department can make its policy longer and better grounded by
 * adding its own reports, spreadsheets and statistics to its Document Library. It is shown before
 * EVERY run (the owner made this a strict rule, revised 2026-10-06), and a small permanent note stays
 * beside the Run Simulation button so the message is never lost.
 *
 * The wording lives in `src/config/runNotice.ts`, so this file exports only components and the
 * pop-up and the note can never drift apart.
 */

/**
 * The dismissible pop-up. It opens before EVERY run an officer makes (the owner made this a
 * strict rule, revised 2026-10-06). It never blocks a run: "Run with the
 * data I have" starts the run exactly as before, and "Open the Document Library" takes the
 * officer to where the department adds its own documents.
 */
export function RunSimulationNotice({
  open,
  departmentName,
  onOpenChange,
  onOpenLibrary,
  onRun,
}: {
  open: boolean;
  departmentName: string;
  onOpenChange: (open: boolean) => void;
  onOpenLibrary: () => void;
  onRun: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{RUN_NOTICE_TITLE}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {runNoticeBody(departmentName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" size="sm" className="text-xs" onClick={onOpenLibrary}>
            <Library className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Open the Document Library
          </Button>
          <Button size="sm" className="text-xs" onClick={onRun}>
            Run with the data I have
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The permanent note beside the Run Simulation button — always visible, never dismissed. */
export function RunSimulationNote({ departmentName }: { departmentName: string }) {
  return (
    <p className="border-b bg-primary/5 px-3 py-1.5 text-[10px] leading-relaxed text-foreground">
      {runNoticeNote(departmentName)}{" "}
      <Link to={DOCUMENT_LIBRARY_PATH} className="font-medium text-primary hover:underline">
        Open the Document Library →
      </Link>
    </p>
  );
}

