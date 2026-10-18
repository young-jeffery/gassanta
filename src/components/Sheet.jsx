import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";

// Bottom sheet that slides up from the bottom of the screen (phone-friendly).
// Stays mounted while it animates out, then unmounts.
export default function Sheet({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);

  // "Open" while not mounted yet: mount now (allowed pattern: adjust state during render)
  if (open && !mounted) setMounted(true);

  useGSAP(
    () => {
      if (!mounted) return;
      const quick = prefersReducedMotion();
      gsap.killTweensOf([backdropRef.current, panelRef.current]); // in case a close/open is mid-animation
      if (open) {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: quick ? 0 : 0.25 });
        gsap.fromTo(panelRef.current, { yPercent: 100 }, { yPercent: 0, duration: quick ? 0 : 0.5, ease: "power3.out" });
      } else {
        gsap.to(backdropRef.current, { opacity: 0, duration: quick ? 0 : 0.2 });
        gsap.to(panelRef.current, {
          yPercent: 100,
          duration: quick ? 0 : 0.3,
          ease: "power2.in",
          onComplete: () => setMounted(false),
        });
      }
    },
    { dependencies: [open, mounted] }
  );

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={backdropRef} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        className="pb-safe absolute inset-x-0 bottom-0 mx-auto max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-b-0 border-accent/30 bg-surface p-5 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/25" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-muted hover:text-ink">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
