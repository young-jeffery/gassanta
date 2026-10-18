// Tiny inline icons so we don't need an icon library.
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export const MusicIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
export const PaletteIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .3-2.1 1.4-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </svg>
);
export const PlayIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const PauseIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </svg>
);
export const NextIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M6 5l9 7-9 7zM17 5h2v14h-2z" />
  </svg>
);
export const PrevIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M18 5l-9 7 9 7zM5 5h2v14H5z" />
  </svg>
);
export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
