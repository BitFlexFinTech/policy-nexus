#!/usr/bin/env node
/**
 * BUILD THE DEPARTMENT DOCUMENT REGISTER — from the real published documents, so a screen and the
 * documents themselves can never disagree about what a department holds.
 *
 * WHY THIS EXISTS. The department library screen, the workspace rail and the relationship graph all
 * need to know a department's documents the moment the screen is drawn, with no waiting for a
 * download. The documents' own text is far too large for that (125 documents, about 9 MB), so the text
 * ships separately — one file per department, `public/department-corpus/<id>.json`, published with the
 * rest of the site and read only when a screen really needs the wording. This script produces the
 * small part every screen needs at once: the REGISTER — each document's title, the body that published
 * it, its date, the address of the published file, how many pages it has, whether its text could really
 * be read, and how many characters of text were read.
 *
 * ONE SOURCE OF TRUTH. The corpus files are the source; `src/config/departmentDocuments.ts` is derived
 * from them and nothing in it is typed by hand. `npm run validate` re-runs this script in check mode
 * and fails the build if the two have drifted apart, so the register can never quietly disagree with
 * the documents it claims to describe.
 *
 * NOTHING IS INVENTED HERE. Every value is copied from the corpus, which was itself built from the
 * body that published each document. A document whose text could not be read is carried across with
 * `read: false` and no text, exactly as the corpus records it.
 *
 * Usage:
 *   node scripts/build-department-register.mjs            # write src/config/departmentDocuments.ts
 *   node scripts/build-department-register.mjs --check     # compare only; exit 1 when out of date
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CORPUS_DIR = join(ROOT, "public/department-corpus");
const OUT = join(ROOT, "src/config/departmentDocuments.ts");

const HEADER = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * The department document register: what each department's library holds, derived from the real
 * published documents in \`public/department-corpus/<departmentId>.json\` by
 * \`scripts/build-department-register.mjs\`.
 *
 * WHY IT IS GENERATED. A screen must know a department's documents the instant it draws, but the
 * documents' own text is far too large to load for that (125 documents, about 9 MB). The text stays in
 * the corpus, read only when the wording is needed; this file carries the register every screen needs.
 * Because it is produced from the corpus rather than typed by hand, the register and the documents
 * cannot drift apart — \`npm run validate\` re-runs the generator and fails the build if they do.
 *
 * Every value below is copied from the corpus, which was built from the body that published each
 * document. Nothing here is invented, and a document whose text could not be read is recorded as
 * \`read: false\` with no characters, never quietly dropped.
 */

import type { DepartmentDocument, DepartmentId } from "./departments";

/** Every department's published documents, keyed by department id. */
export const DEPARTMENT_DOCUMENTS: Record<DepartmentId, readonly DepartmentDocument[]> = {
`;

const FOOTER = `};
`;

/** A string written into the generated file, escaped exactly as TypeScript reads it back. */
const quote = (value) => JSON.stringify(value);

/** One document, laid out one field per line so a change is readable in the diff. */
const documentEntry = (document) =>
  [
    "    {",
    `      id: ${quote(document.id)},`,
    `      section: ${quote(document.section)},`,
    `      title: ${quote(document.title)},`,
    `      publisher: ${quote(document.publisher)},`,
    `      date: ${quote(document.date)},`,
    `      url: ${quote(document.url)},`,
    `      pages: ${document.pages},`,
    `      read: ${document.read},`,
    `      characters: ${document.characters},`,
    "    },",
  ].join("\n");

/** Fail loudly rather than writing a register that misdescribes the documents. */
const problems = [];

const readCorpus = (name) => {
  const department = name.replace(/\.json$/, "");
  const path = join(CORPUS_DIR, name);
  let corpus;
  try {
    corpus = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`public/department-corpus/${name} could not be read (${error.message})`);
    return null;
  }
  const documents = Array.isArray(corpus.documents) ? corpus.documents : [];
  if (documents.length === 0) {
    problems.push(`${department} ships no documents at all`);
    return null;
  }
  const entries = [];
  for (const document of documents) {
    for (const field of ["id", "section", "title", "publisher", "date", "url"]) {
      if (typeof document[field] !== "string" || document[field].length === 0) {
        problems.push(`${department}/${document.id ?? "?"} has no ${field}`);
      }
    }
    if (typeof document.pages !== "number" || document.pages <= 0) {
      problems.push(`${department}/${document.id} records no page count`);
    }
    if (typeof document.read !== "boolean") {
      problems.push(`${department}/${document.id} does not record whether it could be read`);
    }
    if (typeof document.characters !== "number") {
      problems.push(`${department}/${document.id} records no character count`);
    }
    // The corpus rule, checked again here so the register can never carry a contradiction:
    // a document that could not be read contributes no text, and one that could, does.
    if (document.read && !(typeof document.text === "string" && document.text.length > 0)) {
      problems.push(`${department}/${document.id} is marked read but carries no text`);
    }
    if (!document.read && document.text !== "") {
      problems.push(`${department}/${document.id} is marked not read but carries text`);
    }
    entries.push({
      id: document.id,
      section: document.section,
      title: document.title,
      publisher: document.publisher,
      date: document.date,
      url: document.url,
      pages: document.pages,
      read: document.read,
      characters: document.characters,
    });
  }
  return { department, entries };
};

if (!existsSync(CORPUS_DIR)) {
  console.error(`FAIL  ${CORPUS_DIR} is missing — there is nothing to build the register from.`);
  process.exit(1);
}

const files = readdirSync(CORPUS_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();
const corpora = files.map(readCorpus).filter(Boolean);

if (problems.length > 0) {
  console.error("FAIL  the register was not written:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const body = corpora
  .map(
    (corpus) => `  ${corpus.department}: [\n${corpus.entries.map(documentEntry).join("\n")}\n  ],`,
  )
  .join("\n");
const generated = `${HEADER}${body}\n${FOOTER}`;

const total = corpora.reduce((sum, corpus) => sum + corpus.entries.length, 0);

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  if (current !== generated) {
    console.error(
      "FAIL  src/config/departmentDocuments.ts is out of date — the register no longer matches the\n" +
        "      department corpora. Run: node scripts/build-department-register.mjs",
    );
    process.exit(1);
  }
  console.log(
    `PASS  the department register matches the corpora — ${corpora.length} departments, ${total} documents`,
  );
  process.exit(0);
}

writeFileSync(OUT, generated);
console.log(
  `WROTE src/config/departmentDocuments.ts — ${corpora.length} departments, ${total} documents`,
);
