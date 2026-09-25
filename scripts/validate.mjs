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
}

// 9 — print rules present once report actions exist
const reportFile = join(ROOT, "src/components/assessment/DocumentActions.tsx");
if (!existsSync(reportFile)) {
  console.log("SKIP  @media print rules — report actions not created yet");
} else {
  const css = [join(ROOT, "src/index.css")].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
  check("@media print rules present", /@media\s+print/.test(css) ? [] : ["no @media print block found in src/index.css"]);
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