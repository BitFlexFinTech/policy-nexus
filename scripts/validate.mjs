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
 *  8. the scenario anchor date is pinned, and no reference date is exported
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
 * 26. The minister-facing line (the owner's locked item 6) is stated once in the identity file and
 *     rendered on the public landing page (BATCH 7)
 * 27. The platform administration screen sits behind the administrator gate — the gate exists, the
 *     route is wrapped by it, and the gate states plainly that it is NOT real security
 * 28. The platform administration screen is reachable from the public footer (the owner's
 *     instruction: an administrator must be able to find their own screen), while the workspace
 *     chrome deliberately carries no link to it
 * 29. The simulated support desk exists and is honestly labelled — the store, the officer's
 *     open-a-case form, the administrator's inbox, and the "kept in this browser only" statement
 * 30. There is ONE platform-mode master switch (owner's rule, 2026-10-06): `simulated` runs the
 *     scenario engine and shows its results; `live` uses only real services and shows nothing where
 *     one is missing. The administration screen carries the single control and the banner reads it.
 * 31. The administration screen clears this browser's saved data in one click (owner's instruction,
 *     2026-10-06) — the reset is composed in ONE place, forgets every store through its own seam, and
 *     sweeps the platform's shared key prefix so a store added later is cleared too.
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
  // openrouter.ai is allowed as DATA only: it is the DEFAULT address the administrator may
  // enter for the drafting model. It is not a request the shipped build makes — no request is
  // made at all until an administrator switches the capability on and the workspace drafts.
  ignoreLine: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) || /schemaLocation|w3\.org|localhost|127\.0\.0\.1|openrouter\.ai/.test(line),
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

// 7 — the scenario anchor date is pinned, and the reference-date concept is gone
const refFile = join(ROOT, "src/config/reference.ts");
if (!existsSync(refFile)) {
  console.log("SKIP  scenario anchor date — src/config/reference.ts not created yet");
} else {
  const text = readFileSync(refFile, "utf8");
  const problems = [];
  if (!/export const SCENARIO_ANCHOR_DATE = "2026-09-24"/.test(text)) {
    problems.push("src/config/reference.ts does not pin SCENARIO_ANCHOR_DATE to 2026-09-24");
  }
  if (/REFERENCE_DATE/.test(text)) {
    problems.push("src/config/reference.ts still names a REFERENCE_DATE — the reference-date concept was removed");
  }
  check("scenario anchor date pinned; no reference date exported", problems);
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

      // The block is the present-tense state by definition, so the bundle it names beside "IN SYNC"
      // must be the one this working copy actually builds. (Found 2026-10-06: the line named a
      // superseded bundle as "the same build `X`", which checks 12 and 19 — both keyed on the word
      // "serves" — did not see, so a stale name sat in the present tense.) The block's historical
      // batch notes are dated and phrased "on the live host (`X`)", so they are deliberately not
      // matched here.
      const distIndexHtml = join(ROOT, "dist/index.html");
      const syncAt = block.indexOf("IN SYNC");
      if (existsSync(distIndexHtml) && syncAt >= 0) {
        const builtNow = (readFileSync(distIndexHtml, "utf8").match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
        const close = block.indexOf(")", syncAt);
        const stated = close < 0 ? block.slice(syncAt) : block.slice(syncAt, close);
        for (const m of stated.matchAll(/assets\/index-[A-Za-z0-9_-]+\.js/g)) {
          if (builtNow && m[0] !== builtNow) {
            problems.push(
              `PROJECT_STATUS.md's RESUME HERE block names ${m[0]} as the current build, but this working copy builds ${builtNow} — a superseded bundle must not be presented as the current one`,
            );
          }
        }
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
// check 25 — THE RUN-SIMULATION NOTICE IS SHOWN BEFORE EVERY RUN (BATCH 6; revised 2026-10-06)
// The owner asked for a notification on Run Simulation that says, honestly, that the drafted
// policy rests on the real published data the engine holds for the department (which is limited),
// and points the department at its Document Library. The owner then made it a strict rule that
// it is shown before EVERY run (not once per department), so the store that once remembered it
// was removed. This gate fails the build if that capability is dropped or the "remembered"
// behaviour creeps back: the copy must point at the Document Library, the notice must exist, the
// policy input must render it and must NOT consult a store, and no runNoticeStore file may exist.
{
  const problems = [];
  const noticePath = join(ROOT, "src/components/RunSimulationNotice.tsx");
  const copyPath = join(ROOT, "src/config/runNotice.ts");
  const inputPath = join(ROOT, "src/components/PolicyInput.tsx");
  const storePath = join(ROOT, "src/services/assessment/runNoticeStore.ts");

  // The "shown once, then remembered" behaviour is gone on the owner instruction, so the
  // store must not come back.
  if (existsSync(storePath)) {
    problems.push("src/services/assessment/runNoticeStore.ts exists — the notice is shown before every run, so it must not be remembered again");
  }

  if (!existsSync(noticePath)) {
    problems.push("src/components/RunSimulationNotice.tsx is missing — the Run-Simulation notice no longer exists");
  }

  if (!existsSync(copyPath)) {
    problems.push("src/config/runNotice.ts is missing — the notice wording has gone");
  } else {
    const copy = readFileSync(copyPath, "utf8");
    if (!/Document Library/.test(copy)) {
      problems.push("the notice no longer points the department at its Document Library");
    }
    if (!/\/app\/documents/.test(copy)) {
      problems.push("the notice link to the Document Library is gone");
    }
  }

  if (!existsSync(inputPath)) {
    problems.push("src/components/PolicyInput.tsx is missing");
  } else {
    const input = readFileSync(inputPath, "utf8");
    if (!/RunSimulationNotice/.test(input)) {
      problems.push("the policy input no longer renders the Run-Simulation notice");
    }
    if (/hasSeenRunNotice|markRunNoticeSeen/.test(input)) {
      problems.push("the policy input still consults the removed notice store — the notice must be shown before every run");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the Run-Simulation notice is shown before every run and points at the Document Library (BATCH 6, revised 2026-10-06)");
  }
  check("the Run-Simulation notice is shown before every run", problems);

}

// ---------------------------------------------------------------------------------------------
// check 26 — THE MINISTER-FACING LINE IS ON THE LANDING PAGE (BATCH 7)
// The owner's locked item 6: ONE honest sentence, stating that the assessment is only as good as
// the real information a department provides — and that the department provides it through its
// Document Library — shown on the public landing page. This gate fails the build if the sentence
// is dropped from the identity file, if it stops naming the Document Library (the point of the
// line), or if the landing page stops rendering it. The wording was approved by the owner on
// 2026-10-06 and must not change without that approval again.
{
  const problems = [];
  const brandPath = join(ROOT, "src/config/brand.ts");
  const landingPath = join(ROOT, "src/pages/Landing.tsx");

  if (!existsSync(brandPath)) {
    problems.push("src/config/brand.ts is missing — the minister-facing line has no home");
  } else {
    const brand = readFileSync(brandPath, "utf8");
    if (!/export const MINISTER_STATEMENT\s*=/.test(brand)) {
      problems.push("src/config/brand.ts no longer exports MINISTER_STATEMENT");
    }
    if (!/Document Library/.test(brand)) {
      problems.push("the minister-facing line no longer names the Document Library");
    }
  }

  if (!existsSync(landingPath)) {
    problems.push("src/pages/Landing.tsx is missing");
  } else if (!/MINISTER_STATEMENT/.test(readFileSync(landingPath, "utf8"))) {
    problems.push("the landing page no longer renders the minister-facing line");
  }

  if (problems.length === 0) {
    notes.push("INFO  the minister-facing line is stated in the identity file and rendered on the public landing page (BATCH 7)");
  }
  check("the minister-facing line is on the public landing page", problems);
}

// ---------------------------------------------------------------------------------------------
// check 27 — THE PLATFORM ADMINISTRATION SCREEN SITS BEHIND THE ADMINISTRATOR GATE
// The screen holds the platform's connection settings, so it now asks one plain question before it
// will show them. This gate fails the build if the gate module, the gate component or the route
// wrapping is removed, or if the gate stops saying plainly that it is not real security. The
// confirmation is honest about its limit because the whole platform runs in the browser; the funded
// server is what makes real authorisation possible (NEXT PHASE item 3).
{
  const problems = [];
  const accessPath = join(ROOT, "src/session/adminAccess.ts");
  const gatePath = join(ROOT, "src/components/admin/AdminGate.tsx");
  const appPath = join(ROOT, "src/App.tsx");

  if (!existsSync(accessPath)) {
    problems.push("src/session/adminAccess.ts is missing — the guard has no home");
  } else {
    const access = readFileSync(accessPath, "utf8");
    if (!/export const ADMIN_GUARD_STATEMENT\s*=/.test(access)) {
      problems.push("src/session/adminAccess.ts no longer exports the guard's honest statement");
    }
    if (!/not real protection/.test(access)) {
      problems.push("the guard's statement no longer says it is not real protection");
    }
    if (!/export const isAdminAcknowledged\s*=/.test(access)) {
      problems.push("src/session/adminAccess.ts no longer exports isAdminAcknowledged");
    }
  }

  if (!existsSync(gatePath)) {
    problems.push("src/components/admin/AdminGate.tsx is missing — nothing gates the screen");
  } else if (!/ADMIN_GUARD_STATEMENT/.test(readFileSync(gatePath, "utf8"))) {
    problems.push("the gate no longer renders the guard's honest statement");
  }

  if (!existsSync(appPath)) {
    problems.push("src/App.tsx is missing");
  } else if (!/AdminGate/.test(readFileSync(appPath, "utf8"))) {
    problems.push("the platform administration route is no longer wrapped by AdminGate");
  }

  if (problems.length === 0) {
    notes.push("INFO  the platform administration screen sits behind the administrator gate, which states it is not real security");
  }
  check("the administrator gate protects the platform administration screen", problems);
}

// ---------------------------------------------------------------------------------------------
// check 28 — THE ADMINISTRATION SCREEN IS REACHABLE FROM THE PUBLIC FOOTER
// The owner's instruction (2026-10-06): an administrator must be able to find their own screen.
// It is linked once from the public footer, and deliberately NOT from the workspace navigation,
// which is where an ordinary officer would look. This fails the build if the footer link
// disappears (the owner could not reach their own admin page) or if a workspace link is added.
{
  const problems = [];
  const shellPath = join(ROOT, "src/components/public/PublicPageShell.tsx");
  if (!existsSync(shellPath)) {
    problems.push("src/components/public/PublicPageShell.tsx is missing");
  } else if (!/ADMIN_ROUTE/.test(readFileSync(shellPath, "utf8"))) {
    problems.push("the public footer no longer links to the administration screen — the owner must be able to find it");
  }
  const navPath = join(ROOT, "src/components/WorkspaceNav.tsx");
  if (existsSync(navPath) && /ADMIN_ROUTE/.test(readFileSync(navPath, "utf8"))) {
    problems.push("the workspace navigation links to the administration screen — it must not");
  }
  if (problems.length === 0) {
    notes.push("INFO  the administration screen is reachable from the public footer, and not from the workspace navigation");
  }
  check("the administration screen is reachable from the public footer", problems);
}

// ---------------------------------------------------------------------------------------------
// check 29 — THE SIMULATED SUPPORT DESK EXISTS AND IS HONESTLY LABELLED
// The owner's requirement: an officer opens a case (a support ticket), the administrator sees it,
// and it can be delegated to a support representative. It is built mock-first, so the screens must
// say plainly that a case is kept in this browser only until the support server exists. This fails
// the build if the store, the officer's form, the administrator's inbox, the workspace route, or
// the honest statement is removed.
{
  const problems = [];
  const configPath = join(ROOT, "src/config/support.ts");
  const storePath = join(ROOT, "src/services/support/supportStore.ts");
  const formPath = join(ROOT, "src/components/support/OpenCaseForm.tsx");
  const inboxPath = join(ROOT, "src/components/admin/SupportInbox.tsx");
  const pagePath = join(ROOT, "src/pages/Support.tsx");

  for (const path of [configPath, storePath, formPath, inboxPath, pagePath]) {
    if (!existsSync(path)) {
      problems.push(`the simulated support desk is incomplete — ${rel(path)} is missing`);
    }
  }

  if (existsSync(configPath)) {
    const config = readFileSync(configPath, "utf8");
    if (!/export const SUPPORT_DESK_LIMITATION\s*=/.test(config)) {
      problems.push("src/config/support.ts no longer exports the honest desk statement");
    }
    if (!/kept in THIS browser only/.test(config)) {
      problems.push("the support desk statement no longer says a case is kept in this browser only");
    }
  }
  if (existsSync(storePath)) {
    const store = readFileSync(storePath, "utf8");
    if (!/export const openSupportCase\s*=/.test(store)) {
      problems.push("the support store no longer opens a case");
    }
    if (!/export const assignSupportCase\s*=/.test(store)) {
      problems.push("the support store no longer delegates a case to a representative");
    }
  }
  const appPath = join(ROOT, "src/App.tsx");
  if (existsSync(appPath) && !/\/app\/support/.test(readFileSync(appPath, "utf8"))) {
    problems.push("src/App.tsx no longer mounts the /app/support route — an officer cannot open a case");
  }

  if (problems.length === 0) {
    notes.push("INFO  the simulated support desk exists and is honestly labelled (officer form, administrator inbox, kept in this browser only)");
  }
  check("the simulated support desk exists and is honestly labelled", problems);
}

// ---------------------------------------------------------------------------------------------
// check 30 — THE PLATFORM HAS ONE MODE MASTER SWITCH
// The owner's rule (2026-10-06): demo and live must be ONE control, not six. `simulated` runs the
// deterministic scenario engine and shows its results; `live` uses only real services and shows
// nothing where one is missing — never a simulated figure dressed up as real. This fails the build
// if the master switch, the single control, or the banner that reads it is removed.
{
  const problems = [];
  const platformPath = join(ROOT, "src/config/platform.ts");
  const adminPath = join(ROOT, "src/pages/PlatformAdmin.tsx");
  const noticePath = join(ROOT, "src/components/PlatformModeNotice.tsx");

  if (!existsSync(platformPath)) {
    problems.push("src/config/platform.ts is missing");
  } else {
    const platform = readFileSync(platformPath, "utf8");
    for (const symbol of ["platformMode", "withPlatformMode", "isPlatformLive", "setPlatformMode"]) {
      if (!new RegExp(`\\b${symbol}\\b`).test(platform)) {
        problems.push(`src/config/platform.ts no longer carries the master switch (${symbol})`);
      }
    }
  }
  if (!existsSync(adminPath)) {
    problems.push("src/pages/PlatformAdmin.tsx is missing");
  } else {
    const admin = readFileSync(adminPath, "utf8");
    if (!/Platform mode/.test(admin) || !/setPlatformMode/.test(admin)) {
      problems.push("the administration screen no longer carries the ONE platform-mode control");
    }
  }
  if (!existsSync(noticePath) || !/isPlatformLive/.test(readFileSync(noticePath, "utf8"))) {
    problems.push("the mode banner no longer reads the platform mode");
  }

  if (problems.length === 0) {
    notes.push("INFO  the platform has ONE mode master switch (simulated / live), read by the banner");
  }
  check("the platform has one mode master switch", problems);
}


// ---------------------------------------------------------------------------------------------
// check 31 — THE ADMINISTRATION SCREEN CLEARS THIS BROWSER'S SAVED DATA IN ONE CLICK
// The owner's instruction (2026-10-06): a "Clear this browser's saved data" control on the
// administration screen, so data left behind by an earlier build can be reset by the administrator
// themselves. The clear is composed in ONE place (`src/lib/browserData.ts`), which asks each store
// to forget through that store's OWN seam and then sweeps the platform's shared key prefix — so a
// store added later is cleared too. This fails the build if the control, the composer, or any
// store's forget-seam is removed.
{
  const problems = [];
  const dataPath = join(ROOT, "src/lib/browserData.ts");
  const adminPath = join(ROOT, "src/pages/PlatformAdmin.tsx");

  if (!existsSync(dataPath)) {
    problems.push("src/lib/browserData.ts is missing — the one place that clears the browser's data");
  } else {
    const data = readFileSync(dataPath, "utf8");
    for (const symbol of [
      "clearAllBrowserData",
      "BROWSER_DATA_PREFIX",
      "clearConfig",
      "clearContent",
      "clearRuns",
      "clearSupportCases",
      "clearAllDepartmentDocuments",
      "clearAllDrafts",
      "clearAllPolicyInput",
      "clearSession",
      "clearSsoAttempt",
    ]) {
      if (!new RegExp(`\\b${symbol}\\b`).test(data)) {
        problems.push(`the browser-data reset no longer forgets every store (${symbol} missing)`);
      }
    }
  }

  if (!existsSync(adminPath)) {
    problems.push("src/pages/PlatformAdmin.tsx is missing");
  } else {
    const admin = readFileSync(adminPath, "utf8");
    if (!/Clear this browser's saved data/.test(admin) || !/clearAllBrowserData/.test(admin)) {
      problems.push("the administration screen no longer offers the one-click reset");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the administration screen clears this browser's saved data in one click");
  }
  check("the administration screen clears this browser's saved data", problems);
}


// ---------------------------------------------------------------------------------------------
// check 32 — THE RESEARCH ASSISTANT HAS ITS OWN SEPARATE OPENROUTER KEY (ZEPARI Batch A)
// The owner's decision (2026-10-06): the ZEPARI research assistant uses its OWN OpenRouter key,
// entered separately from the drafting key, so each assistant's usage and cost are metered against
// its own key. This fails the build if the second capability, its label, its default, its
// persistence, its model requirement, or its card is removed.
{
  const problems = [];
  const platformPath = join(ROOT, "src/config/platform.ts");
  const adminPath = join(ROOT, "src/pages/PlatformAdmin.tsx");

  if (!existsSync(platformPath)) {
    problems.push("src/config/platform.ts is missing");
  } else {
    const platform = readFileSync(platformPath, "utf8");
    for (const [symbol, why] of [
      ["research: CapabilityConfig", "the research capability is not part of PlatformConfig"],
      ['research: "Research model (OpenRouter)"', "the research capability has no label"],
      ["research: demoAssistantCapability(BAKED_RESEARCH_KEY)", "the research capability has no default (it must carry its OWN baked demonstration key, so it is live with nothing typed)"],
      ["research: { ...config.research, mode }", "the master switch no longer flips the research capability"],
      ["research: normaliseService(record.research", "a stored research key would be dropped on reload"],
    ]) {
      if (!platform.includes(symbol)) problems.push(`src/config/platform.ts: ${why} (${symbol})`);
    }
    // Reached through OpenRouter, so it needs a model name exactly like drafting.
    if (!/id === "drafting" \|\| id === "research"\) && !capability\.model\.trim\(\)/.test(platform)) {
      problems.push("the research capability no longer requires a model name");
    }
  }

  if (!existsSync(adminPath)) {
    problems.push("src/pages/PlatformAdmin.tsx is missing");
  } else {
    const admin = readFileSync(adminPath, "utf8");
    if (!/SERVICE_CAPABILITIES\s*=\s*\[\s*"drafting"\s*,\s*"research"\s*\]/.test(admin)) {
      problems.push("the administration screen no longer shows BOTH OpenRouter cards (drafting and research)");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the ZEPARI research assistant has its own OpenRouter key, separate from the drafting key");
  }
  check("the research assistant has its own separate OpenRouter key", problems);
}


// ---------------------------------------------------------------------------------------------
// check 33 — THE ZEPARI RESEARCH ASSISTANT HAS ITS OWN ENTRY AND LANDING (ZEPARI Batch B)
// The owner's decision (2026-10-06): the platform carries TWO products, and opening the site
// presents a choice — the Nzwisiso policy-simulation assistant (departments) and the ZEPARI
// policy-research assistant, which has its own landing page and two one-click entries. This fails
// the build if the choice, the landing, the two entries, the separate session, or the routes are
// removed. It also fails if a registered mark is put on the ZEPARI name (owner's decision 7).
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const research = readIf("src/config/research.ts");
  if (research === null) {
    problems.push("src/config/research.ts is missing — the research product has no single source of truth");
  } else {
    for (const name of ["Dr. Gibson Chigumira", "Dr. Jesimen Chipika"]) {
      if (!research.includes(name)) problems.push(`src/config/research.ts no longer names ${name}`);
    }
    if (!/cannot read any research/.test(research)) {
      problems.push("src/config/research.ts no longer carries the confidentiality promise");
    }
    if (/®/.test(research)) {
      problems.push("src/config/research.ts asserts a registered mark on the ZEPARI name (owner's decision: none)");
    }
  }

  for (const rel of [
    "src/pages/ResearchLanding.tsx",
    "src/pages/research/ResearchOverview.tsx",
    "src/session/researchSession.ts",
    "src/routes/RequireResearchSession.tsx",
  ]) {
    if (readIf(rel) === null) problems.push(`${rel} is missing — the research entry is incomplete`);
  }

  const session = readIf("src/session/researchSession.ts");
  if (session && (!/signInResearcher/.test(session) || !/clearResearchSession/.test(session))) {
    problems.push("the research session no longer offers sign-in and sign-out");
  }

  const app = readIf("src/App.tsx");
  if (app && (!/path="\/research"/.test(app) || !/path="\/research\/app"/.test(app))) {
    problems.push("src/App.tsx no longer routes the research landing and workspace");
  }

  // The opening page (`/`) presents the choice of the two services. That choice is composed from
  // PLATFORM_HOME (owner's item 1, 2026-10-07), so this reads the homepage and the config together.
  const landing = readIf("src/pages/Home.tsx");
  if (landing) {
    const config = readIf("src/config/brand.ts") || "";
    const rendersChoice =
      /PLATFORM_HOME\.tools\.heading/.test(landing) && /PLATFORM_HOME\.tools\.research/.test(landing);
    const configNamesChoice =
      /heading:\s*"Choose a service"/.test(config) && /to:\s*"\/research"/.test(config);
    if (!(rendersChoice && configNamesChoice)) {
      problems.push("the opening page no longer presents the choice between the two services");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the ZEPARI research assistant has its own entry and landing, kept apart from the department workspace");
  }
  check("the ZEPARI research assistant has its own entry and landing", problems);
}


// ---------------------------------------------------------------------------------------------
// check 34 — THE RESEARCH LIBRARY IS A MOCK-FIRST SEAM, LABELLED PLAINLY (ZEPARI Batch C)
// The owner's decision: ZEPARI's research documents are kept on the servers ZEPARI holds; until that
// server is connected they are kept in THIS BROWSER, and the surface says so. This fails the build if
// the seam, either client, the honest label, the panel, or the workspace wiring is removed.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const seam = readIf("src/services/research/researchDocumentStore.ts");
  if (seam === null) {
    problems.push("src/services/research/researchDocumentStore.ts is missing — the research library has no seam");
  } else {
    for (const [symbol, why] of [
      ["LOCAL_RESEARCH_LIBRARY_STORE", "the Local client is gone"],
      ["createSharedResearchLibraryStore", "the Shared client is gone"],
      ["researchDocumentStoreFor", "the chooser is gone"],
      ['describeCapability(config, "library")', "the seam no longer follows the library capability"],
      ["This browser (Local)", "the honest Local label is gone"],
      ["Shared with nobody", "the honest limit is gone"],
    ]) {
      if (!seam.includes(symbol)) problems.push(`the research library seam: ${why} (${symbol})`);
    }
  }

  for (const rel of [
    "src/services/research/researchDocuments.ts",
    "src/components/research/ResearchLibraryPanel.tsx",
  ]) {
    if (readIf(rel) === null) problems.push(`${rel} is missing — the research library is incomplete`);
  }

  const panel = readIf("src/components/research/ResearchLibraryPanel.tsx");
  if (panel && !/researchDocumentStoreFor/.test(panel)) {
    problems.push("the research library panel no longer routes through the seam");
  }

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchLibraryPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders the research library");
  }

  if (problems.length === 0) {
    notes.push("INFO  the research library is a mock-first seam, kept in this browser and labelled plainly");
  }
  check("the research library is a mock-first seam, labelled plainly", problems);
}


// ---------------------------------------------------------------------------------------------
// check 35 — THE INSTITUTION DATA-CONNECTORS ARE A MOCK-FIRST SEAM THAT INVENTS NOTHING (ZEPARI Batch D)
// The owner's decision: the research assistant reads figures from the institute's own data sources.
// The seam records WHICH sources ZEPARI may read from; it reads NO figures itself, and says so — so
// the platform invents neither a source nor a figure. This fails the build if the seam, either client,
// the honest statement, the panel, or the wiring is removed.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const seam = readIf("src/services/research/researchConnectorStore.ts");
  if (seam === null) {
    problems.push("src/services/research/researchConnectorStore.ts is missing — the data-connectors have no seam");
  } else {
    for (const [symbol, why] of [
      ["LOCAL_RESEARCH_CONNECTOR_STORE", "the Local client is gone"],
      ["createSharedResearchConnectorStore", "the Shared client is gone"],
      ["researchConnectorStoreFor", "the chooser is gone"],
      ["No figures are read from these sources yet", "the honest statement that no figure is read is gone"],
    ]) {
      if (!seam.includes(symbol)) problems.push(`the data-connector seam: ${why} (${symbol})`);
    }
  }

  for (const rel of [
    "src/services/research/researchDataSources.ts",
    "src/components/research/ResearchDataSourcesPanel.tsx",
  ]) {
    if (readIf(rel) === null) problems.push(`${rel} is missing — the data-connectors are incomplete`);
  }

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchDataSourcesPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders the institution data-connectors");
  }

  if (problems.length === 0) {
    notes.push("INFO  the institution data-connectors are a mock-first seam that reads no figure until a server is connected");
  }
  check("the institution data-connectors are a mock-first seam that invents nothing", problems);
}


// ---------------------------------------------------------------------------------------------
// check 36 — THE RESEARCH CHAT IS GROUNDED, AND ANSWERS WITH OR WITHOUT A MODEL (ZEPARI Batch E)
// The owner's decision: the research assistant answers from ZEPARI's own documents and shows its
// sources. Retrieval always runs; the research model writes the answer when one is connected, and
// WITHOUT one the question is still ANSWERED — the matched passages are quoted from the library
// (see `researchAssembly.ts`). Nothing is invented either way.
//
// THIS CHECK HELPED HIDE A DEFECT AND WAS REWRITTEN ON 2026-10-07. It used to require the string
// "No answer model is connected" — so it DEMANDED a refusal to answer, which is exactly what the
// owner reported as "nothing happened" when he asked a question. It now requires the assembled
// answer, and the words that keep it honest. It fails the build if the retrieval, the chat service,
// the assembly, the panel or the wiring is removed, or if the answer can become empty again.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const retrieval = readIf("src/services/research/researchRetrieval.ts");
  if (retrieval === null) {
    problems.push("src/services/research/researchRetrieval.ts is missing — the chat is not grounded");
  } else if (!/findSources/.test(retrieval)) {
    problems.push("the retrieval no longer offers findSources — the chat cannot show its sources");
  }

  const assembly = readIf("src/services/research/researchAssembly.ts");
  if (assembly === null) {
    problems.push("src/services/research/researchAssembly.ts is missing — with no model connected a matched question would go unanswered, which is the defect the owner reported");
  } else {
    for (const [symbol, why] of [
      ["assembleAnswer", "the answer assembled from the library is gone"],
      ["QUOTED from ZEPARI's own documents", "the assembled answer no longer says that its words are quotations"],
      ["no words were written for you", "the assembled answer no longer says that no model wrote it"],
    ]) {
      if (!assembly.includes(symbol)) problems.push(`the library-only answer: ${why} (${symbol})`);
    }
  }

  const chat = readIf("src/services/research/researchChat.ts");
  if (chat === null) {
    problems.push("src/services/research/researchChat.ts is missing — there is no grounded chat");
  } else {
    for (const [symbol, why] of [
      ["askResearchQuestion", "the chat entry point is gone"],
      ['liveService("research")', "the chat no longer uses the research model key"],
      ["assembleAnswer", "the WITHOUT-A-MODEL answer is gone — a matched question would be left unanswered (the owner's defect)"],
      ["ASSEMBLED_ANSWER_DETAIL", "the plain line that says the answer was assembled is gone"],
    ]) {
      if (!chat.includes(symbol)) problems.push(`the research chat: ${why} (${symbol})`);
    }
  }

  const panel = readIf("src/components/research/ResearchChatPanel.tsx");
  if (panel === null) problems.push("src/components/research/ResearchChatPanel.tsx is missing");

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchChatPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders the grounded research chat");
  }

  if (problems.length === 0) {
    notes.push("INFO  the research chat answers from the research library with or without a model, and never fabricates an answer");
  }
  check("the research chat is grounded and answers with or without a model", problems);
}


// ---------------------------------------------------------------------------------------------
// check 37 — THE RESEARCH POLICY BRIEF IS GROUNDED, AND IS PRODUCED WITH OR WITHOUT A MODEL (ZEPARI
// Batch F). The owner's decision: a short brief drawn from the research library, with its sources
// shown. The structure is always shown; the research model writes the words when one is connected,
// and WITHOUT one the brief is still PRODUCED — assembled from the matched passages, with the one
// section that needs a judgement saying plainly that it was not produced (`researchAssembly.ts`).
//
// THIS CHECK HELPED HIDE A DEFECT AND WAS REWRITTEN ON 2026-10-07: it used to require the string
// "No brief model is connected", so it DEMANDED that no brief be produced. It now requires the
// assembled brief and the honesty that goes with it.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const assembly = readIf("src/services/research/researchAssembly.ts");
  if (assembly === null) {
    problems.push("src/services/research/researchAssembly.ts is missing — with no model connected a matched topic would produce no brief at all");
  } else {
    for (const [symbol, why] of [
      ["assembleBrief", "the brief assembled from the library is gone"],
      ["ASSEMBLED from ZEPARI's own documents", "the assembled brief no longer says that its words are quotations"],
      ["Not produced", "the assembled brief no longer admits which section it could not produce (a recommendation is a judgement)"],
    ]) {
      if (!assembly.includes(symbol)) problems.push(`the library-only brief: ${why} (${symbol})`);
    }
  }

  const brief = readIf("src/services/research/researchBrief.ts");
  if (brief === null) {
    problems.push("src/services/research/researchBrief.ts is missing — there is no research brief");
  } else {
    for (const [symbol, why] of [
      ["draftResearchBrief", "the brief entry point is gone"],
      ['liveService("research")', "the brief no longer uses the research model key"],
      ["assembleBrief", "the WITHOUT-A-MODEL brief is gone — a matched topic would be left without a brief"],
      ["ASSEMBLED_BRIEF_DETAIL", "the plain line that says the brief was assembled is gone"],
    ]) {
      if (!brief.includes(symbol)) problems.push(`the research brief: ${why} (${symbol})`);
    }
  }

  const panel = readIf("src/components/research/ResearchBriefPanel.tsx");
  if (panel === null) problems.push("src/components/research/ResearchBriefPanel.tsx is missing");

  const config = readIf("src/config/research.ts");
  if (config && !/RESEARCH_BRIEF_SECTIONS/.test(config)) {
    problems.push("the brief's fixed structure (RESEARCH_BRIEF_SECTIONS) is gone");
  }

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchBriefPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders the policy brief");
  }

  if (problems.length === 0) {
    notes.push("INFO  the research policy brief is produced from the research library with or without a model, and never fabricates a brief");
  }
  check("the research policy brief is grounded and is produced with or without a model", problems);
}

  // The old duplicate tail of check 37 — panel, structure, panel-wiring and its own `check(...)` — used
// to sit here. It was removed on 2026-10-07 when the check was rewritten, because a copied tail is a
// second source of truth for the same requirement and it left `problems`/`readIf` referenced outside
// the block that defines them.


// ---------------------------------------------------------------------------------------------
// check 38 — THE ECONOMIC BAROMETER NAMES THE SOURCE OF EVERY FIGURE (ZEPARI Batch G)
// The owner's decision: the barometer tracks the institute's own indicators. Each reading carries the
// body that published it, so a figure is NEVER shown without a source (the platform's sourcing rule).
// This fails the build if the source field, the seam, the honest statement, or the wiring is removed.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const store = readIf("src/services/research/researchBarometer.ts");
  if (store === null) {
    problems.push("src/services/research/researchBarometer.ts is missing — there is no barometer");
  } else if (!/source: string/.test(store)) {
    problems.push("a barometer reading no longer carries a source — a figure could be shown unsourced");
  }

  const seam = readIf("src/services/research/researchBarometerStore.ts");
  if (seam === null) {
    problems.push("src/services/research/researchBarometerStore.ts is missing — the barometer has no seam");
  } else {
    for (const [symbol, why] of [
      ["LOCAL_RESEARCH_BAROMETER_STORE", "the Local client is gone"],
      ["createSharedResearchBarometerStore", "the Shared client is gone"],
      ["researchBarometerStoreFor", "the chooser is gone"],
    ]) {
      if (!seam.includes(symbol)) problems.push(`the barometer seam: ${why} (${symbol})`);
    }
  }

  const panel = readIf("src/components/research/ResearchBarometerPanel.tsx");
  if (panel === null) {
    problems.push("src/components/research/ResearchBarometerPanel.tsx is missing");
  } else if (!/never shows a number without its source/.test(panel)) {
    problems.push("the barometer panel no longer states that a figure is never shown without its source");
  }

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchBarometerPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders the Economic Barometer");
  }

  if (problems.length === 0) {
    notes.push("INFO  the Economic Barometer names the source of every figure");
  }
  check("the Economic Barometer names the source of every figure", problems);
}


// ---------------------------------------------------------------------------------------------
// check 39 — FINDINGS ARE ROUTED TO DEPARTMENTS AND NEVER FEED THE ENGINE (ZEPARI findings surface)
// The owner's decision: a research finding is routed to the departments it concerns. A finding is a
// NOTE for a human reader — the strict boundary holds, so it is never read by the simulation engine.
// This fails the build if the destination departments, the real-department check, the boundary
// statement, or the wiring is removed.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const store = readIf("src/services/research/researchFindings.ts");
  if (store === null) {
    problems.push("src/services/research/researchFindings.ts is missing — there are no findings");
  } else {
    if (!/departments: DepartmentId\[\]/.test(store)) {
      problems.push("a finding no longer carries its destination departments");
    }
    if (!/isDepartmentId/.test(store)) {
      problems.push("findings are no longer scoped to real departments");
    }
  }

  const seam = readIf("src/services/research/researchFindingsStore.ts");
  if (seam === null) {
    problems.push("src/services/research/researchFindingsStore.ts is missing — the findings have no seam");
  }

  const panel = readIf("src/components/research/ResearchFindingsPanel.tsx");
  if (panel === null) {
    problems.push("src/components/research/ResearchFindingsPanel.tsx is missing");
  } else if (!/RESEARCH_BOUNDARY/.test(panel)) {
    problems.push("the findings panel no longer states the boundary (a finding never feeds the engine)");
  }

  const app = readIf("src/App.tsx");
  if (app && !/<ResearchFindingsPanel \/>/.test(app)) {
    problems.push("the research workspace no longer renders findings-to-departments");
  }

  if (problems.length === 0) {
    notes.push("INFO  findings are routed to the 16 departments and never feed the simulation engine");
  }
  check("findings are routed to departments and never feed the engine", problems);
}


// ---------------------------------------------------------------------------------------------
// check 40 — THE RESEARCH WORKSPACE IS A REAL WORKSPACE, NOT EMPTY BOXES (redesign, 2026-10-07)
// The owner's complaint: the research assistant was six panels stacked with nothing in them. It is now
// a workspace with a section navigation, a home that orients, and a seeded demonstration sample so it
// works the moment it opens. This fails the build if the shell, the navigation, the sections, the home,
// or the seeded sample is removed.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const layout = readIf("src/layouts/ResearchWorkspaceLayout.tsx");
  if (layout === null) {
    problems.push("src/layouts/ResearchWorkspaceLayout.tsx is missing — the research workspace has no shell");
  } else if (!/seedResearchSample/.test(layout)) {
    problems.push("the research workspace shell no longer seeds the demonstration sample");
  }

  const nav = readIf("src/components/research/ResearchNav.tsx");
  if (nav === null) {
    problems.push("src/components/research/ResearchNav.tsx is missing — there is no section navigation");
  } else {
    for (const section of ["/research/app/library", "/research/app/ask", "/research/app/barometer", "/research/app/findings"]) {
      if (!nav.includes(section)) problems.push(`the research navigation is missing a section (${section})`);
    }
  }

  const overview = readIf("src/pages/research/ResearchOverview.tsx");
  if (overview === null) {
    problems.push("src/pages/research/ResearchOverview.tsx is missing — the workspace has no home");
  } else if (!/Reset the sample/.test(overview) || !/Try this/.test(overview)) {
    problems.push("the research home no longer offers the try-this path and the reset control");
  }

  const app = readIf("src/App.tsx");
  if (app) {
    for (const route of ["/research/app", "/research/app/library", "/research/app/barometer", "/research/app/findings"]) {
      if (!app.includes(`path="${route}"`)) problems.push(`src/App.tsx no longer routes a research section (${route})`);
    }
  }

  const sample = readIf("src/services/research/researchSample.ts");
  if (sample === null) {
    problems.push("src/services/research/researchSample.ts is missing — the workspace would open empty");
  } else if (!/seedResearchSample/.test(sample) || !/resetResearchSample/.test(sample)) {
    problems.push("the demonstration sample no longer seeds and resets");
  }

  if (problems.length === 0) {
    notes.push("INFO  the research workspace has its own shell, section navigation, home and a seeded demonstration sample");
  }
  check("the research workspace is a real workspace, not empty boxes", problems);
}


// check 41 — THE PLATFORM HOMEPAGE REBUILD (owner's three asks, 2026-10-07)
// The owner directed a platform homepage at `/`, the policy-simulation landing MOVED to `/simulation`,
// a centred copyright line in every footer, and a static (non-clickable) hover picture of each tool's
// landing on its door. This gate fails the build if any of that is undone: if `/` stops rendering the
// new homepage, if `/simulation` stops rendering the moved landing, if the copyright line loses its
// "Oreida Pvt Ltd" name or its centred alignment, or if the hover picture stops being an inert,
// assistive-technology-hidden layer.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  // 1. `/` is the new homepage, and `/simulation` is the moved policy-simulation landing.
  const home = readIf("src/pages/Home.tsx");
  const app = readIf("src/App.tsx");
  if (home === null) {
    problems.push("src/pages/Home.tsx is missing — the platform homepage has no home");
  }
  if (app === null) {
    problems.push("src/App.tsx is missing");
  } else {
    if (!/path="\/"\s+element=\{<Home\s*\/>\}/.test(app)) {
      problems.push('src/App.tsx no longer renders the platform homepage at "/"');
    }
    if (!/path="\/simulation"\s+element=\{<SimulationLanding\s*\/>\}/.test(app)) {
      problems.push('src/App.tsx no longer renders the policy-simulation landing at "/simulation"');
    }
  }

  // 2. The centred copyright line: composed once, named in full, and rendered centred.
  const brand = readIf("src/config/brand.ts");
  if (brand === null || !/copyright:\s*`© 2026 \$\{PROMOTER_NAME\}\. All rights reserved\.`/.test(brand)) {
    problems.push(
      "src/config/brand.ts no longer composes the copyright line as `© 2026 ${PROMOTER_NAME}. All rights reserved.`",
    );
  }
  const copyrightSources = ["src/components/public/PublicPageShell.tsx", "src/components/SovereignFooter.tsx", "src/components/research/ResearchShell.tsx"];
  for (const rel of copyrightSources) {
    const source = readIf(rel);
    if (source === null) {
      problems.push(`${rel} is missing`);
    } else if (!/PROMOTER\.copyright/.test(source)) {
      problems.push(`${rel} no longer renders the copyright line`);
    } else if (!/text-center/.test(source)) {
      problems.push(`${rel} no longer centres the copyright line`);
    }
  }

  // 3. The hover picture is a static layer: inert (no pointer events) and hidden from assistive
  //    technology, and it is the tool's OWN landing component that is reused.
  if (home !== null) {
    if (!/pointer-events-none/.test(home)) {
      problems.push("the homepage hover preview is no longer inert (pointer-events-none removed)");
    }
    if (!/aria-hidden="true"/.test(home)) {
      problems.push("the homepage hover preview is no longer hidden from assistive technology");
    }
    if (!/<Landing\s*\/>/.test(home) || !/<ResearchLanding\s*\/>/.test(home)) {
      problems.push("the homepage hover preview no longer reuses the two tool landings");
    }
    if (!/hover: hover/.test(home) || !/pointer: fine/.test(home)) {
      problems.push("the homepage hover preview no longer guards against touch devices");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the platform homepage rebuild is in place (new /, moved /simulation, centred copyright, inert hover preview)");
  }
  check("the platform homepage rebuild is in place", problems);
}

// check 42 — THE TWO TOOLS ARE KEPT APART ON THEIR OWN PAGES (owner's instruction, 2026-10-07)
// The choice between the two products lives on the platform homepage (`/`). Each tool's OWN page must
// not offer a card for the other tool — the Nzwisiso policy-simulation page used to, and it passed
// every gate because nothing asserted the card's ABSENCE. This fails the build if `src/pages/Landing.tsx`
// again links to `/research` or shows a "Choose a service" chooser, or if either tool page (the
// simulation landing at `/simulation`, the research landing at `/research`) loses its way back to `/`.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const landing = readIf("src/pages/Landing.tsx");
  if (landing === null) {
    problems.push("src/pages/Landing.tsx is missing");
  } else {
    if (/to="\/research"/.test(landing)) {
      problems.push('src/pages/Landing.tsx links to "/research" — a tool page must not offer the other tool');
    }
    if (/Choose a service/.test(landing)) {
      problems.push('src/pages/Landing.tsx shows a "Choose a service" chooser — that choice belongs on the homepage');
    }
  }

  // Each tool's way home lives in its own SHELL HEADER, so it costs no height in the page content
  // (the simulation landing's primary action must stay on a phone's first screen).
  const publicShell = readIf("src/components/public/PublicPageShell.tsx");
  if (publicShell === null || !/Back to home/.test(publicShell) || !/to="\/"/.test(publicShell)) {
    problems.push('the public shell (PublicPageShell) carries no "Back to home" link to "/"');
  }
  const researchShell = readIf("src/components/research/ResearchShell.tsx");
  if (researchShell === null || !/Back to home/.test(researchShell) || !/to="\/"/.test(researchShell)) {
    problems.push('the research shell (ResearchShell) carries no "Back to home" link to "/"');
  }

  if (problems.length === 0) {
    notes.push("INFO  the two tools are kept apart on their own pages — each links back to the platform home and offers no card for the other tool");
  }
  check("the two tools are kept apart on their own pages", problems);
}

// check 43 — THE HOME PAGE AND THE TOOLS WEAR DIFFERENT IDENTITIES, AND THE HOME IS NEVER YELLOW
// (owner's instructions, 2026-10-07). The platform home and the tools must be clearly different, not
// one page frame reused: the home page wears the Zimbabwe flag's BLACK with GOLD accents, and the
// tool landings keep the emerald State palette. The owner's SECOND complaint is why this check is
// strict about colour: the earlier bright-gold masthead and hero band read as "yellow ... ugly and
// does not look like a government platform" — gold is an ACCENT on the home page, never a field. This
// fails the build if the home page loses its gold identity, if the home page paints a full gold
// background again, if its service bar stops being the flag's black, if the shell's gold identity
// turns back into a gold masthead, or if the shell stops supporting both identities.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const home = readIf("src/pages/Home.tsx");
  if (home === null || !/PublicPageShell[\s\S]{0,120}accent="gold"/.test(home)) {
    problems.push('src/pages/Home.tsx no longer wears the gold identity (`accent="gold"`) — it would look like the tool again');
  } else {
    // Gold is an accent. A bare `bg-gold` anywhere on the home page means a full yellow field has
    // come back. The gold action BUTTONS (`!bg-gold`) and `bg-gold-foreground` are not a field, so
    // they are deliberately not counted.
    const goldField = home.match(/(?<!!)bg-gold(?![-/\w])/g) ?? [];
    if (goldField.length > 0) {
      problems.push(`src/pages/Home.tsx paints a full gold background again (${goldField.length}× a bare \`bg-gold\`) — the owner rejected the yellow band; gold is an accent, never a field`);
    }
    if (!/bg-gold-foreground/.test(home)) {
      problems.push("src/pages/Home.tsx's service bar no longer wears the flag's black (`bg-gold-foreground`)");
    }
  }

  const landing = readIf("src/pages/Landing.tsx");
  if (landing && /accent="gold"/.test(landing)) {
    problems.push("src/pages/Landing.tsx is gold — the policy tool must keep its own emerald identity");
  }

  const shell = readIf("src/components/public/PublicPageShell.tsx");
  if (shell === null) {
    problems.push("src/components/public/PublicPageShell.tsx is missing");
  } else {
    if (!/bg-primary/.test(shell)) {
      problems.push("the public shell no longer supports the emerald identity for the tool pages");
    }
    // The GOLD identity read as its OWN block, so a change to the emerald one cannot satisfy it.
    const goldBlock = /gold:\s*\{([\s\S]*?)\n\s*\}/.exec(shell)?.[1] ?? "";
    if (goldBlock === "") {
      problems.push("the public shell has no `gold` identity block");
    } else {
      if (!/masthead:\s*"bg-gold-foreground"/.test(goldBlock)) {
        problems.push('the shell\'s gold identity no longer paints the masthead the flag\'s black (`masthead: "bg-gold-foreground"`) — a gold masthead is the yellow the owner rejected');
      }
      if (!/rule:\s*"bg-gold"/.test(goldBlock)) {
        problems.push("the shell's gold identity lost its gold hairline under the masthead");
      }
      if (!/footer:\s*"bg-gold-foreground"/.test(goldBlock)) {
        problems.push("the shell's gold identity no longer paints the footer the flag's black");
      }
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the home page wears the flag's black with gold accents (gold never a full field) and the tool landings wear emerald — the two are kept visually apart");
  }
  check("the home page and the tools wear different identities", problems);
}

// check 44 — THE HOME PAGE'S SERVICE BAR SITS AT THE VERY TOP OF THE PAGE (owner's instruction,
// 2026-10-07 — reported twice). The owner's words: the two cards "should be at the very top of the
// page so they don't disturb the content", and after the first attempt they were still "under the
// part that says 'Internal service'". The agreed arrangement is therefore: the coat-of-arms masthead,
// then the SERVICE BAR, then the notice strip, then the page's own content. This fails the build if
// the shell ever draws the notice strip before the service-bar slot again — the exact placement the
// owner rejected — and the homepage browser test measures the same five positions in a real browser.
// (This is the check the first attempt was missing: it passed every gate while still being wrong.)
{
  const problems = [];
  const shellPath = "src/components/public/PublicPageShell.tsx";
  const shellFile = join(ROOT, shellPath);
  if (!existsSync(shellFile)) {
    problems.push(`${shellPath} is missing`);
  } else {
    const shell = readFileSync(shellFile, "utf8");
    // The rendered order, read straight out of the JSX.
    const heroAt = shell.indexOf("{hero}");
    const stripAt = shell.indexOf("<OfficialNoticeStrip");
    if (heroAt === -1) {
      problems.push("the public shell no longer renders the `hero` slot — the home page's service bar would disappear");
    } else if (stripAt === -1) {
      problems.push("the public shell no longer renders the notice strip");
    } else if (heroAt > stripAt) {
      problems.push('the public shell draws the notice strip BEFORE the `hero` slot — the home page\'s cards would again sit under the "Internal service" line, which the owner rejected');
    }
    if (!/data-testid="notice-strip"/.test(shell)) {
      problems.push('the notice strip carries no `data-testid="notice-strip"` — the browser test cannot measure where the cards sit relative to it');
    }
  }
  if (problems.length === 0) {
    notes.push("INFO  the home page's service bar is drawn directly under the Government header and ABOVE the \"Internal service\" line — the placement the owner asked for");
  }
  check("the home page's service bar sits at the very top of the page", problems);
}

// check 45 — THE ZEPARI LANDING PAGE CARRIES THE STATUS BAND, WORDED FOR RESEARCH (owner's
// instruction, 2026-10-07). The ZEPARI landing page was the only landing page without the band that
// the home page and the policy tool's page wear. It now has one, and its words come from ZEPARI's own
// config — never from the department side, because "Simulation results are modelled" would be FALSE
// on the research side (that assistant models nothing; it answers from ZEPARI's own library). This
// fails the build if the band disappears, if its words stop coming from the research config, if the
// department sentence is pasted onto the research side, or if either band's wording moves back into a
// component instead of its single config home.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const researchShell = readIf("src/components/research/ResearchShell.tsx");
  if (researchShell === null) {
    problems.push("src/components/research/ResearchShell.tsx is missing");
  } else {
    if (!/<ResearchServiceNotice\s*\/>/.test(researchShell)) {
      problems.push("the ZEPARI pages no longer render a status band — the research landing page would be the only landing page without one");
    }
    if (!/RESEARCH_SERVICE_NOTICE\.body/.test(researchShell)) {
      problems.push("the ZEPARI status band no longer reads its wording from `RESEARCH_SERVICE_NOTICE` — the words must live in the research config, not in the shell");
    }
  }

  const research = readIf("src/config/research.ts");
  if (research === null) {
    problems.push("src/config/research.ts is missing");
  } else {
    if (!/export const RESEARCH_SERVICE_NOTICE/.test(research)) {
      problems.push("`RESEARCH_SERVICE_NOTICE` is missing from the research config");
    }
    if (/Simulation results are modelled/i.test(research)) {
      problems.push('the research config carries the DEPARTMENT band\'s sentence ("Simulation results are modelled…") — that claim is false on the research side');
    }
    if (!/research library/.test(research)) {
      problems.push("the ZEPARI status band no longer says where its answers come from (the research library)");
    }
  }

  // The two bands stay two separate sources, each in its own single config home.
  const brand = readIf("src/config/brand.ts");
  if (brand === null || !/export const SERVICE_NOTICE/.test(brand)) {
    problems.push("`SERVICE_NOTICE` is missing from the brand config — the department band's wording must live in one place");
  }
  const publicShell = readIf("src/components/public/PublicPageShell.tsx");
  if (publicShell !== null && /are modelled, and are labelled as simulated/.test(publicShell)) {
    problems.push("the department band's sentence is written inside PublicPageShell again — it belongs in src/config/brand.ts");
  }

  if (problems.length === 0) {
    notes.push("INFO  both status bands are in place and worded apart: the department pages say the results are modelled, and the ZEPARI pages say where their answers and figures come from");
  }
  check("the ZEPARI landing page carries its own status band", problems);
}

// check 46 — THE PICTURE OF A TOOL'S PAGE BEGINS AT THE BOTTOM OF THE CARDS (owner's instruction,
// 2026-10-07, verbatim: "when the mouse hovers over the card the bottom of the card should be treated
// as the top of the screen. so the user sees the whole page for the tool including the header etc").
// The picture used to be pinned to the very top of the screen (`fixed inset-0`), so the START of the
// tool's page sat behind the Government header and the cards, and the reader only ever saw the MIDDLE
// of that page — the defect the owner reported. It must now be anchored to the BOTTOM of the window
// with its TOP measured from the bottom edge of the card bar; the header and the cards must stay
// exactly where they are and stay painted above it; the page's own notice line must step aside while a
// picture is up (the tool's page brings its own, and that line sits between the cards and the content,
// where it would cut the top off the picture); and the wheel over the cards must slide the picture, so
// the whole of the tool's page stays reachable. The homepage browser test measures the edge in a real
// browser, with a card hovered.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);
  const shell = readIf("src/components/public/PublicPageShell.tsx");
  const home = readIf("src/pages/Home.tsx");

  if (shell === null) {
    problems.push("src/components/public/PublicPageShell.tsx is missing");
  } else {
    if (!/\{overlay\}/.test(shell)) {
      problems.push("the public shell no longer renders the `overlay` slot — the home page's hover picture would have nowhere to go below the chrome");
    }
    if (!/relative z-50">\{hero\}/.test(shell)) {
      problems.push("the public shell no longer paints the cards' band above the hover picture (`relative z-50` around `{hero}`)");
    }
    if (!/\{overlay \? null : \(/.test(shell)) {
      problems.push("the public shell no longer lets the page's own notice line step aside while a tool's picture is up — that line sits between the cards and the content, so it would cut the top off the picture and print a second, competing line above the tool's own band");
    }
    if (!/data-testid="notice-strip-wrap"/.test(shell)) {
      problems.push('the notice strip has no `data-testid="notice-strip-wrap"` — the browser test cannot measure it');
    }
    if (!/relative z-50 bg-background">\s*<OfficialNoticeStrip/.test(shell)) {
      problems.push("the notice strip is no longer wrapped in an opaque `relative z-50 bg-background` layer — a translucent strip would let the hover picture show through it");
    }
  }

  if (home === null) {
    problems.push("src/pages/Home.tsx is missing");
  } else {
    if (!/overlay=\{/.test(home)) {
      problems.push("src/pages/Home.tsx no longer passes its hover picture through the shell's `overlay` slot — a layer drawn inside the card bar would be painted behind the cards again");
    }
    if (/fixed inset-0/.test(home)) {
      problems.push('the hover picture is pinned to the very TOP of the screen again (`fixed inset-0`) — the bottom of the card must be the top of the screen, or the tool\'s page is seen from its middle with its own header hidden behind the cards (the owner\'s report)');
    }
    if (!/fixed inset-x-0 bottom-0/.test(home)) {
      problems.push("the hover picture is no longer anchored to the BOTTOM of the window (`fixed inset-x-0 bottom-0`)");
    }
    if (!/style=\{\{ top: pictureTop \}\}/.test(home)) {
      problems.push("the hover picture's top edge is no longer the measured bottom edge of the cards (`style={{ top: pictureTop }}`)");
    }
    if (!/ref=\{barRef\}/.test(home) || !/data-testid="service-bar"/.test(home)) {
      problems.push('the cards\' bar has lost its measuring anchor (`ref={barRef}` + `data-testid="service-bar"`) — the picture\'s top edge would have nothing to measure against');
    }
    if (!/getBoundingClientRect\(\)\.bottom/.test(home)) {
      problems.push("src/pages/Home.tsx no longer measures the BOTTOM edge of the cards");
    }
    if (
      !/bar\.addEventListener\("wheel", slidePicture, \{ passive: false \}\)/.test(home) ||
      !/event\.preventDefault\(\)/.test(home) ||
      !/node\.scrollTop \+= event\.deltaY/.test(home)
    ) {
      problems.push("rolling the wheel over the cards no longer slides the picture — the rest of the tool's page would be unreachable, so the reader could never see the whole page. The listener must stay NON-passive (`{ passive: false }`) and stop the page scrolling underneath, or the cards move out from under the pointer and the picture vanishes mid-read (the defect found on 2026-10-07)");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the hover picture begins at the BOTTOM EDGE OF THE CARDS: the tool's page is read from its own header down, the header and the cards stay put and painted above it, the page's own notice line steps aside while it is up, and the wheel over the cards slides it so the whole page stays reachable");
  }
  check("the picture of a tool's page begins at the bottom of the cards", problems);
}

// check 47 — THE TWO CONFIDENTIALITY CARDS, AND ONLY THOSE TWO (owner's instruction, 2026-10-07:
// "we also need to add this card to the policy simulator but obviously modify the wording for policy",
// with one sentence for the /simulation page about a POLICY DRAFT and one for the home page about
// DOCUMENTS). The owner dictated both sentences, so this fails the build if either page loses its card,
// if a sentence stops coming from the single config home, or — the point of the check — if the two are
// ever SWAPPED. A reader must never see "cannot read any documents" on the simulator or "cannot read
// any policy draft" on the home page, because the second is a narrower promise in the wrong place.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const brand = readIf("src/config/brand.ts");
  if (brand === null) {
    problems.push("src/config/brand.ts is missing");
  } else if (!/export const CONFIDENTIALITY = \{/.test(brand)) {
    problems.push("src/config/brand.ts no longer holds the CONFIDENTIALITY statement — the two cards would have nowhere to come from");
  } else {
    if (!/simulator: `\$\{PROMOTER\.name\} cannot read any policy draft\./.test(brand)) {
      problems.push('the simulator\'s confidentiality sentence no longer says "cannot read any policy draft" — the policy page must name a policy draft');
    }
    if (!/home: `\$\{PROMOTER\.name\} cannot read any documents\./.test(brand)) {
      problems.push('the home page\'s confidentiality sentence no longer says "cannot read any documents"');
    }
    if (!/servers managed by \$\{PROMOTER\.name\}/.test(brand)) {
      problems.push("the confidentiality statement no longer says whose servers the data is stored on");
    }
    if (!/heading: "Confidentiality"/.test(brand)) {
      problems.push('the confidentiality heading is gone — the card must still say "Confidentiality"');
    }
  }

  const simulatorPage = readIf("src/pages/Landing.tsx");
  if (simulatorPage === null) {
    problems.push("src/pages/Landing.tsx is missing — the policy simulator page has no confidentiality card");
  } else {
    if (!/CONFIDENTIALITY\.simulator/.test(simulatorPage)) {
      problems.push("the policy-simulation page no longer shows the confidentiality card (CONFIDENTIALITY.simulator)");
    }
    if (/CONFIDENTIALITY\.home/.test(simulatorPage)) {
      problems.push('the policy-simulation page shows the HOME page\'s wording ("any documents") — the simulator must name a policy draft');
    }
  }

  const homePage = readIf("src/pages/Home.tsx");
  if (homePage === null) {
    problems.push("src/pages/Home.tsx is missing");
  } else {
    if (!/CONFIDENTIALITY\.home/.test(homePage)) {
      problems.push("the platform home page no longer shows the confidentiality card (CONFIDENTIALITY.home)");
    }
    if (/CONFIDENTIALITY\.simulator/.test(homePage)) {
      problems.push('the platform home page shows the SIMULATOR\'s wording ("policy draft") — the home page is the door to both assistants, so its promise is about documents');
    }
  }

  if (problems.length === 0) {
    notes.push('INFO  both confidentiality cards are in place and worded apart: the policy simulator names a policy draft, and the home page speaks about documents');
  }
  check("the two confidentiality cards are in place and are not swapped", problems);
}

// check 48 — THE RESEARCH SCREENS WEAR ZEPARI'S COLOURS, NEVER THE DEPARTMENT'S EMERALD (owner's
// report, 2026-10-07: "the buttons on the research assistant are still green, this is unacceptable …
// why are the accents and some of the colors still green instead of using ZEPARI's color theme").
//
// The `.zepari` scope had always defined ZEPARI's colours — but under NEW names, while every SHARED
// component inside it (the button's `bg-primary`, the input's focus `--ring`, the page paper) read the
// PLATFORM's tokens, which are the State emerald in `:root`. Measured before the fix: the Ask button
// computed to `rgba(0, 102, 0, 0.9)` = #006600. This check fails the build if the remap is removed,
// if it stops pointing at a `--zp-*` token, or if `:root` is ever moved BELOW the scope (which would
// make the palette-lock test read ZEPARI's value as the State palette).
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  const css = readIf("src/index.css");
  if (css === null) {
    problems.push("src/index.css is missing");
  } else {
    const rootAt = css.indexOf(":root");
    const zepariAt = css.indexOf(".zepari");
    if (rootAt === -1) {
      problems.push("src/index.css no longer holds the `:root` palette — the State colours are gone");
    }
    if (zepariAt === -1) {
      problems.push("src/index.css no longer holds the `.zepari` scope — the research screens would wear the department palette");
    }
    if (rootAt > -1 && zepariAt > -1 && zepariAt < rootAt) {
      problems.push("the `.zepari` scope is declared BEFORE `:root` — the locked-palette test reads the FIRST `--primary:` in the file, so it would read ZEPARI's value as the State emerald");
    }
    const scope = zepariAt > -1 ? css.slice(zepariAt) : "";
    for (const [line, why] of [
      ["--primary: var(--zp-navy)", "the research side's solid fills are not ZEPARI navy — a shared button would fall back to the department emerald again (the owner's report)"],
      ["--ring: var(--zp-blue)", "the research side's focus outlines are not ZEPARI blue"],
      ["--background: var(--zp-canvas)", "the research side's page paper is not ZEPARI's"],
    ]) {
      if (!scope.includes(line)) problems.push(`the ZEPARI colour scope: ${why} (${line})`);
    }
    if (!/--primary: 120 100% 20%;/.test(css)) {
      problems.push("the State emerald (`--primary: 120 100% 20%`) is no longer in the palette — the department side is a locked constraint");
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the research screens wear ZEPARI's navy, blue and neutrals: the shared buttons, focus rings and page paper inside `.zepari` no longer fall back to the department emerald");
  }
  check("the research screens wear ZEPARI's colours, never the department emerald", problems);
}

// check 49 — THE IN-BROWSER MODEL IS GONE FOR GOOD, AND BOTH ASSISTANTS ARE LIVE FROM THE BUILD WITH
// NOTHING TYPED (the owner's strict rules, 2026-10-07: "no remove the in-browser model completely. we
// dont need it, it failed." and "the api keys should be saved … i should just open the website and
// everything should work").
//
// Two jobs. (1) The free in-browser model must never come back — its file, its downloader, its
// build-time file-copier, its browser proof, its dependency and its downloaded binary all stay out.
// (2) The demonstration keys must stay baked into the build: the drafting and research defaults must
// read the two `VITE_`-prefixed names, so the platform is live the moment it opens. A future session
// must NOT "helpfully" remove the baked key for safety — that is now a defect, not a fix.
{
  const problems = [];
  const readIf = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

  for (const [file, why] of [
    ["src/services/research/researchBrowserModel.ts", "the removed in-browser model is back"],
    ["scripts/fetch-models.mjs", "the removed in-browser model's downloader is back"],
    ["scripts/prune-dist.mjs", "the removed in-browser model's build step is back"],
    ["e2e/research-model.spec.ts", "the removed in-browser model's browser proof is back"],
    ["public/models", "the removed in-browser model's binary is back (about 53 MB that must never be committed)"],
  ]) {
    if (existsSync(join(ROOT, file))) problems.push(`${file} exists again — ${why}`);
  }

  const packageJson = readIf("package.json");
  if (packageJson) {
    if (/@huggingface\/transformers/.test(packageJson)) {
      problems.push("`@huggingface/transformers` is back in package.json — the in-browser model's dependency must stay removed");
    }
    if (/"fetch:models"/.test(packageJson)) {
      problems.push("`npm run fetch:models` is back in package.json — the in-browser model's command must stay removed");
    }
    if (!/"build": "vite build"/.test(packageJson)) {
      problems.push("the build script is no longer plain `vite build` — the removed model's prune step must not return");
    }
  }

  const platform = readIf("src/config/platform.ts");
  if (platform === null) {
    problems.push("src/config/platform.ts is missing");
  } else {
    for (const [name, why] of [
      ["import.meta.env.VITE_OPENROUTER_KEY_POLICY", "the Nzwisiso drafter's key is no longer read into the build, so it would have to be typed in again (the owner's strict rule)"],
      ["import.meta.env.VITE_OPENROUTER_KEY_RESEARCH", "the ZEPARI assistant's key is no longer read into the build, so it would have to be typed in again (the owner's strict rule)"],
    ]) {
      if (!platform.includes(name)) problems.push(`the demonstration keys: ${why} (${name})`);
    }
    if (
      !/drafting: demoAssistantCapability\(/.test(platform) ||
      !/research: demoAssistantCapability\(/.test(platform)
    ) {
      problems.push("the drafting and research defaults no longer carry a baked demonstration key — the site would open with both assistants needing a key typed in");
    }
  }

  const env = readIf(".env");
  if (env !== null) {
    for (const name of ["VITE_OPENROUTER_KEY_POLICY", "VITE_OPENROUTER_KEY_RESEARCH"]) {
      if (!new RegExp(`^${name}=\\S`, "m").test(env)) {
        problems.push(`.env no longer carries ${name} — the built site would open with that assistant needing a key typed in`);
      }
    }
  }

  if (problems.length === 0) {
    notes.push("INFO  the in-browser model is gone for good, and both demonstration keys are baked into the build — the site is live the moment it opens");
  }
  check("the in-browser model is gone, and both assistants are live from the build with nothing typed", problems);
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