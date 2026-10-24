import { useLayoutEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { useTheme } from "../../theme/useTheme";

// Day mode dims the night glow: window light, light spill, bulb halos. Each of those is a group marked
// data-dim="<opacity in day mode>"; at night they are at 1. This fades them when the mode changes (and sets them
// straight away on first load). It only touches the GROUP's opacity, so it never fights the animations on the
// shapes inside (entrance, breathing, flicker).
export function useDayNightScene() {
  const { colorMode } = useTheme();
  const isDay = colorMode === "day";
  const previous = useRef(null);

  useLayoutEffect(() => {
    const first = previous.current === null;
    previous.current = isDay;
    const groups = gsap.utils.toArray("[data-dim]");
    gsap.killTweensOf(groups);
    for (const g of groups) {
      const target = isDay ? Number(g.dataset.dim) : 1;
      if (first || prefersReducedMotion()) gsap.set(g, { opacity: target });
      else gsap.to(g, { opacity: target, duration: 0.8, ease: "power1.inOut" });
    }
  }, [isDay]);
}
