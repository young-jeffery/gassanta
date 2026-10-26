import { useEffect } from "react";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { emitDust } from "../../lib/dustBus";
import { initSfx, sfx } from "../../audio/sfx";

// Tap reactions for the landing scene. ONE window pointerdown listener hit-tests the tap against the scene's shapes
// by geometry, so nothing in the page needs pointer-events and clicks are never intercepted.
//
// Order of checks (first match wins): UI (buttons, sheets: ignored) > fairy-light bulb > title letter > Santa > cottage
// window > door > chimney > big pine > empty sky (wish star) > anywhere else (small snow poof).
// Every reaction = a little motion + a sound (audio/sfx.js). While the entrance is still playing nothing reacts.
// Reduced motion: sounds only. At most MAX_ACTIVE visual effects run at once; taps closer than MIN_GAP are ignored.
//
// Geometry below must match Scene.jsx / sceneArt.js (ground layers use viewBox 1000x420, xMidYMax slice).
const VB_W = 1000;
const VB_H = 420;
const MAX_ACTIVE = 4;
const MIN_GAP = 90; // ms
const UI = 'button, a, input, select, textarea, summary, [role="button"], [role="switch"], [role="dialog"]';

const WINDOWS = [
  [452, 276, 478, 296],
  [522, 276, 548, 296],
];
const DOOR = [491, 283, 509, 308];
const CHIMNEY = [530, 200, 554, 262]; // includes the smoke above it
const PINES = [
  { x: -120, h: 270 },
  { x: 150, h: 215 },
  { x: 318, h: 175 },
  { x: 690, h: 150 },
  { x: 858, h: 205 },
  { x: 1125, h: 265 },
];
const PINE_BASE = 412;
const SKY_LIMIT_Y = 250; // svg y of the cottage layer: above this a miss counts as "sky"

const rnd = gsap.utils.random;
const clamp = gsap.utils.clamp;

// Maps between a ground layer's svg coordinates and the screen, from its on-screen box
// (xMidYMax slice: scale to cover, centered horizontally, bottom aligned)
function layerMap(layer) {
  const r = layer?.getBoundingClientRect();
  if (!r || !r.width || !r.height) return null;
  const s = Math.max(r.width / VB_W, r.height / VB_H);
  const ox = r.left + (r.width - VB_W * s) / 2;
  const oy = r.top + r.height - VB_H * s;
  return {
    s,
    toScreen: (x, y) => ({ x: ox + x * s, y: oy + y * s }),
    toSvg: (px, py) => ({ x: (px - ox) / s, y: (py - oy) / s }),
  };
}

const inBox = (p, [x0, y0, x1, y1], pad) => p.x >= x0 - pad && p.x <= x1 + pad && p.y >= y0 - pad && p.y <= y1 + pad;

function pineAt(p, pad) {
  for (const pine of PINES) {
    const top = PINE_BASE - pine.h;
    if (p.y < top - pad || p.y > PINE_BASE) continue;
    const grow = clamp(0, 1, (p.y - top) / (0.94 * pine.h));
    const half = Math.max(0.06 * pine.h, 0.4 * pine.h * grow);
    if (Math.abs(p.x - pine.x) <= half + pad) return pine;
  }
  return null;
}

export function useTapReactions() {
  useEffect(() => {
    initSfx();
    const reduced = prefersReducedMotion();
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Our own layer for temporary effects (rings, light, the wish star): above the scene and lights, below the snow
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden;";
    document.body.appendChild(layer);

    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    let active = 0;
    let lastTap = 0;
    let lastMove = 0;
    const claim = (ms) => {
      if (reduced || active >= MAX_ACTIVE) return false;
      active += 1;
      later(() => {
        active -= 1;
      }, ms);
      return true;
    };

    const q = {
      get scene() {
        return document.querySelector("[data-scene]");
      },
      get lights() {
        return document.querySelector("[data-lights]");
      },
      get hero() {
        return document.querySelector("[data-hero]");
      },
    };
    const introPlaying = () => !!q.hero?.querySelector("[data-hero-title][data-filling]");

    // ---- tiny effect helpers (temporary elements in our layer, animated with the Web Animations API) ----
    const makeEl = (css) => {
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;left:0;top:0;pointer-events:none;${css}`;
      layer.appendChild(el);
      return el;
    };
    const run = (el, keyframes, options) => {
      const anim = el.animate(keyframes, { fill: "forwards", ...options });
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    };
    const ring = (x, y, { size = 36, color = "var(--c-snow)", border = 2, dur = 700, to = 2.6, rise = 0 } = {}) => {
      const el = makeEl(`width:${size}px;height:${size}px;border-radius:50%;border:${border}px solid ${color};`);
      const at = (k, up) => `translate(${x - size / 2}px, ${y - size / 2 - up}px) scale(${k})`;
      run(el, [{ transform: at(0.3, 0), opacity: 0.85 }, { transform: at(to, rise), opacity: 0 }], { duration: dur, easing: "cubic-bezier(0.2,0.7,0.3,1)" });
    };

    // ---- letters: hop in a wave ----
    const hopping = new WeakMap();
    const hop = (el, amp, delay = 0) => {
      const now = performance.now();
      if ((hopping.get(el) || 0) > now) return;
      hopping.set(el, now + delay * 1000 + 650);
      gsap
        .timeline({ delay })
        .to(el, { yPercent: -30 * amp, rotation: rnd(-7, 7) * amp, scaleY: 1 + 0.08 * amp, duration: 0.15, ease: "power2.out", transformOrigin: "50% 100%" })
        .to(el, { yPercent: 0, rotation: 0, scaleY: 1, duration: 0.55, ease: "bounce.out" });
    };
    const hopWave = (letters, ox, oy) => {
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy);
        if (d > 380) continue;
        hop(el, Math.max(0.3, 1 - d / 380), d / 900);
      }
    };

    // ---- the reactions ----
    const bulbReaction = (lights, index, bulbs, cx, cy) => {
      sfx.chime(index);
      if (!claim(1400)) return;
      const halos = lights.querySelectorAll("[data-halo]");
      const glass = bulbs[index].querySelector("[data-glass]");
      ring(cx, cy, { size: 26, color: glass ? getComputedStyle(glass).fill : "#ffd27a", dur: 800, to: 3.2 });
      emitDust(cx, cy, { count: 5, burst: true });
      if (halos[index]) {
        gsap.timeline().to(halos[index], { scale: 2.2, transformOrigin: "50% 50%", duration: 0.14, ease: "power2.out" }).to(halos[index], { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      }
      // wobble spreads along the string, getting weaker with distance
      bulbs.forEach((bulb, j) => {
        const d = Math.abs(j - index);
        if (d > 6) return;
        const amp = 1 / (1 + d * 0.45);
        gsap
          .timeline({ delay: d * 0.07 })
          .to(bulb, { rotation: (j % 2 ? 1 : -1) * 16 * amp, transformOrigin: "50% 0%", duration: 0.12, ease: "power1.out" })
          .to(bulb, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.3)" });
      });
    };

    const windowReaction = (map, i) => {
      sfx.chime(2 + i * 3);
      if (!claim(1100)) return;
      const [x0, y0, x1, y1] = WINDOWS[i];
      const c = map.toScreen((x0 + x1) / 2, (y0 + y1) / 2);
      ring(c.x, c.y, { size: 30, color: "#ffd27a", dur: 800, to: 3.4 });
      emitDust(c.x, c.y, { count: 8, burst: true });
      const halo = q.scene?.querySelectorAll("[data-halo]")[i];
      if (halo) gsap.timeline().to(halo, { scale: 1.9, transformOrigin: "50% 50%", duration: 0.15, ease: "power2.out" }).to(halo, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.45)" });
    };

    const doorReaction = (map) => {
      sfx.door();
      if (!claim(1500)) return;
      const a = map.toScreen(DOOR[0], DOOR[1]);
      const b = map.toScreen(DOOR[2], DOOR[3]);
      const el = makeEl(
        `left:${a.x}px;top:${a.y}px;width:${b.x - a.x}px;height:${b.y - a.y}px;border-radius:999px 999px 0 0;` +
          "transform-origin:0% 50%;background:linear-gradient(to right,rgba(255,226,160,0.98),rgba(255,210,122,0.6) 55%,rgba(255,210,122,0));"
      );
      run(el, [{ transform: "scaleX(0.05)", opacity: 0 }, { transform: "scaleX(1)", opacity: 1, offset: 0.25 }, { transform: "scaleX(1)", opacity: 0.9, offset: 0.7 }, { transform: "scaleX(0.4)", opacity: 0 }], { duration: 1300, easing: "ease-out" });
      emitDust((a.x + b.x) / 2, b.y - 6, { count: 5, burst: true });
    };

    const chimneyReaction = (map) => {
      sfx.pop();
      if (!claim(1000)) return;
      const c = map.toScreen(542, 224);
      ring(c.x, c.y, { size: 20, color: "color-mix(in srgb, var(--c-snow) 80%, transparent)", border: 3, dur: 1000, to: 3.4, rise: 40 });
      emitDust(c.x, c.y, { count: 10, burst: true });
    };

    const pineReaction = (foreMap, pine) => {
      sfx.thump();
      if (!claim(1200)) return;
      const fore = q.scene?.querySelector('[data-layer="fore"]');
      if (fore) gsap.fromTo(fore, { skewX: -2.4 }, { skewX: 0, duration: 1.1, ease: "elastic.out(1, 0.25)", transformOrigin: "50% 100%", overwrite: "auto" });
      const top = PINE_BASE - pine.h;
      const p1 = foreMap.toScreen(pine.x, top + pine.h * 0.35);
      emitDust(p1.x, p1.y, { count: 9, burst: true });
      later(() => {
        const p2 = foreMap.toScreen(pine.x + rnd(-8, 8), top + pine.h * 0.55);
        emitDust(p2.x, p2.y, { count: 6, burst: true });
      }, 190);
    };

    const wishReaction = (x, y) => {
      sfx.wish();
      if (!claim(1100)) return;
      const len = 64;
      const el = makeEl(
        `width:${len}px;height:3px;border-radius:3px;transform-origin:100% 50%;` +
          "background:linear-gradient(to left,#fff8e6,rgba(255,210,122,0.6) 40%,rgba(255,210,122,0));box-shadow:0 0 8px 1px rgba(255,210,122,0.8);"
      );
      const dx = 112;
      const dy = 60;
      const at = (hx, hy) => `translate(${hx - len}px, ${hy - 1.5}px) rotate(28deg)`;
      run(el, [{ transform: at(x, y), opacity: 0 }, { transform: at(x + dx * 0.15, y + dy * 0.15), opacity: 1, offset: 0.12 }, { transform: at(x + dx * 0.8, y + dy * 0.8), opacity: 1, offset: 0.75 }, { transform: at(x + dx, y + dy), opacity: 0 }], { duration: 900, easing: "cubic-bezier(0.4,0,0.9,0.6)" });
      [0.2, 0.4, 0.6, 0.8].forEach((k) => later(() => emitDust(x + dx * k, y + dy * k, { count: 2 }), 900 * k));
      later(() => emitDust(x + dx, y + dy, { count: 10, burst: true }), 880);
    };

    // ---- find what was tapped ----
    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const now = performance.now();
      if (now - lastTap < MIN_GAP) return;
      if (document.documentElement.hasAttribute("data-scroll-locked")) return; // a sheet is open
      const target = e.target;
      if (target instanceof Element && target.closest(UI)) return;
      const scene = q.scene;
      const lights = q.lights;
      const hero = q.hero;
      if (!scene || !lights || !hero || introPlaying()) return;
      lastTap = now;

      const x = e.clientX;
      const y = e.clientY;

      // 1. fairy-light bulbs
      const bulbs = [...lights.querySelectorAll("[data-bulb]")];
      let best = -1;
      let bestD = 26;
      bulbs.forEach((b, i) => {
        const g = b.querySelector("[data-glass]")?.getBoundingClientRect();
        if (!g) return;
        const d = Math.hypot(g.left + g.width / 2 - x, g.top + g.height / 2 - y);
        if (d < bestD) {
          best = i;
          bestD = d;
        }
      });
      if (best >= 0) {
        const g = bulbs[best].querySelector("[data-glass]").getBoundingClientRect();
        bulbReaction(lights, best, bulbs, g.left + g.width / 2, g.top + g.height / 2);
        return;
      }

      // 2. title letters
      const letters = [...hero.querySelectorAll("[data-letter]")];
      const hitLetter = letters.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
      });
      if (hitLetter >= 0) {
        sfx.hop(hitLetter);
        if (claim(900)) hopWave(letters, x, y);
        return;
      }

      // 2b. Santa's sleigh, while he is flying (useSanta.js reacts to this event)
      const santa = document.querySelector('[data-santa-fly][data-flying="1"]');
      if (santa) {
        const r = santa.getBoundingClientRect();
        if (x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 10) {
          window.dispatchEvent(new CustomEvent("ss:santa", { detail: { x, y } }));
          return;
        }
      }

      // 3. the village
      const cottage = layerMap(scene.querySelector('[data-layer="cottage"]'));
      const fore = layerMap(scene.querySelector('[data-layer="fore"]'));
      if (cottage) {
        const p = cottage.toSvg(x, y);
        const pad = 10 / cottage.s;
        const w = WINDOWS.findIndex((box) => inBox(p, box, pad));
        if (w >= 0) return windowReaction(cottage, w);
        if (inBox(p, DOOR, pad * 0.6)) return doorReaction(cottage);
        if (inBox(p, CHIMNEY, pad * 0.6)) return chimneyReaction(cottage);
      }
      if (fore) {
        const pine = pineAt(fore.toSvg(x, y), 6 / fore.s);
        if (pine) return pineReaction(fore, pine);
      }

      // 4. sky or ground
      const skyLimit = cottage ? cottage.toScreen(0, SKY_LIMIT_Y).y : window.innerHeight * 0.5;
      if (y < skyLimit) return wishReaction(x, y);
      sfx.tick();
      if (claim(500)) emitDust(x, y, { count: 5, burst: true });
    };

    // Desktop: letters near the cursor hop as it passes over the title (no sound, it would be too much)
    const onMove = (e) => {
      if (reduced || e.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastMove < 40) return;
      lastMove = now;
      const hero = q.hero;
      const title = hero?.querySelector("[data-hero-title]");
      if (!title || title.hasAttribute("data-filling")) return;
      const tr = title.getBoundingClientRect();
      if (e.clientX < tr.left - 20 || e.clientX > tr.right + 20 || e.clientY < tr.top - 20 || e.clientY > tr.bottom + 20) return;
      for (const el of hero.querySelectorAll("[data-letter]")) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
        if (d < 70) hop(el, Math.max(0.35, 1 - d / 90));
      }
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    if (canHover) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      timers.forEach(clearTimeout);
      timers.clear();
      layer.remove();
    };
  }, []);
}
