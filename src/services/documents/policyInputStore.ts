/**
 * SINGLE SOURCE OF TRUTH — the draft an officer is working on in the policy input.
 *
 * The owner's seventh item: *"lets assume the user wants to go back and add some text into
 * the text field where they also uploaded their documents, they should be able to go back,
 * of which right now they cant do that."*
 *
 * Until this existed the policy input held everything in the screen's own memory, so opening
 * the Simulation Register and coming back threw away the officer's wording, their uploaded
 * documents and their assumptions. They are now kept in this browser, keyed by department,
 * so the screen comes back exactly as it was left.
 *
 * WHAT IS KEPT: the typed wording, the preset it came from, the four assumptions, and the
 * uploaded files — including the text that was really read from them, because that text is
 * what a run is made from. A PDF (never read in this build) is kept by name, exactly as it
 * was, so nothing is implied to have been read that was not.
 *
 * SIZE, AND THE HONEST LIMIT: a browser gives this storage only a few megabytes, shared with
 * the run register. If the uploaded files' text is too large to keep, the files are kept BY
 * NAME and their text is dropped, and `filesReadable` is false so the screen can say so
 * plainly. Nothing is silently truncated: the officer is told those files must be added again.
 *
 * Determinism: the run's figures do not depend on the clock. This record carries the moment it
 * was written (a real timestamp, so the officer's work is dated when they made it), but nothing
 * shown on screen or inside a document is derived from it.
 */

import { nowIso } from "@/lib/clock";
import { isDepartmentId, type DepartmentId } from "@/config/departments";
import { createKeyValueStore } from "@/lib/browserStorage";
import { DEFAULT_LEVERS, resolveLevers, type ScenarioLevers } from "@/services/assessment/levers";
import type { ExtractionKind } from "@/services/extraction/extractPolicyText";

export const POLICY_INPUT_KEY = "nzwisiso.policy-input.v1";

/**
 * How much of the uploaded files' text will be kept, in characters. A browser's storage is a
 * few megabytes in total and the run register shares it, so this leaves generous room. When
 * the files exceed it they are kept by name and the screen says their text was not kept.
 */
export const POLICY_INPUT_TEXT_LIMIT = 400000;

/** One uploaded file, as the input screen lists it. */
export interface StoredPolicyInputFile {
  name: string;
  sizeLabel: string;
  kind: ExtractionKind;
  /** True only when `text` holds the file's real text. */
  extracted: boolean;
  text: string;
  status: string;
}

/** The whole working state of the policy input, for one department. */
export interface StoredPolicyInput {
  departmentId: DepartmentId;
  text: string;
  templateId?: string;
  levers: ScenarioLevers;
  files: StoredPolicyInputFile[];
  /** False when the files' text was too large to keep and only their names survived. */
  filesReadable: boolean;
  savedAt: string;
}

type InputMap = Readonly<Record<string, StoredPolicyInput>>;

const storage = createKeyValueStore();

/** False when the browser refused persistent storage and memory is in use. */
export const isPolicyInputStorePersistent = () => storage.isPersistent();

const EMPTY: InputMap = Object.freeze({});

const isLeverSet = (value: unknown): boolean => {
  const candidate = value as Partial<ScenarioLevers> | null | undefined;
  return !!candidate && typeof candidate === "object";
};

/** Defensive parse — a malformed entry is dropped rather than crashing the screen. */
const parseInputs = (raw: string | null): InputMap => {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, StoredPolicyInput] => {
        const candidate = entry[1] as Partial<StoredPolicyInput> | null | undefined;
        return (
          !!candidate &&
          typeof candidate === "object" &&
          typeof candidate.text === "string" &&
          typeof candidate.departmentId === "string" &&
          isDepartmentId(candidate.departmentId) &&
          Array.isArray(candidate.files) &&
          isLeverSet(candidate.levers) &&
          !!entry[0]
        );
      },
    );
    return entries.length ? Object.freeze(Object.fromEntries(entries)) : EMPTY;
  } catch {
    return EMPTY;
  }
};

let cachedRaw: string | null | undefined;
let cachedInputs: InputMap = EMPTY;

/** Stable snapshot for the parse cache — the raw JSON, which only changes on a write. */
const getPolicyInputsSnapshot = (): string | null => storage.read(POLICY_INPUT_KEY);

/** Every working input, parsed once per change. */
export const listPolicyInputs = (): InputMap => {
  const raw = getPolicyInputsSnapshot();
  if (raw === cachedRaw) return cachedInputs;
  cachedRaw = raw;
  cachedInputs = parseInputs(raw);
  return cachedInputs;
};

/** One department's working input, read straight from storage. */
export const getPolicyInput = (
  departmentId: string | null | undefined,
): StoredPolicyInput | undefined => (departmentId ? listPolicyInputs()[departmentId] : undefined);

/* ------------------------------------------------------------------------- */
/* Actions                                                                     */
/* ------------------------------------------------------------------------- */

const write = (next: Record<string, StoredPolicyInput>): void => {
  storage.write(POLICY_INPUT_KEY, JSON.stringify(next));
  cachedRaw = storage.read(POLICY_INPUT_KEY);
  cachedInputs = parseInputs(cachedRaw);
};

/** True when there is nothing worth keeping — an untouched screen writes no record. */
const isEmpty = (input: Omit<StoredPolicyInput, "savedAt" | "filesReadable">): boolean =>
  !input.text.trim() &&
  !input.templateId &&
  input.files.length === 0 &&
  input.levers.funding === DEFAULT_LEVERS.funding &&
  input.levers.capacity === DEFAULT_LEVERS.capacity &&
  input.levers.enforcement === DEFAULT_LEVERS.enforcement &&
  input.levers.phaseInMonths === DEFAULT_LEVERS.phaseInMonths;

/**
 * Keep the working state of the policy input. An untouched screen stores nothing and, if a
 * record already exists, clears it — so typing something and deleting it again leaves no
 * trace rather than a stale record.
 */
export const savePolicyInput = (input: Omit<StoredPolicyInput, "savedAt" | "filesReadable">): void => {
  if (!input.departmentId) return;
  if (isEmpty(input)) {
    clearPolicyInput(input.departmentId);
    return;
  }

  // Keep the files' text while it fits; drop it (by name only) when it does not, and say so.
  const filesSize = input.files.reduce(
    (total, file) => total + (file.extracted ? file.text.length : 0),
    0,
  );
  const filesReadable = filesSize <= POLICY_INPUT_TEXT_LIMIT;
  const files = filesReadable
    ? input.files
    : input.files.map((file) =>
        file.extracted && file.text
          ? {
              ...file,
              extracted: false,
              text: "",
              status:
                "Not kept between visits — the file is too large to store. Add it again to include its text.",
            }
          : file,
      );

  write({
    ...listPolicyInputs(),
    [input.departmentId]: {
      ...input,
      files,
      filesReadable,
      levers: resolveLevers(input.levers),
      savedAt: nowIso(),
    },
  });
};

/** Forget one department's working input. */
export const clearPolicyInput = (departmentId: string): void => {
  const current = listPolicyInputs();
  if (!(departmentId in current)) return;
  const next: Record<string, StoredPolicyInput> = { ...current };
  delete next[departmentId];
  write(next);
};

/** Forget every department's working input at once. Used by the administration screen's reset. */
export const clearAllPolicyInput = (): void => {
  storage.remove(POLICY_INPUT_KEY);
  cachedRaw = undefined;
  cachedInputs = EMPTY;
};
