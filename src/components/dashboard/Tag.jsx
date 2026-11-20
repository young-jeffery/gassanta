// A status tag. Fixed colours (not themed), so each state reads the same on every palette, like the error cards.
const TONES = {
  open: "bg-[#dcf5e4] text-[#14532d]",
  closed: "bg-[#e9e6ee] text-[#3d3650]",
  locked: "bg-[#e9e6ee] text-[#3d3650]",
  progress: "bg-[#fff1c9] text-[#7a4b00]",
  drawn: "bg-[#ffe29a] text-[#5c3b00]",
  you: "bg-[#fde3e0] text-[#7a1810]",
  role: "bg-[#e0ecff] text-[#173a73]",
};

export default function Tag({ tone = "closed", children }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${TONES[tone]}`}>
      {tone === "progress" && <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#d97706]" />}
      {children}
    </span>
  );
}
