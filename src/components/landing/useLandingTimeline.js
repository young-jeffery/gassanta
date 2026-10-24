import { useLayoutEffect } from "react";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { getTier } from "../../lib/perf";

// Landing page animation: the entrance timeline plus the idle loops that keep it alive afterwards.
// It finds its pieces by data-* attributes inside three roots: [data-scene], [data-lights], [data-hero]
// (the scene and lights are portaled into <body>, so we can't use a React ref scope for them).
//
// Every animation runs on every device. The performance tier (lib/perf.js) only changes HOW MANY stars twinkle.
// Reduced motion: nothing runs, the page just shows its final state.
// Tapping anywhere during the entrance fast-forwards it. Replays are always the full-length version.

const rnd = gsap.utils.random;

// ---- Title "fill": each letter starts as an empty outline, then ink rises inside it like liquid. ----
// Done with a gradient clipped to the text. The gradient's soft edge sits in the 46%-54% band, which is
// exactly the part that stays off-screen at both ends of the animation (background-size is 220%).
// The outline stroke itself lives in CSS (.hero-title) and never changes, so the weight stays constant.
const FILL_GRADIENT = "linear-gradient(to bottom, transparent 46%, var(--c-ink) 54%)";
const FILL_PROPS = [
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "-webkit-background-clip",
  "background-clip",
  "-webkit-text-fill-color",
];

function applyOutline(letters) {
  for (const el of letters) {
    const s = el.style;
    s.setProperty("background-image", FILL_GRADIENT);
    s.setProperty("background-size", "100% 220%");
    s.setProperty("background-position", "0% 0%");
    s.setProperty("background-repeat", "no-repeat");
    s.setProperty("-webkit-background-clip", "text");
    s.setProperty("background-clip", "text");
    s.setProperty("-webkit-text-fill-color", "transparent");
  }
}

function clearOutline(letters) {
  for (const el of letters) for (const p of FILL_PROPS) el.style.removeProperty(p);
}

// One letter: falls (stretched), squashes on impact, rebounds, lands again, wobbles to rest.
// The fill rises while it bounces.
function letterTimeline(el) {
  return gsap
    .timeline()
    .fromTo(
      el,
      { yPercent: -260, scaleX: 0.85, scaleY: 1.3, rotation: rnd(-12, 12), transformOrigin: "50% 100%" },
      { yPercent: 0, scaleX: 0.9, scaleY: 1.12, rotation: 0, duration: 0.42, ease: "power2.in" },
      0
    )
    .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0)
    .to(el, { scaleY: 0.72, scaleX: 1.22, duration: 0.08, ease: "power2.out" })
    .to(el, { yPercent: -26, scaleY: 1.1, scaleX: 0.92, duration: 0.18, ease: "power2.out" })
    .to(el, { yPercent: 0, scaleY: 0.88, scaleX: 1.1, duration: 0.16, ease: "power2.in" })
    .to(el, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" })
    .fromTo(el, { backgroundPosition: "0% 0%" }, { backgroundPosition: "0% 100%", duration: 0.9, ease: "sine.inOut" }, 0.25);
}

// Returns { cleanup, timeline } (timeline is returned for testing). Safe to call twice (React StrictMode).
export function startLandingAnimation() {
  const scene = document.querySelector("[data-scene]");
  const lights = document.querySelector("[data-lights]");
  const hero = document.querySelector("[data-hero]");
  if (!scene || !lights || !hero) return null;

  const all = (root, sel) => gsap.utils.toArray(sel, root);

  // Pieces
  const sky = scene.querySelector("[data-sky]");
  const starsSvg = scene.querySelector("[data-stars]");
  const startDay = document.documentElement.dataset.mode === "day";
  const celestial = scene.querySelector(startDay ? "[data-sun]" : "[data-moon]"); // the one that rises with the scene
  const otherCelestial = scene.querySelector(startDay ? "[data-moon]" : "[data-sun]");
  const clouds = scene.querySelector("[data-clouds]");
  const shot = scene.querySelector("[data-shooting]");
  const layers = all(scene, "[data-layer]");
  const stars = all(scene, "[data-star]");
  const windows = all(scene, "[data-window]");
  const winHalos = all(scene, "[data-halo]");
  const spill = all(scene, "[data-spill]");
  const puffs = all(scene, "[data-smoke]");
  const wires = all(lights, "[data-wire]");
  const hooks = all(lights, "[data-hook]");
  const bulbs = all(lights, "[data-bulb]");
  const glass = all(lights, "[data-glass]");
  const bulbHalos = all(lights, "[data-halo]");
  const eyebrow = hero.querySelector("[data-hero-eyebrow]");
  const title = hero.querySelector("[data-hero-title]");
  const letters = all(hero, "[data-letter]");
  const tagline = hero.querySelector("[data-hero-tagline]");
  const ctas = all(hero, "[data-hero-cta]");

  let cancelled = false;
  let shotTimer = 0;
  let fontTimer = 0;
  const idle = []; // GSAP loops started after the entrance
  const smoke = []; // smoke loops
  const shotAnims = []; // Web Animations (shooting star)

  // ---- Idle loops ----
  const startStars = () => {
    const n = getTier() >= 2 ? 14 : getTier() === 1 ? 11 : 8; // density only
    gsap.utils.shuffle([...stars]).slice(0, n).forEach((el) => {
      idle.push(
        gsap.to(el, {
          opacity: rnd(0.08, 0.3),
          duration: rnd(1.4, 3.6),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: rnd(0, 3),
        })
      );
    });
  };

  const startSmoke = () => {
    puffs.forEach((p, i) => {
      smoke.push(
        gsap
          .timeline({ repeat: -1, delay: i * 0.9 })
          .fromTo(p, { y: 0, scale: 0.6, opacity: 0 }, { y: -36, scale: 1.5, opacity: 0.34, duration: 1.2, ease: "power1.out" })
          .to(p, { y: -60, scale: 2, opacity: 0, duration: 1.2, ease: "power1.in" })
      );
    });
  };

  // Two groups of halos breathe in turn (the lights are their own small layer, so this repaint is tiny)
  const startBulbs = () => {
    const even = bulbHalos.filter((_, i) => i % 2 === 0);
    const odd = bulbHalos.filter((_, i) => i % 2 === 1);
    idle.push(gsap.to(even, { opacity: 0.3, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    idle.push(gsap.to(odd, { opacity: 0.85, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.2 }));
  };

  const startFlicker = () => {
    windows.forEach((w, i) => {
      idle.push(
        gsap
          .timeline({ repeat: -1, repeatDelay: 1.7 + i * 0.6 })
          .to(w, { opacity: 0.84, duration: 0.07 })
          .to(winHalos[i], { opacity: 0.4, duration: 0.07 }, "<")
          .to(w, { opacity: 1, duration: 0.12 })
          .to(winHalos[i], { opacity: 0.55, duration: 0.12 }, "<")
      );
    });
  };

  // Shooting star: a Web Animation on its own root element, so it runs on the compositor and stays
  // smooth even when JavaScript is busy. Rarer on weaker tiers.
  const startShooting = () => {
    if (!shot || !shot.animate) return;
    const fire = () => {
      if (cancelled) return;
      if (document.documentElement.dataset.mode === "day") {
        schedule(); // no shooting stars in daylight; check again later
        return;
      }
      const x0 = rnd(0.5, 0.92) * window.innerWidth;
      const y0 = rnd(0.04, 0.2) * window.innerHeight;
      const move = (dx, dy) => `translate(${Math.round(x0 - dx)}px, ${Math.round(y0 + dy)}px)`;
      shotAnims.push(
        shot.animate(
          [
            { transform: move(0, 0), opacity: 0 },
            { transform: move(60, 22), opacity: 1, offset: 0.12 },
            { transform: move(300, 112), opacity: 0.9, offset: 0.7 },
            { transform: move(340, 128), opacity: 0 },
          ],
          { duration: 900, easing: "cubic-bezier(0.45, 0, 1, 1)" }
        )
      );
      if (shotAnims.length > 3) shotAnims.shift();
      schedule();
    };
    const schedule = () => {
      const [min, max] = getTier() >= 2 ? [8, 15] : [14, 24];
      shotTimer = setTimeout(fire, rnd(min, max) * 1000);
    };
    schedule();
  };

  const startIdle = () => {
    startBulbs();
    startFlicker();
    startShooting();
  };

  // ---- Initial (hidden) states. Set before the first paint, so nothing flashes. ----
  const ctx = gsap.context(() => {
    gsap.set(sky, { autoAlpha: 0 });
    gsap.set(layers, { y: 50, autoAlpha: 0 });
    gsap.set(starsSvg, { autoAlpha: 0 });
    gsap.set(celestial, { autoAlpha: 0, scale: 0.6 });
    gsap.set(otherCelestial, { autoAlpha: 0 });
    gsap.set(clouds, { autoAlpha: 0 });
    gsap.set(wires, { autoAlpha: 0, strokeDasharray: "1 1", strokeDashoffset: 1 });
    gsap.set(hooks, { scale: 0 });
    gsap.set(bulbs, { scale: 0, transformOrigin: "50% 0%" });
    gsap.set(glass, { opacity: 0.3 });
    gsap.set(bulbHalos, { opacity: 0 });
    gsap.set(windows, { opacity: 0.12 });
    gsap.set(winHalos, { opacity: 0 });
    gsap.set(spill, { opacity: 0 });
    gsap.set(puffs, { opacity: 0 });
    gsap.set(eyebrow, { autoAlpha: 0, y: 14 });
    gsap.set(tagline, { autoAlpha: 0, y: 10 });
    gsap.set(ctas, { autoAlpha: 0, scale: 0.8, y: 10 });
    gsap.set(letters, { autoAlpha: 0 });
    if (title) title.setAttribute("data-filling", "");
    applyOutline(letters);
  });

  // ---- Entrance timeline (built paused; starts once the title font is ready) ----
  let tl;
  const finish = () => {
    clearOutline(letters);
    if (title) title.removeAttribute("data-filling");
    window.removeEventListener("pointerdown", speedUp);
    startIdle();
  };
  const speedUp = () => {
    if (tl && tl.progress() < 1) gsap.to(tl, { timeScale: 4, duration: 0.25 });
  };

  ctx.add(() => {
    tl = gsap.timeline({ paused: true, onComplete: finish });

    // World
    tl.to(sky, { autoAlpha: 1, duration: 0.8, ease: "power1.out" }, 0)
      .to(layers, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.15, ease: "power3.out" }, 0.1)
      .to(starsSvg, { autoAlpha: 1, duration: 1 }, 0.5)
      .to(celestial, { autoAlpha: 1, scale: 1, duration: 1, ease: "power2.out" }, 0.4)
      .to(clouds, { autoAlpha: 1, duration: 1.4 }, 0.8)
      .call(startStars, null, 0.6);

    // Fairy lights: wire draws in, bulbs pop, then light up left to right in a wave
    tl.set(wires, { autoAlpha: 1 }, 0.7)
      .to(wires, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: "power2.inOut" }, 0.7)
      .to(hooks, { scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(2)" }, 0.75)
      .to(bulbs, { scale: 1, duration: 0.7, stagger: 0.05, ease: "elastic.out(1, 0.5)" }, 0.9)
      .to(glass, { opacity: 1, duration: 0.35, stagger: 0.06, ease: "power1.out" }, 1.0)
      .to(bulbHalos, { opacity: 0.6, duration: 0.45, stagger: 0.06, ease: "power1.out" }, 1.0);

    // Cottage comes alive
    tl.to(windows, { opacity: 1, duration: 0.5, stagger: 0.2, ease: "power1.out" }, 1.1)
      .to(winHalos, { opacity: 0.55, duration: 0.6, stagger: 0.2 }, 1.1)
      .to(spill, { opacity: 1, duration: 0.8 }, 1.2)
      .call(startSmoke, null, 1.1);

    // Text
    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.2);
    letters.forEach((el, i) => tl.add(letterTimeline(el), 1.3 + i * 0.07));
    tl.to(tagline, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 2.1).to(
      ctas,
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "back.out(2)" },
      2.4
    );
  });

  // Wait for the title font (max 1.5s) so the letters never appear in a fallback font
  const fontLoad = document.fonts ? document.fonts.load("1em Striper", "Secret Santa").catch(() => {}) : Promise.resolve();
  const timeout = new Promise((resolve) => {
    fontTimer = setTimeout(resolve, 1500);
  });
  Promise.race([fontLoad, timeout]).then(() => {
    if (!cancelled) tl.play();
  });

  window.addEventListener("pointerdown", speedUp, { passive: true });

  const cleanup = () => {
    cancelled = true;
    clearTimeout(fontTimer);
    clearTimeout(shotTimer);
    window.removeEventListener("pointerdown", speedUp);
    gsap.killTweensOf(tl);
    idle.forEach((t) => t.kill());
    smoke.forEach((t) => t.kill());
    shotAnims.forEach((a) => a.cancel());
    ctx.revert();
    clearOutline(letters);
    if (title) title.removeAttribute("data-filling");
  };

  return { cleanup, timeline: tl };
}

export function useLandingTimeline() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const anim = startLandingAnimation();
    return anim ? anim.cleanup : undefined;
  }, []);
}
