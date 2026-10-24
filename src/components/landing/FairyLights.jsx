import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BULB_COLORS, HALO_KEYS, computeLights, needsRelayout } from "./lightsGeometry";

const isCompact = () => window.innerHeight < 500; // phones in landscape

// String of fairy lights across the top. The data-* attributes are hooks for the entrance and idle
// animations (useLandingTimeline.js) and the tap reactions (2.5). pathLength={1} lets the wire draw in
// with a simple dash-offset tween.
//
// Portaled into <body> as a fixed layer at z-2: above the scene (z-1), below the snow (z-5) and page content (z-10).
// Halos are plain radial gradients (no blur filters). To drop them on weak devices later, hide [data-halo]
// with a rule on html[data-perf="0"].
export default function FairyLights() {
  const [lights, setLights] = useState(() => computeLights(window.innerWidth, isCompact()));

  // Rebuild when the window changes size, debounced so the phone address bar sliding doesn't cause churn
  useEffect(() => {
    let timer = 0;
    const update = () => {
      const width = window.innerWidth;
      const compact = isCompact();
      setLights((prev) => (needsRelayout(prev, width, compact) ? computeLights(width, compact) : prev));
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return createPortal(
    <div
      aria-hidden="true"
      data-lights
      className="pointer-events-none fixed inset-x-0 top-0 z-[2]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <svg
        className="block w-full overflow-visible"
        style={{ height: lights.height }}
        viewBox={`0 0 ${lights.width} ${lights.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          {HALO_KEYS.map((key) => (
            <radialGradient key={key} id={`fl-halo-${key}`}>
              <stop offset="0" style={{ stopColor: BULB_COLORS[key] }} stopOpacity="0.8" />
              <stop offset="1" style={{ stopColor: BULB_COLORS[key] }} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <g data-wire-group>
          {lights.paths.map((d, i) => (
            <path key={i} data-wire d={d} pathLength={1} fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: "var(--c-muted)" }} />
          ))}
          {lights.hooks.map((x, i) => (
            <circle key={i} data-hook cx={x} cy="2" r="2.2" style={{ fill: "var(--c-muted)" }} />
          ))}
        </g>

        {/* Halos live in ONE group (behind the bulbs) so day mode can dim them all together. data-dim = the
            group's opacity in day mode; useDayNightScene.js fades it. */}
        <g data-dim="0.4">
          {lights.bulbs.map((b, i) => {
            const rad = (b.rot * Math.PI) / 180; // the bulb's center, 9px below its cap, rotated with the bulb
            return (
              <circle
                key={i}
                data-halo
                cx={b.x - 9 * Math.sin(rad)}
                cy={b.y + 9 * Math.cos(rad)}
                r="15"
                fill={`url(#fl-halo-${b.key})`}
                opacity="0.6"
              />
            );
          })}
        </g>

        {/* Outer <g> positions the bulb; the inner data-bulb <g> is what GSAP animates */}
        {lights.bulbs.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`}>
            <g data-bulb>
              <rect x="-2.2" y="-1" width="4.4" height="4" rx="1" style={{ fill: "var(--c-muted)" }} />
              <ellipse
                data-glass
                cy="9"
                rx="4.2"
                ry="5.8"
                strokeWidth="0.8"
                style={{ fill: BULB_COLORS[b.key], stroke: "color-mix(in oklab, var(--c-ink) 40%, transparent)" }}
              />
              <circle cx="-1.5" cy="6.8" r="1.2" fill="#ffffff" opacity="0.8" />
            </g>
          </g>
        ))}
      </svg>
    </div>,
    document.body
  );
}
