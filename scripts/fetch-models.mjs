#!/usr/bin/env node
/**
 * DOWNLOAD THE RESEARCH MODELS INTO THE SITE'S OWN FOLDER — `npm run fetch:models`.
 *
 * WHY THIS EXISTS. The owner's decision (2026-10-07): the research engine must work for the
 * demonstration, using the FREE model that runs inside the visitor's browser — the default recorded in
 * `docs/ZEPARI_BUILD_PLAN.md` (Stage B): "a small open-source model runs IN THE BROWSER … Fetched from
 * OUR OWN SITE; no key, no cost, nothing to install."
 *
 * So the model files are downloaded ONCE here and served from our own web root. The browser never
 * fetches anything from huggingface.co or any other outside address at runtime — that is the owner's
 * own instruction ("local models … not chatboxes that are hosted outside Zimbabwe"), and a browser
 * test asserts that no request leaves our origin while an answer is produced.
 *
 * THE FILES ARE NOT COMMITTED. They are about 92 MB of binary, so `public/models/` is in `.gitignore`
 * and this script is what puts them on a machine. `npm run build` copies `public/` into `dist/`, and
 * `npm run deploy` uploads them with the rest of the site. A machine that has never run this script
 * still builds and still works — the assistant then answers from the library alone (see
 * `src/services/research/researchAssembly.ts`), which is the "without AI" half of the same plan.
 *
 * WHAT IS DOWNLOADED, with the size checked against Hugging Face on 2026-10-07:
 *   onnx-community/mobilebert-uncased-squad-v2-ONNX  onnx/model_quantized.onnx   25.7 MB
 * plus the model's tokenizer/config files (about 1 MB).
 *
 * ONLY WHAT THE ENGINE USES IS DOWNLOADED. `Xenova/all-MiniLM-L6-v2` (23 MB) is the plan's SEMANTIC
 * SEARCH model — finding passages by meaning rather than by wording — and the answering half was built
 * first because that is the half the owner sees. When semantic search is wired in, add this entry back
 * to `MODELS` below and nothing else changes:
 *   { id: "Xenova/all-MiniLM-L6-v2", role: "semantic search", files: ["config.json",
 *     "special_tokens_map.json", "tokenizer.json", "tokenizer_config.json", "vocab.txt",
 *     "onnx/model_quantized.onnx"] },
 */

import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline as streamPipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_MODELS = join(ROOT, "public", "models");
const ORT_TARGET = join(PUBLIC_MODELS, "ort");

/**
 * ONLY THE ENGINE FILE A REAL BROWSER ASKS FOR is copied. The package ships four WebAssembly variants
 * (about 90 MB in total) and keeping more than one puts tens of megabytes of never-requested binary on
 * the server. MEASURED twice, 2026-10-07 in Chromium: the engine asked for `…asyncify.wasm` (26 MB).
 * A second variant (`…jsep.wasm`, 27 MB) was kept at first "in case a WebGPU browser wants it", and
 * then REMOVED on the owner's instruction that this is for the demonstration: a browser that asked for
 * it would get a 404 and the assistant would fall back to quoting the library, and the full set belongs
 * on the VPS, not here.
 */
const ORT_VARIANTS = /^ort-wasm-simd-threaded\.asyncify\.(wasm|mjs)$/;

/**
 * THE MODEL THE ENGINE RUNS — chosen for the demonstration.
 *
 * The owner's decision (2026-10-07): this must go onto the demo site quickly, "because this is only for
 * demo purpose to show that it actually works… once the approve we will load on it on a VPS". The
 * first model tried was `Xenova/distilbert-base-uncased-distilled-squad` at 65 MB; MobileBERT fine-tuned
 * on SQuAD v2 gives a very similar style of answer at 25.7 MB, and the site's upload speed is about
 * 16 KiB/s, so the smaller one is roughly 40 minutes sooner to publish.
 *
 * THE FULL MODEL IS A ONE-LINE CHANGE, and nothing else in the code needs to move when it is swapped:
 * replace the `id` below with "Xenova/distilbert-base-uncased-distilled-squad" and run
 * `npm run fetch:models` on the machine that publishes. Recorded here so the VPS step is trivial.
 */
const MODELS = [
  {
    id: "onnx-community/mobilebert-uncased-squad-v2-ONNX",
    role: "answering — pulls the sentence that answers a question out of the passages",
    files: [
      "config.json",
      "special_tokens_map.json",
      "tokenizer.json",
      "tokenizer_config.json",
      "vocab.txt",
      "onnx/model_quantized.onnx",
    ],
  },
];

const force = process.argv.includes("--force");

/** A file that already exists is left alone unless `--force` is passed. */
const alreadyThere = async (path) => {
  if (force) return false;
  try {
    const info = await stat(path);
    return info.size > 0;
  } catch {
    return false;
  }
};

const downloadOne = async (url, target) => {
  if (await alreadyThere(target)) {
    const { size } = await stat(target);
    console.log(`  = ${target.slice(ROOT.length + 1)} — already here (${Math.round(size / 1048576)} MB)`);
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`${url} answered ${response.status}`);
  }
  await streamPipeline(Readable.fromWeb(response.body), createWriteStream(target));
  const { size } = await stat(target);
  console.log(`  + ${target.slice(ROOT.length + 1)} — ${Math.round(size / 1024)} kB`);
};

/**
 * The browser engine also needs ONNX Runtime's own WebAssembly files. They ship inside the installed
 * package, so they are COPIED from there rather than downloaded — nothing outside this machine is
 * involved. Without this they would be fetched from a public CDN at run time, which is exactly what
 * the sovereignty instruction forbids.
 */
const copyOrtFiles = async () => {
  const source = join(ROOT, "node_modules", "onnxruntime-web", "dist");
  let names;
  try {
    names = await readdir(source);
  } catch {
    console.log("  ! onnxruntime-web is not installed yet — run `npm install` first. Skipped.");
    return;
  }
  const wanted = names.filter((name) => ORT_VARIANTS.test(name));
  if (!wanted.length) {
    console.log("  ! no ONNX runtime WebAssembly files found in the installed package. Skipped.");
    return;
  }
  await mkdir(ORT_TARGET, { recursive: true });
  for (const name of wanted) {
    const to = join(ORT_TARGET, name);
    if (await alreadyThere(to)) {
      console.log(`  = public/models/ort/${name} — already here`);
      continue;
    }
    const bytes = await readFile(join(source, name));
    await writeFile(to, bytes);
    console.log(`  + public/models/ort/${name} — ${Math.round(bytes.length / 1024)} kB`);
  }
};

const main = async () => {
  console.log("Fetching the research models into the site's own folder (public/models/)…");
  console.log("Nothing is fetched from an outside address while the site runs — only here, once.\n");

  for (const model of MODELS) {
    console.log(`${model.id}  (${model.role})`);
    for (const file of model.files) {
      const url = `https://huggingface.co/${model.id}/resolve/main/${file}`;
      await downloadOne(url, join(PUBLIC_MODELS, model.id, file));
    }
    console.log("");
  }

  console.log("The browser engine's own WebAssembly files (copied from the installed package):");
  await copyOrtFiles();

  console.log(
    [
      "",
      "Done. `npm run build` copies these into dist/, and `npm run deploy` uploads them.",
      "They are NOT in the code store — public/models/ is gitignored on purpose (about 53 MB).",
      "",
    ].join("\n"),
  );
};

main().catch((error) => {
  console.error(`\nThe models could not be fetched: ${error.message}`);
  console.error("The site still works without them: the assistant answers from the library alone.");
  process.exitCode = 1;
});