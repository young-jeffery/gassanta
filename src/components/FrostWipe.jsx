import { useLayoutEffect, useRef } from "react";
import { registerFrost } from "../lib/frost";

// The frost overlay of the page transition (lib/frost.js animates it). Hidden (display: none) except while it plays,
// so it costs no GPU memory at rest. While visible it covers the screen and blocks taps (for under a second).
// Built from plain gradients and transforms only: no blur filters, no backdrop-filter. Everything is palette-driven
// (--c-snow tinted with a touch of ice blue).
//   cols : six overlapping columns that together cover the screen. Each has a rounded bottom (the drip) and reaches a
//          little above the top edge, so the soft fade at its top edge is off-screen until it slides down
//   rim  : glittery frost in the four corners; fades out first
const ICE = "color-mix(in srgb, var(--c-snow) 86%, #b9e3ff)";
const ICE_DEEP = "color-mix(in srgb, var(--c-snow) 70%, #8fcff2)";
const COLS = 6;

// Faint crystal hatching + a soft vertical shade, so the frost looks like frost and not a flat sheet
const COL_BG =
  `repeating-linear-gradient(60deg, rgb(255 255 255 / 0.22) 0 2px, transparent 2px 15px),` +
  `repeating-linear-gradient(-60deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 19px),` +
  `linear-gradient(to bottom, transparent 0, ${ICE} 3.2svh, ${ICE} 72%, ${ICE_DEEP} 100%)`;

const corner = (x, y) => `radial-gradient(70% 55% at ${x}% ${y}%, rgb(255 255 255 / 0.95), transparent 72%)`;
const RIM = [corner(0, 0), corner(100, 0), corner(0, 100), corner(100, 100)].join(", ");

export default function FrostWipe() {
  const rootRef = useRef(null);
  const rimRef = useRef(null);
  const colRefs = useRef([]);

  // Layout effect (not a passive one): Layout's route-change effect must always find the overlay already registered
  useLayoutEffect(() => {
    registerFrost({ root: rootRef.current, rim: rimRef.current, cols: colRefs.current.filter(Boolean) });
    return () => registerFrost(null);
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="fixed inset-0 z-[96] overflow-hidden" style={{ display: "none" }}>
      {Array.from({ length: COLS }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            colRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{
            top: "-8svh",
            height: "112svh",
            left: `calc(${(i * 100) / COLS}% - 1.2vw)`,
            width: `calc(${100 / COLS}% + 2.4vw)`,
            background: COL_BG,
            borderRadius: "0 0 50% 50% / 0 0 5svh 5svh",
          }}
        />
      ))}
      <div ref={rimRef} className="absolute inset-0" style={{ background: RIM }} />
    </div>
  );
}
