import { useEffect } from "react";
import { gsap } from "../../../lib/gsap";
import { prefersReducedMotion } from "../../../lib/motion";

// Points every snowman's pupils (and nudges its head) at wherever the gaze store says. Works on any container that
// holds <g data-snow> groups with [data-eye] > [data-pupil] and a [data-head]. A hidden container (display: none)
// measures as 0 wide and is skipped, so the desktop scene and the phone peeker can both stay mounted.
const PUPIL_TRAVEL = 3.4; // how far a pupil may slide inside the eye, in the drawing's own units

export function useSnowmanGaze(store, rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let unsubscribe = () => {};
    const ctx = gsap.context(() => {
      const duration = prefersReducedMotion() ? 0 : 0.28;
      const ease = "power3.out";

      const items = Array.from(root.querySelectorAll("[data-snow]")).map((snow) => {
        const head = snow.querySelector("[data-head]");
        return {
          eyes: Array.from(snow.querySelectorAll("[data-eye]")).map((eye) => {
            const pupil = eye.querySelector("[data-pupil]");
            return { eye, qx: gsap.quickTo(pupil, "x", { duration, ease }), qy: gsap.quickTo(pupil, "y", { duration, ease }) };
          }),
          hx: head ? gsap.quickTo(head, "x", { duration: duration * 1.6, ease }) : null,
          hy: head ? gsap.quickTo(head, "y", { duration: duration * 1.6, ease }) : null,
        };
      });

      const apply = (state) => {
        for (const item of items) {
          let headDx = 0;
          let headDy = 0;
          item.eyes.forEach((e, index) => {
            const rect = e.eye.getBoundingClientRect();
            if (rect.width === 0) return;
            let dx = 0;
            let dy = 0;
            if (state.away) {
              dx = state.awayDir * PUPIL_TRAVEL;
              dy = -PUPIL_TRAVEL * 0.35;
            } else if (state.target) {
              const vx = state.target.x - (rect.left + rect.width / 2);
              const vy = state.target.y - (rect.top + rect.height / 2);
              const dist = Math.hypot(vx, vy) || 1;
              const k = Math.min(1, dist / 140); // near targets move the pupil less
              dx = (vx / dist) * PUPIL_TRAVEL * k;
              dy = (vy / dist) * PUPIL_TRAVEL * k;
            }
            e.qx(dx);
            e.qy(dy);
            if (index === 0) {
              headDx = state.away ? state.awayDir * 4 : dx * 0.6; // turning the whole head away is more obvious than pupils
              headDy = state.away ? -1 : dy * 0.6;
            }
          });
          if (item.hx) {
            item.hx(headDx);
            item.hy(headDy);
          }
        }
      };

      apply(store.state);
      unsubscribe = store.subscribe(apply);
    }, root);

    return () => {
      unsubscribe();
      ctx.revert();
    };
  }, [store, rootRef]);
}
