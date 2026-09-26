import { Check } from "lucide-react";
import { DEPARTMENTS, DEPARTMENT_COUNT, type DepartmentId } from "@/config/departments";
import { cn } from "@/lib/utils";

interface DepartmentGridProps {
  /** Id of the currently selected department, if any. */
  selectedId?: string | null;
  /** Called with the department id when a department is chosen. */
  onSelect: (departmentId: DepartmentId) => void;
  /** Optional extra classes for the grid container. */
  className?: string;
}

/**
 * The public entry point into the platform: all 16 departments as real,
 * keyboard-accessible buttons. The list is rendered from `DEPARTMENTS`, so a
 * department can never be silently missing from this screen.
 *
 * This is a native button list rather than a set of cards with click handlers,
 * so Tab/Shift-Tab, Enter and Space all work without extra key handling.
 */
export function DepartmentGrid({ selectedId, onSelect, className }: DepartmentGridProps) {
  return (
    <div
      role="group"
      aria-label={`Select a department — ${DEPARTMENT_COUNT} available`}
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}
    >
      {DEPARTMENTS.map((department) => {
        const isSelected = department.id === selectedId;
        return (
          <button
            key={department.id}
            type="button"
            onClick={() => onSelect(department.id)}
            aria-pressed={isSelected}
            className={cn(
              "flex h-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "hover:border-primary/40 hover:bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {department.abbr}
              </span>
              {isSelected && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Selected
                </span>
              )}
            </div>

            <span className="text-sm font-semibold leading-snug tracking-tight text-foreground">
              {department.shortName}
            </span>

            <span className="text-[10px] leading-relaxed text-muted-foreground">
              {department.name}
            </span>

            <span className="mt-auto pt-1 text-[10px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{department.priorities[0].label}</span>
              {" · "}
              {department.indicators.length} indicators · {department.policyTemplates.length} policy templates
            </span>
          </button>
        );
      })}
    </div>
  );
}