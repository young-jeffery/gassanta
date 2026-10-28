import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { getDivisor, getTier, isBusy, recordWork, subscribeTier } from "../lib/perf";
import { getStorm } from "../lib/storm";
import { useTheme } from "../theme/useTheme";

// Three depth layers, far to near. Nearer flakes are bigger, faster, brighter.
const LAYERS = [
  { speed: [24, 38], size: [0.8, 1.5], alpha: 0.45, sway: 6 },
  { speed: [38, 66], size: [1.4, 2.4], alpha: 0.7, sway: 12 },
  { speed: [66, 100], size: [2.2, 3.8], alpha: 0.95, sway: 20 },
];
const POINTER_RADIUS = 120;
// Blizzard mode (lib/blizzard.js drives lib/storm.js): a violent storm. Up to STORM_MULT x the flakes (capped), a
// gusting wind blowing left to right at 1000-2500 px/s (nearer layers are pushed up to 1.5x harder, every flake has
// its own speed), a 4x faster fall, random turbulence, and flakes drawn as long slanted streaks.
const STORM_MULT = 5.5;
const STORM_CAP = 800;
const WIND_LAYER = [0.6, 1, 1.5];
const MOBILE_WIDTH = 768;
const MOBILE_DENSITY = 2;

// Quality per performance tier (see lib/perf.js). Tiers scale density and resolution only.
// halfRate (tier 0 only) draws at 30fps; every other tier draws at up to 60fps.
const QUALITY = {
  2: { dpr: 2, density: 1, halfRate: false },
  1: { dpr: 1.5, density: 0.75, halfRate: false },
  0: { dpr: 1, density: 0.5, halfRate: true },
};

const rand = (min, max) => min + Math.random() * (max - min);

// Full-screen falling snow. Drag a finger or move the mouse and the flakes get pushed around.
// One canvas + one GSAP ticker loop; flakes are batched per layer to keep it cheap on phones.
// Quality follows the adaptive performance tier: pixel density and flake count (frame rate only at tier 0).
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
    let baseCount = 0; // flakes drawn in calm weather; the rest of the array only appears during a storm
    let bounds = [0, 0, 0, 0]; // flakes are kept sorted by layer; bounds[l]..bounds[l+1] is layer l
    let ticks = 0;
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

    // The array is built at the storm maximum; each frame only the active share of every layer is drawn
    const maxCount = () => (reduced ? targetCount() : Math.min(STORM_CAP, Math.round(targetCount() * STORM_MULT)));

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

      baseCount = targetCount();
      const n = maxCount();
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
      // Frame gate: draw at most ~60fps (every 2nd tick on 120Hz screens), 30fps at tier 0 or while a sheet
      // slides. Skipped ticks pass their time forward, so motion speed is identical.
      const stormNow = reduced ? 0 : getStorm();
      const every = getDivisor() * (q.halfRate || (isBusy() && stormNow === 0) ? 2 : 1); // a storm keeps its frame rate
      ticks += 1;
      if (ticks % every !== 0) {
        pending += deltaTime;
        return;
      }
      const t0 = performance.now();
      const dt = Math.min(deltaTime + pending, 100) / 1000; // clamp so a lag spike doesn't teleport flakes
      pending = 0;
      const t = time;
      const pointerActive = !reduced && performance.now() - pointer.lastMove < 120;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colorRef.current;
      ctx.strokeStyle = colorRef.current;
      ctx.lineCap = "round";

      // Storm values for this frame (all zero / neutral in calm weather)
      const storm = stormNow;
      const frac = flakes.length > 0 ? Math.min(1, (baseCount + storm * (flakes.length - baseCount)) / flakes.length) : 1;
      const gust = 0.7 + 0.3 * Math.sin(t * 1.1) + 0.2 * Math.sin(t * 2.7 + 1.3);
      const wind = storm > 0 ? Math.pow(storm, 1.3) * (1100 + 1000 * gust) : 0; // px/s
      const fall = 1 + 3 * storm;
      const streaks = storm > 0.05;
      const streakLen = 0.03 * Math.min(1, storm * 1.5); // seconds of travel drawn as the streak

      for (let layer = 0; layer < LAYERS.length; layer++) {
        const L = LAYERS[layer];
        const windL = wind * WIND_LAYER[layer];
        const start = bounds[layer];
        const end = start + Math.ceil((bounds[layer + 1] - start) * frac);
        ctx.globalAlpha = L.alpha;
        ctx.beginPath();
        if (streaks) ctx.lineWidth = L.size[0] + L.size[1]; // average flake diameter

        for (let i = start; i < end; i++) {
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
          // every flake gets its own speed and its own turbulence in a storm (all zero in calm weather)
          const mult = 0.75 + 0.5 * ((f.phase * 1.618) % 1);
          const turbX = Math.sin(t * 5 + f.phase * 3) * 200 * storm;
          const turbY = Math.sin(t * 3 + f.phase * 2) * 140 * storm;
          f.y += (f.vy * speedScale * fall + turbY) * dt;
          f.x += (Math.sin(t * 0.7 + f.phase) * L.sway * speedScale + f.vx + windL * mult + turbX) * dt;

          if (f.y > h + 10) {
            f.y = -10;
            f.x = Math.random() * w;
            f.vx = 0;
          }
          if (f.x < -10) f.x = w + 10;
          else if (f.x > w + 10) f.x = -10;

          if (streaks) {
            // a short line along the flake's velocity (slanted down-right in a storm)
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x - (windL * mult + f.vx + turbX) * streakLen, f.y - (f.vy * fall + turbY) * streakLen);
          } else {
            ctx.moveTo(f.x + f.r, f.y);
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          }
        }
        if (streaks) ctx.stroke();
        else ctx.fill();
      }
      ctx.globalAlpha = 1;
      recordWork(performance.now() - t0);
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
