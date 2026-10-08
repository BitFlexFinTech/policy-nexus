#!/usr/bin/env node
/**
 * DROP THE DUPLICATE ENGINE FILE FROM THE BUILT SITE — `npm run build` runs this after `vite build`.
 *
 * WHY. The bundler copies ONNX Runtime's WebAssembly file into `dist/assets/` under a hashed name
 * (about 27 MB) because the engine library refers to it. Our code deliberately does NOT use that copy:
 * it points the engine at `/models/ort/` (`env.backends.onnx.wasm.wasmPaths`), which is the copy
 * `npm run fetch:models` puts there under the exact name the engine asks for. The browser proof
 * (`e2e/research-model.spec.ts`) records exactly which files the browser reads, and every one of them
 * comes from `/models/`.
 *
 * So the hashed copy is 27 MB of binary that no visitor ever downloads, and at this host's upload speed
 * it is about half an hour of publishing. It is removed here, after the build, so the fresh copy cannot
 * creep back in unnoticed. If the engine ever started asking for it, the browser proof would fail — the
 * tests run against this pruned build.
 */

import { readdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "dist", "assets");

const sizeOf = async (path) => {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
};

const names = await readdir(ASSETS).catch(() => []);
const duplicates = names.filter((name) => /^ort-wasm.*\.wasm$/.test(name));

if (!duplicates.length) {
  console.log("dist/assets holds no duplicate engine file — nothing to remove.");
} else {
  let removed = 0;
  for (const name of duplicates) {
    const size = await sizeOf(join(ASSETS, name));
    removed += size;
    await rm(join(ASSETS, name));
    console.log(`  − dist/assets/${name} (${Math.round(size / 1048576)} MB)`);
  }
  const kept = await sizeOf(join(ROOT, "dist", "models", "ort", "ort-wasm-simd-threaded.asyncify.wasm"));
  console.log(
    `Removed ${Math.round(removed / 1048576)} MB the browser never asks for. ` +
      `The engine reads its file from /models/ort/ instead (${Math.round(kept / 1048576)} MB, kept).`,
  );
}
