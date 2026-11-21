import { useEffect } from "react";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { isLite } from "../../lib/lite";
import { emitDust } from "../../lib/dustBus";

// The special reaction of a dashboard card: it hops and tilts, its wave slides, its doodles shake, a little snow puffs,
// and a few symbols float up (hearts on the preferences card, stars on the gifts, snowflakes on registration...).
//
// When it plays:
//   - a mouse moves onto the card, or
//   - the card is clicked or TAPPED on an empty part (taps on buttons, links and inputs are left alone: they are going
//     somewhere, so phones get the effect exactly when there is nothing else to do).
// Cooldown: once played, the card ignores triggers for COOLDOWN_MS, so it can't be spammed. Not played in lite mode
// or with reduced motion. To change the symbols: GLYPHS. To change the pause: COOLDOWN_MS.
const COOLDOWN_MS = 1800;
const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button']";
const GLYPHS = {
  trees: ["❄", "✦", "❅"],
  hearts: ["♥", "♡", "✦"],
  gifts: ["★", "✦", "✧"],
  list: ["✓", "✎", "✦"],
  paper: ["❄", "✦", "★"],
  faces: ["☺", "♥", "✦"],
  envelope: ["✉", "✦", "♥"],
};
const rand = (a, b) => a + Math.random() * (b - a);

export function useCardFx(ref, kind) {
  useEffect(() => {
    const card = ref.current;
    if (!card) return undefined;
    const ctx = gsap.context(() => {});
    let last = 0;

    const play = (clientX, clientY) => {
      if (isLite() || prefersReducedMotion()) return;
      const now = performance.now();
      if (now - last < COOLDOWN_MS) return;
      last = now;

      ctx.add(() => {
        const rect = card.getBoundingClientRect();
        const px = clientX === undefined ? rect.width / 2 : clientX - rect.left;
        const py = clientY === undefined ? rect.height / 2 : clientY - rect.top;

        // the card hops and settles
        gsap.timeline()
          .to(card, { y: -9, rotation: rand(-1.4, 1.4), scale: 1.02, duration: 0.18, ease: "power2.out" })
          .to(card, { y: 0, rotation: 0, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" });

        // the wave slides one screen to the left (seamless: see Wave.jsx)
        const wave = card.querySelector("[data-wave]");
        if (wave) gsap.fromTo(wave, { xPercent: 0 }, { xPercent: -50, duration: 1.5, ease: "power1.inOut" });

        // the doodles shake
        const doodles = card.querySelector("[data-doodles]");
        if (doodles) gsap.fromTo(doodles, { rotation: -7, scale: 1.14, transformOrigin: "80% 80%" }, { rotation: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.35)" });

        // symbols float up from where it was touched
        const layer = card.querySelector("[data-fx]");
        if (layer && layer.children.length < 12) {
          const glyphs = GLYPHS[kind] ?? GLYPHS.trees;
          for (let i = 0; i < 7; i++) {
            const el = document.createElement("span");
            el.textContent = glyphs[i % glyphs.length];
            el.style.cssText = `position:absolute;left:${px + rand(-34, 34)}px;top:${py + rand(-6, 10)}px;font-size:${rand(15, 26)}px;line-height:1;color:currentColor;opacity:0;will-change:transform,opacity`;
            layer.appendChild(el);
            gsap.fromTo(
              el,
              { y: 0, scale: 0.4, opacity: 0, rotation: rand(-30, 30) },
              {
                y: -rand(60, 130),
                x: rand(-40, 40),
                scale: rand(0.9, 1.3),
                rotation: rand(-80, 80),
                opacity: 1,
                duration: 0.35,
                ease: "power2.out",
                onComplete: () => {
                  gsap.to(el, { opacity: 0, y: "-=26", duration: 0.7, ease: "power1.in", onComplete: () => el.remove() });
                },
                delay: i * 0.05,
              }
            );
          }
        }
      });
      emitDust(clientX ?? card.getBoundingClientRect().left + 40, clientY ?? card.getBoundingClientRect().top + 40, { count: 7, burst: true });
    };

    const onEnter = (e) => {
      if (e.pointerType === "mouse") play(e.clientX, e.clientY);
    };
    const onClick = (e) => {
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return; // that tap is going somewhere
      play(e.clientX, e.clientY);
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("click", onClick);
    return () => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("click", onClick);
      ctx.revert();
    };
  }, [ref, kind]);
}
