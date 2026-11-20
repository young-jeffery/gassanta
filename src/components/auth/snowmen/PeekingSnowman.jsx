import { useRef } from "react";
import { gsap, useGSAP } from "../../../lib/gsap";
import { prefersReducedMotion } from "../../../lib/motion";
import { isLite } from "../../../lib/lite";
import { sfx } from "../../../audio/sfx";
import { Head, Scarf } from "./Snowman";
import { useSnowmanGaze } from "./useSnowmanGaze";

// Phone version: one snowman whose head and scarf peek over the top edge of the form card (the wrapper is clipped,
// and its bottom edge sits exactly on the card's top edge). It ducks out of sight while a password is visible.
// Hidden entirely on desktop (md:) and on phones in landscape (short:), where there is no room for it.
export default function PeekingSnowman({ store, hidden, speech, onPoke }) {
  const rootRef = useRef(null);
  useSnowmanGaze(store, rootRef);

  const speechId = speech?.id;
  const speechLength = speech?.text.length ?? 0;

  // Slide up on arrival, duck down when hidden. data-peek has no transform attribute of its own (GSAP owns it).
  const { contextSafe } = useGSAP(
    () => {
      const peek = rootRef.current.querySelector("[data-peek]");
      const reduced = prefersReducedMotion();
      gsap.to(peek, { y: hidden ? 130 : 0, duration: reduced ? 0 : 0.45, ease: hidden ? "power2.in" : "back.out(1.7)" });
    },
    { scope: rootRef, dependencies: [hidden] }
  );

  useGSAP(
    () => {
      if (prefersReducedMotion() || document.documentElement.dataset.perf === "0" || isLite()) return;
      const snow = rootRef.current.querySelector("[data-snow]");
      gsap.fromTo(snow.querySelector("[data-tail]"), { rotation: -5 }, { rotation: 7, transformOrigin: "50% 0%", duration: 1.7, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.timeline({ repeat: -1, repeatDelay: 3 }).to(snow.querySelectorAll("[data-eye]"), { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1 });
    },
    { scope: rootRef }
  );

  useGSAP(
    () => {
      if (speechId === undefined || prefersReducedMotion()) return;
      const mouth = rootRef.current.querySelector("[data-mouth]");
      gsap.fromTo(mouth, { scaleY: 1 }, { scaleY: 0.3, duration: 0.11, yoyo: true, repeat: Math.min(30, Math.round(speechLength / 3) * 2 + 1), ease: "none", transformOrigin: "50% 50%" });
    },
    { scope: rootRef, dependencies: [speechId, speechLength] }
  );

  const poke = contextSafe((event) => {
    if (hidden) return;
    const peek = event.currentTarget.querySelector("[data-peek]");
    if (!prefersReducedMotion() && peek) {
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(peek, { y: 14, duration: 0.1 })
        .to(peek, { y: -6, duration: 0.15, ease: "power2.out" })
        .to(peek, { y: 0, duration: 0.5, ease: "bounce.out" });
    }
    sfx.pop();
    onPoke();
  });

  return (
    <div ref={rootRef} className="absolute bottom-0 left-3 h-24 w-28 overflow-hidden" onPointerDown={poke}>
      <svg viewBox="0 0 120 96" className="h-full w-full" aria-hidden="true" focusable="false">
        <g transform="translate(60 54)">
          <g data-snow>
            <g data-peek>
              <g transform="translate(0 34)">
                <Scarf color="color-mix(in oklab, var(--c-primary) 55%, #ff5a4d)" />
              </g>
              <g data-head>
                <Head hat="beanie" color="color-mix(in oklab, var(--c-primary) 55%, #ff5a4d)" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
