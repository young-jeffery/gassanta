// Small line icons for the phase cards, in the doodle style of the page background.
const base = { viewBox: "0 0 48 48", width: 34, height: 34, fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export function TreeIcon() {
  return (
    <svg {...base}>
      <path d="M24 5 14 19h6L9 31h30L28 19h6Z" />
      <path d="M21 31v8h6v-8" />
      <path d="M24 5v0" />
    </svg>
  );
}

export function HeartListIcon() {
  return (
    <svg {...base}>
      <path d="M24 40C10 31 7 22 11.5 16.5 15 12.5 21 13.5 24 18c3-4.5 9-5.5 12.5-1.5C41 22 38 31 24 40Z" />
    </svg>
  );
}

export function GiftIcon() {
  return (
    <svg {...base}>
      <rect x="8" y="20" width="32" height="20" rx="3" />
      <rect x="6" y="14" width="36" height="8" rx="2" />
      <path d="M24 14v26" />
      <path d="M24 14c-10-12-18-2 0 0 18-2 10-12 0 0Z" />
    </svg>
  );
}
