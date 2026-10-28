import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";
import { markBusy } from "./perf";
import { setStorm } from "./storm";
import { sfx } from "../audio/sfx";

// The landing page's exit: a blizzard transition played when either "Enter" button is pressed (~3.4s).
//   0.0s   storm builds fast (SnowCanvas reads lib/storm.js), wind sound fades in, buttons lock (the overlay blocks
//          input). The snow layer rises above the page text (html[data-storm]) so flakes rush across the title too
//   0.1s   title, tagline and buttons are ripped off to the right
//   0.95s  whiteout sweeps in from the left at an angle (the Blizzard.jsx overlay), with a whoosh
//   1.9s   fully covered: navigate to the next page underneath (Layout skips its own fade)
//   2.1s   the whiteout melts away, the storm calms, the wind fades out
// Reduced motion: no transition, navigates straight away. The overlay element is registered by Blizzard.jsx.
let overlay = null; // { root, sweep, mists }
let running = false;
let arrived = false;

export function registerBlizzard(refs) {
  overlay = refs;
}

// True once after a blizzard navigation, so Layout can skip the page's normal fade-in
export function consumeArrival() {
  const was = arrived;
  arrived = false;
  return was;
}

// Returns false (and does nothing) if a transition is already running
export function playBlizzard(navigateFn) {
  if (running) return false;
  if (prefersReducedMotion() || !overlay) {
    navigateFn();
    return true;
  }
  running = true;
  markBusy(4000); // the performance monitor ignores this stretch, so a storm can never cause a quality downgrade

  const { root, sweep, mists } = overlay;
  const storm = { v: 0 };
  const rnd = gsap.utils.random;
  const letters = gsap.utils.toArray("[data-hero] [data-letter]");
  const others = gsap.utils.toArray("[data-hero-eyebrow], [data-hero-tagline], [data-hero-cta]");
  const feed = () => setStorm(storm.v);
  const html = document.documentElement;
  html.setAttribute("data-storm", "");

  gsap.set(root, { display: "block" });
  gsap.set(sweep, { xPercent: -100, skewX: -16, opacity: 1 });
  gsap.set(mists, { x: "-70vw", y: "-6vh", opacity: 0 });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(root, { display: "none" });
      setStorm(0);
      html.removeAttribute("data-storm");
      running = false;
    },
  });

  tl.add(() => {
    sfx.windStart();
    sfx.windLevel(1, 0.9);
  }, 0)
    .to(storm, { v: 1, duration: 0.55, ease: "power2.in", onUpdate: feed }, 0)
    // the wind rips the text away
    .to(letters, { x: () => rnd(400, 900), y: () => rnd(20, 120), rotation: () => rnd(20, 70), autoAlpha: 0, duration: 0.55, stagger: 0.022, ease: "power3.in" }, 0.1)
    .to(others, { x: 700, y: 40, autoAlpha: 0, duration: 0.5, stagger: 0.04, ease: "power3.in" }, 0.15)
    // whiteout, after the storm has had time to rage
    .add(() => sfx.whoosh(), 0.95)
    .to(sweep, { xPercent: 0, duration: 0.95, ease: "power2.in" }, 0.95)
    .to(mists, { x: "22vw", y: "6vh", opacity: 0.95, duration: 1, stagger: 0.08, ease: "power1.in" }, 0.9)
    // covered: swap the page underneath
    .add(() => {
      arrived = true;
      navigateFn();
    }, 1.9)
    // melt away
    .to(storm, { v: 0, duration: 1.5, ease: "power2.out", onUpdate: feed }, 2.1)
    .add(() => sfx.windLevel(0, 1.3), 2.1)
    .to(sweep, { opacity: 0, duration: 1.1, ease: "power2.inOut" }, 2.05)
    .to(mists, { y: "-12vh", opacity: 0, duration: 1.2, stagger: 0.06, ease: "power1.out" }, 2.05)
    .add(() => sfx.windStop(0.5), 3.3);

  return true;
}
