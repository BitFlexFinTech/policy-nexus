#!/usr/bin/env node
/**
 * Nzwisiso static validator — fails loudly on forbidden patterns.
 * Run: npm run validate
 *
 * Checks, in the order they run (each prints PASS/FAIL/SKIP with counts):
 *  1. Banned user-facing copy (demo / prototype / fake data / coming soon / lorem ipsum)
 *  2. Forbidden predictive phrasing (claims about real public opinion / certainty)
 *  3. Vendor terminology (MiroFish / OASIS / GraphRAG / Zep / Puter / Vultr / Neo4j / ...) — no exception
 *  4. Implementation vocabulary (LLM / API), permitted in exactly one owner-approved sentence
 *  5. Non-determinism (Math.random / Date.now / new Date) in app source — allowed in
 *     exactly one file, `src/lib/clock.ts`, and nowhere else (see the check below)
 *  6. Runtime network URLs in app source or index.html
 *  7. 16 departments with the exact stable IDs
 *  8. REFERENCE_DATE pinned to 2026-09-24
 *  9. Decision-support disclaimer present
 * 10. The served HTML description matches the brand description
 * 11. @media print rules present
 * 12. Rendered-pair contrast, MEASURED from the declared tokens in src/index.css
 * 13. Retired statements absent from the documents — false facts corrected at source, so a cold
 *     session cannot reintroduce one by copying an old paragraph
 * 14. The deployment claim is stated, agreed across documents, and carries its evidence
 * 15. The Coat of Arms carries a recorded sha256 that matches the file, and every icon size
 *     index.html declares actually exists on disk
 * 16. The Claude prompt asks for exactly three documents — the funding memo, the pitch deck and the
 *     one-page ask — and still carries the pilot framing and the named-source statement
 * 17. The product name carries its configured mark everywhere a reader sees it, and is composed
 *     in one place only
 * 18. An internal service is not offered to search engines — no crawler is allowed while the
 *     classification says "For Internal Use Only", and the served page carries the same instruction
 * 19. No superseded bundle is presented as the live one — every deployment claim the records make is
 *     checked against the bundle this working copy actually builds
 * 20. The promoter is always named in full — "Oreida Pvt Ltd", never "Oreida" alone
 * 21. The live-site description states the figures the configuration actually holds — the
 *     published / modelled split, derived from the data, never a superseded hand-typed number
 * 22. Real, published figures outnumber the modelled ones (the owner's locked goal, PART 11)
 * 23. An Excel `.xlsx` upload is READ in the browser, not recorded by name — the reader exists
 *     and is wired into the extraction seam, and every upload surface offers the type (BATCH 4)
 * 24. A department's own documents are USED in the drafted policy — the generator reads the run's
 *     own documents, lists the ones really read at Annex D, and quotes the department's own wording
 *     where it carries one of its stated priorities (BATCH 5)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];
const notes = [];
// The canonical ids, in the order `src/config/departments.ts` declares them (the Ministry of ICT
// second, after the Office of the President and Cabinet). Kept here as a plain list because this
// validator runs as plain Node without TypeScript; check 6 compares membership, and the app's own
// tests assert the order itself.
const DEPT_IDS = ["opc", "ict", "fin", "agri", "health", "edu", "hedu", "mines", "energy", "psc", "lg", "mfa", "env", "def", "zimra", "zida"];

const walk = (dir, exts) => {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
};

const rel = (p) => relative(ROOT, p);
const lines = (p) => readFileSync(p, "utf8").split("\n");

/**
 * Comment-only lines. Determinism and vendor-terminology checks are about code
 * that actually runs and copy a user can actually see, so documentation that
 * *names* a forbidden call (e.g. "never call `new Date()`") is not a violation.
 * A trailing comment on a line of code does not start with a comment marker, so
 * it is still scanned.
 */
const commentLine = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

const srcFiles = [...walk(join(ROOT, "src"), [".ts", ".tsx"]), join(ROOT, "index.html")].filter(existsSync);
const appFiles = srcFiles.filter((p) => !p.includes("/components/ui/"));
const uiFiles = srcFiles.filter((p) => p.includes("/components/ui/"));
/**
 * Copy a reader can actually see. `src/test/**` is excluded because those files are never bundled
 * into the application — `dist/` contains only what the entry imports — so a test that must NAME a
 * banned word in order to assert it is absent previously tripped the check on itself, and the
 * author had to work around it by not writing the word. That was a false positive at source, not a
 * real guard: nothing in a test file can reach an officer. The code checks (determinism, runtime
 * network) still scan every source file, tests included.
 */
const copyFiles = appFiles.filter((p) => !p.includes("/test/"));

const check = (name, hits) => {
  if (hits.length) {
    failures.push(`${name}: ${hits.length} violation(s)\n` + hits.map((h) => `    ${h}`).join("\n"));
    console.log(`FAIL  ${name} — ${hits.length} violation(s)`);
  } else {
    console.log(`PASS  ${name}`);
  }
};

const scan = (files, patterns, { ignoreLine } = {}) => {
  const hits = [];
  for (const file of files) {
    lines(file).forEach((line, i) => {
      if (ignoreLine && ignoreLine(line)) return;
      for (const [label, re] of patterns) {
        if (re.test(line)) hits.push(`${rel(file)}:${i + 1}  [${label}]  ${line.trim().slice(0, 100)}`);
      }
    });
  }
  return hits;
};

// 1 — banned user-facing copy. "placeholder" is a legitimate HTML/Tailwind token, so those lines are skipped.
//    "prototype" is excluded when it is a member expression (`Element.prototype` in
//    code) — the banned sense is the product-status word in prose, not a JS property.
const attrLine = (line) => /placeholder\s*[:=]/.test(line) || /placeholder\.svg/.test(line);
// The retired hosting claim: the interface said the simulation ran "within the
// Government of Zimbabwe estate". That was a claim about which infrastructure serves
// the page — something the platform cannot know from where it runs — and it was not
// true of the address the demonstration is served from. The compute-path fact that IS
// true lives in `SOVEREIGNTY_STATEMENT`. This gate keeps the old claim from returning.
check("banned user-facing copy", scan(copyFiles, [
  ["banned-copy", /(?<!\.)\b(lorem ipsum|coming soon|reset demo|demo mode|prototype|fake data|placeholder data|demonstration build)\b/i],
  ["retired-estate-claim", /Government of Zimbabwe estate/i],
], { ignoreLine: attrLine }));

// 2 — no claims about real public opinion or certainty
check("forbidden predictive phrasing", scan(copyFiles, [
  ["predictive-claim", /\b(will definitely|zimbabweans will|citizens oppose|citizens support|the public will|public opinion will)\b/i],
]));

// 3a — vendor names are banned everywhere a reader can see, with no exception at all.
check("vendor terminology scrubbed", scan(copyFiles, [
  ["vendor-term", /\b(MiroFish|OASIS|GraphRAG|Graphiti|Zep|Puter|puter|Vultr|Neo4j|DeepSeek)\b/],
], { ignoreLine: commentLine }));

// 3b — implementation vocabulary. The initiative's brief forbids it in user-facing copy, so it
// is banned with ONE owner-approved exception: the data-path sentence on the landing page says
// the platform "leverages the platform's API layer", added at the owner's direct instruction on
// 2026-09-29. The exception is this exact phrase and nothing else — a second use of the word
// anywhere in the app still fails this check, which is what keeps the brief's rule meaningful.
// (Uppercase-only on purpose: `api` is a legitimate local identifier — the stock carousel
// primitive uses one — while `API` in prose is the banned sense.)
const APPROVED_API_PHRASE = "leverages the platform's API layer";
const approvedApiLine = (line) => line.includes(APPROVED_API_PHRASE) || commentLine(line);
check("implementation vocabulary limited to the approved sentence", scan(copyFiles, [
  ["implementation-term", /\b(LLM|LLMs|API|APIs)\b/],
], { ignoreLine: approvedApiLine }));

// 4 — determinism inside app logic (ui/** is stock shadcn; its unused helper is excluded explicitly)
const determinism = [
  ["non-determinism", /\bMath\.random\s*\(/],
  ["non-determinism", /\bDate\.now\s*\(/],
  ["non-determinism", /\bnew Date\s*\(/],
];
const uiHits = scan(uiFiles, determinism, { ignoreLine: commentLine });
if (uiHits.length) {
  notes.push(`INFO  excluded ${uiHits.length} hit(s) inside src/components/ui/** (stock shadcn primitives, not app logic):\n` + uiHits.map((h) => `    ${h}`).join("\n"));
}
// The clock is allowed in ONE file — `src/lib/clock.ts` — and nowhere else. That file is
// the only place the system clock is read; every other module receives a moment as data,
// so the engine, the register and every document builder stay deterministic. A `new Date(`
// anywhere else in the app still fails, which is what keeps the proposal's "same policy,
// always the same result" promise true.
const clockFile = join(ROOT, "src", "lib", "clock.ts");
check("determinism (no Math.random/Date.now/new Date)", scan(appFiles.filter((p) => p !== clockFile), determinism, { ignoreLine: commentLine }));

// 5 — no runtime network calls
check("no runtime network URLs", scan(srcFiles, [
  ["network", /https?:\/\/[^\s"')]+/],
], {
  ignoreLine: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) || /schemaLocation|w3\.org|localhost|127\.0\.0\.1/.test(line),
}));

// 6 — the 16 departments, with the exact stable IDs
const deptFile = join(ROOT, "src/config/departments.ts");
if (!existsSync(deptFile)) {
  console.log("SKIP  16-department config — src/config/departments.ts not created yet");
} else {
  const text = readFileSync(deptFile, "utf8");
  const found = DEPT_IDS.filter((id) => new RegExp(`id:\\s*["'\`]${id}["'\`]`).test(text));
  const missing = DEPT_IDS.filter((id) => !found.includes(id));
  check("16 departments present with exact IDs", missing.map((id) => `missing department id "${id}" in src/config/departments.ts`));
  if (!missing.length) notes.push(`INFO  all ${DEPT_IDS.length} department ids present in src/config/departments.ts`);
}

// 7 — reference date pinned
const refFile = join(ROOT, "src/config/reference.ts");
if (!existsSync(refFile)) {
  console.log("SKIP  REFERENCE_DATE — src/config/reference.ts not created yet");
} else {
  const text = readFileSync(refFile, "utf8");
  check("REFERENCE_DATE pinned to 2026-09-24", /2026-09-24/.test(text) ? [] : ["src/config/reference.ts does not contain 2026-09-24"]);
}

// 8 — decision-support disclaimer present once assessment/brand files exist
const disclaimerSources = ["src/config/brand.ts", "src/components/assessment/ExecutiveSummary.tsx", "src/pages/Assessment.tsx"]
  .map((f) => join(ROOT, f))
  .filter(existsSync);
if (!disclaimerSources.length) {
  console.log("SKIP  decision-support disclaimer — brand/assessment files not created yet");
} else {
  const ok = disclaimerSources.filter((f) => /prepared for decision support|not a definitive forecast/i.test(readFileSync(f, "utf8")));
  check("decision-support disclaimer present", ok.length ? [] : disclaimerSources.map((f) => `${rel(f)} does not contain the disclaimer`));
  if (ok.length) notes.push(`INFO  disclaimer found in: ${ok.map(rel).join(", ")}`);

// The served HTML duplicates the brand summary by hand — a static file cannot import
// TypeScript. That duplication cannot be removed without a build step, so instead the
// two copies are CHECKED against each other, turning a silent drift into a failed build.
{
  const brandPath = join(ROOT, "src/config/brand.ts");
  const htmlPath = join(ROOT, "index.html");
  const drift = [];
  if (existsSync(brandPath) && existsSync(htmlPath)) {
    const brandText = readFileSync(brandPath, "utf8");
    const html = readFileSync(htmlPath, "utf8");
    const declared = [
      ...html.matchAll(/(?:name|property)="(?:description|og:description)"[^>]*content="([^"]*)"/g),
    ].map((m) => m[1]);
    // brand.ts builds the sentence from concatenated literals, so strip the whitespace,
    // quotes and join operators from the statement and compare the bare sentence. The
    // anchor is a line-start two-space indent followed by a word character OR a comment
    // slash, so the capture stops at the field's own comma and can never run into the
    // COMMENT above or below it (both of which mention "description").
    //
    // The sentence now opens with the product NAME, which brand.ts COMPOSES from its parts
    // (so the mark is one setting). This reads those parts out of the same file and resolves
    // them here, rather than demanding that the served HTML stop matching the source.
    const statement =
      (brandText.match(/\n  description:([\s\S]*?)\n  (?=[\w/])/) || [])[1] || "";
    const resolvedName = (() => {
      const mark = (brandText.match(/export const TRADEMARK = "([^"]+)"/) || [])[1];
      const base = (brandText.match(/const NAME_BASE = "([^"]+)"/) || [])[1];
      const suffix = (brandText.match(/const NAME_SUFFIX = "([^"]+)"/) || [])[1];
      return base && suffix && mark ? `${base} ${suffix}${mark}` : null;
    })();
    if (statement.includes("${NAME}") && !resolvedName) {
      drift.push(
        "src/config/brand.ts builds its description from ${NAME} but does not declare NAME_BASE, NAME_SUFFIX and TRADEMARK, so the served HTML cannot be checked against it",
      );
    }
    const resolvedStatement = resolvedName
      ? statement.replace(/\$\{NAME\}/g, resolvedName)
      : statement;
    // The statement is written with double-quoted strings and template literals mixed, so
    // both markers have to be stripped before the sentence can be compared.
    const owned = /["`]/.test(resolvedStatement)
      ? resolvedStatement.replace(/[\s"`+]/g, "").replace(/,$/, "")
      : "";
    const bare = (value) => value.replace(/\s+/g, "");

    if (!owned) drift.push("no description found in src/config/brand.ts to check the served HTML against");
    else if (declared.length === 0) drift.push("index.html declares no description or og:description to check");
    else {
      declared.forEach((value) => {
        if (bare(value) !== owned) {
          drift.push(
            `index.html description "${value}" does not match BRAND.description in src/config/brand.ts — update both or neither`,
          );
        }
      });
    }
  }
  check("served HTML description matches the brand description", drift);
}


}

// 9 — print rules present once report actions exist
const reportFile = join(ROOT, "src/components/assessment/DocumentActions.tsx");
if (!existsSync(reportFile)) {
  console.log("SKIP  @media print rules — report actions not created yet");
} else {
  const css = [join(ROOT, "src/index.css")].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
  check("@media print rules present", /@media\s+print/.test(css) ? [] : ["no @media print block found in src/index.css"]);
}

// 10 — contrast of the token pairs the app actually renders. MEASURED, not estimated:
//      computed from the declared tokens in src/index.css with the WCAG 2.x
//      relative-luminance formula, and alpha-composited where a muted colour is used
//      over a dark one. This exists because the two worst offenders in the palette
//      looked fine by eye: secondary copy measured 4.45:1 on white and brand gold
//      hairlines measured 1.38:1 — both invisible as failures until computed.
const MUTED_WHITE_FLOOR = 75;
const cssPath = join(ROOT, "src/index.css");
if (!existsSync(cssPath)) {
  console.log("SKIP  rendered-pair contrast — src/index.css not found");
} else {
  const cssText = readFileSync(cssPath, "utf8");
  const declared = {};
  for (const m of cssText.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
    declared[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  const toRgb = ([h, s, l]) => {
    const sat = s / 100;
    const lig = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255));
  };
  const luminance = ([r, g, b]) => {
    const channel = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const contrastOf = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  const over = (fg, bg, alpha) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

  // [label, foreground token, foreground alpha, background token, minimum ratio]
  const PAIRS = [
    ["body text on the page canvas", "foreground", 1, "background", 4.5],
    ["secondary copy on the page canvas", "muted-foreground", 1, "background", 4.5],
    ["body text on a card", "foreground", 1, "card", 4.5],
    ["secondary copy on a card", "muted-foreground", 1, "card", 4.5],
    ["green label on a card", "primary", 1, "card", 4.5],
    ["green label on the tinted surface", "primary", 1, "primary-tint", 4.5],
    ["body text on the tinted surface", "foreground", 1, "primary-tint", 4.5],
    ["secondary copy on the tinted surface", "muted-foreground", 1, "primary-tint", 4.5],
    ["white on green (masthead, primary CTA)", "primary-foreground", 1, "primary", 4.5],
    ["muted white on green at the floor", "primary-foreground", MUTED_WHITE_FLOOR / 100, "primary", 4.5],
    ["gold rule on a card", "gold-rule", 1, "card", 3],
    ["gold rule on the tinted surface", "gold-rule", 1, "primary-tint", 3],
    ["gold rule on the page canvas", "gold-rule", 1, "background", 3],
    ["brand gold on green (masthead rule, wordmark)", "gold", 1, "primary", 3],
    // ENFORCED since the defect sweep: this pair used to be printed as a KNOWN-RED note
    // at 3.73:1. The token was darkened to 4 80% 48% and the pair moved into the
    // enforced set, so a regression now fails the build rather than being reported.
    ["danger text on a card (risk state, error copy)", "destructive", 1, "card", 4.5],
    ["white on danger (destructive buttons)", "destructive-foreground", 1, "destructive", 4.5],
  ];
  const contrastHits = [];
  const measured = [];
  for (const [label, fgKey, alpha, bgKey, min] of PAIRS) {
    const fg = declared[fgKey];
    const bg = declared[bgKey];
    if (!fg || !bg) {
      contrastHits.push(`token pair missing for "${label}" (--${fgKey} on --${bgKey})`);
      continue;
    }
    const fgRgb = alpha === 1 ? toRgb(fg) : over(toRgb(fg), toRgb(bg), alpha);
    const ratio = contrastOf(fgRgb, toRgb(bg));
    const ok = ratio >= min - 0.001;
    if (!ok) contrastHits.push(`${label}: ${ratio.toFixed(2)}:1 is below the ${min}:1 floor`);
    measured.push(`${ok ? "ok  " : "LOW "} ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`);
  }

  // Muted white on green is the only place the app renders white at an opacity, so a
  // floor is enforced against the source rather than only against the token.
  for (const file of srcFiles) {
    lines(file).forEach((line, i) => {
      for (const m of line.matchAll(/text-primary-foreground\/(\d+)/g)) {
        if (Number(m[1]) < MUTED_WHITE_FLOOR) {
          contrastHits.push(
            `${rel(file)}:${i + 1}  text-primary-foreground/${m[1]} — below the measured AA floor /${MUTED_WHITE_FLOOR}`,
          );
        }
      }
    });
  }

  check("rendered-pair contrast (measured from tokens)", contrastHits);
  notes.push(
    `INFO  contrast measured from src/index.css:\n` +
      measured.map((line) => `    ${line}`).join("\n"),
  );

  // The old KNOWN-RED note for --destructive as text on --card is RETIRED: that pair is
  // now enforced in PAIRS above, because the token was darkened and the app-wide risk of
  // changing it was accepted. It is kept here only as a guard that the pair really is
  // being measured, so the note can never quietly revert to being informational.
  if (declared.destructive && declared.card) {
    const ratio = contrastOf(toRgb(declared.destructive), toRgb(declared.card));
    if (ratio < 4.5) {
      contrastHits.push(
        `danger text on a card regressed to ${ratio.toFixed(2)}:1 — the token is what fixed this, not a check exemption`,
      );
    }
  }
}

// 11 — RETIRED STATEMENTS. Every one of these was a FALSE FACT in a document rather than a code bug:
//      a fix reported as still open (in two separate places), a deployment state three phases out of
//      date (in three separate files, one of which then told the reader to deploy before presenting),
//      and a duplication described as unsolvable after it had in fact been checked every build. The
//      fix was the corrected text; THIS is the gate, so a cold session cannot reintroduce the claim by
//      pasting an old paragraph back in. Matches whitespace-normalised text, so a claim re-wrapped
//      across two lines is still caught.
{
  const docs = [
    join(ROOT, "PROJECT_STATUS.md"),
    join(ROOT, "PRODUCTION_READINESS.md"),
    join(ROOT, "README.md"),
    ...walk(join(ROOT, "docs"), [".md"]),
  ].filter(existsSync);
  const retired = [
    ["the scale strip's retired count", /scale strip still reads/i],
    ["the retired \"Hundreds\" claim", /still reads[^.]{0,40}Hundreds/i],
    ["a live host described as behind", /still serves the\b/i],
    ["work described as not yet live", /not yet on the live host/i],
    ["a fix described as not made", /flagged not fixed:\s*the scale strip/i],
    ["items described as open after they were fixed", /known and deliberately open/i],
    ["duplication described as unchecked", /can drift from\s*`?brand\.ts`?\s*silently/i],
    ["the retired Government-hosting claim", /Government of Zimbabwe estate/i],
  ];
  const hits = [];
  for (const file of docs) {
    const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
    for (const [label, re] of retired) {
      const m = text.match(re);
      if (m) {
        const from = Math.max(0, m.index - 50);
        hits.push(`${rel(file)}  [${label}]  ...${text.slice(from, m.index + m[0].length + 50)}...`);
      }
    }
  }
  check("retired document statements absent", hits);
}

// 12 — THE DEPLOYMENT CLAIM. Three documents said the live host was serving an older bundle long
//      after it had been redeployed, and one of them told the reader to deploy before presenting for
//      that reason. A local validator cannot fetch the site, so this enforces what CAN be checked
//      here: the two record files must both still state which bundle is live, they must agree with
//      each other, and each must carry the sha256 that proves the claim came from fetching the served
//      file. When dist/ exists the locally built name is printed beside the claim, so a reader can see
//      at a glance whether the live host is behind.
{
  const claimFiles = ["PROJECT_STATUS.md", "PRODUCTION_READINESS.md", "docs/PROPOSAL_PROMPT.md"]
    .map((f) => join(ROOT, f))
    .filter(existsSync);
  const claims = [];
  for (const file of claimFiles) {
    const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
    for (const m of text.matchAll(/serves\s*\*{0,2}\s*`?(assets\/index-[A-Za-z0-9_-]+\.js)/g)) {
      claims.push({ file: rel(file), name: m[1], text, at: m.index });
    }
  }
  const problems = [];
  for (const must of ["PROJECT_STATUS.md", "PRODUCTION_READINESS.md"]) {
    if (claimFiles.some((p) => rel(p) === must) && !claims.some((c) => c.file === must)) {
      problems.push(`${must} no longer states which bundle the live host serves — the deployment state must be stated, not dropped`);
    }
  }
  const names = [...new Set(claims.map((c) => c.name))];
  if (names.length > 1) {
    problems.push(`the documents disagree about which bundle the live host serves: ${names.join(", ")} — at least one of them is stale`);
  }
  for (const c of claims) {
    if (c.file !== "PROJECT_STATUS.md" && c.file !== "PRODUCTION_READINESS.md") continue;
    if (!/[0-9a-f]{64}/.test(c.text.slice(c.at, c.at + 600))) {
      problems.push(`${c.file} says the live host serves ${c.name} without the sha256 that proves the served file was fetched and compared`);
    }
  }
  check("deployment claim stated, agreed and evidenced", problems);
  if (names.length === 1) {
    const distHtml = join(ROOT, "dist/index.html");
    const built = existsSync(distHtml)
      ? (readFileSync(distHtml, "utf8").match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0]
      : null;
    notes.push(
      `INFO  live bundle stated in the documents: ${names[0]}\n` +
        (built
          ? `    the local build produces: ${built}` +
            (built === names[0]
              ? "  (the same file — the live host is current)"
              : "  (a different file — the live host is behind this build until it is redeployed)")
          : "    no local build in this working copy (run `npm run build` to compare)"),
    );
  }
}

// 13 — THE COAT OF ARMS, AND THE ICON SET. A picture is the one thing no other check can watch:
//      nothing in the source code names what is inside it, so swapping the drawing is invisible to
//      every other validator — which is exactly how a stylised drawing came to be shown under a
//      "Government of Zimbabwe" masthead. So the record must carry the file's sha256 and this check
//      compares the recorded value against the bytes on disk: the document is the claim, the file is
//      the reality. The icon hrefs are read out of index.html rather than listed here, so a declared
//      size that no longer exists cannot pass, and there is no second copy of that list to drift.
{
  const artwork = join(ROOT, "src/assets/zimbabwe-coat-of-arms.png");
  const problems = [];
  let actual = null;
  if (!existsSync(artwork)) {
    problems.push(
      "src/assets/zimbabwe-coat-of-arms.png is missing — the masthead, the tab icon and the iOS tile all derive from this one file",
    );
  } else {
    actual = createHash("sha256").update(readFileSync(artwork)).digest("hex");
    const recorded = [];
    for (const f of ["PROJECT_STATUS.md", "PRODUCTION_READINESS.md"].map((n) => join(ROOT, n)).filter(existsSync)) {
      const text = readFileSync(f, "utf8").replace(/\s+/g, " ");
      for (const m of text.matchAll(/zimbabwe-coat-of-arms\.png/g)) {
        for (const h of text.slice(m.index, m.index + 400).matchAll(/[0-9a-f]{64}/g)) {
          recorded.push({ file: rel(f), hash: h[0] });
        }
      }
    }
    if (!recorded.length) {
      problems.push(
        "no sha256 is recorded beside src/assets/zimbabwe-coat-of-arms.png, so nobody can check whether the artwork in the build is the official one",
      );
    }
    for (const r of recorded) {
      if (r.hash !== actual) {
        problems.push(
          `${r.file} records sha256 ${r.hash} for the Coat of Arms, but the file on disk hashes to ${actual} — either the artwork was swapped or the record is stale`,
        );
      }
    }
  }

  const html = existsSync(join(ROOT, "index.html")) ? readFileSync(join(ROOT, "index.html"), "utf8") : "";
  const declared = new Set(
    [...html.matchAll(/href="\/([A-Za-z0-9._-]+\.(?:ico|png))"/g)].map((m) => m[1]),
  );
  if (!declared.size) {
    problems.push("index.html declares no icon — the browser tab would show a blank page symbol");
  }
  for (const name of declared) {
    const p = join(ROOT, "public", name);
    if (!existsSync(p) || statSync(p).size === 0) {
      problems.push(`index.html declares /${name} but public/${name} is missing or empty`);
    }
  }

  check("Coat of Arms fingerprinted and every declared icon present", problems);
  if (actual) {
    notes.push(
      `INFO  Coat of Arms sha256 ${actual.slice(0, 12)}…  ·  ${declared.size} icon file(s) declared in index.html, all present in public/`,
    );
  }
}

// 14 — THE CLAUDE PROMPT ASKS FOR THREE DOCUMENTS, NOT SIX. The pack was deliberately cut down: a
//      separate legal instrument, a procurement paper, a governance annex and a full sources register
//      were each dropped by the Phase AB scope decision, and `docs/PROPOSAL_PROMPT.md` went on
//      describing the older, heavier pack until AB-7 rewrote it. This gate reads the prompt the way a
//      reader would: the three deliverables must be named, the parts must number 1 to 3 and stop
//      there, and the withdrawn "produce all five/six" instruction must not come back by pasting an
//      old paragraph in. It also holds the two things the rewrite must never drop — that the pilot is
//      proposed and not endorsed, and that the programme is named as the Government spells it.
{
  const promptFile = join(ROOT, "docs/PROPOSAL_PROMPT.md");
  const problems = [];
  if (!existsSync(promptFile)) {
    problems.push(
      "docs/PROPOSAL_PROMPT.md is missing — it is the deliverable prompt, and the last item of the agreed plan",
    );
  } else {
    const text = readFileSync(promptFile, "utf8");
    const flat = text.replace(/\s+/g, " ");
    const required = [
      ["the funding memo, with its length", /the funding memo \(2 pages\)/],
      ["the pitch deck, with its slide count", /the pitch deck \(10[–-]12 slides\)/],
      ["the one-page ask", /the one-page ask/],
      ["the named-source statement", /named-source statement/],
      ["the pilot framing — proposed, and never endorsed", /no endorsement/],
      ["the programme named as the Government spells it", /Digitalize Zimbabwe/],
    ];
    for (const [label, re] of required) {
      if (!re.test(flat)) problems.push(`the prompt no longer states ${label}`);
    }

    const parts = [...text.matchAll(/^\*\*Part\s+(\d+)\s*—/gm)].map((m) => m[1]);
    if (parts.join(",") !== "1,2,3") {
      problems.push(
        `the prompt's deliverables are Part ${parts.join(", ") || "(none)"} — the agreed pack is exactly ` +
          "Part 1, 2 and 3: the funding memo, the pitch deck and the one-page ask",
      );
    }

    const retired = [
      ["the withdrawn 'produce all five/six' instruction", /produce all (?:four|five|six)\b/i],
      ["a fourth deliverable part", /^\*\*Part\s+[4-9]\s*—/m],
      ["the withdrawn 'five/six deliverables' heading", /the (?:five|six) deliverables/i],
    ];
    for (const [label, re] of retired) {
      const m = text.match(re);
      if (m) problems.push(`${label}: "…${m[0].replace(/\s+/g, " ").trim()}…"`);
    }
  }
  check("the Claude prompt asks for exactly three documents", problems);
}

// 15 — THE PRODUCT NAME CARRIES ITS MARK, AND IS COMPOSED IN ONE PLACE. A reader who sees the
//      platform called "Nzwisiso AI" beside the Government's own "Nzwisiso.ai" campaign cannot
//      tell whether this is that campaign — so the name must always carry its mark, and the
//      mark must be the CONFIGURED one. This check reads `TRADEMARK` out of `src/config/brand.ts`
//      rather than hardcoding a symbol, so the day the mark is registered and the setting changes
//      to ®, this gate keeps working untouched. The name is composed only in brand.ts (that is
//      where the parts live); everywhere else no bare "Nzwisiso" may reach a reader. Comment
//      lines are ignored — a comment naming the platform is not user-visible copy.
{
  const brandFile = join(ROOT, "src/config/brand.ts");
  const brandSource = existsSync(brandFile) ? readFileSync(brandFile, "utf8") : "";
  const configured = (brandSource.match(/export const TRADEMARK = "([^"]+)"/) || [])[1];
  const problems = [];
  if (!configured) {
    problems.push(
      "src/config/brand.ts declares no exported TRADEMARK — the product mark must be one readable setting",
    );
  }
  const composeFiles = appFiles.filter((f) => rel(f) !== "src/config/brand.ts");
  const hits = scan(
    composeFiles,
    [
      [
        "bare-product-name",
        // The Government's own campaign is spelled "Nzwisiso.ai" and must be allowed: naming it
        // is deliberate, and the platform's own name always carries the configured mark.
        configured
          ? new RegExp(`Nzwisiso(?!\\s?AI${configured})(?!\\.ai)`)
          : /Nzwisiso(?!\s?AI)(?!\.ai)/,
      ],
    ],
    // A comment naming the platform is not user-visible copy — including the JSX form,
    // which opens with `{/*` rather than `/*`.
    { ignoreLine: (line) => commentLine(line) || line.trimStart().startsWith("{/*") },
  );
  check("product name carries its configured mark, composed in one place", [...problems, ...hits]);
  notes.push(
    `INFO  product mark configured in src/config/brand.ts: ${configured ?? "(none)"}`,
  );
}

// 16 — AN INTERNAL SERVICE IS NOT OFFERED TO SEARCH ENGINES. The footer of every screen says
//      "For Internal Use Only", and public/robots.txt was inviting Googlebot, Bingbot and the
//      social crawlers to index the whole platform. Both cannot be true. This reads the
//      classification out of brand.ts and fails if a crawler is allowed again, or if the served
//      page drops its own noindex instruction.
{
  const brandFile = join(ROOT, "src/config/brand.ts");
  const brandSource = existsSync(brandFile) ? readFileSync(brandFile, "utf8") : "";
  const classification = (brandSource.match(/classification:\s*"([^"]+)"/) || [])[1] || "";
  const internal = /internal/i.test(classification);
  const problems = [];
  if (internal) {
    const robots = join(ROOT, "public/robots.txt");
    if (!existsSync(robots)) {
      problems.push("public/robots.txt is missing — an internal service must say so to crawlers");
    } else {
      const text = readFileSync(robots, "utf8");
      const allows = [...text.matchAll(/^\s*Allow:\s*(\S.*)$/gim)].map((m) => m[1].trim());
      if (allows.length) {
        problems.push(
          `public/robots.txt allows ${allows.join(", ")} while brand.ts classifies the service as "${classification}"`,
        );
      }
      if (!/^\s*Disallow:\s*\/\s*$/im.test(text)) {
        problems.push("public/robots.txt does not disallow all crawlers");
      }
    }
    const htmlPath = join(ROOT, "index.html");
    const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
    if (!/<meta\s+name="robots"[^>]*noindex/i.test(html)) {
      problems.push(
        'index.html carries no <meta name="robots" content="noindex…"> — the served page must say it too',
      );
    }
  }
  check("internal service is not offered to search engines", problems);
  if (internal) {
    notes.push(
      `INFO  classification "${classification}" — crawlers disallowed in robots.txt and index.html`,
    );
  }
}

// 17 — NO SUPERSEDED BUNDLE IS PRESENTED AS THE LIVE ONE. Check 12 proves the three record
//      files AGREE on the live bundle; it cannot see a stale claim worded differently, and that
//      is how eight stale statements survived a redeploy. Found on 2026-10-02, after the site had
//      been republished: prose still told the reader the host was one build behind, one line
//      still presented the Phase S bundle as "Live build (current — 2026-09-26)", and the block
//      still said "the one action left for the whole project is the redeploy". A dated log row is
//      the record of what was true then and is left alone; PROSE must be true now. This fails
//      when, in prose:
//        R1 — a present-tense "serves … <bundle>" names a bundle other than the agreed live one;
//        R2 — the live host/site is said to be behind;
//        R3 — a deploy/redeploy is said to be still to come;
//        R4 — (when the records agree the host serves the build this copy produces) the RESUME
//             HERE block fails to state the sync check's result.
{
  const recordFiles = ["PROJECT_STATUS.md", "PRODUCTION_READINESS.md", "docs/PROPOSAL_PROMPT.md"]
    .map((f) => join(ROOT, f))
    .filter(existsSync);
  const problems = [];

  // The bundle the records agree the live host serves, and the one this working copy builds.
  const served = new Set();
  for (const file of recordFiles) {
    const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
    for (const m of text.matchAll(/serves\s*\*{0,2}\s*`?(assets\/index-[A-Za-z0-9_-]+\.js)/g)) {
      served.add(m[1]);
    }
  }
  const distHtml = join(ROOT, "dist/index.html");
  const built = existsSync(distHtml)
    ? (readFileSync(distHtml, "utf8").match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0]
    : null;

  if (served.size === 1) {
    const live = [...served][0];
    // Nothing is outstanding only when this copy builds exactly what the records say is live.
    const outstanding = Boolean(built) && built !== live;

    for (const file of recordFiles) {
      // Prose is read as paragraphs — consecutive non-table lines joined — so a claim split
      // across two lines is still seen, while a dated log row is skipped whole.
      const paragraphs = [];
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          const lineNo = index + 1;
          // A blank line, a table row, or the start of a new bullet ends the paragraph.
          if (/^\s*$/.test(line) || /^\s*\|/.test(line) || /^\s*[-*]\s/.test(line)) {
            paragraphs.push(/^\s*[-*]\s/.test(line) ? { from: lineNo, to: lineNo, text: line } : null);
            return;
          }
          const last = paragraphs[paragraphs.length - 1];
          // Join only lines that really are consecutive prose; a blank line or a table
          // row ends the paragraph.
          if (last && last.to === lineNo - 1) {
            last.text += " " + line;
            last.to = lineNo;
          } else {
            paragraphs.push({ from: lineNo, to: lineNo, text: line });
          }
        });

      for (const paragraph of paragraphs) {
        if (!paragraph) continue;
        const where = `${rel(file)}:${paragraph.from}`;

        // R1 — a present-tense claim that the host serves some bundle.
        for (const m of paragraph.text.matchAll(
          /serves(?![a-z])[\s\S]{0,120}?(assets\/index-[A-Za-z0-9_-]+\.js)/g,
        )) {
          if (m[1] !== live) {
            problems.push(
              `${where}: says the host serves ${m[1]}, but the records agree the live host serves ${live} — a superseded bundle must not be presented as the live one`,
            );
          }
        }

        if (outstanding) continue; // being behind is true, and must be stated

        for (const sentence of paragraph.text.split(/(?<=[.;])\s+/)) {
          const said = sentence.trim().replace(/\s+/g, " ").slice(0, 110);
          // R2 — the live host said to be behind.
          if (/(host|site|origin)[^.]{0,80}\b(is|are)\b[^.]{0,40}\b(one build behind|behind)\b/i.test(sentence)) {
            problems.push(
              `${where}: says the live host is behind, but it serves the build this working copy produces (${live}) — the statement is stale: "${said}…"`,
            );
          }
          // R3 — a deploy said to be still to come, in the same breath as the deploy word.
          const deploy = sentence.match(/\b(redeploy\w*|deploy\w*)\b/i);
          if (deploy) {
            const near = sentence.slice(
              Math.max(0, deploy.index - 40),
              deploy.index + deploy[0].length + 40,
            );
            if (
              /\b(still|left|outstanding|pending)\b/i.test(near) &&
              !/\b(no|not|never|nothing|none|was|were|had|did)\b/i.test(sentence)
            ) {
              problems.push(
                `${where}: says a deploy is still to come, but the host already serves the build this working copy produces (${live}) — the statement is stale: "${said}…"`,
              );
            }
          }
        }
      }
    }

    // R4 — when nothing is outstanding, the record must say so in the sync check's own words.
    const resumeSource = readFileSync(join(ROOT, "PROJECT_STATUS.md"), "utf8");
    const at = resumeSource.indexOf("## RESUME HERE");
    if (at < 0) {
      problems.push("PROJECT_STATUS.md carries no `## RESUME HERE` block — the resume point must exist");
    } else if (!outstanding && !/IN SYNC/.test(resumeSource.slice(at))) {
      problems.push(
        "PROJECT_STATUS.md: the records agree the host serves the current build, so RESUME HERE must state the sync check's result (IN SYNC) — the state must be stated, not left to be guessed",
      );
    }
  }

  check("no superseded bundle presented as the live one", problems);
}

// ---------------------------------------------------------------------------------------------
// check 20 — the promoter is always named in full
// The company is written "Oreida Pvt Ltd" everywhere. The short form was found twice in the records
// on 2026-10-05 (a possessive and a bare subject); this gate fails if it comes back, so the naming
// rule cannot be forgotten by a later session copying an old sentence.
{
  const problems = [];
  const files = [
    ...new Set([
      ...appFiles,
      ...copyFiles,
      join(ROOT, "PROJECT_STATUS.md"),
      join(ROOT, "PRODUCTION_READINESS.md"),
    ]),
  ];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((line, index) => {
      const bare = line.match(/\bOreida\b(?! Pvt Ltd)/g);
      if (bare) {
        problems.push(
          `${rel(file)}:${index + 1}: writes "Oreida" alone (${bare.length}×) — the promoter is always written "Oreida Pvt Ltd": "${line.trim().slice(0, 80)}…"`,
        );
      }
    });
  }
  check("the promoter is always named Oreida Pvt Ltd", problems);
}

// ---------------------------------------------------------------------------------------------
// check 21 — the description of the live site states the figures the configuration actually holds
// The defect this exists for: `docs/PROPOSAL_PROMPT.md` describes what the live site is "today" and
// still said every department modelled **24** stakeholder groups and carried **35 published / 125
// modelled** indicators and **all 24 published figures** — all three stale since the 2026-10-04
// expansion. Each stale number had been corrected by hand in an earlier session, which is exactly
// why it drifted again. So the numbers are now DERIVED from the configuration and compared with the
// paragraph that describes the present state; a superseded figure fails the build instead of being
// noticed by eye. Dated history rows are untouched — only the present-tense paragraph is checked.
{
  const problems = [];
  const deptText = readFileSync(join(ROOT, "src/config/departments.ts"), "utf8");
  const refText = readFileSync(join(ROOT, "src/config/reference.ts"), "utf8");

  // Every row carrying a `basis` is a department indicator; the retired shape (a free-text
  // `source`) and the departments' priority rows carry none, so they cannot inflate the count.
  let indicators = 0;
  let publishedIndicators = 0;
  for (const line of deptText.split("\n")) {
    if (!/\{ id: "[a-z0-9-]+", label: "/.test(line)) continue;
    if (!/basis: \{ kind: "(published|modelled)"/.test(line)) continue;
    indicators += 1;
    if (/basis: \{ kind: "published"/.test(line)) publishedIndicators += 1;
  }
  const modelledIndicators = indicators - publishedIndicators;

  // Stakeholder groups: one `shareSource` per segment — the named publisher, or the platform's
  // own Modelled word.
  const groups = [...refText.matchAll(/shareSource:/g)].length;
  const modelledGroups = [...refText.matchAll(/shareSource: MODELLED_SHARE_LABEL/g)].length;
  const publishedGroups = groups - modelledGroups;

  // How many groups each department models — its own `segments` list, the first one in its record.
  const perDepartment = [...new Set(deptText
    .split(/\n  \{\n    id: "/)
    .slice(1)
    .map((chunk) => {
      const m = chunk.match(/segments: \[([^\]]*)\]/);
      return m ? (m[1].match(/"[a-z0-9-]+"/g) || []).length : -1;
    }))];
  if (perDepartment.length !== 1) {
    problems.push(
      `the departments do not model the same number of stakeholder groups (${perDepartment.join(", ")}) — the records state one number, so the configuration must hold one`,
    );
  }
  const deptGroups = perDepartment[0];

  const promptPath = join(ROOT, "docs/PROPOSAL_PROMPT.md");
  if (existsSync(promptPath)) {
    const prompt = readFileSync(promptPath, "utf8");
    const start = prompt.indexOf("What the live site actually is today");
    if (start < 0) {
      problems.push(
        "docs/PROPOSAL_PROMPT.md no longer states what the live site is today — the present state must be stated, not dropped",
      );
    } else {
      const rest = prompt.slice(start);
      const boundary = rest.slice(1).search(/\n(?:- |---|## )/);
      const excerpt = (boundary < 0 ? rest : rest.slice(0, boundary + 1)).replace(/\s+/g, " ");

      if (!excerpt.includes(`${publishedIndicators} published / ${modelledIndicators} modelled`)) {
        problems.push(
          `docs/PROPOSAL_PROMPT.md describes the live site without its current indicator split (${publishedIndicators} published / ${modelledIndicators} modelled)`,
        );
      }
      for (const m of excerpt.matchAll(/all (\d+) published figures/g)) {
        if (Number(m[1]) !== publishedIndicators) {
          problems.push(
            `docs/PROPOSAL_PROMPT.md says "all ${m[1]} published figures" — the configuration holds ${publishedIndicators}`,
          );
        }
      }
      const modelling = [...excerpt.matchAll(/modelling\s*\*{0,2}(\d+)\*{0,2}\s+stakeholder groups/g)];
      if (!modelling.length) {
        problems.push(
          "docs/PROPOSAL_PROMPT.md no longer says how many stakeholder groups a department models",
        );
      }
      for (const m of modelling) {
        if (Number(m[1]) !== deptGroups) {
          problems.push(
            `docs/PROPOSAL_PROMPT.md says a department models ${m[1]} stakeholder groups — the configuration holds ${deptGroups}`,
          );
        }
      }
      const allowed = [
        `${publishedIndicators} / ${modelledIndicators}`,
        `${publishedGroups} / ${modelledGroups}`,
      ];
      for (const m of excerpt.matchAll(/(\d+) published \/ (\d+) modelled/g)) {
        if (!allowed.includes(`${m[1]} / ${m[2]}`)) {
          problems.push(
            `docs/PROPOSAL_PROMPT.md states the superseded split "${m[1]} published / ${m[2]} modelled" — the configuration holds ${publishedIndicators} / ${modelledIndicators} indicators and ${publishedGroups} / ${modelledGroups} groups`,
          );
        }
      }
      notes.push(
        `INFO  configuration today: ${indicators} indicators (${publishedIndicators} published / ${modelledIndicators} modelled) · ` +
          `${groups} stakeholder groups (${publishedGroups} published / ${modelledGroups} modelled), ${deptGroups} modelled per department`,
      );
    }
  }
  // The readiness record states the split in its own words ("N are published figures and M are
  // Modelled"). It is present-tense, so it must agree with the configuration — and it must state
  // the split at all, so the current figures cannot be dropped instead of corrected.
  const readinessPath = join(ROOT, "PRODUCTION_READINESS.md");
  if (existsSync(readinessPath)) {
    const readiness = readFileSync(readinessPath, "utf8").replace(/\s+/g, " ");
    const claims = [...readiness.matchAll(/(\d+) are published figures and (\d+) are/g)];
    if (!claims.length) {
      problems.push(
        "PRODUCTION_READINESS.md no longer states the current published / modelled split — the present state must be stated, not dropped",
      );
    }
    for (const m of claims) {
      if (Number(m[1]) !== publishedIndicators || Number(m[2]) !== modelledIndicators) {
        problems.push(
          `PRODUCTION_READINESS.md says "${m[1]} are published figures and ${m[2]} are Modelled" — the configuration holds ${publishedIndicators} / ${modelledIndicators}`,
        );
      }
    }
  }

  // The RESUME HERE block is the present-tense state by definition, so the current indicator split
  // must be stated there for the next session to start from a true figure.
  const statusPath = join(ROOT, "PROJECT_STATUS.md");
  if (existsSync(statusPath)) {
    const status = readFileSync(statusPath, "utf8");
    const start = status.indexOf("\n## RESUME HERE");
    if (start < 0) {
      problems.push("PROJECT_STATUS.md has no RESUME HERE block — the next session's entry point is missing");
    } else {
      const rest = status.slice(start + 1);
      const end = rest.indexOf("\n## ", 1);
      const block = (end < 0 ? rest : rest.slice(0, end));
      if (!block.includes(`${publishedIndicators} published / ${modelledIndicators} modelled`)) {
        problems.push(
          `PROJECT_STATUS.md's RESUME HERE block does not state the current indicator split (${publishedIndicators} published / ${modelledIndicators} modelled)`,
        );
      }
    }
  }

  check("the live-site description states the configuration's current figures", problems);
}
// ---------------------------------------------------------------------------------------------
// check 22 — real, published figures OUTNUMBER the modelled ones (the owner's locked goal)
// The owner's locked goal (recorded 2026-10-04, PART 11 of docs/PLATFORM_ENRICHMENT_PLAN.md):
// real, published figures must outnumber the platform's own modelled ones. The flip was reached
// on 2026-10-05 (245 published / 235 modelled), and this gate landed with it. It fails the build
// if the published count ever falls back to or below the modelled count, so the goal cannot be
// silently undone by a later change. It is proved able to fail by mutation (see PROJECT_STATUS.md).
{
  const problems = [];
  const deptText = readFileSync(join(ROOT, "src/config/departments.ts"), "utf8");
  let published = 0;
  let modelled = 0;
  for (const line of deptText.split("\n")) {
    if (!/\{ id: "[a-z0-9-]+", label: "/.test(line)) continue;
    if (/basis: \{ kind: "published"/.test(line)) published += 1;
    else if (/basis: \{ kind: "modelled"/.test(line)) modelled += 1;
  }
  if (published <= modelled) {
    problems.push(
      `the platform's real, published figures (${published}) no longer outnumber its own modelled ones (${modelled}) — the owner's locked goal (PART 11) requires published to EXCEED modelled`,
    );
  } else {
    notes.push(`INFO  the owner's locked goal holds: ${published} published figures outnumber ${modelled} modelled`);
  }
  check("real, published figures outnumber the modelled ones (the owner's locked goal)", problems);
}

// ---------------------------------------------------------------------------------------------
// check 23 — an Excel .xlsx upload is READ, not recorded by name (BATCH 4)
// The defect this exists for: the upload zone accepted `.txt`, `.docx` and `.pdf` and reported a
// spreadsheet as an unsupported type, so a department's return or statistics table — the most
// common shape of the data these departments actually hold — contributed nothing to a run. The
// reader is real and dependency-free (the same zip container the Word reader uses), so this gate
// fails the build if the capability is dropped or silently narrowed: the reader must exist and be
// wired into the extraction seam, and every upload surface must offer the type.
{
  const problems = [];
  const readerPath = join(ROOT, "src/services/extraction/xlsxText.ts");
  const extractorPath = join(ROOT, "src/services/extraction/extractPolicyText.ts");
  const surfaces = [
    join(ROOT, "src/components/PolicyInput.tsx"),
    join(ROOT, "src/components/documents/DepartmentDocumentsPanel.tsx"),
  ];

  if (!existsSync(readerPath)) {
    problems.push("src/services/extraction/xlsxText.ts is missing — a spreadsheet can no longer be read");
  } else {
    const reader = readFileSync(readerPath, "utf8");
    if (!/export const readXlsxText\s*=/.test(reader)) {
      problems.push("src/services/extraction/xlsxText.ts no longer exports readXlsxText");
    }
  }

  if (!existsSync(extractorPath)) {
    problems.push("src/services/extraction/extractPolicyText.ts is missing");
  } else {
    const extractor = readFileSync(extractorPath, "utf8");
    if (!/"xlsx"/.test(extractor)) {
      problems.push("the extraction seam no longer knows the xlsx kind");
    }
    if (!/readXlsxText/.test(extractor)) {
      problems.push(
        "the extraction seam no longer calls readXlsxText — a spreadsheet would be recorded by name again",
      );
    }
    if (!/\.xlsx/.test(extractor)) {
      problems.push("the extraction seam no longer classifies a .xlsx file");
    }
  }

  for (const surface of surfaces) {
    if (!existsSync(surface)) {
      problems.push(`${rel(surface)} is missing`);
      continue;
    }
    if (!/accept="[^"]*\.xlsx/.test(readFileSync(surface, "utf8"))) {
      problems.push(`${rel(surface)} no longer offers .xlsx in its file input`);
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  an Excel .xlsx is read in the browser and offered on every upload surface (BATCH 4)");
  }
  check("an Excel .xlsx upload is read, not recorded by name", problems);
}

// ---------------------------------------------------------------------------------------------
// check 24 — A DEPARTMENT'S OWN DOCUMENTS ARE USED IN THE DRAFTED POLICY (BATCH 5)
// The defect this exists for: a department could add its own reports, spreadsheets and statistics
// to its Document Library, and the run counted them and changed the seed — but the drafted policy
// itself never used them, so a department's own material could not make the instrument longer or
// better grounded. The generator now reads the run's own documents: it lists the ones really read
// at Annex D and quotes the department's own wording where it carries one of its stated priorities.
// This gate fails the build if that capability is dropped or silently narrowed.
{
  const problems = [];
  const generatorPath = join(ROOT, "src/services/assessment/policyDraft.ts");
  const structurePath = join(ROOT, "src/services/assessment/documentStructure.ts");
  const promptsPath = join(ROOT, "src/config/draftingPrompts.ts");

  if (!existsSync(generatorPath)) {
    problems.push("src/services/assessment/policyDraft.ts is missing");
  } else {
    const generator = readFileSync(generatorPath, "utf8");
    if (!/annex-documents/.test(generator)) {
      problems.push("the drafted policy no longer carries the documents annex (annex-documents)");
    }
    if (!/ANNEX\.documents/.test(generator)) {
      problems.push("the drafted policy no longer labels the documents annex from the one ANNEX list");
    }
    if (!/run\.documents/.test(generator)) {
      problems.push("the drafted policy no longer reads the run's own documents — the department's material would be ignored again");
    }
    if (!/document\.text/.test(generator)) {
      problems.push("the drafted policy no longer uses the text really read from a document");
    }
    if (!/situation-documents/.test(generator)) {
      problems.push("the situation analysis no longer carries the departmental-material clause");
    }
  }

  if (!existsSync(structurePath)) {
    problems.push("src/services/assessment/documentStructure.ts is missing");
  } else if (!/documents:\s*"Annex D"/.test(readFileSync(structurePath, "utf8"))) {
    problems.push("the ANNEX list no longer names the documents annex (Annex D)");
  }

  if (!existsSync(promptsPath)) {
    problems.push("src/config/draftingPrompts.ts is missing");
  } else if (!/Annex D — Documents and data relied upon/.test(readFileSync(promptsPath, "utf8"))) {
    problems.push("the policy structure no longer asks for the documents annex — the local generator and a configured service would disagree");
  }

  if (problems.length === 0) {
    notes.push("INFO  the drafted policy reads a department's own documents and quotes them where they carry its priorities (BATCH 5)");
  }
  check("a department's own documents are used in the drafted policy", problems);
}

// ---------------------------------------------------------------------------------------------
// check 25 — THE RUN-SIMULATION NOTICE IS SHOWN ONCE PER DEPARTMENT (BATCH 6)
// The owner asked for a notification on Run Simulation that says, honestly, that the drafted
// policy rests on the real published data the engine holds for the department (which is limited),
// and points the department at its Document Library. This gate fails the build if that capability
// is dropped or silently narrowed: the store that remembers the notice must exist and expose the
// two calls, the notice must link to the Document Library, and the policy input must consult and
// remember it. It is proved able to fail by mutation (see PROJECT_STATUS.md).
{
  const problems = [];
  const storePath = join(ROOT, "src/services/assessment/runNoticeStore.ts");
  const noticePath = join(ROOT, "src/components/RunSimulationNotice.tsx");
  const copyPath = join(ROOT, "src/config/runNotice.ts");
  const inputPath = join(ROOT, "src/components/PolicyInput.tsx");

  if (!existsSync(storePath)) {
    problems.push("src/services/assessment/runNoticeStore.ts is missing — the notice can no longer be remembered");
  } else {
    const store = readFileSync(storePath, "utf8");
    if (!/export const hasSeenRunNotice\s*=/.test(store)) {
      problems.push("the notice store no longer exposes hasSeenRunNotice");
    }
    if (!/export const markRunNoticeSeen\s*=/.test(store)) {
      problems.push("the notice store no longer exposes markRunNoticeSeen");
    }
  }

  if (!existsSync(noticePath)) {
    problems.push("src/components/RunSimulationNotice.tsx is missing — the Run-Simulation notice no longer exists");
  }

  if (!existsSync(copyPath)) {
    problems.push("src/config/runNotice.ts is missing — the notice's wording has gone");
  } else {
    const copy = readFileSync(copyPath, "utf8");
    if (!/Document Library/.test(copy)) {
      problems.push("the notice no longer points the department at its Document Library");
    }
    if (!/\/app\/documents/.test(copy)) {
      problems.push("the notice's link to the Document Library is gone");
    }
  }

  if (!existsSync(inputPath)) {
    problems.push("src/components/PolicyInput.tsx is missing");
  } else {
    const input = readFileSync(inputPath, "utf8");
    if (!/hasSeenRunNotice/.test(input)) {
      problems.push("the policy input no longer checks whether the notice has been seen");
    }
    if (!/markRunNoticeSeen/.test(input)) {
      problems.push("the policy input no longer remembers the notice");
    }
    if (!/RunSimulationNotice/.test(input)) {
      problems.push("the policy input no longer renders the Run-Simulation notice");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the Run-Simulation notice is shown once per department and points at the Document Library (BATCH 6)");
  }
  check("the Run-Simulation notice is shown once per department", problems);
}



// summary
console.log("\n" + "-".repeat(72));
if (notes.length) console.log(notes.join("\n") + "\n" + "-".repeat(72));
if (failures.length) {
  console.log(`VALIDATE: FAIL — ${failures.length} check group(s) red\n`);
  console.log(failures.join("\n\n"));
  process.exit(1);
}
console.log("VALIDATE: PASS — all checks green");