import { contrastRatio } from "./contrast";
import { capChroma, lightnessOf, mixHex, setLightness } from "./colorMath";

// Every palette has a NIGHT and a DAY version. The six dark palettes keep their hand-picked colors as night
// (Snowy Woodland keeps its as day); the opposite version is derived from the same hues, so each palette keeps
// its identity: the old text color becomes the new background, the old background becomes the new text, and a
// few colors are nudged until contrast is good. To hand-tune any variant, add to a palette in palettes.js:
//     variants: { day: { canvas: "#..." }, night: { accent: "#..." } }
// (whatever you list overrides the derived value).

// Walks lightness in the given direction until `hex` has at least `min` contrast against `bg`
function ensureContrast(hex, bg, min, direction) {
  let out = hex;
  let L = lightnessOf(hex);
  const step = direction === "darker" ? -0.01 : 0.01;
  for (let i = 0; i < 80 && contrastRatio(out, bg) < min; i++) {
    L += step;
    if (L < 0.12 || L > 0.98) break;
    out = setLightness(hex, L);
  }
  return out;
}

const isLightColor = (hex) => lightnessOf(hex) >= 0.62;

function deriveDay(c) {
  const canvas = setLightness(c.ink, Math.max(lightnessOf(c.ink), 0.95), 0.04);
  const ink = ensureContrast(setLightness(c.canvas, Math.min(lightnessOf(c.canvas), 0.3), 0.09), canvas, 8, "darker");

  let primary;
  let onPrimary;
  if (isLightColor(c.primary)) {
    primary = ink; // a pale button on a pale page would vanish, so it takes the ink color
    onPrimary = canvas;
  } else {
    primary = c.primary;
    onPrimary = contrastRatio(c.onPrimary, primary) >= 4.5 ? c.onPrimary : canvas;
  }

  return {
    canvas,
    ...(c.surface ? { surface: setLightness(c.surface, 0.91, 0.022) } : {}),
    primary,
    onPrimary,
    accent: ensureContrast(c.accent, canvas, 2.4, "darker"),
    ink,
    snow: mixHex("#ffffff", canvas, 0.12), // daylight snow is white (slightly warmed by the page color)
  };
}

function deriveNight(c) {
  const canvas = setLightness(c.ink, Math.min(lightnessOf(c.ink), 0.24), 0.06);
  const ink = setLightness(c.canvas, Math.max(lightnessOf(c.canvas), 0.93), 0.04);

  let primary;
  let onPrimary;
  if (!isLightColor(c.primary)) {
    primary = ink; // a dark button on a dark page would vanish, so it takes the ink color
    onPrimary = canvas;
  } else {
    primary = c.primary;
    onPrimary = contrastRatio(c.onPrimary, primary) >= 4.5 ? c.onPrimary : canvas;
  }

  return {
    canvas,
    ...(c.surface ? { surface: setLightness(c.surface, 0.27, 0.05) } : {}),
    primary,
    onPrimary,
    accent: ensureContrast(c.accent, canvas, 3, "lighter"),
    ink,
    snow: capChroma(ink, 0.03),
  };
}

const cache = new Map();

// Colors of `palette` for mode "day" | "night"
export function getColors(palette, mode) {
  const native = palette.mode === "light" ? "day" : "night";
  if (mode === native) return palette.colors;
  const key = `${palette.id}:${mode}`;
  if (!cache.has(key)) {
    const derived = native === "night" ? deriveDay(palette.colors) : deriveNight(palette.colors);
    cache.set(key, { ...derived, ...(palette.variants?.[mode] ?? {}) });
  }
  return cache.get(key);
}

// The palette as the rest of the app sees it for the current mode.
// `mode` is "light"/"dark" (what the browser and the scene care about); `colorMode` is "day"/"night".
export function resolvePalette(palette, colorMode) {
  return {
    ...palette,
    colors: getColors(palette, colorMode),
    mode: colorMode === "day" ? "light" : "dark",
    colorMode,
    nativeMode: palette.mode,
  };
}
