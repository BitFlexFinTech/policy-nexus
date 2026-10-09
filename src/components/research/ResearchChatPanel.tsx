import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askResearchQuestion, type ResearchChatAnswer } from "@/services/research/researchChat";

/**
 * The grounded research chat (ZEPARI Batch E).
 *
 * A question is matched against ZEPARI's research library, and the passages that matched are shown as
 * the sources. When a research model is connected, it writes an answer drawn ONLY from those sources;
 * when none is connected the question is still ANSWERED — the matched passages are quoted from the
 * library, each under the document it came from, and the panel says plainly that the answer was
 * assembled rather than written. It never says anything the documents do not. Nothing here reaches the
 * simulation engine.
 */
export function ResearchChatPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ResearchChatAnswer | null>(null);
  const [asking, setAsking] = useState(false);

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      setAnswer(null);
      return;
    }
    setAsking(true);
    setAnswer(await askResearchQuestion(trimmed));
    setAsking(false);
  };

  return (
    <section aria-labelledby="research-chat-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-chat-heading"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Ask the research library
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Every answer is drawn from ZEPARI's own documents, and the sources it used are shown. The
        assistant will not answer from anything else, and never states a figure it did not read.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block min-w-[16rem] flex-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Question</span>
          <Input
            value={question}
            placeholder="e.g. What does the library say about mining revenue?"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void ask();
            }}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <Button size="sm" className="h-8 text-xs" disabled={asking} onClick={() => void ask()}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {asking ? "Asking…" : "Ask"}
        </Button>
      </div>

      {/* A question that is being answered must not look frozen. The research model is a real service
          now (its key is built into this copy of the platform), so this is a short wait, not a download. */}
      {asking && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground" role="status">
          Reading ZEPARI's documents…
        </p>
      )}

      {answer && (
        <div className="mt-3 space-y-3">
          <p className="text-[10px] leading-relaxed text-muted-foreground">{answer.detail}</p>

          {answer.answer && (
            <div className="rounded-md border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Answer
              </span>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {answer.answer}
              </p>
            </div>
          )}

          {answer.sources.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sources ({answer.sources.length})
              </span>
              <ul className="mt-1 space-y-1">
                {answer.sources.map((source) => (
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