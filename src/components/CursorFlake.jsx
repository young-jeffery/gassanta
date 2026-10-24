import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { emitDust } from "../lib/dustBus";

// Desktop hover cursor: while the mouse is over something clickable, the native cursor hides and a small
// snowflake takes its place on the spot. It spins and sheds snow-dust particles. Touch devices never see it.
// The default (non-hover) cursor stays the static snowflake from index.css.
//
// Three nested elements, each with exactly ONE job, so the browser never has to mix them:
//   wrapper : position only (JS writes `transform` straight from the pointer event, no transitions)
//   skin    : opacity + scale transitions (appear / grow / press)
//   spin    : the endless rotation (a CSS animation)
// Mixing a moving transform with a running transform animation on ONE element is a known way to get a
// cursor that lags, glides in from its old position, or jumps.
const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], summary, label[for], select';

export default function CursorFlake() {
  const wrapRef = useRef(null);
  const skinRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    const wrap = wrapRef.current;
    const skin = skinRef.current;
    const reduced = prefersReducedMotion();
    const root = document.documentElement;

    let x = -100;
    let y = -100;
    let hovering = false;
    let raf = 0;
    let lastEmit = 0;

    const place = (px, py) => {
      x = px;
      y = py;
      wrap.style.transform = `translate3d(${px - 16}px, ${py - 16}px, 0)`;
    };

    // Particles while hovering (also when the mouse is still). Position is NOT handled here.
    const emitLoop = (now) => {
      if (!hovering) {
        raf = 0;
        return;
      }
      if (!reduced && now - lastEmit > 85) {
        emitDust(x, y, { count: 1 });
        lastEmit = now;
      }
      raf = requestAnimationFrame(emitLoop);
    };

    // The flake and the "hide the native cursor" flag change in the same step, so there is never a moment
    // with two cursors or with none.
    const setHover = (value) => {
      if (value === hovering) return;
      hovering = value;
      skin.dataset.show = value ? "1" : "0";
      if (value) root.setAttribute("data-flake-hover", "");
      else root.removeAttribute("data-flake-hover");
      if (value && !raf) raf = requestAnimationFrame(emitLoop);
    };

    const onMove = (e) => {
      if (e.pointerType !== "touch") place(e.clientX, e.clientY);
    };
    const onOver = (e) => {
      if (e.pointerType === "touch") return;
      place(e.clientX, e.clientY); // position first, then show: it appears exactly under the pointer
      setHover(e.target instanceof Element && !!e.target.closest(INTERACTIVE));
    };
    const onLeaveWindow = (e) => {
      if (!e.relatedTarget) setHover(false);
    };
    const onBlur = () => setHover(false);
    const onDown = (e) => {
      if (e.pointerType === "touch" || !hovering) return;
      skin.dataset.press = "1";
      if (!reduced) emitDust(x, y, { count: 8, burst: true });
    };
    const onUp = () => {
      skin.dataset.press = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onLeaveWindow, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      root.removeAttribute("data-flake-hover");
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onLeaveWindow);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-95"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div ref={skinRef} data-show="0" className="cursor-flake">
        <div className="cursor-flake-spin">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <defs>
              <radialGradient id="cf-glow">
                <stop offset="0" stopColor="#ffd27a" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
              </radialGradient>
              <g id="cf-arm" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3.5V28.5M13 6.6L16 9.6L19 6.6M13 25.4L16 22.4L19 25.4" />
              </g>
            </defs>
            <circle cx="16" cy="16" r="16" fill="url(#cf-glow)" />
            <g stroke="#0f1726" strokeOpacity="0.6" strokeWidth="4.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <use href="#cf-arm" />
              <use href="#cf-arm" transform="rotate(60 16 16)" />
              <use href="#cf-arm" transform="rotate(120 16 16)" />
            </g>
            <g stroke="#fff8e6" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <use href="#cf-arm" />
              <use href="#cf-arm" transform="rotate(60 16 16)" />
              <use href="#cf-arm" transform="rotate(120 16 16)" />
            </g>
            <circle cx="16" cy="16" r="2.2" fill="#fff8e6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
