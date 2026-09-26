/**
 * Deterministic seed + run identifier derivation. Kept separate from both the
 * engine and the store so that the stored run id and the computed run id are
 * always produced by the same function (single source of truth).
 *
 * The seed is a pure function of the request. It deliberately ignores cosmetic
 * differences in the policy text (see `normaliseSeedText`), so re-pasting the
 * same draft with different line wrapping does not create a second run.
 */

import { hashString, normaliseSeedText, toSeedHex } from "@/lib/prng";
import type { AssessmentRequest } from "./types";

/** The exact string the engine is seeded from. Logged with every run. */
export const seedForRequest = (request: AssessmentRequest): string =>
  [
    request.departmentId,
    normaliseSeedText(request.policyText),
    request.templateId ?? "custom",
    request.timeHorizon ?? "medium",
  ].join("::");

/** Short hex of the seed, used in identifiers. */
export const seedHexForRequest = (request: AssessmentRequest): string =>
  toSeedHex(hashString(seedForRequest(request)));

/**
 * Stable run identifier. Because it derives only from the request, re-running
 * identical inputs replaces the earlier run rather than duplicating it.
 */
export const runIdFor = (request: AssessmentRequest): string =>
  `${request.departmentId}-${seedHexForRequest(request)}`;
