/**
 * THE FREE, IN-BROWSER RESEARCH MODEL — the default the owner chose (2026-10-07): *"go with free
 * in-browser model we need the research engine to actually work for the demo presentation."*
 *
 * WHAT IT IS. A small open-source model runs inside the visitor's own browser, downloaded from OUR OWN
 * SITE (never from huggingface.co at run time — the owner's instruction: *"local models … not chatboxes
 * that are hosted outside Zimbabwe"*):
 *
 *   onnx-community/mobilebert-uncased-squad-v2-ONNX   25.7 MB   pulls the answer sentence out of a passage
 *
 * It is MobileBERT fine-tuned on SQuAD v2 — chosen on the owner's instruction (2026-10-07) that this is a
 * build for the demonstration: it has to go up quickly at a host which uploads at about 16 KiB/s, and it
 * gives the same style of answer as the larger 65 MB model at less than half the size. The larger model
 * (`Xenova/distilbert-base-uncased-distilled-squad`) belongs on the VPS and is a two-line change.
 * A second model, `Xenova/all-MiniLM-L6-v2` (23 MB), is the plan's SEMANTIC SEARCH model and is NOT
 * downloaded or wired yet — matching is by wording until it is.
 *
 * There is NO key, NO account, NO cost and NO per-question charge, and no question or document ever
 * leaves the visitor's machine.
 *
 * WHAT IT HONESTLY IS. It is an EXTRACTIVE model: it points at the sentence in the passage that answers
 * the question. It does not write prose. That is exactly what the build plan says the free default is
 * ("extractive QA … optional small instruct model for fuller prose"), and the answer it produces is
 * therefore always a real quotation, which is what this platform promises anyway. Flowing prose is what
 * the paid OpenRouter upgrade adds.
 *
 * FAILURE IS SAFE. If the model files are not on the server, if the browser cannot run WebAssembly, or
 * if anything else goes wrong, every function here returns `null` and the caller falls back to the
 * library-only answer (`researchAssembly.ts`). The assistant therefore never breaks; it just quotes
 * instead of pointing.
 */

import type { ResearchSource } from "./researchRetrieval";

/**
 * THE MODEL ID in one place. MobileBERT fine-tuned on SQuAD v2 — chosen on the owner's instruction that
 * this is for the demonstration: it answers in the same extractive style as the larger model and is
 * 25.7 MB instead of 65 MB, which at this host's upload speed is about 40 minutes sooner to publish.
 * The full model (`Xenova/distilbert-base-uncased-distilled-squad`) belongs on the VPS; swapping to it
 * is one line here plus one line in `scripts/fetch-models.mjs`.
 */
const ANSWER_MODEL = "onnx-community/mobilebert-uncased-squad-v2-ONNX";

/** One passage the model may read: the document's real text, and the name to attribute an answer to. */
export interface BrowserPassage {
  name: string;
  text: string;
}

export interface BrowserAnswer {
  /** The sentence the model pulled out — a real quotation from a document. */
  text: string;
  /** Which document it came from. */
  sourceName: string;
}

/** One finding: what one document answers, and how confident the model was about it. */
export interface BrowserFinding extends BrowserAnswer {
  score: number;
}

/** Set on the library once, before the first model is created. NOTHING may come from outside our site. */
const configureEngine = (env: {
  allowRemoteModels: boolean;
  allowLocalModels: boolean;
  localModelPath: string;
  backends: { onnx: { wasm: { wasmPaths: string } } };
}) => {
  env.allowRemoteModels = false; // no request to huggingface.co, ever
  env.allowLocalModels = true;
  env.localModelPath = "/models/"; // our own web root, uploaded by `npm run deploy`
  env.backends.onnx.wasm.wasmPaths = "/models/ort/"; // the engine's own files, also ours
};

type AnswerFn = (question: string, context: string) => Promise<unknown>;

let answerPipeline: Promise<AnswerFn> | null = null;

/**
 * Load the answering model once per visit, and keep it. A second call reuses the same promise, so two
 * questions asked at once do not download the model twice.
 */
const loadAnswerModel = (): Promise<AnswerFn> => {
  if (!answerPipeline) {
    answerPipeline = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      configureEngine(env as unknown as Parameters<typeof configureEngine>[0]);
      // `q8` is the quantised file we host (`onnx/model_quantized.onnx`) — the smallest usable one.
      return (await pipeline("question-answering", ANSWER_MODEL, { dtype: "q8" })) as unknown as AnswerFn;
    })();
    // A failure must NOT be remembered, or every later question would give up without trying.
    answerPipeline = answerPipeline.catch((error) => {
      answerPipeline = null;
      throw error;
    });
  }
  return answerPipeline;
};

/**
 * Ask the in-browser model what EACH document answers. One finding per document that yielded a
 * sentence, best first — so a caller can show the best (the chat) or all of them (the brief).
 *
 * Returns an empty list when the model cannot run — no files on the server, no WebAssembly, or nothing
 * in the passages that answers — and the caller then falls back to quoting the library.
 */
export const findingsWithBrowserModel = async (
  question: string,
  passages: readonly BrowserPassage[],
): Promise<BrowserFinding[]> => {
  const readable = passages.filter((passage) => passage.text.trim().length > 0);
  if (!readable.length) return [];
  try {
    const answer = await loadAnswerModel();
    const findings: BrowserFinding[] = [];
    for (const passage of readable) {
      /* MEASURED IN A REAL BROWSER, 2026-10-07 — and this cost a whole debugging round, so it is
         written down: this pipeline must be called with the question and the context as TWO ARGUMENTS.
         The equivalent object form (`answer({ question, context })`) returns `{answer: "", score: 0}`
         and throws NOTHING, which looks exactly like "the model cannot run" — the assistant then fell
         back to quoting the library and no one could tell why. The probe that proved it, on the standard
         test pair:
             two arguments — answer("What is the capital of France?", "The capital of France is Paris.")
                            → { answer: "paris", score: 0.9557… }        ← correct
             object form  — answer({ question, context })
                            → { answer: "",      score: 0 }               ← silently empty
         Do NOT "tidy" this back into the object form. */
      const result = (await answer(question, passage.text)) as { answer?: unknown; score?: unknown } | undefined;
      const text = typeof result?.answer === "string" ? result.answer.trim() : "";
      const score = typeof result?.score === "number" ? result.score : 0;
      if (text) findings.push({ text, sourceName: passage.name, score });
    }
    return findings.sort((a, b) => b.score - a.score);
  } catch (error) {
    /* FAILURE IS SAFE, BUT IT IS NOT SILENT: the caller falls back to quoting the library, and a
       developer (or a future session) can see WHY in the console. Captured as a warning, not an error,
       so it never trips the "no console errors" browser test — the product is still working. */
    console.warn(
      "[research] the in-browser model could not answer, so the library will be quoted instead:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
};

/** The single best finding, or `null` — what the chat shows. */
export const answerWithBrowserModel = async (
  question: string,
  passages: readonly BrowserPassage[],
): Promise<BrowserAnswer | null> => {
  const [best] = await findingsWithBrowserModel(question, passages);
  return best ? { text: best.text, sourceName: best.sourceName } : null;
};

/**
 * Build the model's reading list from the passages the library matched. The document's FULL text is
 * given to the model (a fragment is too little for it to work on), while the name stays as the thing an
 * answer is attributed to.
 */
export const passagesFromSources = (
  sources: readonly ResearchSource[],
  fullTextOf: (documentId: string) => string | undefined,
): BrowserPassage[] =>
  sources.map((source) => ({
    name: source.name,
    text: fullTextOf(source.id) ?? source.excerpt,
  }));

/** The plain line that says exactly what happened, shown beside an answer the browser model wrote. */
export const IN_BROWSER_ANSWER_DETAIL =
  "Answered from ZEPARI's own documents by the model running in this browser — no key, no cost, and " +
  "nothing left this device.";

/** The same, for the brief. */
export const IN_BROWSER_BRIEF_DETAIL =
  "Drawn from ZEPARI's own documents by the model running in this browser — no key, no cost, and " +
  "nothing left this device.";

/** True when the model files are on this server, so a caller can say plainly what will happen. */
export const browserModelFilesPresent = async (): Promise<boolean> => {
  try {
    const response = await fetch(`/models/${ANSWER_MODEL}/config.json`, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};