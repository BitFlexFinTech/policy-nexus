/**
 * SINGLE SOURCE OF TRUTH — deterministic pseudo-randomness.
 *
 * Every varying figure in the scenario engine comes from here. `Math.random()`
 * is forbidden in this project (see .clinerules/04-determinism-and-validation.md
 * and `scripts/validate.mjs` check 4), so the engine derives variation from a
 * seed string instead: the same department, policy text and template always
 * produce a byte-identical result.
 *
 * Implementation notes:
 * - `hashString` is FNV-1a (32-bit), a pure function of the input string.
 * - `createRng` is mulberry32, a small, well-known 32-bit PRNG. It is seeded
 *   from the hash, so the sequence is a pure function of the seed string.
 * - There is no clock and no entropy source anywhere in this file.
 */

/** FNV-1a 32-bit hash of a string. Pure, platform-independent, no clock. */
export const hashString = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    // Math.imul keeps the multiply in 32-bit integer space.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Lower-case hex of a 32-bit unsigned integer, zero-padded to 8 characters. */
export const toSeedHex = (value: number): string => (value >>> 0).toString(16).padStart(8, "0");

export interface Rng {
  /** The exact string this generator was seeded from — logged with the run. */
  readonly seed: string;
  /** Next value in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive of both ends. */
  int(min: number, max: number): number;
  /** One element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** True with the given probability (default half). */
  bool(probability?: number): boolean;
}

/**
 * Create a deterministic PRNG from a seed string. Two calls with the same seed
 * yield identical sequences; there is deliberately no way to inject entropy.
 */
export const createRng = (seedInput: string): Rng => {
  // Seeded from the hash, then advanced only by mulberry32.
  let state = hashString(seedInput);

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed: seedInput,
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error("createRng().pick requires a non-empty list");
      return items[Math.floor(next() * items.length)];
    },
    bool: (probability = 0.5) => next() < probability,
  };
};

/**
 * Normalise policy text before it is hashed into a seed, so that cosmetic
 * differences (trailing spaces, line wrapping, letter case) do not change the
 * result. Two drafts that differ only in whitespace are the same draft.
 */
export const normaliseSeedText = (text: string): string =>
  text.replace(/\s+/g, " ").trim().toLowerCase();
