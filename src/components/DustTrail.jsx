import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { setDustEmitter } from "../lib/dustBus";
import { getDivisor, getTier, recordWork, subscribeTier } from "../lib/perf";
import { useTheme } from "../theme/useTheme";

const POOL_SIZE = 90;
const MAX_PER_EVENT = 6;
const GLOW = "#ffd27a";

// Quality per performance tier (see lib/perf.js): density and resolution only
const QUALITY = {
  2: { dpr: 1.5, max: 90, step: 9 },
  1: { dpr: 1, max: 70, step: 10 },
  0: { dpr: 1, max: 45, step: 12 },
};

const rand = (min, max) => min + Math.random() * (max - min);

// Snow-dust trail that follows a finger or mouse, plus bursts on tap/click. Other components can also spawn
// particles through lib/dustBus.js (hover cursor, tap reactions). One canvas, one ticker, a fixed particle
// pool, no allocation while moving. The canvas is hidden whenever nothing is alive, so it costs nothing idle.
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
    let hasLast = false; // last pointer position, to fill gaps on fast moves (plain numbers: no allocation)
    let lastX = 0;
    let lastY = 0;
    let resizeTimer = 0;
    let ticks = 0;
    let pending = 0;

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
      if (hasLast) {
        const dx = x - lastX;
        const dy = y - lastY;
        const count = Math.min(MAX_PER_EVENT, Math.floor(Math.hypot(dx, dy) / q.step));
        for (let i = 1; i <= count; i++) spawn(lastX + (dx * i) / count, lastY + (dy * i) / count, false);
        if (count > 0) {
          lastX = x;
          lastY = y;
        }
      } else {
        hasLast = true;
        lastX = x;
        lastY = y;
      }
    };
    const burst = (x, y) => {
      hasLast = true;
      lastX = x;
      lastY = y;
      const n = Math.round(12 * (q.max / 90) + 4);
      for (let i = 0; i < n; i++) spawn(x, y, true);
    };
    const end = () => {
      hasLast = false; // a lifted finger shouldn't draw a line to the next touch
    };

    // Mouse/pen: pointer events. Touch: touch events, because Android cancels pointer events the moment
    // the browser thinks a drag might be a scroll, while touchmove keeps firing.
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
      ticks += 1;
      if (ticks % getDivisor() !== 0) {
        pending += deltaTime; // 60fps cap on 120Hz screens; time carries forward so speed is unchanged
        return;
      }
      const t0 = performance.now();
      const dt = Math.min(deltaTime + pending, 50) / 1000;
      pending = 0;
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
      recordWork(performance.now() - t0);
    };

    const unsubscribeTier = subscribeTier((tier) => {
      q = QUALITY[tier];
      resize();
    });

    // Other components spawn particles through the bus
    setDustEmitter((x, y, opts) => {
      const n = opts?.count ?? 1;
      for (let i = 0; i < n; i++) spawn(x, y, !!opts?.burst);
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
      setDustEmitter(null);
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
