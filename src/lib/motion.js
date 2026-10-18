// True when the phone/OS has "reduce motion" switched on. Animations should skip or soften.
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
