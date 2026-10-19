import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { getTier, subscribeTier } from "../lib/perf";
import { useTheme } from "../theme/useTheme";

const POOL_SIZE = 90;
const MAX_PER_EVENT = 6;
const GLOW = "#ffd27a";

// Quality per performance tier (see lib/perf.js)
const QUALITY = {
  2: { dpr: 1.5, max: 90, step: 9 },
  1: { dpr: 1, max: 60, step: 11 },
  0: { dpr: 1, max: 32, step: 14 },
};

const rand = (min, max) => min + Math.random() * (max - min);

// Snow-dust trail that follows a finger or mouse, plus a small burst on tap/click.
// One canvas, one GSAP ticker, a fixed pool of particles (no allocation while moving).
// The canvas is hidden whenever no particles are alive, so it costs nothing when idle.
export default function DustTrail() {
  const canvasRef = useRef(null);
  const colorRef = useRef("#ffffff");
  const { palette } = useTheme();

  // Dust color follows the palette: snow on dark themes, accent (readable) on the light theme
  useEffect(() => {
    const token = palette.mode === "light" ? "--c-accent" : "--c-snow";
    colorRef.current = getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "#ffffff";
  }, [palette]);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pool = Array.from({ length: POOL_SIZE }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 1, gold: false }));
    let q = QUALITY[getTier()];
    let cursor = 0;
    let alive = 0;
    let shown = false;
    let last = null; // last pointer position, to fill gaps on fast moves
    let resizeTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, q.dpr);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200); // don't reallocate while the phone's browser bar is sliding
    };

    const show = (visible) => {
      if (shown === visible) return;
      shown = visible;
      canvas.style.visibility = visible ? "visible" : "hidden";
    };

    const spawn = (x, y, burst) => {
      const p = pool[cursor];
      cursor = (cursor + 1) % q.max;
      if (!p.alive) alive += 1;
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? rand(30, 110) : rand(6, 34);
      p.alive = true;
      p.x = x + rand(-3, 3);
      p.y = y + rand(-3, 3);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed + (burst ? -10 : 8); // dust settles slowly
      p.max = rand(0.6, 1.25);
      p.life = p.max;
      p.r = rand(0.9, burst ? 3.2 : 2.6);
      p.gold = Math.random() < 0.12;
      show(true);
    };

    const trail = (x, y) => {
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const count = Math.min(MAX_PER_EVENT, Math.floor(Math.hypot(dx, dy) / q.step));
        for (let i = 1; i <= count; i++) spawn(last.x + (dx * i) / count, last.y + (dy * i) / count, false);
        if (count > 0) last = { x, y };
      } else {
        last = { x, y };
      }
    };
    const burst = (x, y) => {
      last = { x, y };
      const n = Math.round(12 * (q.max / 90) + 4);
      for (let i = 0; i < n; i++) spawn(x, y, true);
    };
    const end = () => {
      last = null; // a lifted finger shouldn't draw a line to the next touch
    };

    // Mouse/pen: pointer events. Touch: touch events, because Android cancels pointer events the moment
    // the browser thinks a drag might be a scroll (that's why the trail only showed on tap there),
    // while touchmove keeps firing.
    const onPointerMove = (e) => {
      if (e.pointerType !== "touch") trail(e.clientX, e.clientY);
    };
    const onPointerDown = (e) => {
      if (e.pointerType !== "touch") burst(e.clientX, e.clientY);
    };
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (t) burst(t.clientX, t.clientY);
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) trail(t.clientX, t.clientY);
    };

    const tick = (time, deltaTime) => {
      if (alive === 0) return;
      const dt = Math.min(deltaTime, 50) / 1000;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const base = colorRef.current;

      for (const p of pool) {
        if (!p.alive) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.alive = false;
          alive -= 1;
          continue;
        }
        const k = p.life / p.max; // 1 -> 0
        const drag = 1 - Math.min(1, 2.4 * dt);
        p.vx *= drag;
        p.vy = p.vy * drag + 14 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.globalAlpha = Math.min(1, k * 1.4) * (p.gold ? 0.95 : 0.85);
        ctx.fillStyle = p.gold ? GLOW : base;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * k), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (alive === 0) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        show(false);
      }
    };

    const unsubscribeTier = subscribeTier((tier) => {
      q = QUALITY[tier];
      resize();
    });

    canvas.style.visibility = "hidden";
    resize();
    gsap.ticker.add(tick);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", end, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      unsubscribeTier();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] h-full w-full" />;
}
