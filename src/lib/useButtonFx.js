import { useEffect } from "react";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";
import { emitDust } from "./dustBus";
import { initSfx, sfx } from "../audio/sfx";

// Button feel for the landing page CTAs. Attach to the WRAPPER div around a button (never the button itself, which
// keeps its own CSS). One element, one job: this moves/squashes the wrapper with GSAP.
//   desktop mouse : lift + slight magnetic pull toward the cursor
//   press         : squash (held while pressed), elastic rebound on release, sparkle burst at the pointer,
//                   a soft chime, and on Android a 10ms vibration
//   drop fill     : if the button contains a .cta-drop, a circle of the contrasting color grows from the point where
//                   the pointer entered (or from the center when focused with the keyboard) until it fills the button,
//                   and shrinks back toward the point where the pointer left. The circle itself is CSS (transform
//                   only); this just tells it where to start, through CSS variables.
// Reduced motion: no movement and no drop animation (index.css shows a plain CSS press instead).
const MAX_X = 7; // px the button can drift toward the cursor
const MAX_Y = 5;
const PULL = 0.18; // fraction of the cursor's offset from the button's center
const LIFT = -3; // px

export function useButtonFx(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    initSfx();
    const reduced = prefersReducedMotion();

    const btn = el.querySelector("button");
    const drop = el.querySelector(".cta-drop");
    const qx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    const clamp = gsap.utils.clamp;
    let pressed = false;
    let filled = false;

    // ---- drop fill ----
    const dropTo = (on, px, py) => {
      if (!drop || !btn || reduced) return;
      const r = btn.getBoundingClientRect();
      const x = px === undefined ? r.width / 2 : clamp(0, r.width, px - r.left) - btn.clientLeft;
      const y = py === undefined ? r.height / 2 : clamp(0, r.height, py - r.top) - btn.clientTop;
      const s = drop.style;
      if (on) {
        if (filled) return;
        filled = true;
        // start from nothing at the entry point: set it without a transition, then grow
        s.transition = "none";
        s.setProperty("--dd", `${Math.ceil(2 * Math.hypot(r.width, r.height))}px`);
        s.setProperty("--dx", `${x}px`);
        s.setProperty("--dy", `${y}px`);
        s.setProperty("--ds", "0");
        void drop.offsetWidth; // flush, so the next change animates
        s.transition = "";
        s.setProperty("--ds", "1");
        btn.dataset.fill = "1";
      } else {
        if (!filled) return;
        filled = false;
        s.setProperty("--dx", `${x}px`);
        s.setProperty("--dy", `${y}px`);
        s.setProperty("--ds", "0");
        delete btn.dataset.fill;
      }
    };

    // ---- magnet + lift (mouse only) ----
    const magnet = (e) => {
      if (reduced || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      // Center WITHOUT our own offset, otherwise the button chases its own movement and jitters
      const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
      qx(clamp(-MAX_X, MAX_X, (e.clientX - cx) * PULL));
      qy(LIFT + clamp(-MAX_Y, MAX_Y, (e.clientY - cy) * PULL));
    };

    const release = () => {
      if (!pressed) return;
      pressed = false;
      if (!reduced) gsap.to(el, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    };

    const onEnter = (e) => {
      magnet(e);
      dropTo(true, e.clientX, e.clientY);
    };
    const onLeave = (e) => {
      if (!reduced) {
        qx(0);
        qy(0);
      }
      release();
      if (document.activeElement !== btn || !btn?.matches(":focus-visible")) dropTo(false, e.clientX, e.clientY);
    };
    const onDown = (e) => {
      pressed = true;
      sfx.press();
      if (reduced) return;
      gsap.to(el, { scaleX: 1.04, scaleY: 0.92, duration: 0.09, ease: "power2.out", overwrite: "auto" });
      emitDust(e.clientX, e.clientY, { count: 8, burst: true });
      if (e.pointerType === "touch" && navigator.vibrate) navigator.vibrate(10);
    };
    const onFocusIn = () => {
      if (btn?.matches(":focus-visible")) dropTo(true);
    };
    const onFocusOut = () => dropTo(false);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", magnet);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", magnet);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
      if (btn) delete btn.dataset.fill;
    };
  }, [ref]);
}
