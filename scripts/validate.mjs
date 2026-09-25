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

  // Known-red, deliberately NOT enforced: recorded so it stays visible every run
  // without the landing-page work silently taking ownership of the whole app's
  // danger colour. See PROJECT_STATUS.md "Known-red".
  if (declared.destructive && declared.card) {
    notes.push(
      `INFO  KNOWN-RED (not enforced)  --destructive as text on --card measures ` +
        `${contrastOf(toRgb(declared.destructive), toRgb(declared.card)).toFixed(2)}:1 (needs 4.5:1). ` +
        `Out of scope for the landing page: it is the workspace risk-state colour and also drives ` +
        `destructive buttons app-wide.`,
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