import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { isLite } from "../lib/lite";
import { useLite } from "../lib/useLite";
import { useMusic } from "../audio/useMusic";
import Sheet from "./Sheet";
import MusicPanel from "./MusicPanel";
import PalettePanel from "./PalettePanel";
import { MusicIcon, PaletteIcon } from "./Icons";

// A lightning bolt: "lite" = light and fast
function LiteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6L13.5 2Z" />
    </svg>
  );
}

// Floating buttons (bottom-right), top to bottom: lite-mode switch (static, no animations; see lib/lite.js), music, palette.
// Present on every page. Rendered through a portal straight into <body>, so no parent element's transform, overflow or
// layout can ever shift it. Position is set inline so it doesn't depend on any other class.
export default function Dock() {
  const [open, setOpen] = useState(null); // null | "music" | "palette"
  const { playing } = useMusic();
  const { lite, setLite } = useLite();
  const dockRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || isLite()) return;
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
  // A button that is "in use" (lite mode on, music playing) is filled with the primary colour instead of showing a dot.
  const btn = (active) =>
    `relative grid h-12 w-12 place-items-center rounded-full border shadow-lg transition-[scale,background-color,color] active:scale-90 ${
      active ? "border-accent bg-primary text-on-primary" : "border-accent/40 bg-surface/90 text-ink"
    }`;

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
          <button className={btn(lite)} onClick={() => setLite(!lite)} aria-pressed={lite} aria-label={lite ? "Lite mode is on. Switch to the full animated version" : "Switch to lite mode (static, no animations)"}>
            <LiteIcon />
          </button>
        </div>
        <div className="dock-btn">
          <button className={btn(playing)} onClick={() => setOpen("music")} aria-label={playing ? "Music (playing)" : "Music"}>
            <MusicIcon />
          </button>
        </div>
        <div className="dock-btn">
          <button className={btn(false)} onClick={() => setOpen("palette")} aria-label="Change colors">
            <PaletteIcon />
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
