import { useState, useSyncExternalStore } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS, findDepartment, type DepartmentId } from "@/config/departments";
import { RESEARCH_BOUNDARY } from "@/config/research";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import {
  getResearchFindingsServerSnapshot,
  getResearchFindingsSnapshot,
  isResearchFindingStorePersistent,
  subscribeToResearchFindings,
} from "@/services/research/researchFindings";
import { researchFindingsStoreFor } from "@/services/research/researchFindingsStore";

/**
 * Findings to departments (the last ZEPARI surface).
 *
 * A finding is routed to the departments it concerns. It is a NOTE for a human reader: the strict
 * boundary holds — a finding is never read by the simulation engine.
 */
export function ResearchFindingsPanel() {
  const config = usePlatformConfig();
  const store = researchFindingsStoreFor(config);
  useSyncExternalStore(
    subscribeToResearchFindings,
    getResearchFindingsSnapshot,
    getResearchFindingsServerSnapshot,
  );
  const findings = store.list();

  const [notices, setNotices] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<DepartmentId[]>([]);

  const toggle = (id: DepartmentId) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  const add = async () => {
    const cleanText = text.trim();
    if (!cleanText || selected.length === 0) {
      setNotices(["A finding needs its text AND at least one department it concerns."]);
      return;
    }
    try {
      await store.add({ text: cleanText, departments: selected });
      setText("");
      setSelected([]);
      setNotices([`Finding routed to ${selected.length} department${selected.length === 1 ? "" : "s"}.`]);
    } catch (error) {
      setNotices([
        `This browser recorded it, but the findings server did not accept it (${
          error instanceof Error ? error.message : "unknown error"
        }).`,
      ]);
    }
  };

  const reportFailure = (error: unknown) =>
    setNotices([
      `This browser updated the findings, but the server did not accept the change (${
        error instanceof Error ? error.message : "unknown error"
      }).`,
    ]);

  const departmentNames = (ids: readonly DepartmentId[]): string =>
    ids.map((id) => findDepartment(id)?.shortName ?? id).join(", ");

  return (
    <section aria-labelledby="research-findings-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-findings-heading"
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
        Findings to departments
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Record a finding and route it to the departments it concerns. A finding is a note for a person
        to read — {RESEARCH_BOUNDARY}
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Kept on: {store.label}.</span> {store.limitation}
        {isResearchFindingStorePersistent()
          ? ""
          : " This browser refused to keep data between visits, so they last only until this page is closed."}
      </p>

      <div className="mt-3 space-y-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Finding</span>
          <Input
            value={text}
            placeholder="e.g. mineral revenue is concentrated in a few districts"
            onChange={(event) => setText(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>

        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Route to ({selected.length} selected)
          </span>
          <ul className="mt-1 grid max-h-40 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
            {DEPARTMENTS.map((department) => (
              <li key={department.id}>
                <label className="flex items-center gap-1.5 text-[11px] text-foreground">
                  <input
                    type="checkbox"
                    checked={selected.includes(department.id)}
                    onChange={() => toggle(department.id)}
                  />
                  {department.shortName}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void add()}>
          Record this finding
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

      {findings.length > 0 && (
        <div className="mt-3 space-y-1">
          <ul className="space-y-1">
            {findings.map((finding) => (
              <li
                key={finding.id}
                className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs text-foreground">{finding.text}</span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    Routed to: {departmentNames(finding.departments)}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 shrink-0 text-[10px]"
                  aria-label={`Remove finding`}
                  onClick={() => void store.remove(finding.id).catch(reportFailure)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px]"
            onClick={() => void store.clear().catch(reportFailure)}
          >
            Remove all
          </Button>
        </div>
      )}
    </section>
  );
}
