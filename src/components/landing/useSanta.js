import { useEffect } from "react";
import { prefersReducedMotion } from "../../lib/motion";
import { emitDust } from "../../lib/dustBus";
import { getTier } from "../../lib/perf";
import { sfx } from "../../audio/sfx";

// Flies Santa's sleigh (the <Santa /> element) across the sky: first flight ~16s after the page loads (the entrance
// takes ~5s, so that is roughly 12s after it), then one every 30-40s, alternating left-to-right and right-to-left.
// The flight is one Web Animations animation (compositor only); a faint sparkle trail is emitted behind it through
// the dust canvas. Tapping him ("ss:santa" event sent by useTapReactions when a tap lands on his box) shows a
// "Ho ho ho!" bubble, a sparkle burst and a sound. No flights with reduced motion; a flight waits while the tab is
// hidden or a sheet is open.
const FIRST_MS = 16000;
const GAP_MS = [30000, 40000];
const ARC = [0, -8, -12, -6, 0]; // gentle rise and fall along the flight (px)
const rand = (a, b) => a + Math.random() * (b - a);

export function useSanta() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const el = document.querySelector("[data-santa-fly]");
    if (!el) return undefined;
    const svg = el.querySelector("[data-santa-svg]");
    const bubble = el.querySelector("[data-santa-bubble]");

    let dir = 1; // 1 = left to right
    let anim = null;
    let trail = 0;
    let timer = 0;
    let lastHo = 0;
    let cancelled = false;

    const stopTrail = () => {
      clearInterval(trail);
      trail = 0;
    };
    const schedule = (ms) => {
      clearTimeout(timer);
      timer = setTimeout(launch, ms);
    };

    function launch() {
      if (cancelled) return;
      if (document.hidden || document.documentElement.hasAttribute("data-scroll-locked")) {
        schedule(4000);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.round(Math.min(260, Math.max(150, vw * 0.34)));
      const lights = document.querySelector("[data-lights]");
      const minTop = (lights ? lights.getBoundingClientRect().bottom : 60) + 8; // below the fairy lights
      const top = Math.max(minTop, vh * 0.16) + rand(0, vh * 0.1);

      el.style.width = `${width}px`;
      el.style.display = "block";
      el.dataset.flying = "1";
      svg.style.transform = dir === 1 ? "" : "scaleX(-1)";

      const out = width + 24;
      const x0 = dir === 1 ? -out : vw + 24;
      const x1 = dir === 1 ? vw + 24 : -out;
      const duration = Math.min(22000, Math.max(12000, (vw + 2 * out) * 18));
      const frames = ARC.map((dy, i) => ({ transform: `translate(${x0 + ((x1 - x0) * i) / (ARC.length - 1)}px, ${top + dy}px)` }));
      anim = el.animate(frames, { duration, easing: "linear", fill: "forwards" });

      const step = getTier() === 0 ? 280 : 140;
      trail = setInterval(() => {
        const r = el.getBoundingClientRect();
        const x = dir === 1 ? r.left + r.width * 0.12 : r.right - r.width * 0.12; // behind the sleigh
        if (x < 0 || x > vw) return;
        emitDust(x, r.top + r.height * 0.7, { count: 1 });
      }, step);

      anim.onfinish = () => {
        stopTrail();
        el.style.display = "none";
        el.dataset.flying = "0";
        dir = -dir;
        schedule(rand(GAP_MS[0], GAP_MS[1]));
      };
    }

    const onSantaTap = (e) => {
      const now = performance.now();
      if (now - lastHo < 800) return;
      lastHo = now;
      const { x, y } = e.detail;
      sfx.hoho();
      emitDust(x, y, { count: 14, burst: true });
      bubble?.animate(
        [
          { opacity: 0, transform: "translateY(8px) scale(0.6)" },
          { opacity: 1, transform: "translateY(-6px) scale(1.08)", offset: 0.2 },
          { opacity: 1, transform: "translateY(-10px) scale(1)", offset: 0.75 },
          { opacity: 0, transform: "translateY(-22px) scale(0.95)" },
        ],
        { duration: 1400, easing: "ease-out" }
      );
    };

    window.addEventListener("ss:santa", onSantaTap);
    schedule(FIRST_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopTrail();
      window.removeEventListener("ss:santa", onSantaTap);
      if (anim) anim.cancel();
      el.style.display = "none";
      el.dataset.flying = "0";
    };
  }, []);
}
