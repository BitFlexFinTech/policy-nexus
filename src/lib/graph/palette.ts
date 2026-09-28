/**
 * THE GRAPH'S OWN PALETTE — the ONE place a graph colour or shape is written.
 *
 * WHY THIS MAY LEAVE THE PLATFORM PALETTE: the user granted an explicit, recorded
 * exemption for the relationship graph ALONE (PROJECT_STATUS.md, Phase AB). The
 * platform's emerald/gold identity, its typography, its components and its generated
 * documents are untouched — this module governs the simulation surface and nothing else.
 *
 * WHY COLOUR ALONE IS NOT ENOUGH: one in 25 African males is red-green colour-blind
 * (Okabe & Ito, "Colour Universal Design", jfly.uni-koeln.de), and the documented method
 * is to use *"not only different colors but also a combination of different shapes,
 * positions, line types and coloring patterns"*. So every mark carries FOUR independent
 * channels — colour, SHAPE, SIZE and its written label — and the shape repeats whatever
 * the colour says, so nothing is carried by colour alone.
 *
 * HONEST LIMIT, measured rather than assumed: FIVE colours is where distinct identity
 * ends for a red-green colour-blind reader (the probe that produced this number is
 * recorded in PROJECT_STATUS.md, Phase AB). A department models five to twelve groups,
 * so beyond the fifth the colour repeats and the LABEL carries the distinction. That is
 * why labels are never dropped, however crowded the picture gets.
 * `src/test/graph-palette.test.ts` enforces this — change a value here and it fails.
 *
 * DETERMINISM: pure data and pure arithmetic. No clock, no randomness.
 */

import type { RelationshipNodeKind } from "@/services/assessment/network";

/** A shape a node can be drawn as. Shape is the redundant channel for the node's kind. */
export type GraphNodeShape = "ring" | "circle" | "square" | "diamond";

/**
 * The graph's ink. One value, used for two things that must look like the same pen:
 * the draft's outline (it is drawn as a RING — no fill at all, a thick ink outline, the
 * largest mark on the surface, unique by construction so it never competes with a
 * group's colour) and the outline every filled mark carries.
 *
 * WHY EVERY FILLED MARK IS OUTLINED IN INK, measured rather than assumed: on the white
 * card the group fills measure 5.19:1 (blue), 6.85:1 (deep pink), 3.06:1 (magenta),
 * 2.25:1 (orange) and 1.32:1 (yellow) against the surface. A pale fill with no boundary
 * would be hard to see at all, so the ink outline carries the mark's SHAPE while the
 * fill carries the group — which is the whole point of splitting colour from shape.
 */
export const GRAPH_INK = "#111827";

/**
 * Stroke weights, in REAL SCREEN PIXELS. Every stroke that uses one of these is drawn
 * with `vector-effect="non-scaling-stroke"`, so a line keeps the same weight however
 * small the card is scaled. Before this, weights were expressed in the 1000×750 virtual
 * space and multiplied by the card's scale: at roughly a 0.5 scale a 1.5-unit outline
 * became 0.75 real pixels and anti-aliased into grey, which is the "low quality" that
 * was reported. `src/test/graph-palette.test.ts` keeps these in a usable pixel band.
 */
export const GRAPH_EDGE_STROKE = 1;
/** How much a stronger relationship thickens its edge, on top of the base weight. */
export const GRAPH_EDGE_STROKE_STRENGTH = 0.6;
export const GRAPH_MARK_OUTLINE_STROKE = 1.25;
/** The draft's ring is the heaviest line on the surface — it is the hub. */
export const GRAPH_RING_STROKE = 2;
/** The focus/selection indicator, drawn dashed so it is never read as a mark's outline. */
export const GRAPH_FOCUS_STROKE = 1.5;

/** Everything else is drawn as a filled shape with a dark outline. */
export const GRAPH_NODE_FILL = {
  /** A stated priority. */
  priority: "#7C3AED",
  /** A document the draft is read against — paper grey, deliberately not a hue. */
  corpus: "#6B7280",
} as const;

/**
 * The stakeholder groups. Five colours — and five is a MEASURED limit, not a
 * preference. `src/test/graph-palette.test.ts` re-simulates protanopia and deuteranopia
 * over these values and fails if any two collapse; the probe run in Phase AB showed that
 * beyond five, colours in this space cannot be told apart for a red-green colour-blind
 * reader (blues merge with blues, every green merges into grey, and violet merges into
 * sky blue). So past the fifth group the colour repeats and the always-drawn LABEL
 * carries the distinction — which is why labels are never dropped, however crowded the
 * picture becomes. Fixed order: a group always draws in the same colour.
 */
export const GRAPH_GROUP_COLOURS = [
  "#0072B2", // blue
  "#E69F00", // orange
  "#CC79A7", // magenta
  "#B0006D", // deep pink
  "#F0E442", // yellow
] as const;

/** The shape each kind of node is drawn as. No two kinds share a shape. */
export const GRAPH_NODE_SHAPE: Record<RelationshipNodeKind, GraphNodeShape> = {
  policy: "ring",
  stakeholder: "circle",
  priority: "square",
  corpus: "diamond",
};

/** The colour a group is drawn in, given its place among the modelled groups. */
export const graphGroupColour = (index: number): string =>
  GRAPH_GROUP_COLOURS[
    ((index % GRAPH_GROUP_COLOURS.length) + GRAPH_GROUP_COLOURS.length) %
      GRAPH_GROUP_COLOURS.length
  ];

/**
 * The points of a polygonal mark, in the local space the mark is drawn in.
 * `circle` and `ring` return null — they are drawn as a circle.
 */
export const shapePoints = (shape: GraphNodeShape, radius: number): string | null => {
  if (shape === "diamond") {
    const d = radius * 1.18;
    return `0,${-d} ${d},0 0,${d} ${-d},0`;
  }
  if (shape === "square") {
    const s = radius * 0.92;
    return `${-s},${-s} ${s},${-s} ${s},${s} ${-s},${s}`;
  }
  return null;
};

/* ------------------------------------------------------------------------- */
/* The colour maths — used only to CHECK the palette, never to draw with it.   */
/* ------------------------------------------------------------------------- */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

const rgbToHex = (rgb: readonly number[]): string =>
  `#${rgb
    .map((channel) => Math.round(clamp01(channel / 255) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

/** sRGB transfer function, both directions. */
const toLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const toSrgb = (linear: number) => {
  const c = clamp01(linear);
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
};

/**
 * Red-green colour-blindness, simulated with the widely used linear-RGB
 * approximations. They are approximations rather than clinical models — which is
 * exactly why the test enforces a generous margin instead of a borderline one.
 */
const CVD_MATRIX = {
  protanopia: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
} as const;

export type CvdType = keyof typeof CVD_MATRIX;

export const simulateCvd = (hex: string, type: CvdType): string => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const m = CVD_MATRIX[type];
  return rgbToHex([
    toSrgb(m[0][0] * r + m[0][1] * g + m[0][2] * b),
    toSrgb(m[1][0] * r + m[1][1] * g + m[1][2] * b),
    toSrgb(m[2][0] * r + m[2][1] * g + m[2][2] * b),
  ]);
};

/** CIE Lab, so "are these two far apart" is measured for the eye, not for RGB. */
export const toLab = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

/** Perceptual distance. Above roughly 10, two colours are distinct at a glance. */
export const colourDistance = (a: string, b: string): number => {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
};

/** The worst-separated pair in a set, as a given simulated viewer would see it.
 *  Reports the ORIGINAL two colours, never the simulated ones — a diagnostic that
 *  printed the transformed values named colours that do not exist in the palette. */
export const closestPair = (
  colours: readonly string[],
  type?: CvdType,
): { a: string; b: string; distance: number } => {
  const seen = type ? colours.map((colour) => simulateCvd(colour, type)) : [...colours];
  let worst = { a: colours[0], b: colours[1] ?? colours[0], distance: Number.POSITIVE_INFINITY };
  for (let i = 0; i < seen.length; i += 1) {
    for (let j = i + 1; j < seen.length; j += 1) {
      const distance = colourDistance(seen[i], seen[j]);
      if (distance < worst.distance) {
        worst = { a: colours[i], b: colours[j], distance };
      }
    }
  }
  return worst;
};

