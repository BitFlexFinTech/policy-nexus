/**
 * The three UI directions offered to the owner at Stage D (docs/ZEPARI_BUILD_PLAN.md, §5).
 *
 * They share ONE platform, ONE content set and the institute's own blue + gold; they differ only in
 * how a researcher meets the evidence. The owner picks one; the other two are discarded.
 */
export type DesignSkin = "desk" | "terminal" | "lab";

export interface DesignOption {
  id: DesignSkin;
  to: string;
  name: string;
  tagline: string;
  body: string;
  /** The colours the direction leans on, as CSS values, for the chooser's swatch. */
  swatch: readonly string[];
}

/** The seven sections every direction carries, in order — the real workspace's own sections. */
export const DESIGN_SECTIONS: readonly string[] = [
  "Overview",
  "Library",
  "Data sources",
  "Ask",
  "Policy brief",
  "Economic Barometer",
  "Findings",
];

export const DESIGN_OPTIONS: readonly DesignOption[] = [
  {
    id: "desk",
    to: "/research/designs/desk",
    name: "The Research Desk",
    tagline: "Light and editorial",
    body: "One generous reading column, with the evidence kept beside it as a footnote rail — the feel of the institute's own printed bulletin.",
    swatch: ["hsl(var(--zp-canvas))", "hsl(var(--zp-navy))", "hsl(var(--zp-gold))"],
  },
  {
    id: "terminal",
    to: "/research/designs/terminal",
    name: "The Analyst's Terminal",
    tagline: "Dark and data-forward",
    body: "A dark navy instrument panel: the institute's figures in a dense table, the research note in the centre, the sources pinned to the right.",
    swatch: ["hsl(var(--zp-term-bg))", "hsl(var(--zp-blue))", "hsl(var(--zp-gold-soft))"],
  },
  {
    id: "lab",
    to: "/research/designs/lab",
    name: "The Evidence Lab",
    tagline: "Light dashboard, charts first",
    body: "A dashboard: the headline figures first, the chart as the hero, then the note and the evidence arranged in a grid.",
    swatch: ["hsl(var(--zp-surface))", "hsl(var(--zp-blue))", "hsl(var(--zp-sky))"],
  },
];

export const DESIGN_BY_ID = (id: DesignSkin): DesignOption =>
  DESIGN_OPTIONS.find((option) => option.id === id) as DesignOption;
