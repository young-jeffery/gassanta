import { gsap } from "./gsap";
import { markBusy } from "./perf";

// The ordinary page transition: "freeze and melt" (~0.7s). Layout calls playFrost() the moment the route changes,
// BEFORE the browser paints, so the new page is never seen un-frosted:
//   0.0s   the whole screen is frost (the overlay snaps on: this is the freeze). A glittery rim of ice fades out
//   0.05s  the frost starts to melt: six columns slide down off the screen one after another (random order, each at
//          its own speed), like drips running down a window, revealing the new page from the top
//   ~0.7s  done, the overlay is hidden again (display: none, so it costs nothing at rest)
// Not played: on first load, after the landing page's blizzard (lib/blizzard.js has its own), between the
// register / join / login / forgot pages (they must swap seamlessly), in lite mode (Layout does a plain fade instead)
// or with reduced motion. If a second route change arrives while this is playing (a redirect chain such as
// /login -> /dashboard -> /g/slug/dashboard), the one in progress simply carries on.
// The overlay's elements are registered by components/FrostWipe.jsx.
let overlay = null; // { root, cols, rim }
let timeline = null;

export function registerFrost(refs) {
  if (!refs && timeline) {
    timeline.kill();
    timeline = null;
  }
  overlay = refs;
}

// Returns true if a transition is playing (new or already running), false if there is nothing to play it on
export function playFrost() {
  if (!overlay) return false;
  if (timeline) return true;

  const { root, cols, rim } = overlay;
  markBusy(1500); // the performance monitor ignores this stretch, so a transition can never cause a quality downgrade
  gsap.set(root, { display: "block" });
  gsap.set(cols, { yPercent: 0 });
  gsap.set(rim, { opacity: 1 });

  timeline = gsap.timeline({
    onComplete: () => {
      gsap.set(root, { display: "none" });
      timeline = null;
    },
  });
  timeline
    .to(rim, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.04)
    .to(
      cols,
      { yPercent: 100, duration: () => gsap.utils.random(0.34, 0.46), ease: "power2.in", stagger: { amount: 0.14, from: "random" } },
      0.06
    );
  return true;
}
