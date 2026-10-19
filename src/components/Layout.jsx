import { Outlet, useLocation } from "react-router-dom";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import SnowCanvas from "./SnowCanvas";
import DustTrail from "./DustTrail";
import PerfHud from "./PerfHud";
import Dock from "./Dock";

// Shell around every page: soft glow background, snow, page-enter animation, dust trail, and the dock.
//
// Stacking order (low to high):
//   z-0   glow background
//   z-1   landing scene (portaled to <body> by Scene.jsx)
//   z-5   snow  <- wrapper below; it sits above the scene but below the page content
//   z-10  page content
//   z-90  pointer dust trail
//   z-100 fps meter (only with ?fps in the URL)
//
// Width rule: on phones content is full width; from md up it takes 80% of the viewport (w-4/5).
// Pages decide their own alignment inside it (we left-align on desktop instead of centering everything).
//
// Heights use svh (the SMALLEST the viewport gets when browser bars are showing), never dvh/vh. A page
// taller than the visible area becomes scrollable, and mobile browsers then jump/scroll it by themselves
// when their bars show or hide. With svh the page can never be taller than the visible area.
export default function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // Fade/slide each page in when the route changes
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(mainRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    },
    { dependencies: [pathname] }
  );

  return (
    // overflow-clip (not overflow-hidden): anything that sticks out, like the 18px slide-in above, is
    // clipped and can't create a scrollbar mid-animation.
    <div className="relative min-h-svh overflow-clip">
      {/* Soft colored glows behind everything; they follow the active palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(70% 45% at 50% -5%, color-mix(in srgb, var(--c-accent) 22%, transparent), transparent 70%)," +
            "radial-gradient(60% 40% at 100% 100%, color-mix(in srgb, var(--c-primary) 30%, transparent), transparent 70%)",
        }}
      />

      {/* The wrapper creates the z-5 layer; the canvas inside stays fixed and full-screen */}
      <div className="relative z-5">
        <SnowCanvas />
      </div>

      {/* px-page = 1.25rem, or the notch inset if larger (matters in landscape) */}
      <main ref={mainRef} className="pt-safe pb-safe px-page relative z-10 mx-auto flex min-h-svh w-full flex-col md:w-4/5 md:px-0">
        <Outlet />
      </main>

      <DustTrail />
      <PerfHud />
      <Dock />
    </div>
  );
}
