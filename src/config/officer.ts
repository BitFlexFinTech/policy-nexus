/**
 * SINGLE SOURCE OF TRUTH — who prepared a policy, and how honestly that is stated.
 *
 * The owner's requirement: a drafted policy must show who it was done by — first name,
 * surname, department and position — so there is a paper trail for each user. With
 * one-click entry there are no credentials, so the platform can only RECORD what the
 * officer states; it must never imply an identity was proven when it was not. That is
 * why the identity carries its own `source` and why every place that shows a name says
 * which it is, in the one sentence defined here.
 *
 * The name is composed in exactly one place (`officerDisplayName`), so a screen, an
 * exported document and the run record can never render the same person differently.
 */

export interface OfficerIdentity {
  firstName: string;
  surname: string;
  /** The officer's post, e.g. "Director, Policy Development". */
  position: string;
  /**
   * How the name was established. `self-declared` is what this build can honestly claim:
   * the officer typed it at entry. `sign-in` is used once a Government identity provider
   * answers and the name comes from the provider instead.
   */
  source: "self-declared" | "sign-in";
}

/**
 * The sentence shown wherever a self-declared name appears. Written once, so the platform
 * cannot claim more about an identity in one place than it does in another.
 */
export const OFFICER_SELF_DECLARED_NOTE =
  "Names in this build are self-declared at entry: Government sign-in is not enabled yet, so the platform records who prepared a document but cannot verify it.";

/**
 * The DEMO identity shown on the paper-trail card and recorded on every document.
 *
 * The owner's instruction (demo): the platform shows this name by default and it is NOT
 * editable — this is a demonstration, so every drafted policy is attributed to the Minister.
 * It carries the same shape as any officer identity, so the screen and every document name the
 * same person in the same way (`officerDisplayName` / `officerRecordLine`).
 */
export const DEMO_OFFICER: OfficerIdentity = {
  firstName: "Hon. Tatenda A",
  surname: "Mavetera",
  position: "Minister of ICT",
  source: "self-declared",
};

/** The name as a person writes it. The ONLY place first and surname are joined. */
export const officerDisplayName = (officer: OfficerIdentity): string =>
  [officer.firstName, officer.surname].map((part) => part.trim()).filter(Boolean).join(" ");

/**
 * Trim what the officer typed, and treat a wholly blank entry as no identity at all —
 * so an empty form stores nothing rather than a nameless record that looks like one.
 */
export const cleanOfficer = (officer: Partial<OfficerIdentity>): OfficerIdentity | undefined => {
  const firstName = (officer.firstName ?? "").trim();
  const surname = (officer.surname ?? "").trim();
  const position = (officer.position ?? "").trim();
  if (!firstName && !surname && !position) return undefined;
  return {
    firstName,
    surname,
    position,
    source: officer.source === "sign-in" ? "sign-in" : "self-declared",
  };
};

/** One plain line naming the preparer for a record, or null when none was recorded. */
export const officerRecordLine = (officer: OfficerIdentity | undefined): string | null => {
  if (!officer) return null;
  const name = officerDisplayName(officer) || "unnamed";
  return officer.position ? `${name} — ${officer.position}` : name;
};
