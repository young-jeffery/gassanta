import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { useMusic } from "../audio/useMusic";

const TITLE = "Secret Santa";
const TOKENS = [
  ["canvas", "bg-canvas"],
  ["surface", "bg-surface"],
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["ink", "bg-ink"],
  ["muted", "bg-muted"],
];

// Stage 1 placeholder. It exists to test the foundation on a phone: animation, snow, music, palettes.
// The real landing page is Stage 2.
export default function Home() {
  const rootRef = useRef(null);
  const { playing, play } = useMusic();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(".char", { y: 50, opacity: 0, rotate: () => gsap.utils.random(-14, 14), duration: 0.8, stagger: 0.05, ease: "back.out(2)" })
        .from(".fade-in", { y: 16, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }, "-=0.3");

      // Gentle idle bob on the gift emoji
      gsap.to(".gift", { y: -10, rotate: 4, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="gift text-6xl" aria-hidden="true">🎁</div>

      <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl" aria-label={TITLE}>
        {TITLE.split("").map((ch, i) => (
          <span key={i} className="char inline-block" aria-hidden="true">
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </h1>

      <p className="fade-in max-w-xs text-lg text-muted">Foundation test. Drag your finger across the screen to stir the snow.</p>

      <button
        onClick={play}
        className="fade-in rounded-full border border-accent/40 bg-primary px-8 py-4 font-display text-lg font-extrabold text-on-primary shadow-xl transition active:scale-95"
      >
        {playing ? "Music is on" : "Enter with music"}
      </button>

      <div className="fade-in w-full rounded-3xl border border-accent/30 bg-surface/80 p-5 backdrop-blur">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Palette tokens</p>
        <div className="grid grid-cols-3 gap-3">
          {TOKENS.map(([name, cls]) => (
            <div key={name} className="text-center">
              <div className={`${cls} h-12 rounded-xl ring-1 ring-ink/20`} />
              <span className="mt-1 block text-xs text-muted">{name}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Use the buttons at the bottom right to change colors or music.</p>
      </div>
    </div>
  );
}
