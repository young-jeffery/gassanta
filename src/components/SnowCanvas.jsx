import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { getTier, subscribeTier } from "../lib/perf";
import { useTheme } from "../theme/useTheme";

// Three depth layers, far to near. Nearer flakes are bigger, faster, brighter.
const LAYERS = [
  { speed: [24, 38], size: [0.8, 1.5], alpha: 0.45, sway: 6 },
  { speed: [38, 66], size: [1.4, 2.4], alpha: 0.7, sway: 12 },
  { speed: [66, 100], size: [2.2, 3.8], alpha: 0.95, sway: 20 },
];
const POINTER_RADIUS = 120;
const MOBILE_WIDTH = 768;
const MOBILE_DENSITY = 2;

// Quality per performance tier (see lib/perf.js)
const QUALITY = {
  2: { dpr: 2, density: 1, halfRate: false, stir: true },
  1: { dpr: 1.5, density: 0.65, halfRate: false, stir: true },
  0: { dpr: 1, density: 0.35, halfRate: true, stir: false },
};

const rand = (min, max) => min + Math.random() * (max - min);

// Full-screen falling snow. Drag a finger or move the mouse and the flakes get pushed around.
// One canvas + one GSAP ticker loop; flakes are batched per layer to keep it cheap on phones.
// Quality follows the adaptive performance tier: pixel density, flake count, frame rate, pointer push.
export default function SnowCanvas() {
  const canvasRef = useRef(null);
  const colorRef = useRef("#ffffff");
  const { palette } = useTheme();

  // Re-read the snow color whenever the palette changes
  useEffect(() => {
    colorRef.current = getComputedStyle(document.documentElement).getPropertyValue("--c-snow").trim() || "#ffffff";
  }, [palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();
    const speedScale = reduced ? 0.3 : 1;
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;

    let q = QUALITY[getTier()];
    let w = 0;
    let h = 0;
    let flakes = [];
    let bounds = [0, 0, 0, 0]; // flakes are kept sorted by layer; bounds[l]..bounds[l+1] is layer l
    let skip = false;
    let pending = 0;
    let resizeTimer = 0;
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, lastMove: -1e9 };

    const makeFlake = (anywhere) => {
      const layer = Math.floor(Math.random() * LAYERS.length);
      const L = LAYERS[layer];
      return {
        layer,
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        r: rand(...L.size),
        vy: rand(...L.speed),
        vx: 0, // extra horizontal velocity from the pointer
        phase: Math.random() * Math.PI * 2,
      };
    };

    const targetCount = () => {
      const base = Math.round((w * h) / 7000);
      const mobileBoost = w <= MOBILE_WIDTH ? MOBILE_DENSITY : 1;
      const scaled = base * mobileBoost * q.density * (lowPower ? 0.7 : 1) * (reduced ? 0.4 : 1);
      return Math.max(24, Math.min(170, Math.round(scaled)));
    };

    const rebuildBounds = () => {
      flakes.sort((a, b) => a.layer - b.layer);
      bounds = [0, 0, 0, 0];
      for (const f of flakes) bounds[f.layer + 1] += 1;
      for (let i = 1; i < bounds.length; i++) bounds[i] += bounds[i - 1];
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, q.dpr); // cap: 3x screens don't need 3x snow
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = targetCount();
      while (flakes.length < n) flakes.push(makeFlake(true));
      if (flakes.length > n) flakes.length = n;
      rebuildBounds();
    };

    // Phones fire many resize events while the browser bar slides in and out. Reallocating the canvas
    // on each one causes stutter, so wait until they stop.
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };

    const moveTo = (x, y) => {
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.lastMove = performance.now();
    };
    // Mouse/pen use pointer events. Touch uses touch events, because Android cancels pointer events as
    // soon as the browser decides a drag might be a scroll, while touchmove keeps firing.
    const onPointerMove = (e) => {
      if (e.pointerType !== "touch") moveTo(e.clientX, e.clientY);
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) moveTo(t.clientX, t.clientY);
    };

    const tick = (time, deltaTime) => {
      if (q.halfRate) {
        // light tier: draw every other tick (30fps) and carry the skipped time into the next one
        skip = !skip;
        if (skip) {
          pending += deltaTime;
          return;
        }
      }
      const dt = Math.min(deltaTime + pending, 100) / 1000; // clamp so a lag spike doesn't teleport flakes
      pending = 0;
      const t = time;
      const pointerActive = q.stir && !reduced && performance.now() - pointer.lastMove < 120;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colorRef.current;

      for (let layer = 0; layer < LAYERS.length; layer++) {
        const L = LAYERS[layer];
        ctx.globalAlpha = L.alpha;
        ctx.beginPath();

        for (let i = bounds[layer]; i < bounds[layer + 1]; i++) {
          const f = flakes[i];

          if (pointerActive) {
            const dx = f.x - pointer.x;
            const dy = f.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < POINTER_RADIUS && dist > 0.1) {
              const force = 1 - dist / POINTER_RADIUS;
              f.vx += ((dx / dist) * 220 + pointer.vx * 6) * force * dt * 6;
            }
          }

          f.vx *= 1 - Math.min(1, 2.2 * dt); // damping
          f.y += f.vy * speedScale * dt;
          f.x += (Math.sin(t * 0.7 + f.phase) * L.sway * speedScale + f.vx) * dt;

          if (f.y > h + 10) {
            f.y = -10;
            f.x = Math.random() * w;
            f.vx = 0;
          }
          if (f.x < -10) f.x = w + 10;
          else if (f.x > w + 10) f.x = -10;

          ctx.moveTo(f.x + f.r, f.y);
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const unsubscribeTier = subscribeTier((tier) => {
      q = QUALITY[tier];
      resize();
    });

    resize();
    gsap.ticker.add(tick);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      unsubscribeTier();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
