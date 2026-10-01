import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fillableRows, type DocumentFills, type FillField } from "@/services/assessment/matrices";
import type { AssessmentRun } from "@/services/assessment/types";
import type { Department } from "@/config/departments";

/** The plain name of each answer, so a box is never labelled with a database word. */
const FIELD_LABEL: Record<FillField, string> = {
  office: "Responsible office",
  date: "Target date",
  funding: "Funding source",
  target: "Target",
  frequency: "Frequency",
  amount: "Amount",
};

/**
 * The form that completes the working matrices.
 *
 * This is where the department's own answers go — the office that carries a measure, the date it is due,
 * the budget line that pays for it, the target and the collecting office for each indicator. Typed here
 * ONCE, then printed into both the drafted policy and the Implementation pack, so the two can never show
 * different offices for the same measure.
 *
 * A box left empty keeps printing the marked blank. Nothing is ever filled in with a guess.
 */
export function ImplementationForm({
  run,
  department,
  fills,
  setField,
  clear,
  answered,
  persistent,
}: {
  run: AssessmentRun;
  department: Department;
  fills: DocumentFills;
  setField: (rowKey: string, field: FillField, value: string) => void;
  clear: () => void;
  answered: number;
  persistent: boolean;
}) {
  const rows = fillableRows(run, department);

  return (
    <section aria-label="Complete the working matrices" className="rounded-lg border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-2.5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Complete the working matrices
          </div>
          <p className="mt-0.5 max-w-3xl text-[10px] leading-relaxed text-muted-foreground">
            These are the values only your department can state. Type each one once — every document that
            prints it, including the drafted policy, then shows your answer instead of a blank.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {answered} of {rows.length} rows completed
          </span>
          {answered > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clear}>
              Clear all answers
            </Button>
          )}
        </div>
      </header>

      <div className="divide-y">
        {rows.map((row, index) => {
          const startsGroup = index === 0 || rows[index - 1].group !== row.group;
          return (
            <div key={row.key} className="px-4 py-2">
              {startsGroup && (
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {row.group}
                </div>
              )}
              <div className="text-xs font-medium text-foreground">{row.label}</div>
              <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {row.fields.map((field) => (
                  <label key={field} className="block">
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                      {FIELD_LABEL[field]}
                    </span>
                    <Input
                      value={fills[row.key]?.[field] ?? ""}
                      onChange={(event) => setField(row.key, field, event.target.value)}
                      placeholder="To be confirmed"
                      className="mt-0.5 h-7 text-xs"
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="border-t px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
        {persistent
          ? "Your answers are kept in this browser, for this run, so they are still here when you come back — and they appear in both the drafted policy and this pack. They are not sent anywhere."
          : "This browser refused to keep data between visits, so your answers last only until this page is closed."}
      </p>
    </section>
  );
}
