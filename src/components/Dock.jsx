import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { useMusic } from "../audio/useMusic";
import Sheet from "./Sheet";
import MusicPanel from "./MusicPanel";
import PalettePanel from "./PalettePanel";
import { MusicIcon, PaletteIcon } from "./Icons";

// Floating buttons (bottom-right) that open the music and palette sheets. Present on every page.
// Rendered through a portal straight into <body>, so no parent element's transform, overflow or
// layout can ever shift it. Position is set inline so it doesn't depend on any other class.
export default function Dock() {
  const [open, setOpen] = useState(null); // null | "music" | "palette"
  const { playing } = useMusic();
  const dockRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // fromTo with explicit end values: never reads a half-finished state
      gsap.fromTo(
        ".dock-btn",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.6, ease: "back.out(2.2)" }
      );
    },
    { scope: dockRef }
  );

  // Escape closes the sheet (desktop)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // No backdrop-blur here: re-blurring the animated snow behind these buttons on every frame is costly on phones.
  const btn =
    "relative grid h-12 w-12 place-items-center rounded-full border border-accent/40 bg-surface/90 text-ink shadow-lg transition-[scale] active:scale-90";

  return createPortal(
    <>
      <div
        ref={dockRef}
        className="z-30 flex flex-col gap-3"
        style={{
          position: "fixed",
          right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        }}
      >
        <div className="dock-btn">
          <button className={btn} onClick={() => setOpen("palette")} aria-label="Change colors">
            <PaletteIcon />
          </button>
        </div>
        <div className="dock-btn">
          <button className={btn} onClick={() => setOpen("music")} aria-label="Music">
            <MusicIcon />
            {playing && <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-glow" />}
          </button>
        </div>
      </div>

      <Sheet open={open === "palette"} onClose={() => setOpen(null)} title="Pick your colors">
        <PalettePanel />
      </Sheet>
      <Sheet open={open === "music"} onClose={() => setOpen(null)} title="Christmas music">
        <MusicPanel />
      </Sheet>
    </>,
    document.body
  );
}
