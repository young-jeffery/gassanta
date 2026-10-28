import { useEffect, useRef } from "react";
import { registerBlizzard } from "../lib/blizzard";

// The whiteout used by the landing page's blizzard transition (see lib/blizzard.js, which animates these pieces).
// Hidden (display: none) except while it plays, so it costs no GPU memory at rest. While visible it covers the
// screen and blocks taps. Built from plain gradients and transforms only: no blur filters, no backdrop-filter.
//   sweep : a very wide snow-colored slab with a soft leading edge, skewed so the edge is at an angle
//   mists : three layers of soft snow clouds that move at different speeds, so the whiteout swirls
const SNOW = "var(--c-snow)";
const blob = (w, h, x, y) => `radial-gradient(${w}% ${h}% at ${x}% ${y}%, ${SNOW}, transparent 70%)`;

const MISTS = [
  `${blob(45, 35, 25, 30)}, ${blob(40, 30, 75, 65)}`,
  `${blob(50, 30, 60, 25)}, ${blob(35, 40, 20, 75)}`,
  `${blob(60, 25, 45, 50)}, ${blob(30, 30, 85, 20)}`,
];

export default function Blizzard() {
  const rootRef = useRef(null);
  const sweepRef = useRef(null);
  const mistRefs = useRef([]);

  useEffect(() => {
    registerBlizzard({ root: rootRef.current, sweep: sweepRef.current, mists: mistRefs.current.filter(Boolean) });
    return () => registerBlizzard(null);
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="fixed inset-0 z-[97] overflow-hidden" style={{ display: "none" }}>
      <div
        ref={sweepRef}
        className="absolute will-change-transform"
        style={{
          top: "-10%",
          bottom: "-10%",
          left: "-30vw",
          width: "260vw",
          background: `linear-gradient(to right, ${SNOW} 0%, ${SNOW} 72%, transparent 100%)`,
        }}
      />
      {MISTS.map((background, i) => (
        <div
          key={i}
          ref={(el) => {
            mistRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{ inset: "-25%", background, opacity: 0 }}
        />
      ))}
    </div>
  );
}
