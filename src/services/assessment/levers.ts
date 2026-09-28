/**
 * SCENARIO LEVERS — the assumptions an officer can change before a run.
 *
 * Before this module the only thing an officer could change was the policy text; the
 * time horizon changed a label and nothing else. A lever here is an assumption the
 * model answers to, and every lever states its own effect in plain language, so the
 * officer can see WHY a figure moved between two runs of the same draft.
 *
 * ONE PLACE, THREE READERS: the policy input renders the controls from `LEVER_CONTROLS`,
 * the engine applies the effects, and the run screen and the report state the settings
 * back from `leverSummary`. A control can therefore never exist that the engine ignores,
 * and an effect can never exist that the officer cannot see.
 *
 * DETERMINISM: plain authored data plus pure arithmetic. No clock, no randomness.
 */

/** How the policy is paid for. The tuple IS the type, and the controls are built from it. */
export const FUNDING_LEVERS = ["unstated", "within-budget", "new-appropriation"] as const;
export type FundingLever = (typeof FUNDING_LEVERS)[number];
/** How ready the front line is to carry the change. */
export const CAPACITY_LEVERS = ["unstated", "ready", "needs-support"] as const;
export type CapacityLever = (typeof CAPACITY_LEVERS)[number];
/** How firmly the policy is enforced. */
export const ENFORCEMENT_LEVERS = ["advisory", "standard", "strict"] as const;
export type EnforcementLever = (typeof ENFORCEMENT_LEVERS)[number];

export interface ScenarioLevers {
  funding: FundingLever;
  capacity: CapacityLever;
  enforcement: EnforcementLever;
  /**
   * Months given to affected groups before obligations begin. 0 means nothing is
   * assumed beyond whatever transition period the draft itself states.
   */
  phaseInMonths: number;
}

/** The neutral setting: nothing assumed beyond what the draft says. */
export const DEFAULT_LEVERS: ScenarioLevers = {
  funding: "unstated",
  capacity: "unstated",
  enforcement: "standard",
  phaseInMonths: 0,
};

/** The phase-in choices offered, in months. 0 = none assumed. */
export const PHASE_IN_CHOICES: ReadonlyArray<LeverOption> = [
  { value: "0", label: "Not assumed" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "36", label: "36 months" },
];

/**
 * True only for one of the values a lever actually accepts. Used by the interface so
 * a control can never set a value the engine does not handle — without a cast.
 */
export const isLeverValue = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((candidate) => candidate === value);

/** One option a lever offers. */
export interface LeverOption {
  value: string;
  label: string;
}

/** One control the policy input renders, built from the value tuples above. */
export interface LeverControl {
  id: "funding" | "capacity" | "enforcement";
  label: string;
  /** What this lever changes, in one line an official can read. */
  note: string;
  options: ReadonlyArray<LeverOption>;
}

const FUNDING_LABELS: Record<FundingLever, string> = {
  unstated: "Not assumed",
  "within-budget": "Inside the current budget",
  "new-appropriation": "Needs a new appropriation",
};
const CAPACITY_LABELS: Record<CapacityLever, string> = {
  unstated: "Not assumed",
  ready: "Already staffed and trained",
  "needs-support": "Needs training or staff",
};
const ENFORCEMENT_LABELS: Record<EnforcementLever, string> = {
  advisory: "Advisory",
  standard: "Standard",
  strict: "Strict",
};

export const LEVER_CONTROLS: ReadonlyArray<LeverControl> = [
  {
    id: "funding",
    label: "Funding",
    note: "Whether the money for the change is already inside the department's budget, or needs a new appropriation.",
    options: FUNDING_LEVERS.map((value) => ({ value, label: FUNDING_LABELS[value] })),
  },
  {
    id: "capacity",
    label: "Front-line capacity",
    note: "Whether the offices that must carry the change are already staffed and trained for it.",
    options: CAPACITY_LEVERS.map((value) => ({ value, label: CAPACITY_LABELS[value] })),
  },
  {
    id: "enforcement",
    label: "Enforcement",
    note: "How firmly the new duties are pressed. Advisory duty lowers modelled engagement; strict duty raises both engagement and resistance.",
    options: ENFORCEMENT_LEVERS.map((value) => ({ value, label: ENFORCEMENT_LABELS[value] })),
  },
];

/** Fill in whatever the caller left out. Pure. */
export const resolveLevers = (levers?: Partial<ScenarioLevers>): ScenarioLevers => ({
  funding: levers?.funding ?? DEFAULT_LEVERS.funding,
  capacity: levers?.capacity ?? DEFAULT_LEVERS.capacity,
  enforcement: levers?.enforcement ?? DEFAULT_LEVERS.enforcement,
  phaseInMonths: Math.max(0, Math.round(levers?.phaseInMonths ?? DEFAULT_LEVERS.phaseInMonths)),
});

/** True when the officer has changed nothing, so the screens can say so briefly. */
export const isNeutral = (levers: ScenarioLevers): boolean =>
  levers.funding === DEFAULT_LEVERS.funding &&
  levers.capacity === DEFAULT_LEVERS.capacity &&
  levers.enforcement === DEFAULT_LEVERS.enforcement &&
  levers.phaseInMonths === DEFAULT_LEVERS.phaseInMonths;

const OPTION_LABEL = new Map<string, string>(
  [...LEVER_CONTROLS.flatMap((control) => control.options), ...PHASE_IN_CHOICES].map((option) => [
    option.value,
    option.label,
  ]),
);

/**
 * One plain-language line per assumption that is switched on, plus a line naming the
 * horizon. Used by the run screen, the report and the drafted policy, so all three
 * state the same thing.
 */
export const leverSummary = (levers: ScenarioLevers, horizonMonths: number): string[] => {
  const lines: string[] = [`Modelled horizon of ${horizonMonths} months.`];
  (["funding", "capacity", "enforcement"] as const).forEach((key) => {
    const value = levers[key];
    if (value === DEFAULT_LEVERS[key]) return;
    lines.push(`${OPTION_LABEL.get(value) ?? value} — assumed for ${key}.`);
  });
  if (levers.phaseInMonths > 0) {
    lines.push(
      `Phasing: affected groups are given ${levers.phaseInMonths} months before the duties begin.`,
    );
  }
  if (isNeutral(levers)) {
    lines.push("No further assumptions were set: the run answers to the draft itself.");
  }
  return lines;
};
