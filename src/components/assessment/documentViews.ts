/**
 * The four documents one completed run produces, in the order an officer reads
 * them. SINGLE SOURCE OF TRUTH for that list: the navigation strip renders from
 * it, and the test that checks every screen offers all four derives its count
 * from it, so a destination can neither be forgotten on a screen nor invented
 * twice.
 *
 * Kept out of `DocumentNav.tsx` on purpose — that file exports a component, and a
 * component file that also exports data breaks fast refresh.
 */
export const DOCUMENT_VIEWS: ReadonlyArray<{ segment: string; label: string; end?: boolean }> = [
  { segment: "", label: "Executive summary", end: true },
  { segment: "full", label: "Full assessment" },
  { segment: "report", label: "Full report" },
  { segment: "policy-draft", label: "Drafted policy" },
  { segment: "implementation-pack", label: "Implementation pack" },
];
