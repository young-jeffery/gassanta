import { createPortal } from "react-dom";
import { useTheme } from "../../theme/useTheme";
import {
  DRIFT_PATH,
  FAR_PATH,
  FORE_PINES_PATH,
  GLOW,
  GROUND_H,
  GROUND_W,
  MID_PATH,
  MID_PINES_PATH,
  NEAR_PATH,
  STARS,
  TONES,
} from "./sceneArt";

// The night-village backdrop. Static in Stage 2.1; the `data-*` attributes are hooks for the
// entrance timeline (2.3), parallax (2.4) and tap reactions (2.5).
//
// It is portaled into <body> as a fixed full-screen layer (z-1) so it can sit BETWEEN Layout's glow
// and the snow canvas, and so the page-enter transform on <main> can't break `position: fixed`.
//
// Two SVGs:
//  - sky: stars + moon, full-screen, percent coordinates (circles stay round at any aspect ratio)
//  - ground: hills, forest, cottage. Anchored bottom-center, viewBox 1000x420, overflow visible.
export default function Scene() {
  const { palette } = useTheme();
  const t = TONES[palette.mode === "light" ? "light" : "dark"];

  return createPortal(
    <div aria-hidden="true" data-scene className="pointer-events-none fixed inset-0 z-1 overflow-hidden">
      {/* ---- Sky ---- */}
      <svg className="absolute inset-0 h-full w-full" data-sky>
        <defs>
          <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: t.skyTop }} />
            <stop offset="0.55" style={{ stopColor: t.skyMid }} />
            <stop offset="1" style={{ stopColor: t.skyLow }} />
          </linearGradient>
          <radialGradient id="sc-moon">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.55" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#sc-sky)" data-layer="sky" />

        <g data-layer="stars" style={{ display: t.showStars ? undefined : "none" }}>
          {STARS.map((s, i) => (
            <circle key={i} data-star cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff8e6" opacity={s.o} />
          ))}
        </g>

        {/* Nested <svg x/y> gives the moon its own origin at a screen percentage */}
        <svg x="84%" y="12%" overflow="visible" data-moon>
          <circle r="64" fill="url(#sc-moon)" opacity={t.haloOpacity} data-moon-halo />
          <circle r="20" style={{ fill: t.moon }} />
          <circle cx="-6" cy="-4" r="4" fill="#8a7f6a" opacity="0.22" />
          <circle cx="7" cy="6" r="3" fill="#8a7f6a" opacity="0.22" />
          <circle cx="4" cy="-9" r="2" fill="#8a7f6a" opacity="0.22" />
        </svg>
      </svg>

      {/* ---- Ground ---- */}
      <svg
        className="absolute inset-x-0 bottom-0 mx-auto w-full overflow-visible"
        style={{ height: "min(46svh, 420px)", maxWidth: GROUND_W }}
        viewBox={`0 0 ${GROUND_W} ${GROUND_H}`}
        preserveAspectRatio="xMidYMax slice"
        data-ground
      >
        <defs>
          <radialGradient id="sc-win">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.9" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sc-spill">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.55" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g data-layer="far">
          <path d={FAR_PATH} style={{ fill: t.far }} />
        </g>

        <g data-layer="mid">
          <path d={MID_PATH} style={{ fill: t.mid }} />
          <path d={MID_PINES_PATH} style={{ fill: t.mid }} />
        </g>

        <g data-layer="cottage">
          {/* Chimney (drawn first so the roof overlaps its base) */}
          <rect x="534" y="232" width="16" height="30" style={{ fill: t.body }} />
          <rect x="532" y="229" width="20" height="5" rx="1" style={{ fill: t.roofSnow }} />

          {/* Smoke puffs: animated in 2.3 */}
          <g data-smoke-group>
            <circle data-smoke cx="542" cy="224" r="5" style={{ fill: t.smoke }} opacity="0.35" />
            <circle data-smoke cx="545" cy="214" r="6.5" style={{ fill: t.smoke }} opacity="0.28" />
            <circle data-smoke cx="549" cy="202" r="8" style={{ fill: t.smoke }} opacity="0.2" />
          </g>

          {/* Body, roof, snow on the roof edges */}
          <rect x="440" y="262" width="120" height="46" rx="2" style={{ fill: t.body }} />
          <polygon points="424,266 500,222 576,266" style={{ fill: t.roof }} />
          <polygon points="424,266 500,222 576,266 564,266 500,234 436,266" style={{ fill: t.roofSnow }} />

          {/* Window glow, windows, frames */}
          <circle data-halo cx="465" cy="286" r="34" fill="url(#sc-win)" opacity="0.55" />
          <circle data-halo cx="535" cy="286" r="34" fill="url(#sc-win)" opacity="0.55" />
          <rect data-window x="452" y="276" width="26" height="20" rx="2" fill={GLOW} />
          <rect data-window x="522" y="276" width="26" height="20" rx="2" fill={GLOW} />
          <path
            d="M 465 276 V 296 M 452 286 H 478 M 535 276 V 296 M 522 286 H 548"
            fill="none"
            strokeWidth="2"
            style={{ stroke: t.body }}
          />

          {/* Door */}
          <path d="M 491 308 V 292 a 9 9 0 0 1 18 0 V 308 Z" style={{ fill: t.door }} />
          <circle cx="505" cy="301" r="1.2" fill={GLOW} />
        </g>

        <g data-layer="near">
          <path d={NEAR_PATH} style={{ fill: t.near }} />
          {/* Window light spilling onto the snow */}
          <ellipse data-spill cx="500" cy="310" rx="75" ry="9" fill="url(#sc-spill)" />
        </g>

        <g data-layer="fore">
          <path d={FORE_PINES_PATH} style={{ fill: t.fore }} />
          <path d={DRIFT_PATH} style={{ fill: t.drift }} />
        </g>
      </svg>
    </div>,
    document.body
  );
}
