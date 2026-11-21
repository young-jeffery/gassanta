// A wavy strip along a card's bottom edge. The drawing is two screens wide and a whole number of waves long, so
// sliding it left by exactly half its width (useCardFx does this on hover/tap) loops without a seam.
const PATH = `M0 14 q12.5 -14 25 0${" t25 0".repeat(31)} V28 H0 Z`;

export default function Wave({ color }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-7 overflow-hidden">
      <svg data-wave viewBox="0 0 800 28" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-full w-[200%]">
        <path d={PATH} fill={color} />
      </svg>
    </div>
  );
}
