import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { draftResearchBrief, type ResearchBrief } from "@/services/research/researchBrief";

/**
 * The research policy brief (ZEPARI Batch F).
 *
 * A topic is matched against ZEPARI's research library, and the brief's structure and the sources it
 * draws on are always shown. When a research model is connected it drafts the brief from those sources
 * only; when none is connected the brief is still PRODUCED — assembled from the matched passages in its
 * fixed sections, with the one section that needs a judgement saying plainly that it was not produced.
 * It never says anything the documents do not. Nothing here reaches the simulation engine.
 */
export function ResearchBriefPanel() {
  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [drafting, setDrafting] = useState(false);

  const draft = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setBrief(null);
      return;
    }
    setDrafting(true);
    setBrief(await draftResearchBrief(trimmed));
    setDrafting(false);
  };

  return (
    <section aria-labelledby="research-brief-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-brief-heading"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Policy brief
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        A short brief on a topic, drawn from ZEPARI's own documents with its sources shown. The
        structure is fixed. The words are written by the research model when one is connected, and
        quoted from the sources when none is — the brief never says anything the documents do not.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block min-w-[16rem] flex-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Topic</span>
          <Input
            value={topic}
            placeholder="e.g. mineral revenue and the fiscus"
            onChange={(event) => setTopic(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void draft();
            }}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <Button size="sm" className="h-8 text-xs" disabled={drafting} onClick={() => void draft()}>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {drafting ? "Drafting…" : "Draft the brief"}
        </Button>
      </div>

      {/* Same note as the chat's, for the same reason: the first brief is slow because the model is
          downloaded from this site once (about 80 MB). */}
      {drafting && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground" role="status">
          Drawing the brief from ZEPARI's documents with the model in this browser. The first brief
          downloads the model from this site once (about 80 MB); after that it is quick.
        </p>
      )}

      {brief && (
        <div className="mt-3 space-y-3">
          <p className="text-[10px] leading-relaxed text-muted-foreground">{brief.detail}</p>

          <div className="rounded-md border bg-background p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Structure
            </span>
            <p className="mt-1 text-xs leading-relaxed text-foreground">
              {brief.structure.join(" · ")}
            </p>
          </div>

          {brief.brief && (
            <div className="rounded-md border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Brief
              </span>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {brief.brief}
              </p>
            </div>
          )}

          {brief.sources.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sources ({brief.sources.length})
              </span>
              <ul className="mt-1 space-y-1">
                {brief.sources.map((source) => (
                  <li key={source.id} className="rounded-md border bg-background px-3 py-2">
                    <span className="text-xs font-medium text-foreground">{source.name}</span>
                    {source.excerpt && (
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        “{source.excerpt}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}