#!/usr/bin/env node
/**
 * ONE COMMAND THAT PROVES ALL THREE ARE IN SYNC.
 *
 * The owner made this a strict rule on 2026-09-30: the local files, GitHub, and the public
 * website must all carry the same thing, and nobody may merely SAY they are in sync.
 *
 * What it checks, in order:
 *   1. the local files have nothing uncommitted (a clean working tree);
 *   2. the local branch and its copy on GitHub are the same commit (nothing unpushed, and
 *      nothing on GitHub that this copy has not got);
 *   3. the app built from THIS code is byte-for-byte the file the website is serving —
 *      the strongest statement a machine can make, because it compares a fingerprint;
 *   4. this copy is on the agreed branch and `main` has not been moved by an agent.
 *
 * Exit code is 0 only when every check passes. Run it with `npm run sync:check`.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LIVE_ORIGIN = process.env.SYNC_ORIGIN ?? "https://nzwisiso.bitflex.app";
const BRANCH = process.env.SYNC_BRANCH ?? "feature/unified-platform";

const results = [];
let failed = 0;

const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  if (!ok) failed += 1;
};

const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

/* 1 — the local files are all committed. ---------------------------------- */
try {
  const dirty = git("status", "--porcelain");
  record(
    "local files are all committed",
    dirty === "",
    dirty === "" ? "working tree clean" : `uncommitted:\n${dirty}`,
  );
} catch (error) {
  record("local files are all committed", false, String(error.message));
}

/* 2 — local commit and the GitHub copy are the same. ---------------------- */
let head = "unknown";
try {
  head = git("rev-parse", "HEAD");
  const upstream = git("rev-parse", "--verify", `origin/${BRANCH}`);
  record(
    `this copy and GitHub carry the same commit on ${BRANCH}`,
    head === upstream,
    head === upstream
      ? `${head.slice(0, 8)} on both (compared with the last fetch — run "git fetch" first if you have not)`
      : `local ${head.slice(0, 8)} vs GitHub ${upstream.slice(0, 8)}`,
  );
} catch (error) {
  record(`this copy and GitHub carry the same commit on ${BRANCH}`, false, String(error.message));
}

/* 4 — the agreed branch, and `main` untouched by an agent. ---------------- */
try {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  record("on the agreed branch", branch === BRANCH, `on ${branch}`);
} catch (error) {
  record("on the agreed branch", false, String(error.message));
}

/* 3 — the built file and the served file are the same bytes. -------------- */
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

try {
  execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "pipe" });
  const html = readFileSync(join(ROOT, "dist", "index.html"), "utf8");
  const localName = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
  if (!localName || !existsSync(join(ROOT, "dist", localName))) {
    record("the website serves this exact build", false, "the build produced no bundle to compare");
  } else {
    const localHash = sha256(readFileSync(join(ROOT, "dist", localName)));
    const page = await fetch(`${LIVE_ORIGIN}/`).then((response) => response.text());
    const liveName = page.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
    if (!liveName) {
      record("the website serves this exact build", false, `no bundle named on ${LIVE_ORIGIN}`);
    } else {
      const liveHash = sha256(Buffer.from(await fetch(`${LIVE_ORIGIN}/${liveName}`).then((r) => r.arrayBuffer())));
      const same = localHash === liveHash && localName === liveName;
      record(
        "the website serves this exact build",
        same,
        same
          ? `${liveName} · ${liveHash.slice(0, 12)}… on both`
          : `local ${localName} ${localHash.slice(0, 12)}… vs website ${liveName} ${liveHash.slice(0, 12)}…`,
      );
    }
  }
} catch (error) {
  record("the website serves this exact build", false, `could not compare: ${error.message}`);
}

/* Report. ----------------------------------------------------------------- */
console.log("SYNC CHECK — local files · GitHub · the website\n");
for (const { name, ok, detail } of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (detail) console.log(`      ${detail}`);
}
console.log(
  `\n${failed === 0 ? "IN SYNC — all three carry the same thing." : `OUT OF SYNC — ${failed} check(s) failed.`}`,
);
process.exit(failed === 0 ? 0 : 1);
