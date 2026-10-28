import { useEffect } from "react";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";
import { getDivisor } from "./perf";
import { getStorm } from "./storm";

// Landing page depth effect: the scene's layers slide sideways by different amounts, so the village seems to have
// depth. The nearest layers (foreground pines) move most, the sky barely moves. Only `x` is written: the entrance
// owns `y`/`autoAlpha`, the sun/moon swap owns `y`/`scale`, the pine shake owns `skewX`. GSAP keeps one transform per
// element, so they all compose without fighting. Text and fairy lights stay still.
//
// Input -> one number `norm` (-1..1):
//   mouse : the cursor's x across the window
//   touch : the finger's x (touch events: Android cancels pointer events during drags)
//   idle  : after IDLE_MS without input the scene drifts slowly on its own (two sines of different periods, so it
//           never visibly repeats), on every device
// `norm` is smoothed over time (so flicks and lifted fingers never snap) and each layer moves by -norm * depth,
// opposite to the pointer. Reduced motion: does nothing. Runs in one ticker callback with quickSetters (no tween
// objects); on 100Hz+ screens it updates at a 60fps cap like the canvases. No performance tier removes it.
// During the blizzard transition (lib/storm.js) every layer also trembles, harder for nearer layers.
const IDLE_MS = 2000;
const SMOOTH_S = 0.35; // smoothing time constant
const MIN_STEP = 0.02; // px: skip writes smaller than this

// max shift in px at full tilt on a ~390px-wide phone; scaled with screen width (capped), see widthScale()
const LAYERS = [
  ["[data-sky]", 2],
  ["[data-stars]", 3],
  ["[data-moon]", 4],
  ["[data-sun]", 4],
  ["[data-clouds]", 7],
  ['[data-layer="far"]', 6],
  ['[data-layer="mid"]', 9],
  ['[data-layer="cottage"]', 12],
  ['[data-layer="near"]', 17],
  ['[data-layer="fore"]', 24],
];
const widthScale = () => Math.min(2.2, Math.max(1, window.innerWidth / 390));

const drift = (ms) => {
  const s = ms / 1000;
  return 0.55 * Math.sin((s * Math.PI * 2) / 14) + 0.25 * Math.sin((s * Math.PI * 2) / 23 + 1.3);
};

export function useParallax() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const scene = document.querySelector("[data-scene]");
    if (!scene) return undefined;

    const items = LAYERS.map(([selector, depth]) => {
      const el = scene.querySelector(selector);
      return el ? { set: gsap.quickSetter(el, "x", "px"), depth, last: 0 } : null;
    }).filter(Boolean);

    let k = widthScale();
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        k = widthScale();
      }, 200);
    };

    let inputNorm = 0;
    let lastInput = performance.now(); // eases into the idle drift 2s after load
    let current = 0;
    let ticks = 0;
    let pending = 0;

    const fromX = (x) => {
      inputNorm = Math.max(-1, Math.min(1, (x / window.innerWidth) * 2 - 1));
      lastInput = performance.now();
    };
    const onPointerMove = (e) => {
      if (e.pointerType !== "touch") fromX(e.clientX);
    };
    const onTouch = (e) => {
      const t = e.touches[0];
      if (t) fromX(t.clientX);
    };

    const tick = (time, deltaTime) => {
      ticks += 1;
      if (ticks % getDivisor() !== 0) {
        pending += deltaTime; // time carries forward, so speed is the same at any refresh rate
        return;
      }
      const dt = Math.min(deltaTime + pending, 100) / 1000;
      pending = 0;
      const now = performance.now();
      const target = now - lastInput > IDLE_MS ? drift(now) : inputNorm;
      current += (target - current) * (1 - Math.exp(-dt / SMOOTH_S));
      const storm = getStorm();
      for (const item of items) {
        const shake = storm > 0.05 ? (Math.random() * 2 - 1) * storm * item.depth * 0.45 : 0;
        const x = -current * item.depth * k + shake;
        if (Math.abs(x - item.last) < MIN_STEP) continue;
        item.last = x;
        item.set(x);
      }
    };

    gsap.ticker.add(tick);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);
}
