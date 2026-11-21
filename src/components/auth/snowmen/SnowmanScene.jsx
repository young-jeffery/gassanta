import { useRef } from "react";
import { gsap, useGSAP } from "../../../lib/gsap";
import { prefersReducedMotion } from "../../../lib/motion";
import { isLite } from "../../../lib/lite";
import { emitDust } from "../../../lib/dustBus";
import { sfx } from "../../../audio/sfx";
import { Snowman } from "./Snowman";
import { useSnowmanGaze } from "./useSnowmanGaze";

// The desktop stage: three snowmen of different heights on a snow bank, drawn in one 640x600 SVG that scales to fit.
// Bubble anchors (percent of the stage) live in AuthShell (SPOTS), keep them in step with this array if you move one.
const SNOWMEN = [
  { x: 170, y: 548, s: 1.5, hat: "top", scarf: "color-mix(in oklab, var(--c-primary) 55%, #ff5a4d)" },
  { x: 360, y: 562, s: 1.2, hat: "beanie", scarf: "#ffd27a" },
  { x: 520, y: 576, s: 0.9, hat: "muffs", scarf: "color-mix(in oklab, var(--c-accent) 30%, #3fb8d8)" },
];

// The stage is always on the LEFT of the screen with the form on its right: the tallest snowman stands farthest from the
// form, the smallest closest to it, and everyone's nose points right, toward the form.
export default function SnowmanScene({ store, speech, cheer, onPoke }) {
  const rootRef = useRef(null);
  useSnowmanGaze(store, rootRef);

  const speechId = speech?.id;
  const speaker = speech?.who;
  const speechLength = speech?.text.length ?? 0;

  // Idle life: breathing, scarf sway, blinking, an occasional wave. Skipped on reduced motion and on the lowest
  // performance tier (index.css/perf.js set data-perf="0" on <html>).
  const { contextSafe } = useGSAP(
    () => {
      if (prefersReducedMotion() || document.documentElement.dataset.perf === "0" || isLite()) return;
      rootRef.current.querySelectorAll("[data-snow]").forEach((snow, i) => {
        gsap.to(snow.querySelector("[data-breathe]"), {
          scaleY: 1.018, transformOrigin: "50% 100%", duration: 2.4 + i * 0.45, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.6,
        });
        gsap.fromTo(snow.querySelector("[data-tail]"), { rotation: -5 }, {
          rotation: 7, transformOrigin: "50% 0%", duration: 1.6 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut",
        });
        gsap.timeline({ repeat: -1, repeatDelay: 2.4 + i * 0.9 }).to(snow.querySelectorAll("[data-eye]"), {
          scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut",
        });
        gsap.timeline({ repeat: -1, repeatDelay: 6 + i * 2.5, delay: 3 + i * 2 }).to(snow.querySelector("[data-arm-r]"), {
          rotation: -24, transformOrigin: "0% 100%", duration: 0.26, yoyo: true, repeat: 5, ease: "sine.inOut",
        });
      });
    },
    { scope: rootRef }
  );

  // Whoever is speaking moves their mouth for a while
  useGSAP(
    () => {
      if (speechId === undefined || prefersReducedMotion()) return;
      const mouth = rootRef.current.querySelectorAll("[data-snow]")[speaker]?.querySelector("[data-mouth]");
      if (!mouth) return;
      gsap.fromTo(mouth, { scaleY: 1 }, { scaleY: 0.3, duration: 0.11, yoyo: true, repeat: Math.min(30, Math.round(speechLength / 3) * 2 + 1), ease: "none", transformOrigin: "50% 50%" });
    },
    { scope: rootRef, dependencies: [speechId, speaker, speechLength] }
  );

  // Success: everyone jumps, one after another
  useGSAP(
    () => {
      if (!cheer || prefersReducedMotion()) return;
      const squash = rootRef.current.querySelectorAll("[data-squash]");
      gsap.timeline()
        .to(squash, { scaleY: 0.9, scaleX: 1.06, transformOrigin: "50% 100%", duration: 0.1, stagger: 0.08 })
        .to(squash, { y: -26, scaleY: 1.05, scaleX: 0.97, duration: 0.2, ease: "power2.out", stagger: 0.08 }, "<0.05")
        .to(squash, { y: 0, scaleY: 1, scaleX: 1, duration: 0.8, ease: "bounce.out", stagger: 0.08 }, ">-0.05");
    },
    { scope: rootRef, dependencies: [cheer] }
  );

  const poke = contextSafe((index, event) => {
    const squash = event.currentTarget.querySelector("[data-squash]"); // the snowman that was clicked
    if (!prefersReducedMotion() && squash) {
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(squash, { scaleY: 0.88, scaleX: 1.08, transformOrigin: "50% 100%", duration: 0.08 })
        .to(squash, { y: -16, scaleY: 1.06, scaleX: 0.96, duration: 0.16, ease: "power2.out" })
        .to(squash, { y: 0, scaleY: 1, scaleX: 1, duration: 0.7, ease: "bounce.out" });
      emitDust(event.clientX, event.clientY, { count: 8, burst: true });
    }
    sfx.pop();
    onPoke(index);
  });

  const wiggle = contextSafe((event) => {
    if (event.pointerType === "touch" || prefersReducedMotion()) return;
    const head = event.currentTarget.querySelector("[data-head]");
    if (head) gsap.fromTo(head, { rotation: -5 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
  });

  return (
    <svg ref={rootRef} viewBox="0 0 640 600" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        {/* the snow bank fades out toward the left and right edges instead of ending in a hard line */}
        <linearGradient id="sm-bank-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.16" style={{ stopColor: "var(--sm-ground)", stopOpacity: 0 }} />
          <stop offset="0.3" style={{ stopColor: "var(--sm-ground)", stopOpacity: 1 }} />
          <stop offset="0.7" style={{ stopColor: "var(--sm-ground)", stopOpacity: 1 }} />
          <stop offset="0.84" style={{ stopColor: "var(--sm-ground)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <ellipse cx="320" cy="640" rx="470" ry="100" fill="url(#sm-bank-fade)" />
      {SNOWMEN.map((m, i) => (
        <g
          key={m.x}
          transform={`translate(${m.x} ${m.y}) scale(${m.s})`}
          style={{ cursor: "pointer" }}
          onPointerDown={(e) => poke(i, e)}
          onPointerEnter={(e) => wiggle(e)}
        >
          <Snowman hat={m.hat} scarf={m.scarf} facing="right" />
        </g>
      ))}
      {/* snow piled in front of each base, so they look planted in it */}
      {SNOWMEN.map((m) => (
        <ellipse key={m.x} cx={m.x} cy={m.y + 2} rx={78 * m.s} ry={11 * m.s} style={{ fill: "var(--sm-ground)" }} pointerEvents="none" />
      ))}
    </svg>
  );
}
