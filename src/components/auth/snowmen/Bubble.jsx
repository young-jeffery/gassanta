import { useRef } from "react";
import { gsap, useGSAP } from "../../../lib/gsap";
import { prefersReducedMotion } from "../../../lib/motion";
import { isLite } from "../../../lib/lite";

// A speech bubble that stands out on every palette: always a warm-white card with dark text, a thick dark outline and
// a hard offset shadow (comic style), so it can't be mistaken for part of the form. Decorative (aria-hidden): the same
// hints are also written next to each field, so screen-reader users lose nothing and get no chatty live region.
// Pops in with a little bounce (not in lite mode). The caller sets its position AND width (className), and may use
// Tailwind translate classes, which GSAP's `transform: scale` doesn't disturb. tailClass moves the little pointer.
const INK = "#2a2430";

export default function Bubble({ text, className = "", tailClass = "left-1/2 -translate-x-1/2", style }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || isLite()) return;
      gsap.fromTo(ref.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)", transformOrigin: "50% 100%" });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ borderColor: INK, boxShadow: `3px 4px 0 ${INK}`, ...style }}
      className={`pointer-events-none z-20 rounded-2xl border-2 bg-[#fffaf0] px-3.5 py-2.5 leading-snug font-extrabold text-[#2a2430] ${className}`}
    >
      {text}
      <span
        style={{ borderColor: INK }}
        className={`absolute -bottom-2 h-3.5 w-3.5 rotate-45 border-r-2 border-b-2 bg-[#fffaf0] ${tailClass}`}
      />
    </div>
  );
}
