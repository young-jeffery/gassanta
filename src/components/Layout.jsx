import { Outlet, useLocation } from "react-router-dom";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import SnowCanvas from "./SnowCanvas";
import Dock from "./Dock";

// Shell around every page: soft glow background, snow, page-enter animation, and the dock.
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
    <div className="relative min-h-dvh overflow-x-hidden">
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
      <SnowCanvas />

      <main ref={mainRef} className="pt-safe pb-safe relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5">
        <Outlet />
      </main>

      <Dock />
    </div>
  );
}
