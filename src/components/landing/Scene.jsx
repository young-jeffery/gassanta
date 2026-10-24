import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { useTheme } from "../../theme/useTheme";
import {
  CELESTIAL,
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
  SUN_RAYS_PATH,
  TONES,
} from "./sceneArt";

// The night-village backdrop, portaled into <body> as a fixed full-screen layer (z-1) so it sits BETWEEN
// Layout's glow and the snow canvas, and so the page-enter transform on <main> can't break `position: fixed`.
//
// Every moving piece is its own element with will-change, so the browser keeps each on its own GPU layer.
// Fading or moving one layer then costs almost nothing (moving shapes inside one big SVG repaints all of it,
// which is what made phones struggle). data-* attributes are the hooks for the animations.
//   sky: a plain gradient div          stars: transparent SVG (+ shooting star)     moon: tiny SVG
//   ground layers (back to front): far, mid, cottage, near, fore, each its own SVG, viewBox 1000x420, overflow visible
// Day mode: three clouds drifting across at different speeds (CSS animation on their own roots = compositor only)
const CLOUDS = [
  { top: "9%", scale: 1, dur: 150, delay: -20, cx: "12vw" },
  { top: "19%", scale: 0.7, dur: 210, delay: -120, cx: "58vw" },
  { top: "29%", scale: 1.25, dur: 260, delay: -60, cx: "80vw" },
];

// Sun box: 220px max (desktop), 40% of the screen width on phones, never below 140px. Change the 40vw to resize on phones.
const SUN_SIZE = "clamp(140px, 40vw, 220px)";

const GROUND_STYLE = { height: "min(46svh, 420px)", maxWidth: GROUND_W };
const GROUND_VIEWBOX = `0 0 ${GROUND_W} ${GROUND_H}`;

function GroundLayer({ layer, children }) {
  return (
    <svg
      data-layer={layer}
      className="absolute inset-x-0 bottom-0 mx-auto w-full overflow-visible will-change-transform"
      style={GROUND_STYLE}
      viewBox={GROUND_VIEWBOX}
      preserveAspectRatio="xMidYMax slice"
    >
      {children}
    </svg>
  );
}

export default function Scene() {
  const { palette } = useTheme();
  const isDay = palette.mode === "light"; // effective mode: day colors are the "light" tones
  const t = TONES[isDay ? "light" : "dark"];

  // Which of sun/moon starts hidden is decided once. After that, GSAP owns their visibility (the swap below).
  const [startedDay] = useState(isDay);

  // Day <-> night: the outgoing sun/moon sinks away, the incoming one rises (the page colors change via the
  // View Transition in ThemeProvider; this is the celestial body's own little animation).
  const previousDay = useRef(isDay);
  useLayoutEffect(() => {
    if (previousDay.current === isDay) return;
    previousDay.current = isDay;
    const root = document.querySelector("[data-scene]");
    const moon = root?.querySelector("[data-moon]");
    const sun = root?.querySelector("[data-sun]");
    if (!moon || !sun) return;
    const incoming = isDay ? sun : moon;
    const outgoing = isDay ? moon : sun;
    gsap.killTweensOf([moon, sun]);
    if (prefersReducedMotion()) {
      gsap.set(incoming, { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(outgoing, { autoAlpha: 0 });
      return;
    }
    gsap.to(outgoing, { y: 90, scale: 0.8, autoAlpha: 0, duration: 0.55, ease: "power2.in" });
    gsap.fromTo(incoming, { y: 90, scale: 0.8, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.8, delay: 0.25, ease: "power3.out" });
  }, [isDay]);

  return createPortal(
    <div aria-hidden="true" data-scene className="pointer-events-none fixed inset-0 z-1 overflow-hidden">
      <div
        data-sky
        className="absolute inset-0"
        style={{
          background:
            (isDay ? `radial-gradient(55% 40% at ${CELESTIAL.x} ${CELESTIAL.y}, rgba(255, 214, 130, 0.38), transparent 72%), ` : "") +
            `linear-gradient(to bottom, ${t.skyTop} 0%, ${t.skyMid} 55%, ${t.skyLow} 100%)`,
        }}
      />

      {/* Stars: their own transparent layer covering only the top 60% of the screen (less GPU memory).
          Percent coordinates keep circles round on any screen. */}
      <svg
        data-stars
        className="absolute inset-x-0 top-0 h-[60%] w-full"
        style={{ display: t.showStars ? undefined : "none" }}
      >
        {STARS.map((s, i) => (
          <circle key={i} data-star cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff8e6" opacity={s.o} />
        ))}
      </svg>

      {/* Shooting star: its own tiny root element, flown across the sky with a Web Animation (compositor only) */}
      <svg
        data-shooting
        className="absolute top-0 left-0 overflow-visible"
        width="60"
        height="24"
        viewBox="-6 -22 60 26"
        style={{ opacity: 0, display: t.showStars ? undefined : "none" }}
      >
        <line x1="0" y1="0" x2="46" y2="-17" stroke="#fff8e6" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        <circle r="1.9" fill="#ffffff" />
      </svg>

      {/* Moon. It used to be a 0x0 SVG, which browsers refuse to draw even with overflow visible.
          Now a real 160x160 box whose center sits at 84% / 12% of the screen. */}
      <svg
        data-moon
        className="absolute overflow-visible will-change-transform"
        style={{
          left: `calc(${CELESTIAL.x} - 80px)`,
          top: `calc(${CELESTIAL.y} - 80px)`,
          visibility: startedDay ? "hidden" : undefined,
        }}
        width="160"
        height="160"
        viewBox="-80 -80 160 160"
      >
        <defs>
          {/* Glow hugs the moon: strongest just outside the disc (offset 0.5), gone by the halo's edge */}
          <radialGradient id="sc-moon">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.6" />
            <stop offset="0.5" stopColor={GLOW} stopOpacity="0.32" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="56" fill="url(#sc-moon)" opacity={t.haloOpacity} data-moon-halo />
        <circle r="28" style={{ fill: t.moon }} />
        <circle cx="-8.4" cy="-5.6" r="5.6" fill="#8a7f6a" opacity="0.22" />
        <circle cx="9.8" cy="8.4" r="4.2" fill="#8a7f6a" opacity="0.22" />
        <circle cx="5.6" cy="-12.6" r="2.8" fill="#8a7f6a" opacity="0.22" />
      </svg>

      {/* Sun (day). A wrapper div that GSAP moves; the SVG inside turns slowly with a CSS animation.
          Size scales with the screen: SUN_SIZE is 220px on desktop and shrinks on phones (40% of the width, min 140px). */}
      <div
        data-sun
        className="absolute will-change-transform"
        style={{
          left: `calc(${CELESTIAL.x} - ${SUN_SIZE} / 2)`,
          top: `calc(${CELESTIAL.y} - ${SUN_SIZE} / 2)`,
          width: SUN_SIZE,
          height: SUN_SIZE,
          visibility: startedDay ? undefined : "hidden",
        }}
      >
        <svg className="sun-spin h-full w-full" viewBox="-110 -110 220 220">
          <defs>
            <radialGradient id="sc-sun-glow">
              <stop offset="0" stopColor="#fff0b3" stopOpacity="0.75" />
              <stop offset="0.3" stopColor={GLOW} stopOpacity="0.4" />
              <stop offset="1" stopColor={GLOW} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sc-sun-disc">
              <stop offset="0" stopColor="#fff6d6" />
              <stop offset="1" stopColor="#ffd271" />
            </radialGradient>
          </defs>
          <circle r="104" fill="url(#sc-sun-glow)" />
          <path d={SUN_RAYS_PATH} fill="#ffd05f" opacity="0.9" />
          <circle r="33" fill="url(#sc-sun-disc)" />
        </svg>
      </div>

      {/* Clouds (day only) */}
      <div data-clouds className="absolute inset-0" style={{ display: isDay ? undefined : "none" }}>
        {CLOUDS.map((c, i) => (
          <svg
            key={i}
            className="cloud absolute left-0"
            style={{ top: c.top, width: 220 * c.scale, height: 90 * c.scale, "--cx": c.cx, "--dur": `${c.dur}s`, "--delay": `${c.delay}s` }}
            viewBox="0 0 220 90"
          >
            <g style={{ fill: t.cloud }} opacity="0.92">
              <rect x="18" y="48" width="184" height="30" rx="15" />
              <circle cx="70" cy="47" r="26" />
              <circle cx="110" cy="34" r="32" />
              <circle cx="152" cy="47" r="24" />
            </g>
          </svg>
        ))}
      </div>

      <GroundLayer layer="far">
        <path d={FAR_PATH} style={{ fill: t.far }} />
      </GroundLayer>

      <GroundLayer layer="mid">
        <path d={MID_PATH} style={{ fill: t.mid }} />
        <path d={MID_PINES_PATH} style={{ fill: t.mid }} />
      </GroundLayer>

      <GroundLayer layer="cottage">
        <defs>
          <radialGradient id="sc-win">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.9" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Chimney (drawn first so the roof overlaps its base) */}
        <rect x="534" y="232" width="16" height="30" style={{ fill: t.body }} />
        <rect x="532" y="229" width="20" height="5" rx="1" style={{ fill: t.roofSnow }} />

        {/* Smoke puffs */}
        <g data-smoke-group>
          <circle data-smoke cx="542" cy="224" r="5" style={{ fill: t.smoke }} opacity="0.35" />
          <circle data-smoke cx="545" cy="214" r="6.5" style={{ fill: t.smoke }} opacity="0.28" />
          <circle data-smoke cx="549" cy="202" r="8" style={{ fill: t.smoke }} opacity="0.2" />
        </g>

        {/* Body, roof, snow on the roof edges */}
        <rect x="440" y="262" width="120" height="46" rx="2" style={{ fill: t.body }} />
        <polygon points="424,266 500,222 576,266" style={{ fill: t.roof }} />
        <polygon points="424,266 500,222 576,266 564,266 500,234 436,266" style={{ fill: t.roofSnow }} />

        {/* Window glow + windows: one group, dimmed in day mode (data-dim = its day opacity) */}
        <g data-dim="0.5">
          <circle data-halo cx="465" cy="286" r="34" fill="url(#sc-win)" opacity="0.55" />
          <circle data-halo cx="535" cy="286" r="34" fill="url(#sc-win)" opacity="0.55" />
          <rect data-window x="452" y="276" width="26" height="20" rx="2" fill={GLOW} />
          <rect data-window x="522" y="276" width="26" height="20" rx="2" fill={GLOW} />
        </g>
        <path
          d="M 465 276 V 296 M 452 286 H 478 M 535 276 V 296 M 522 286 H 548"
          fill="none"
          strokeWidth="2"
          style={{ stroke: t.body }}
        />

        {/* Door */}
        <path d="M 491 308 V 292 a 9 9 0 0 1 18 0 V 308 Z" style={{ fill: t.door }} />
        <circle cx="505" cy="301" r="1.2" fill={GLOW} />
      </GroundLayer>

      <GroundLayer layer="near">
        <defs>
          <radialGradient id="sc-spill">
            <stop offset="0" stopColor={GLOW} stopOpacity="0.55" />
            <stop offset="1" stopColor={GLOW} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={NEAR_PATH} style={{ fill: t.near }} />
        {/* Window light spilling onto the snow */}
        <g data-dim="0.25">
          <ellipse data-spill cx="500" cy="310" rx="75" ry="9" fill="url(#sc-spill)" />
        </g>
      </GroundLayer>

      <GroundLayer layer="fore">
        <path d={FORE_PINES_PATH} style={{ fill: t.fore }} />
        <path d={DRIFT_PATH} style={{ fill: t.drift }} />
      </GroundLayer>
    </div>,
    document.body
  );
}
