// Perceptual color math (OKLab / OKLCH) used to derive the day and night variants of a palette.
// OKLab keeps hue and perceived lightness consistent, so "make this darker" doesn't turn it muddy or shift its hue.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToOklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = toLinear(((n >> 16) & 255) / 255);
  const g = toLinear(((n >> 8) & 255) / 255);
  const b = toLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const hex2 = (v) => Math.round(clamp(fromLinear(clamp(v, 0, 1)), 0, 1) * 255).toString(16).padStart(2, "0");

// Converts back to #rrggbb. If the color is outside the screen's gamut, chroma is reduced until it fits
// (lightness and hue are kept).
export function oklabToHex(lab) {
  let { a, b } = lab;
  const L = clamp(lab.L, 0, 1);
  for (let i = 0; i < 40; i++) {
    const rgb = oklabToLinearRgb({ L, a, b });
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return `#${rgb.map(hex2).join("")}`;
    a *= 0.93;
    b *= 0.93;
  }
  const g = hex2(L ** 3);
  return `#${g}${g}${g}`;
}

export const lightnessOf = (hex) => hexToOklab(hex).L;

// Same hue (and chroma, optionally capped), new lightness
export function setLightness(hex, L, maxChroma = Infinity) {
  const { a, b } = hexToOklab(hex);
  const C = Math.hypot(a, b);
  const k = C > maxChroma ? maxChroma / C : 1;
  return oklabToHex({ L, a: a * k, b: b * k });
}

export function capChroma(hex, maxChroma) {
  const lab = hexToOklab(hex);
  const C = Math.hypot(lab.a, lab.b);
  if (C <= maxChroma) return hex;
  const k = maxChroma / C;
  return oklabToHex({ L: lab.L, a: lab.a * k, b: lab.b * k });
}

// t = 0 gives `from`, t = 1 gives `to`
export function mixHex(from, to, t) {
  const x = hexToOklab(from);
  const y = hexToOklab(to);
  return oklabToHex({ L: x.L + (y.L - x.L) * t, a: x.a + (y.a - x.a) * t, b: x.b + (y.b - x.b) * t });
}
