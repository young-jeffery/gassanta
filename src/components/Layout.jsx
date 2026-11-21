import { Outlet, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { isLite } from "../lib/lite";
import { useLite } from "../lib/useLite";
import { sfx } from "../audio/sfx";
import { useGlobalSfx } from "../audio/useGlobalSfx";
import SnowCanvas from "./SnowCanvas";
import DustTrail from "./DustTrail";
import CursorFlake from "./CursorFlake";
import PerfHud from "./PerfHud";
import ChristmasDoodles from "./ChristmasDoodles";
import Dock from "./Dock";
import Blizzard from "./Blizzard";
import FrostWipe from "./FrostWipe";
import { consumeArrival } from "../lib/blizzard";
import { playFrost } from "../lib/frost";

// Moving among these pages must feel seamless (no transition at all): the join-code, sign-up, log-in and reset flows
const AUTH_PAGES = new Set(["/register", "/join", "/login", "/forgot"]);
const LITE_FADE_MS = 250;

// Shell around every page: soft glow background, snow, page-enter animation, dust trail, and the dock.
//
// Lite mode (lib/lite.js) removes everything that animates: snow, dust trail, custom cursor, blizzard and frost overlays.
// Page changes get a plain quarter-second fade instead. Sounds (useGlobalSfx + the page-change sound below) work in both.
//
// Stacking order (low to high):
//   z-0   glow background, Christmas doodle pattern (non-landing pages)
//   z-1   landing scene (portaled to <body> by Scene.jsx)
//   z-5   snow  <- wrapper below; it sits above the scene but below the page content (z-12 during a blizzard, see index.css)
//   z-10  page content
//   z-90  pointer dust trail
//   z-95  desktop hover cursor (rotating snowflake)
//   z-96  frost overlay (the ordinary page transition, lib/frost.js; hidden except while it plays)
//   z-97  blizzard whiteout (page transition from the landing page; hidden except while it plays)
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
  const { lite } = useLite();
  const mainRef = useRef(null);
  const prevPath = useRef(pathname);
  const lastDoor = useRef(0);
  const onLanding = pathname === "/";

  useGlobalSfx();

  // On every route change (the first load is skipped: the path hasn't changed yet):
  //   - a soft "door" sound (not after the landing page's blizzard, which has its own sounds; once only if redirects
  //     chain several changes together)
  //   - the page transition. None after the blizzard, and none between the AUTH_PAGES. Leaving the landing page
  //     normally means the blizzard played; the rare other way out gets no transition. Everything else: the freeze-and-
  //     melt frost (lib/frost.js), or in lite mode a plain fade. Reduced motion: nothing.
  // A layout effect, so the frost is on screen before the browser paints the new page. It is deliberately NOT inside
  // useGSAP: that would revert the frost timeline when the next route change re-runs the effect.
  useLayoutEffect(() => {
    const from = prevPath.current;
    if (from === pathname) return;
    prevPath.current = pathname;

    const arrival = consumeArrival();
    const now = performance.now();
    if (!arrival && now - lastDoor.current > 400) {
      lastDoor.current = now;
      sfx.door();
    }
    if (arrival || prefersReducedMotion()) return;
    if (AUTH_PAGES.has(from) && AUTH_PAGES.has(pathname)) return;
    if (isLite()) {
      mainRef.current?.animate({ opacity: [0, 1] }, { duration: LITE_FADE_MS, easing: "ease-out" });
      return;
    }
    if (from === "/") return;
    playFrost();
  }, [pathname]);

  return (
    // overflow-clip (not overflow-hidden): anything that sticks out is clipped and can't create a scrollbar.
    <div className="relative min-h-svh overflow-clip">
      {/* Soft colored glows behind everything; they follow the active palette.
          Skipped on the landing page: its opaque sky covers them, and every full-screen layer costs GPU memory.
          On desktop (mouse + classic scrollbars) index.css hides this element and paints the same glow on <html>
          instead, because the reserved scrollbar gutter on the right is outside the page and only the html
          background can reach it. */}
      {!onLanding && (
        <div
          aria-hidden="true"
          className="page-glow pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(70% 45% at 50% -5%, color-mix(in srgb, var(--c-accent) 22%, transparent), transparent 70%)," +
              "radial-gradient(60% 40% at 100% 100%, color-mix(in srgb, var(--c-primary) 30%, transparent), transparent 70%)",
          }}
        />
      )}

      {/* Christmas doodle pattern behind every page except the landing page (which has its own scene). Static. */}
      {!onLanding && <ChristmasDoodles />}

      {/* The wrapper creates the z-5 layer; the canvas inside stays fixed and full-screen. No snow at all in lite mode. */}
      {!lite && (
        <div className="snow-layer relative z-5">
          <SnowCanvas />
        </div>
      )}

      {/* px-page = 1.25rem, or the notch inset if larger (matters in landscape) */}
      <main ref={mainRef} className="pt-safe pb-safe px-page relative z-10 mx-auto flex min-h-svh w-full flex-col md:w-4/5 md:px-0">
        <Outlet />
      </main>

      {!lite && <DustTrail />}
      {!lite && <Blizzard />}
      {!lite && <FrostWipe />}
      {!lite && <CursorFlake />}
      <PerfHud />
      <Dock />
    </div>
  );
}
