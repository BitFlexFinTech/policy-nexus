/**
 * SINGLE SOURCE OF TRUTH — the editable landing-page content.
 *
 * The landing page's wording is written here once, as an explicit DEFAULT for each
 * field. An administrator may override those defaults from the platform
 * administration screen; the override is kept in this browser and read back
 * through this module, so a screen never reaches into storage itself.
 *
 * What may NOT be overridden, and why (this is deliberate, not an oversight):
 * - the brief-fixed sentences (the governance sentence, the engine explanation,
 *   the sovereignty statement, the service principle) — tests assert them word
 *   for word, and the governance sentence is the platform's legal position;
 * - the identity strings (product name, entity, tagline, classification) — these
 *   live in `src/config/brand.ts` and must stay equal to the copies declared in
 *   `index.html`, which a validator checks;
 * - the official Coat of Arms FILE itself — a validator pins its fingerprint. The
 *   screen may show a different uploaded mark, but the official asset is untouched
 *   and remains the default.
 * Each of those is listed in the administration screen as read-only, with this
 * reason, so nobody is left guessing why it cannot be changed.
 *
 * DETERMINISM: reading content is pure — no clock, no randomness. An override
 * changes what is displayed, never a simulation result.
 */

import { BRAND, ENGINE_EXPLANATION, GOVERNANCE, SOVEREIGNTY_STATEMENT } from "@/config/brand";
import { createKeyValueStore } from "@/lib/browserStorage";

/** One editable piece of the landing page. */
export interface ContentField {
  /** Stable key. The override is stored under this id. */
  id: string;
  /** The section it belongs to, as the administration screen groups them. */
  group: string;
  /** What the field is, in plain words. */
  label: string;
  /** The wording the platform ships with. */
  default: string;
  /** A paragraph rather than a single line. */
  multiline?: boolean;
  /** Read-only: shown so the reason is visible, never writable. */
  locked?: boolean;
}

/** The one-sentence leadership line for the second capability card. */
const CAPABILITY_POPULATION_BODY =
  `${BRAND.name} creates a simulated population representing relevant stakeholder perspectives ` +
  "and examines how those agents interact within the policy scenario.";

/** The platform-coverage intro line, which names the platform once. */
const CAPABILITIES_INTRO =
  "Government policy can have complex effects across communities, institutions, industries and " +
  `stakeholders. ${BRAND.name} provides an additional analytical lens for exploring those ` +
  "potential responses before implementation.";

/**
 * Every editable field, in the order the page reads. The section words — "How it
 * works", "Platform coverage" and the rest — are the page's own copy, so they are
 * here and an administrator can adjust the wording without a developer.
 */
export const CONTENT_FIELDS: readonly ContentField[] = [
  // --- Policy assessment card ------------------------------------------------
  { id: "assessment.label", group: "Policy assessment card", label: "Small label above the card", default: "Policy assessment" },
  { id: "assessment.heading", group: "Policy assessment card", label: "Card heading", default: "From policy draft to structured assessment" },
  { id: "assessment.step1.title", group: "Policy assessment card", label: "Step 1 title", default: "Add your policy" },
  { id: "assessment.step1.body", group: "Policy assessment card", label: "Step 1 text", default: "Upload a document or enter a policy draft." },
  { id: "assessment.step2.title", group: "Policy assessment card", label: "Step 2 title", default: "Run simulation" },
  { id: "assessment.step2.body", group: "Policy assessment card", label: "Step 2 text", default: "Explore potential responses across simulated stakeholder perspectives." },
  { id: "assessment.step3.title", group: "Policy assessment card", label: "Step 3 title", default: "Review assessment" },
  { id: "assessment.step3.body", group: "Policy assessment card", label: "Step 3 text", default: "Examine potential concerns, risks and areas for further consideration." },

  // --- A new capability for policy assessment --------------------------------
  { id: "capabilities.heading", group: "Capabilities section", label: "Section heading", default: "A new capability for policy assessment" },
  { id: "capabilities.intro", group: "Capabilities section", label: "Section intro paragraph", default: CAPABILITIES_INTRO, multiline: true },
  { id: "capabilities.card1.title", group: "Capabilities section", label: "Card 1 title", default: "Policy input" },
  { id: "capabilities.card1.body", group: "Capabilities section", label: "Card 1 text", default: "Upload or enter the proposed policy." },
  { id: "capabilities.card2.title", group: "Capabilities section", label: "Card 2 title", default: "Stakeholder simulation" },
  { id: "capabilities.card2.lead", group: "Capabilities section", label: "Card 2 lead phrase", default: "Thousands of simulated agents." },
  { id: "capabilities.card2.body", group: "Capabilities section", label: "Card 2 text", default: CAPABILITY_POPULATION_BODY, multiline: true },
  { id: "capabilities.card3.title", group: "Capabilities section", label: "Card 3 title", default: "Policy assessment" },
  { id: "capabilities.card3.body", group: "Capabilities section", label: "Card 3 text", default: "Review structured findings, potential risks and areas requiring further consideration." },

  // --- The process (inside "What happens behind the assessment") -------------
  { id: "process.note", group: "The process", label: "Line under the process heading", default: "Each stage adds depth to the one before it: the draft is understood, mapped, populated, run and analysed before an assessment is produced for review.", multiline: true },


  // --- How it works ----------------------------------------------------------
  { id: "how.heading", group: "How it works", label: "Section heading", default: "How it works" },
  { id: "how.step1.title", group: "How it works", label: "Step 1 title", default: "Provide the draft policy" },
  { id: "how.step1.body", group: "How it works", label: "Step 1 text", default: "Paste the text, start from a draft the department has already prepared, or upload a PDF, DOCX or TXT file.", multiline: true },
  { id: "how.step2.title", group: "How it works", label: "Step 2 title", default: "Run the simulation" },
  { id: "how.step2.body", group: "How it works", label: "Step 2 text", default: "The simulation core models every stakeholder group the department defines, over a stated horizon, from a seeded and reproducible process.", multiline: true },
  { id: "how.step3.title", group: "How it works", label: "Step 3 title", default: "Read the result and draft the policy" },
  { id: "how.step3.body", group: "How it works", label: "Step 3 text", default: "Open the executive summary, the full assessment or the long-form report — then edit the drafted policy and export it.", multiline: true },

  // --- Structured and repeatable --------------------------------------------
  { id: "repeatable.heading", group: "Structured and repeatable", label: "Heading", default: "Structured and repeatable" },
  { id: "repeatable.body", group: "Structured and repeatable", label: "Text", default: "The same defined assessment process is applied consistently to each policy scenario, providing a controlled environment for examining potential stakeholder responses. Scenario results are generated locally from the defined policy scenario and reference configuration.", multiline: true },

  // --- Platform coverage -----------------------------------------------------
  { id: "coverage.heading", group: "Platform coverage", label: "Heading", default: "Platform coverage" },
  { id: "coverage.note", group: "Platform coverage", label: "Note under the figures", default: "Counts are read directly from the department reference configuration, so this page cannot claim more coverage than the platform holds.", multiline: true },

  // --- Closing call to action ------------------------------------------------
  { id: "closing.heading", group: "Closing call to action", label: "Heading", default: "Begin a policy assessment" },
  { id: "closing.body", group: "Closing call to action", label: "Text", default: "Select the department you are preparing policy for. Its indicators, prepared drafts and reference documents load into the workspace.", multiline: true },

  // --- Read-only: shown with the reason it cannot be changed -----------------
  { id: "locked.principle", group: "Fixed wording (read-only)", label: "Service principle above the heading", default: BRAND.eyebrow, locked: true },
  { id: "locked.governance", group: "Fixed wording (read-only)", label: "The governance sentence — who decides", default: GOVERNANCE.humanJudgement, multiline: true, locked: true },
  { id: "locked.engine", group: "Fixed wording (read-only)", label: "What happens behind the assessment", default: ENGINE_EXPLANATION.body, multiline: true, locked: true },
  { id: "locked.sovereignty", group: "Fixed wording (read-only)", label: "Sovereign-compute statement", default: SOVEREIGNTY_STATEMENT, multiline: true, locked: true },
];

/** The groups, in the order they appear, for the administration screen. */
export const CONTENT_GROUPS: readonly string[] = CONTENT_FIELDS.reduce<string[]>((groups, field) => {
  if (!groups.includes(field.group)) groups.push(field.group);
  return groups;
}, []);

const DEFAULTS = new Map(CONTENT_FIELDS.map((field) => [field.id, field.default]));
const LOCKED_IDS = new Set(CONTENT_FIELDS.filter((field) => field.locked).map((field) => field.id));

/** The wording the platform ships with for a field, or "" for an unknown id. */
export const contentDefault = (id: string): string => DEFAULTS.get(id) ?? "";

export const CONTENT_STORAGE_KEY = "nzwisiso.content.v1";

/** The largest uploaded mark we will keep, as characters of the data address. */
export const MAX_BRAND_ASSET_CHARS = 512 * 1024;


/**
 * What an administrator has changed. `text` holds only the fields that differ
 * from the default; `logo` and `favicon` hold a data address, or "" for none.
 */
export interface ContentOverride {
  text: Record<string, string>;
  logo: string;
  favicon: string;
}

export const DEFAULT_CONTENT: ContentOverride = { text: {}, logo: "", favicon: "" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Only an uploaded image may be stored — an http(s) address would be a network call. */
const asBrandAsset = (value: unknown): string =>
  typeof value === "string" &&
  value.startsWith("data:image/") &&
  value.length <= MAX_BRAND_ASSET_CHARS
    ? value
    : "";

/**
 * Parse a stored override defensively. A locked field, an unknown id, a blank
 * value and an oversized or non-image mark are all dropped, so a hand-edited
 * store can never change a fixed sentence or reach the network.
 */
export const normaliseContent = (value: unknown): ContentOverride => {
  const record = isRecord(value) ? value : {};
  const text: Record<string, string> = {};
  if (isRecord(record.text)) {
    for (const [id, raw] of Object.entries(record.text)) {
      if (typeof raw !== "string") continue;
      if (!DEFAULTS.has(id) || LOCKED_IDS.has(id)) continue;
      if (!raw.trim()) continue;
      text[id] = raw;
    }
  }
  return { text, logo: asBrandAsset(record.logo), favicon: asBrandAsset(record.favicon) };
};

/* ------------------------------------------------------------------------- */
/* Store                                                                     */
/* ------------------------------------------------------------------------- */

const storage = createKeyValueStore();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeToContent = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let cachedRaw: string | null | undefined;
let cachedContent: ContentOverride = DEFAULT_CONTENT;

/** Current override. Cached against the raw stored string for a stable reference. */
export const getContent = (): ContentOverride => {
  const raw = storage.read(CONTENT_STORAGE_KEY);
  if (raw === cachedRaw) return cachedContent;
  cachedRaw = raw;
  if (!raw) {
    cachedContent = DEFAULT_CONTENT;
    return cachedContent;
  }
  try {
    cachedContent = normaliseContent(JSON.parse(raw));
  } catch {
    cachedContent = DEFAULT_CONTENT;
  }
  return cachedContent;
};

export const getContentSnapshot = getContent;
export const getContentServerSnapshot = (): ContentOverride => DEFAULT_CONTENT;

/** False when the browser refused persistent storage and memory is in use. */
export const isContentPersistent = () => storage.isPersistent();

export const saveContent = (next: ContentOverride): ContentOverride => {
  storage.write(CONTENT_STORAGE_KEY, JSON.stringify(normaliseContent(next)));
  cachedRaw = undefined;
  emit();
  return getContent();
};

/** Forget every override, returning the page to the wording it ships with. */
export const clearContent = (): void => {
  storage.remove(CONTENT_STORAGE_KEY);
  cachedRaw = undefined;
  emit();
};

/* ------------------------------------------------------------------------- */
/* Reading                                                                   */
/* ------------------------------------------------------------------------- */

/** The wording to display: the override when there is one, otherwise the default. */
export const contentText = (override: ContentOverride, id: string): string => {
  const value = override.text[id];
  return typeof value === "string" && value.trim() ? value : contentDefault(id);
};

/** The displayed mark: an uploaded logo when there is one, otherwise the caller's default. */
export const logoSrc = (override: ContentOverride, fallback: string): string =>
  override.logo || fallback;

/** The uploaded tab icon, or null to leave the shipped icon set alone. */
export const faviconOverride = (override: ContentOverride): string | null =>
  override.favicon || null;

/** True when a field has been changed from the wording it ships with. */
export const isFieldOverridden = (override: ContentOverride, id: string): boolean =>
  typeof override.text[id] === "string" && override.text[id] !== contentDefault(id);

/** True when anything at all has been changed. */
export const hasContentOverride = (override: ContentOverride): boolean =>
  override.logo !== "" ||
  override.favicon !== "" ||
  Object.keys(override.text).some((id) => isFieldOverridden(override, id));

