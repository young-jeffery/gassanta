// Pure art data for the landing scene (no React in here).
//
// The ground SVG has viewBox 0 0 1000 420. Layers are drawn from X0 to X1 (much wider than the
// viewBox) and the SVG has overflow:visible, so wide screens and parallax never show an edge.
// The cottage sits at x = 500, the middle of the composition.

export const GLOW = "#ffd27a"; // fairy-light warm white (same value as --color-glow in index.css)
export const GROUND_W = 1000;
export const GROUND_H = 420;
export const X0 = -700;
export const X1 = 1700;
const BOTTOM = 470; // fills run below the viewBox so nothing shows underneath

const r1 = (v) => Math.round(v * 10) / 10;

// Small seeded random generator: same "random" scene every load, no flicker on hot reload
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Closed, smooth hill shape through the given [x, y] points (sorted by x), filled down to `bottom`
export function hillPath(points, bottom = BOTTOM) {
  let d = `M ${points[0][0]} ${bottom} L ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = r1(p1[0] + (p2[0] - p0[0]) / 6);
    const c1y = r1(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = r1(p2[0] - (p3[0] - p1[0]) / 6);
    const c2y = r1(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last[0]} ${bottom} Z`;
}

// Height of the polyline at x (used to plant trees on a ridge)
export function yAt(points, x) {
  for (let i = 0; i < points.length - 1; i++) {
    const [xa, ya] = points[i];
    const [xb, yb] = points[i + 1];
    if (x >= xa && x <= xb) return ya + ((yb - ya) * (x - xa)) / (xb - xa);
  }
  return points[points.length - 1][1];
}

// One pine tree (3 tiers + trunk) as an SVG sub-path
function pineSubpath(x, base, h) {
  const top = base - h;
  const t1 = top + 0.36 * h;
  const t2 = top + 0.66 * h;
  const t3 = top + 0.94 * h;
  const w1 = 0.2 * h;
  const w2 = 0.3 * h;
  const w3 = 0.4 * h;
  const tr = 0.06 * h;
  const p = (dx, y) => `${r1(x + dx)} ${r1(y)}`;
  return [
    `M ${p(0, top)}`,
    `L ${p(w1, t1)} L ${p(w1 * 0.45, t1)}`,
    `L ${p(w2, t2)} L ${p(w2 * 0.45, t2)}`,
    `L ${p(w3, t3)} L ${p(tr, t3)} L ${p(tr, base)}`,
    `L ${p(-tr, base)} L ${p(-tr, t3)} L ${p(-w3, t3)}`,
    `L ${p(-w2 * 0.45, t2)} L ${p(-w2, t2)}`,
    `L ${p(-w1 * 0.45, t1)} L ${p(-w1, t1)} Z`,
  ].join(" ");
}

export function pinesPath(items) {
  return items.map((t) => pineSubpath(t.x, t.base, t.h)).join(" ");
}

// ---- Shapes -------------------------------------------------------------------------------

const FAR_POINTS = [
  [-700, 195],
  [-450, 165],
  [-200, 190],
  [60, 150],
  [320, 185],
  [580, 160],
  [840, 192],
  [1100, 158],
  [1360, 188],
  [1700, 170],
];
const MID_POINTS = [
  [-700, 258],
  [-420, 244],
  [-150, 256],
  [120, 240],
  [380, 252],
  [620, 242],
  [880, 255],
  [1150, 241],
  [1420, 254],
  [1700, 246],
];
const NEAR_POINTS = [
  [-700, 330],
  [-400, 318],
  [-100, 326],
  [250, 312],
  [500, 298],
  [760, 314],
  [1100, 326],
  [1400, 318],
  [1700, 332],
];
const DRIFT_POINTS = [
  [-700, 404],
  [-300, 393],
  [100, 401],
  [500, 390],
  [900, 402],
  [1300, 393],
  [1700, 405],
];

export const FAR_PATH = hillPath(FAR_POINTS);
export const MID_PATH = hillPath(MID_POINTS);
export const NEAR_PATH = hillPath(NEAR_POINTS);
export const DRIFT_PATH = hillPath(DRIFT_POINTS);

// Forest along the mid ridge. A clearing is left behind the cottage.
export const MID_PINES_PATH = (() => {
  const rng = mulberry32(11);
  const trees = [];
  let x = X0;
  while (x < X1) {
    const h = 46 + rng() * 44;
    if (Math.abs(x - 500) > 95)
      trees.push({ x, h, base: yAt(MID_POINTS, x) + 10 });
    x += 30 + rng() * 26;
  }
  return pinesPath(trees);
})();

// Big dark pines framing the cottage (the outer ones only show on wide screens)
export const FORE_PINES_PATH = pinesPath(
  [
    { x: -120, h: 270 },
    { x: 150, h: 215 },
    { x: 318, h: 175 },
    { x: 690, h: 150 },
    { x: 858, h: 205 },
    { x: 1125, h: 265 },
  ].map((t) => ({ ...t, base: 412 })),
);

// Stars use percentages of the screen, so they spread over any aspect ratio
export const STARS = (() => {
  const rng = mulberry32(5);
  return Array.from({ length: 38 }, () => ({
    x: r1(rng() * 100),
    y: r1(rng() * 56),
    r: r1(0.6 + rng() * 1.1),
    o: r1(0.4 + rng() * 0.5),
  }));
})();

// ---- Colors -------------------------------------------------------------------------------
// Everything derives from the palette tokens, so all 7 palettes work. Depth: far = hazy, near = bright snow.

const V = {
  canvas: "var(--c-canvas)",
  ink: "var(--c-ink)",
  snow: "var(--c-snow)",
};
const mix = (a, pct, b) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;

export const TONES = {
  dark: {
    skyTop: mix(V.canvas, 68, "black"),
    skyMid: V.canvas,
    skyLow: mix(V.canvas, 82, V.snow),
    far: mix(V.canvas, 66, V.snow),
    mid: mix(V.canvas, 78, "black"),
    body: mix(V.canvas, 52, "black"),
    roof: mix(V.canvas, 64, "black"),
    door: mix(V.canvas, 38, "black"),
    roofSnow: mix(V.snow, 88, V.canvas),
    near: mix(V.canvas, 46, V.snow),
    fore: mix(V.canvas, 50, "black"),
    drift: mix(V.canvas, 30, V.snow),
    smoke: mix(V.snow, 80, V.canvas),
    moon: mix("white", 80, GLOW),
    haloOpacity: 0.5,
    showStars: true,
  },
  // Snowy Woodland: a pale snowy dusk. No stars; silhouettes are tinted from ink (forest green).
  light: {
    skyTop: mix(V.canvas, 78, V.ink),
    skyMid: mix(V.canvas, 88, V.ink),
    skyLow: V.canvas,
    far: mix(V.canvas, 72, V.ink),
    mid: mix(V.ink, 60, V.canvas),
    body: mix(V.ink, 82, "black"),
    roof: mix(V.ink, 92, "black"),
    door: mix(V.ink, 70, "black"),
    roofSnow: mix("white", 92, V.canvas),
    near: mix("white", 62, V.canvas),
    fore: mix(V.ink, 90, "black"),
    drift: mix("white", 85, V.canvas),
    smoke: mix("white", 70, V.canvas),
    moon: mix("white", 85, V.canvas),
    haloOpacity: 0.25,
    showStars: false,
  },
};
