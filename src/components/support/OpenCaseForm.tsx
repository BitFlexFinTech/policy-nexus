import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROMOTER } from "@/config/brand";
import { officerDisplayName } from "@/config/officer";
import { SUPPORT_CATEGORIES, type SupportCategory } from "@/config/support";
import { useSession } from "@/session/useSession";
import { supportCaseActions } from "@/services/support/useSupportCases";

const FIELD_LABEL = "text-[10px] uppercase tracking-wide text-muted-foreground";

/**
 * The officer's "Open a case" form. It records a case for the signed-in department through
 * the support seam — today the SIMULATED desk, so the case is kept in this browser only and
 * the page states that plainly. The officer's department comes from the session, never from
 * a field they could mistype, so a case is always tied to the right department.
 */
export function OpenCaseForm() {
  const session = useSession();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>(SUPPORT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const departmentId = session?.departmentId ?? null;

  const submit = () => {
    if (!departmentId) return;
    const created = supportCaseActions.openSupportCase({
      departmentId,
      subject,
      category,
      description,
      openedBy: session?.officer ? officerDisplayName(session.officer) : null,
    });
    if (!created) {
      setNotice("Add a subject before opening a case.");
      return;
    }
    setSubject("");
    setCategory(SUPPORT_CATEGORIES[0]);
    setDescription("");
    setNotice(
      `Opened ${created.id}. ${PROMOTER.name} support sees it on the administration screen.`,
    );
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-xs font-semibold tracking-tight text-foreground">Open a case</h2>
      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
        Tell {PROMOTER.name} support what went wrong or what you need. A case is a support ticket:
        it is reviewed on the administration screen and delegated to a support representative.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="case-subject" className={FIELD_LABEL}>
            Subject
          </Label>
          <Input
            id="case-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="A short summary of the issue"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="case-category" className={FIELD_LABEL}>
            Category
          </Label>
          <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
            <SelectTrigger id="case-category" aria-label="Category" className="h-8 text-xs">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="case-details" className={FIELD_LABEL}>
            What happened
          </Label>
          <Textarea
            id="case-details"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="What you were doing, what you expected, and what you saw."
            className="text-xs"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" className="h-8 text-xs" onClick={submit} disabled={!subject.trim()}>
          Open a case
        </Button>
        {notice && <span className="text-[10px] font-medium text-primary">{notice}</span>}
      </div>
    </section>
  );
}
