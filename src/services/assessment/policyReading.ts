/**
 * POLICY READING — what the submitted draft actually says.
 *
 * This module is what makes the platform's own sentence "the policy is read for
 * its intent, scope and the institutions it touches" true. It is a PURE,
 * DETERMINISTIC function of the policy text and the signed-in department's own
 * configuration: no clock, no randomness, no network, no model call. Read the
 * same text twice and every list below is byte-identical.
 *
 * It states four things, and only things a reader can point at in the text:
 *   1. The ACTION SENTENCES — the sentences that assign an action to a party,
 *      counted by a stated rule (a duty word, or a recognised action verb).
 *   2. The MODELLED GROUPS the draft's own words concern, matched against the canonical
 *      stakeholder segments, so the run can say which groups it is actually about.
 *   3. The INSTRUMENTS the draft names: those inside the department's own register, and
 *      separately any real Act it names that sits OUTSIDE that register.
 *   4. The CLAUSES it carries or lacks: a transition period, monitoring, a review
 *      trigger, funding, a penalty, a register or licence, and enforcement.
 *
 * DELIBERATELY NOT PART OF THE RESULT SCHEMA. `AssessmentRun` (`./types.ts`) is
 * unchanged: like the relationship graph in `./network.ts`, this reading is a pure
 * function of the request, derived on read. That keeps the stored-run contract and
 * the mock -> real engine swap untouched.
 */

import { CITED_INSTRUMENTS, getCitedInstrument, type CitedInstrumentId } from "@/config/instruments";
import type { Department } from "@/config/departments";
import {
  getStakeholderSegment,
  STAKEHOLDER_SEGMENTS,
  type StakeholderSegmentId,
} from "@/config/reference";

/** The clause kinds the reader looks for, each with the words a draft uses. */
export interface PolicyClauses {
  /** A start date, phasing, a grace period or a staged introduction. */
  transition: boolean;
  /** Monitoring, evaluation or reporting duties. */
  monitoring: boolean;
  /** A stated trigger or date on which the policy would be revisited. */
  reviewTrigger: boolean;
  /** Money: a budget, an allocation, a levy or a named funder. */
  funding: boolean;
  /** A penalty, offence, fine or liability. */
  penalty: boolean;
  /** A register, registration step, licence, permit or accreditation. */
  registerOrLicence: boolean;
  /** Enforcement, inspection, audit or compliance machinery. */
  enforcement: boolean;
}

/** What the reader found, stated plainly enough to print. */
export interface PolicyReading {
  /**
   * The sentences that assign an action, in the order they appear. Named for what
   * the reader actually counts — a sentence with a duty word ("must", "shall", "is
   * responsible for") or with one of the recognised action verbs — rather than for
   * a legal conclusion the reader cannot draw.
   */
  actionSentences: string[];
  /** The modelled groups the draft's own words concern, in canonical order. */
  concernedSegmentIds: StakeholderSegmentId[];
  /** Instruments from the department's own register that the draft names. */
  citedInstrumentIds: CitedInstrumentId[];
  /**
   * Real Acts the draft names that are NOT in this department's register. Not an
   * error — a flag, because a draft resting on an Act outside the register is
   * something the officer should see.
   */
  outsideInstrumentTitles: string[];
  /** The clause kinds present. */
  clauses: PolicyClauses;
  /** One line per finding, in plain language, for the interface and the report. */
  findings: string[];
  /**
   * How far the draft's own words reach, 0–100. A stated formula, so the same
   * text always gives the same number and a reader can check it:
   *   action sentences (max 40) + groups concerned (max 30) + clause kinds present (max 28).
   */
  breadth: number;
  /** Words in the draft, so a reader can see the reading is proportional. */
  wordCount: number;
}

/* ------------------------------------------------------------------------- */
/* Text helpers — plain string work, nothing that could vary between runs.     */
/* ------------------------------------------------------------------------- */

const SENTENCE_SPLIT = /(?<=[.!?;])\s+|\n+/;

const splitSentences = (text: string): string[] =>
  text
    .split(SENTENCE_SPLIT)
    .map((sentence) =>
      sentence
        .replace(/^[\s#*\-•\d.)]+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((sentence) => sentence.length > 0);

/**
 * Duty forms — the words that place a duty directly on somebody.
 */
const DUTY_FORMS =
  /\b(must|shall|should|is required to|are required to|will be required to|is expected to|are expected to|has to|have to|undertakes to|undertake to|required to|prohibited from|may not|is directed to|are directed to|is obliged to|are obliged to|is mandated to|are mandated to|is responsible for|are responsible for|is to be|are to be)\b/i;

/**
 * The drafting verb STEMS the reader recognises. Policy drafts rarely say "must" —
 * they say "each ministry submits", "the programme expands the model", "the process
 * is mapped". Matching the stem (not one fixed spelling) means every inflection is
 * caught: expand, expands, expanding, expanded.
 *
 * THIS IS KEYWORD MATCHING, NOT COMPREHENSION, and it is described that way
 * everywhere it is shown. A deterministic reader with no model call cannot know
 * what a sentence means; what it can do — and does — is find the drafting
 * constructions reliably, count them, and let the run answer to them. The list is
 * deliberately wide so that nothing a department writes goes unseen; the gate in
 * `src/test/policy-reading.test.ts` fails if any prepared draft reads as empty.
 */
const ACTION_STEMS = [
  // duties and obligations
  "requir", "oblig", "mandat", "direct", "prohibit", "comply", "complian",
  // reporting and recording
  "submit", "report", "escalat", "notif", "disclos", "furnish", "record", "regist",
  "document", "captur", "track", "monitor", "measur", "evaluat", "audit", "inspect", "verif",
  // money
  "fund", "budget", "financ", "spend", "cost", "pay", "remit", "settl", "invest",
  "levy", "pric", "tariff", "subsidis", "subsidiz", "procure", "tender", "allocat",
  // making and changing rules
  "introduc", "establish", "replac", "revis", "amend", "reform", "regulat", "standardis",
  "standardiz", "harmonis", "streamlin", "simplif", "consolidat", "integrat", "decentralis",
  "decentraliz", "delegat", "repeal", "extend", "restrict", "limit", "cap", "waiv", "exempt",
  // doing the work
  "implement", "operat", "deliver", "provid", "offer", "suppli", "supply", "giv", "grant",
  "issue", "certif", "licens", "accredit", "permit", "approv", "authoris", "authoriz",
  "designat", "assign", "deploy", "recruit", "employ", "train", "upgrad", "build", "creat",
  "install", "equip", "rehabilitat", "maintain", "repair", "expend",
  // moving, sharing, linking
  "transfer", "moves?", "move", "link", "connect", "integrat", "publish", "advertis",
  "consult", "engag", "coordinat", "collaborat", "partner", "delegat", "shar", "exchange",
  // outcomes the draft is trying to shift
  "expand", "reduc", "increas", "improve", "strengthen", "address", "prioritis", "prioritiz",
  "target", "achiev", "align", "ensur", "enable", "encourag", "incentivis", "incentiviz",
  "penalis", "penaliz", "discourag", "protect", "safeguard", "promote", "support",
  // structure of the draft itself
  "set", "sets", "phras", "phase", "schedul", "adopt", "apply", "applies", "follow", "keep",
  "hold", "retain", "review", "absorb", "map", "commit", "attract", "contract", "receiv",
  "gain", "access", "cover", "arriv", "complet", "carry", "remain", "continu", "ceas", "end",
] as const;

/** A stem matches the start of a word, so every inflection of it counts. */
const ACTION_WORD = new RegExp(`\\b(${ACTION_STEMS.join("|")})[a-z]*\\b`, "i");

/** Constructions that place a duty on a named party without a duty word. */
const DUTY_CONSTRUCTION =
  /\b(requires?|obliges?|mandates?|directs?)\b[^.]{0,40}\bto\b|\b(is|are|was|were)\s+(required|directed|obliged|mandated|prohibited|expected)\b/i;

const assignsAnAction = (sentence: string): boolean =>
  DUTY_FORMS.test(sentence) || DUTY_CONSTRUCTION.test(sentence) || ACTION_WORD.test(sentence);


const wordsIn = (text: string): string[] => text.toLowerCase().match(/[a-z][a-z'-]{1,}/g) ?? [];

/**
 * Words too common to identify anything. Kept here rather than in a shared
 * module because this is the only reader in the platform.
 */
const STOPWORDS = new Set([
  "and", "the", "for", "with", "that", "this", "these", "those", "from", "into", "its", "their",
  "other", "others", "such", "any", "all", "who", "whom", "whose", "which", "where", "when",
  "not", "are", "was", "were", "has", "have", "had", "being", "been", "will", "would", "may",
  "can", "could", "under", "over", "between", "across", "within", "without", "including",
  "include", "against", "about", "after", "before", "than", "then", "also", "more", "most",
]);

/** "disabilities" -> "disability", "traders" -> "trader", "persons" -> "person". */
const singular = (word: string): string => {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
};

/**
 * The keywords that identify one modelled group, DERIVED from its own label so
 * there is no second hand-written list to drift. Both the plural and the
 * singular are kept, because drafts use both.
 */
const keywordsForLabel = (label: string): string[] => {
  const out = new Set<string>();
  wordsIn(label)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .forEach((word) => {
      out.add(word);
      out.add(singular(word));
    });
  return [...out].filter((word) => word.length >= 3);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mentions = (haystack: string, needles: readonly string[]): boolean =>
  needles.some((needle) => new RegExp(`\\b${escapeRegex(needle)}\\b`).test(haystack));

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

/* ------------------------------------------------------------------------- */
/* The clause forms                                                            */
/* ------------------------------------------------------------------------- */

/** The words that show a clause is present. One place, so the reader and the report agree. */
const CLAUSE_FORMS: Record<keyof PolicyClauses, RegExp> = {
  transition:
    /\b(transition(al|ing)?|phase[- ]?in|phased|phasing|grace period|staged|staggered|commencement date|takes effect|with effect from)\b/i,
  monitoring:
    /\b(monitor(ing|ed)?|evaluat(e|ion|ed)|report(ing|s)?|indicator|performance measure|data collection)\b/i,
  reviewTrigger:
    /\b(review(ed|s)?|revis(ed|ion)|revisit(ed)?)\b[^.]{0,60}?\b(within|after|every|annually|no later than|by the end of|upon|when)\b|\breview (trigger|clause|date)\b|\bsunset\b/i,
  funding:
    /\b(fund(ed|ing|s)?|budget(ary|ed)?|allocat(e|ed|ion)|appropriat(e|ed|ion)|financ(e|ed|ing|ial)|treasury|levy|grant)\b/i,
  penalty: /\b(penalt(y|ies)|offence|offenses?|fines?|sanction(s|ed)?|liable|liability)\b/i,
  registerOrLicence:
    /\b(register(ed|s|ing|ation)?|licen[cs]e[ds]?|licen[cs]ing|permits?|permitted|accredit(ation|ed)|certificat(e|es|ion))\b/i,
  enforcement:
    /\b(enforc(e|ed|ement)|complian(ce|t)|inspect(ion|or|ions)?|audit(ed|s|ing)?)\b/i,
};

/** The plain-language name of each clause kind, for the findings and the report. */
export const CLAUSE_LABELS: Record<keyof PolicyClauses, string> = {
  transition: "a transition period",
  monitoring: "monitoring and evaluation",
  reviewTrigger: "a review trigger",
  funding: "funding",
  penalty: "a penalty",
  registerOrLicence: "a register or licence",
  enforcement: "enforcement",
};

/** Every clause kind, in one order, so the report and the screen cannot disagree. */
export const CLAUSE_KEYS = Object.keys(CLAUSE_LABELS) as Array<keyof PolicyClauses>;

/* ------------------------------------------------------------------------- */
/* The reader                                                                  */
/* ------------------------------------------------------------------------- */

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/**
 * Read a submitted draft. PURE: the same text and the same department always
 * yield a byte-identical reading. Nothing here is random, and nothing is read
 * that a person could not point at in the text.
 */
export const readPolicy = (policyText: string, department: Department): PolicyReading => {
  const sentences = splitSentences(policyText);
  const haystack = policyText.toLowerCase();

  const actionSentences = sentences.filter((sentence) => assignsAnAction(sentence));

  // The groups the draft's own words concern, in canonical order so the reading is stable.
  const concernedSegmentIds = STAKEHOLDER_SEGMENTS.map((segment) => segment.id).filter((id) =>
    mentions(haystack, keywordsForLabel(getStakeholderSegment(id).label)),
  );

  // Instruments: matched by the exact published title, or by the title with its chapter
  // stripped — never by a guessed abbreviation.
  const namedInstruments = CITED_INSTRUMENTS.filter((instrument) => {
    const title = instrument.title.toLowerCase();
    const withoutChapter = title.replace(/\s*\(chapter[^)]*\)/i, "").trim();
    return (
      haystack.includes(title) || (withoutChapter.length > 12 && haystack.includes(withoutChapter))
    );
  });
  const register = new Set<string>(department.instruments);
  const citedInstrumentIds = namedInstruments
    .filter((instrument) => register.has(instrument.id))
    .map((instrument) => instrument.id as CitedInstrumentId);
  const outsideInstrumentTitles = namedInstruments
    .filter((instrument) => !register.has(instrument.id))
    .map((instrument) => instrument.title);

  const clauses = CLAUSE_KEYS.reduce(
    (result, key) => ({ ...result, [key]: CLAUSE_FORMS[key].test(policyText) }),
    {} as PolicyClauses,
  );
  const present = CLAUSE_KEYS.filter((key) => clauses[key]);
  const absent = CLAUSE_KEYS.filter((key) => !clauses[key]);

  // The stated breadth formula. Each part is capped, so a very long draft cannot
  // run away with the figure: 10 obligations x 4 = 40, 6 groups x 5 = 30,
  // 7 clause kinds x 4 = 28.
  const breadth = Math.min(
    100,
    Math.min(actionSentences.length, 10) * 4 +
      Math.min(concernedSegmentIds.length, 6) * 5 +
      present.length * 4,
  );

  const groupWords = concernedSegmentIds.map((id) => getStakeholderSegment(id).label);
  const findings: string[] = [
    actionSentences.length === 0
      ? "The draft assigns no action to anyone — it states intent without an action."
      : `The draft assigns ${actionSentences.length} ${plural(actionSentences.length, "action", "actions")} to named parties.`,
    groupWords.length === 0
      ? `The draft's own words name none of the ${department.segments.length} groups this department models.`
      : `The draft's own words concern ${groupWords.length} of the ${department.segments.length} groups this department models: ${groupWords.join(", ")}.`,
    citedInstrumentIds.length === 0
      ? "The draft names no instrument from this department's own register."
      : `The draft names ${citedInstrumentIds.length} ${plural(citedInstrumentIds.length, "instrument", "instruments")} from this department's register: ${citedInstrumentIds
          .map((id) => getCitedInstrument(id).title)
          .join("; ")}.`,
    present.length === 0
      ? "The draft carries none of the seven clause kinds the reader looks for."
      : `The draft carries ${present.map((key) => CLAUSE_LABELS[key]).join(", ")}.`,
  ];
  if (present.length > 0 && absent.length > 0) {
    findings.push(`It carries no ${absent.map((key) => CLAUSE_LABELS[key]).join(", no ")}.`);
  }
  if (outsideInstrumentTitles.length > 0) {
    findings.push(
      `It also names ${outsideInstrumentTitles.length} ${plural(outsideInstrumentTitles.length, "instrument", "instruments")} outside this department's register, which is worth checking: ${outsideInstrumentTitles.join("; ")}.`,
    );
  }

  return {
    actionSentences,
    concernedSegmentIds: unique(concernedSegmentIds),
    citedInstrumentIds: unique(citedInstrumentIds),
    outsideInstrumentTitles: unique(outsideInstrumentTitles),
    clauses,
    findings,
    breadth,
    wordCount: wordsIn(policyText).length,
  };
};
