// A page-wide Christmas doodle pattern for every page except the landing page (which has its own scene): hand-drawn
// line icons (snowflakes, gifts, candy canes, holly, stockings, bells, baubles, trees, mittens, gingerbread men,
// stars, sparkles) tiled over the background in the palette's ink colour at very low strength.
//
// One fixed layer, one SVG <pattern>, no animation, so it costs next to nothing and is identical in lite mode.
// Each doodle is drawn around its own (0,0) in a box of about 50x50 and placed in the 480x480 tile by TILE below
// (x, y, rotation in degrees, scale). To change the look: edit a shape, move one in TILE, or change OPACITY.
const OPACITY = 0.11;

const SHAPES = {
  snowflake: (
    <>
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -22 V22 M-6 -15 L0 -9 L6 -15 M-6 15 L0 9 L6 15" />
        </g>
      ))}
    </>
  ),
  gift: (
    <>
      <rect x="-16" y="-6" width="32" height="26" rx="3" />
      <rect x="-19" y="-14" width="38" height="9" rx="2" />
      <path d="M0 -14 V20" />
      <path d="M0 -14 C-14 -30 -23 -14 0 -14 C23 -14 14 -30 0 -14" />
    </>
  ),
  cane: (
    <>
      <path d="M-8 24 V-6 a10 10 0 0 1 20 0 v3" strokeWidth="7" strokeDasharray="6 5" strokeLinecap="butt" />
      <path d="M-8 24 V-6 a10 10 0 0 1 20 0 v3" strokeWidth="1.6" opacity="0.5" />
    </>
  ),
  star: <path d="M0 -21 L6.2 -7.4 L21 -6.5 L9.6 3.2 L13.2 17.5 L0 9.8 L-13.2 17.5 L-9.6 3.2 L-21 -6.5 L-6.2 -7.4 Z" />,
  holly: (
    <>
      <path d="M0 0 C6 -12 22 -14 28 -5 C22 -3 20 2 15 2 C13 9 4 9 0 0 Z" transform="rotate(-25)" />
      <path d="M0 0 C-6 -12 -22 -14 -28 -5 C-22 -3 -20 2 -15 2 C-13 9 -4 9 0 0 Z" transform="rotate(25)" />
      <circle cx="-3" cy="8" r="3.4" />
      <circle cx="4" cy="9" r="3.4" />
      <circle cx="0" cy="15" r="3.4" />
    </>
  ),
  mitten: (
    <>
      <path d="M-12 22 V-2 C-12 -14 -2 -20 6 -16 C14 -12 14 -4 12 0 L12 22 Z" />
      <path d="M-12 6 C-22 4 -24 -4 -18 -8" />
      <path d="M-12 14 H12" />
    </>
  ),
  bauble: (
    <>
      <circle cx="0" cy="4" r="16" />
      <path d="M-5 -12 h10 v-5 h-10 Z" />
      <path d="M0 -17 C0 -25 7 -25 7 -20" />
      <path d="M-13 4 L-7 -1 L0 4 L7 -1 L13 4" />
    </>
  ),
  tree: (
    <>
      <path d="M0 -24 L-12 -8 H-5 L-16 6 H-6 L-20 20 H20 L6 6 H16 L5 -8 H12 Z" />
      <path d="M-4 20 V26 H4 V20" />
    </>
  ),
  stocking: (
    <>
      <path d="M-8 -22 H8 V2 C8 8 20 10 20 20 C20 28 8 28 4 22 C0 16 -8 12 -8 6 Z" />
      <path d="M-9 -15 H9" />
    </>
  ),
  bell: (
    <>
      <path d="M0 -22 V-18" />
      <path d="M-14 14 C-14 -4 -10 -18 0 -18 C10 -18 14 -4 14 14 Z" />
      <path d="M-18 14 H18" />
      <circle cx="0" cy="19" r="3" />
    </>
  ),
  ginger: (
    <>
      <circle cx="0" cy="-15" r="7" />
      <path d="M-5 -9 L-19 -9 C-24 -9 -24 -2 -19 -2 L-8 0 L-13 20 H-4 L0 8 L4 20 H13 L8 0 L19 -2 C24 -2 24 -9 19 -9 L5 -9" />
      <circle cx="0" cy="-2" r="1.4" />
      <circle cx="0" cy="5" r="1.4" />
    </>
  ),
  sparkle: <path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9 Z" />,
  dots: (
    <>
      <circle cx="-8" cy="-4" r="1.7" />
      <circle cx="6" cy="-9" r="1.4" />
      <circle cx="9" cy="6" r="1.9" />
      <circle cx="-4" cy="10" r="1.3" />
    </>
  ),
};

// [shape, x, y, rotation, scale] inside a 480 x 480 tile; repeats edge to edge
const TILE = [
  ["snowflake", 60, 60, 0, 1],
  ["gift", 185, 50, -8, 1],
  ["cane", 305, 70, 20, 1],
  ["star", 420, 55, 10, 0.9],
  ["sparkle", 125, 130, 0, 1],
  ["dots", 245, 130, 0, 1],
  ["bell", 55, 185, -10, 1],
  ["holly", 175, 190, 8, 1],
  ["tree", 295, 195, 0, 1],
  ["mitten", 415, 185, -12, 1],
  ["sparkle", 360, 130, 0, 0.8],
  ["stocking", 70, 305, 8, 1],
  ["bauble", 190, 305, -6, 1],
  ["ginger", 305, 310, 10, 1],
  ["snowflake", 420, 300, 15, 0.8],
  ["dots", 125, 255, 0, 1],
  ["sparkle", 245, 250, 0, 0.9],
  ["tree", 55, 420, -8, 0.8],
  ["star", 180, 425, -12, 0.85],
  ["gift", 300, 425, 12, 0.85],
  ["holly", 415, 420, -5, 0.9],
  ["sparkle", 360, 365, 0, 1],
  ["dots", 125, 380, 0, 1],
];

export default function ChristmasDoodles() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full text-ink"
      style={{ opacity: OPACITY }}
    >
      <defs>
        <pattern id="xmas-doodles" width="480" height="480" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {TILE.map(([shape, x, y, rotate, scale], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
                {SHAPES[shape]}
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#xmas-doodles)" />
    </svg>
  );
}
