#!/usr/bin/env node
/**
 * Nzwisiso static validator — fails loudly on forbidden patterns.
 * Run: npm run validate
 *
 * Checks (each prints PASS/FAIL/SKIP with counts):
 *  1. Banned user-facing copy (demo / prototype / fake data / coming soon / lorem ipsum)
 *  2. Forbidden predictive phrasing (claims about real public opinion / certainty)
 *  3. Vendor terminology (MiroFish / OASIS / GraphRAG / Zep / Puter / Vultr / Neo4j / ...)
 *  4. Non-determinism (Math.random / Date.now / new Date) in app source
 *  5. Runtime network URLs in app source or index.html
 *  6. 16 departments with the exact stable IDs (once config exists)
 *  7. REFERENCE_DATE pinned to 2026-09-24 (once config exists)
 *  8. Decision-support disclaimer present (once assessment/brand files exist)
 *  9. @media print rules present (once report screens exist)
 * 10. Rendered-pair contrast, MEASURED from the declared tokens in src/index.css
 * 11. Retired statements absent from the documents — false facts that were corrected at
 *     source, so a cold session cannot reintroduce one by copying an old paragraph
 * 12. The deployment claim is stated, agreed across documents, and carries its evidence
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];
const notes = [];
const DEPT_IDS = ["opc", "fin", "agri", "health", "edu", "hedu", "ict", "mines", "energy", "psc", "lg", "mfa", "env", "def", "zimra", "zida"];

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
check("banned user-facing copy", scan(appFiles, [
  ["banned-copy", /(?<!\.)\b(lorem ipsum|coming soon|reset demo|demo mode|prototype|fake data|placeholder data|demonstration build)\b/i],
], { ignoreLine: attrLine }));

// 2 — no claims about real public opinion or certainty
check("forbidden predictive phrasing", scan(appFiles, [
  ["predictive-claim", /\b(will definitely|zimbabweans will|citizens oppose|citizens support|the public will|public opinion will)\b/i],
]));

// 3 — vendor / implementation terminology must never be user-visible
check("vendor terminology scrubbed", scan(appFiles, [
  ["vendor-term", /\b(MiroFish|OASIS|GraphRAG|Graphiti|Zep|Puter|puter|Vultr|Neo4j|DeepSeek)\b/],
  // Implementation vocabulary the initiative's brief forbids in user-facing copy.
  // Uppercase-only on purpose: `api` is a legitimate local identifier (the stock
  // carousel primitive uses one), while `API` in prose is the banned sense.
  ["implementation-term", /\b(LLM|LLMs|API|APIs)\b/],
], { ignoreLine: commentLine }));

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
check("determinism (no Math.random/Date.now/new Date)", scan(appFiles, determinism, { ignoreLine: commentLine }));

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
    const statement =
      (brandText.match(/\n  description:([\s\S]*?)\n  (?=[\w/])/) || [])[1] || "";
    const owned = statement.includes('"')
      ? statement.replace(/[\s"+]/g, "").replace(/,$/, "")
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

// summary
console.log("\n" + "-".repeat(72));
if (notes.length) console.log(notes.join("\n") + "\n" + "-".repeat(72));
if (failures.length) {
  console.log(`VALIDATE: FAIL — ${failures.length} check group(s) red\n`);
  console.log(failures.join("\n\n"));
  process.exit(1);
}
console.log("VALIDATE: PASS — all checks green");