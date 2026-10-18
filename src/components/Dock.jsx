import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { useMusic } from "../audio/useMusic";
import Sheet from "./Sheet";
import MusicPanel from "./MusicPanel";
import PalettePanel from "./PalettePanel";
import { MusicIcon, PaletteIcon } from "./Icons";

// Floating buttons (bottom-right) that open the music and palette sheets. Present on every page.
export default function Dock() {
  const [open, setOpen] = useState(null); // null | "music" | "palette"
  const { playing } = useMusic();
  const dockRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".dock-btn", { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.6, ease: "back.out(2.2)" });
    },
    { scope: dockRef }
  );

  // Escape closes the sheet (desktop)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const btn =
    "dock-btn relative grid h-12 w-12 place-items-center rounded-full border border-accent/40 bg-surface/80 text-ink shadow-lg backdrop-blur transition active:scale-90";

  return (
    <>
      <div
        ref={dockRef}
        className="fixed right-4 z-30 flex flex-col gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <button className={btn} onClick={() => setOpen("palette")} aria-label="Change colors">
          <PaletteIcon />
        </button>
        <button className={btn} onClick={() => setOpen("music")} aria-label="Music">
          <MusicIcon />
          {playing && <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-glow" />}
        </button>
      </div>

      <Sheet open={open === "palette"} onClose={() => setOpen(null)} title="Pick your colors">
        <PalettePanel />
      </Sheet>
      <Sheet open={open === "music"} onClose={() => setOpen(null)} title="Christmas music">
        <MusicPanel />
      </Sheet>
    </>
  );
}
