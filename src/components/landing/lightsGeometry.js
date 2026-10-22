// Pure math for the fairy-light string (no React). All numbers are in SVG pixels, 1 unit = 1 screen px.
//
// The string is a row of sagging swags hung from the top edge. Each swag is one quadratic curve:
//   P(t) = (1-t)^2*P0 + 2(1-t)t*C + t^2*P2   with  P0.y = P2.y = hook height,  C.y = hook + 2*depth
// which puts the lowest point exactly `depth` below the hooks. Bulbs sit at evenly spaced t values.
// A hook always lands on the exact horizontal center, so the middle of a phone stays clear of the title.

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const r1 = (v) => Math.round(v * 10) / 10;

export const HOOK_Y = 2;

// Bulb colors come from the palette plus warm white and white. The order never puts two equal colors
// side by side, including where the sequence repeats.
export const BULB_SEQUENCE = ["glow", "rose", "white", "accent", "glow", "snow", "rose"];
export const HALO_KEYS = ["glow", "rose", "white", "accent", "snow"];
export const BULB_COLORS = {
  glow: "#ffd27a",
  white: "#fffaf0",
  accent: "var(--c-accent)",
  // primary is often nearly invisible against the sky, so it is lightened
  rose: "color-mix(in oklab, var(--c-primary) 55%, white)",
  snow: "var(--c-snow)",
};

export const swagCountFor = (width) => clamp(Math.round(width / 260), 2, 4);

export function computeLights(width, compact) {
  const swagCount = swagCountFor(width);
  const depth = clamp(width / 14, 26, 56) * (compact ? 0.6 : 1);
  const perSwag = compact ? 4 : width <= 600 ? 5 : 4;
  const swagWidth = width / swagCount;

  const paths = [];
  const hooks = [];
  const bulbs = [];
  let n = 0;

  for (let s = 0; s < swagCount; s++) {
    const x0 = s * swagWidth;
    const x1 = (s + 1) * swagWidth;
    paths.push(`M ${r1(x0)} ${HOOK_Y} Q ${r1((x0 + x1) / 2)} ${r1(HOOK_Y + 2 * depth)} ${r1(x1)} ${HOOK_Y}`);
    hooks.push(r1(x0));

    for (let k = 0; k < perSwag; k++) {
      const t = (k + 1) / (perSwag + 1);
      const x = x0 + (x1 - x0) * t;
      const y = HOOK_Y + 4 * depth * t * (1 - t);
      const slope = Math.atan2(4 * depth * (1 - 2 * t), x1 - x0); // wire angle at this point
      bulbs.push({
        x: r1(x),
        y: r1(y),
        rot: r1(((slope * 180) / Math.PI) * 0.3), // bulbs lean a little with the wire
        key: BULB_SEQUENCE[n % BULB_SEQUENCE.length],
      });
      n += 1;
    }
  }
  hooks.push(r1(width));

  return {
    width,
    compact,
    swagCount,
    height: Math.ceil(HOOK_Y + depth + 17),
    paths,
    hooks,
    bulbs,
  };
}

// Recompute only when something visible would change (ignores tiny width jitter from phone browser bars)
export function needsRelayout(prev, width, compact) {
  return Math.abs(width - prev.width) >= 24 || compact !== prev.compact || swagCountFor(width) !== prev.swagCount;
}
