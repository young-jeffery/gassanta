// Hand-drawn scribbles for the dashboard cards: each card kind has its own little cluster of doodles (trees and snow
// for registration, hearts for preferences, gifts for the reveal, a checklist and pencil for the wishlist, a page of
// rules, smiley faces for members, an envelope and paper plane for invites), drawn in the card's own colour and kept
// faint and behind the text, bottom-right (above the card's wavy edge).
//
// Every kind is a 220x150 drawing made of plain lines (stroke, no fill). To add one: add a key to KINDS below and use
// it as <Card scribble="yourKey">. To change how loud they are: OPACITY.
const OPACITY = 0.28;

const heart = "M0 9 C-14 -4 -12 -17 0 -12 C12 -17 14 -4 0 9 Z";
const star = "M0 -9 L2.6 -3 L9 -2.4 L4.2 1.8 L5.6 8 L0 4.8 L-5.6 8 L-4.2 1.8 L-9 -2.4 L-2.6 -3 Z";
const face = (
  <>
    <circle r="19" />
    <circle cx="-7" cy="-4" r="1.6" />
    <circle cx="7" cy="-4" r="1.6" />
    <path d="M-8 4 q8 9 16 0" />
  </>
);

const KINDS = {
  trees: (
    <>
      <path d="M4 142 q18 -10 36 0 t36 0 t36 0 t36 0 t36 0 t36 0" />
      <path d="M60 44 L46 70 H54 L40 96 H80 L66 70 H74 Z" />
      <path d="M56 96 v12 h8 v-12" />
      <path d="M118 78 L108 96 H114 L104 112 H132 L122 96 H128 Z" />
      <path d="M115 112 v10 h6 v-10" />
      <g transform="translate(60 26)">
        <path d={star} />
      </g>
      <circle cx="152" cy="42" r="2" />
      <circle cx="174" cy="66" r="2.8" />
      <circle cx="146" cy="90" r="1.8" />
      <circle cx="196" cy="34" r="2.2" />
      <path d="M152 118 c10 -24 30 6 22 12 s-12 -18 12 -22 s22 8 30 -4" />
    </>
  ),
  hearts: (
    <>
      <g transform="translate(62 66) scale(2.4)">
        <path d={heart} />
      </g>
      <g transform="translate(130 96) scale(1.6)">
        <path d={heart} />
      </g>
      <g transform="translate(176 50) scale(1.2)">
        <path d={heart} />
      </g>
      <path d="M14 128 c26 -34 52 18 80 -12 s46 -30 72 -6" />
      <path d="M160 104 l12 -3 -5 11" />
      <g transform="translate(110 38) scale(0.9)">
        <path d={star} />
      </g>
      <path d="M186 96 l5 6 10 -12" />
    </>
  ),
  gifts: (
    <>
      <rect x="52" y="76" width="64" height="52" rx="4" />
      <rect x="46" y="60" width="76" height="18" rx="3" />
      <path d="M84 60 V128" />
      <path d="M84 60 C62 30 36 48 84 60 C132 48 106 30 84 60" />
      <rect x="148" y="100" width="40" height="28" rx="3" />
      <path d="M168 100 V128 M144 100 h48" />
      <path d="M150 30 q8 -10 16 0 t16 0" />
      <path d="M170 56 q6 -8 12 0 t12 0" />
      <g transform="translate(132 52) scale(0.9)">
        <path d={star} />
      </g>
      <g transform="translate(196 90) scale(0.7)">
        <path d={star} />
      </g>
    </>
  ),
  list: (
    <>
      <rect x="22" y="30" width="16" height="16" rx="3" />
      <path d="M26 38 l4 5 8 -11" />
      <path d="M50 38 h70" />
      <rect x="22" y="64" width="16" height="16" rx="3" />
      <path d="M26 72 l4 5 8 -11" />
      <path d="M50 72 h56" />
      <rect x="22" y="98" width="16" height="16" rx="3" />
      <path d="M50 106 h64" />
      <path d="M150 116 L190 58 L206 68 L166 126 Z" />
      <path d="M150 116 L146 134 L166 126" />
      <path d="M186 64 l14 9" />
      <g transform="translate(160 38) scale(0.9)">
        <path d={star} />
      </g>
    </>
  ),
  paper: (
    <>
      <path d="M56 22 H132 L164 54 V126 H56 Z" />
      <path d="M132 22 V54 H164" />
      <path d="M72 72 H148 M72 88 H148 M72 104 H122" />
      <path d="M176 36 v30 M176 76 v4" />
      <g transform="translate(26 40) scale(0.9)">
        <path d={star} />
      </g>
      <path d="M14 118 q10 -12 20 0 t20 0" />
    </>
  ),
  faces: (
    <>
      <g transform="translate(52 72)">{face}</g>
      <g transform="translate(108 96) scale(1.15)">{face}</g>
      <g transform="translate(166 64)">{face}</g>
      <g transform="translate(80 38) scale(0.8)">
        <path d={heart} />
      </g>
      <g transform="translate(196 112) scale(0.9)">
        <path d={heart} />
      </g>
      <path d="M10 138 q16 -10 32 0 t32 0 t32 0 t32 0 t32 0 t32 0" />
    </>
  ),
  envelope: (
    <>
      <rect x="28" y="76" width="84" height="56" rx="5" />
      <path d="M28 80 L70 112 L112 80" />
      <path d="M144 42 L206 20 L174 76 L162 56 Z" />
      <path d="M162 56 L206 20" />
      <path d="M144 42 L162 56" />
      <path d="M118 84 C132 64 122 56 142 48" strokeDasharray="4 5" />
      <g transform="translate(40 40) scale(0.9)">
        <path d={star} />
      </g>
      <g transform="translate(190 100) scale(0.8)">
        <path d={star} />
      </g>
    </>
  ),
};

// The corner cluster behind a card's content, drawn in the card's text colour
export default function Scribbles({ kind }) {
  return (
    <svg
      data-doodles
      aria-hidden="true"
      viewBox="0 0 220 150"
      className="pointer-events-none absolute -right-3 bottom-5 z-0 h-36 w-52"
      style={{ opacity: OPACITY, color: "var(--c-ink)" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {KINDS[kind]}
    </svg>
  );
}
