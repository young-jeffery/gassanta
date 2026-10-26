import { createPortal } from "react-dom";

// Santa's sleigh: a flat silhouette (SVG drawn in code) that useSanta.js flies across the sky now and then.
// Portaled into <body> at z-1 (right after the scene, above its sky, under the lights and the page text), hidden
// until a flight starts so it costs nothing at rest. Drawn facing right; the hook mirrors the svg for right-to-left
// flights. Colored with the palette's ink color (light at night, dark by day); only the lantern, sleigh runner
// and Rudolph's nose have fixed colors. Layers: wrapper = flight (Web Animations), .santa-bob = gentle bobbing (CSS),
// svg = left/right mirroring.
export default function Santa() {
  return createPortal(
    <div
      aria-hidden="true"
      data-santa-fly
      data-flying="0"
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden will-change-transform"
    >
      <span
        data-santa-bubble
        className="absolute bottom-full left-1/2 mb-1 whitespace-nowrap rounded-full bg-surface px-3 py-1 font-display text-sm font-extrabold text-ink"
        style={{ opacity: 0, translate: "-50% 0" }}
      >
        Ho ho ho!
      </span>
      <div className="santa-bob">
        <svg data-santa-svg viewBox="0 0 330 92" className="block h-auto w-full" style={{ color: "var(--c-ink)", opacity: 0.92 }} fill="currentColor">
          <defs>
            <radialGradient id="santa-halo-red">
              <stop offset="0" stopColor="#ff4b4b" stopOpacity="0.7" />
              <stop offset="1" stopColor="#ff4b4b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="santa-halo-gold">
              <stop offset="0" stopColor="#ffd27a" stopOpacity="0.8" />
              <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
            </radialGradient>
            {/* one leaping reindeer, centered on its body, facing right */}
            <g id="santa-deer">
              <ellipse rx="20" ry="8" />
              <path d="M12 -4 L24 -20 L30 -17 L19 3 Z" />
              <path d="M24 -20 L40 -17 L41 -13 L28 -11 Z" />
              <path d="M26 -20 L24 -27 L31 -21 Z" />
              <path d="M-19 -3 L-27 -9 L-21 1 Z" />
              <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 5 L25 8 L33 7" />
                <path d="M14 5 L27 13 L35 12" />
                <path d="M-14 5 L-26 12 L-34 10" />
                <path d="M-18 4 L-30 8 L-38 3" />
              </g>
              <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M30 -20 L27 -32 M27 -32 L22 -35 M27 -32 L30 -38 M31 -21 L36 -30 L40 -32" />
              </g>
            </g>
          </defs>

          {/* reins, then the two reindeer */}
          <path d="M82 46 L192 52 L282 44" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.8" />
          <use href="#santa-deer" transform="translate(178 60) rotate(-5)" />
          <use href="#santa-deer" transform="translate(268 50) rotate(-9)" />
          {/* Rudolph's glowing nose on the lead reindeer */}
          <g transform="translate(268 50) rotate(-9)">
            <circle cx="43" cy="-14" r="10" fill="url(#santa-halo-red)" />
            <circle cx="42" cy="-14" r="2.6" fill="#ff4b4b" />
          </g>

          {/* sleigh, sack, Santa */}
          <g transform="translate(10 80)">
            <path d="M2 -28 Q4 -8 14 -6 L76 -6 Q90 -8 92 -26 Q92 -32 88 -34 Q86 -28 80 -24 L12 -24 L10 -30 Z" />
            <path d="M6 1 L84 1 Q96 1 96 -12" fill="none" stroke="#ffd27a" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M20 -6 L20 1 M60 -6 L60 1" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M4 -26 Q-6 -46 12 -52 Q24 -50 25 -32 Z" />
            <path d="M28 -24 Q31 -42 44 -42 Q56 -38 56 -24 Z" />
            <circle cx="45" cy="-48" r="7" />
            <path d="M37 -52 L47 -69 L53 -52 Z" />
            <circle cx="48" cy="-70" r="3.2" />
            <path d="M52 -38 L72 -34" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="96" cy="-30" r="9" fill="url(#santa-halo-gold)" />
            <circle cx="95" cy="-30" r="2" fill="#ffd27a" />
          </g>
        </svg>
      </div>
    </div>,
    document.body
  );
}
