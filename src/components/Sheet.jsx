import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { useScrollLock } from "../lib/useScrollLock";

const DISMISS_DISTANCE = 100; // px dragged down before it counts as "dismiss"
const DISMISS_VELOCITY = 0.6; // px per ms: a quick flick also dismisses

// Bottom sheet that slides up from the bottom of the screen (phone-friendly).
// - The page behind it is frozen while it's open.
// - Swiping down drags the sheet and dismisses it. Inside the scrolling list, the swipe only
//   dismisses once the list is already at its top; otherwise it scrolls the list.
// Stays mounted while it animates out, then unmounts.
export default function Sheet({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // "Open" while not mounted yet: mount now (allowed pattern: adjust state during render)
  if (open && !mounted) setMounted(true);

  // Keep the page frozen for as long as the sheet is on screen, including its closing animation
  useScrollLock(mounted);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Open / close animation
  useGSAP(
    () => {
      if (!mounted) return;
      const quick = prefersReducedMotion();
      gsap.killTweensOf([backdropRef.current, panelRef.current]); // in case a close/open is mid-animation
      if (open) {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: quick ? 0 : 0.25 });
        gsap.fromTo(panelRef.current, { yPercent: 100 }, { yPercent: 0, duration: quick ? 0 : 0.5, ease: "power3.out" });
      } else {
        // Starts from wherever the panel currently is, so a swipe-dismiss continues smoothly
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

  // Swipe-down-to-dismiss (touch)
  useEffect(() => {
    const panel = panelRef.current;
    if (!mounted || !panel) return;

    let tracking = false;
    let dragging = false;
    let fromBody = false;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;

    const height = () => panel.offsetHeight || 1;

    const onStart = (e) => {
      if (e.touches.length !== 1) return;
      tracking = true;
      dragging = false;
      startY = lastY = e.touches[0].clientY;
      lastT = e.timeStamp;
      velocity = 0;
      fromBody = !!e.target.closest("[data-sheet-body]");
    };

    const onMove = (e) => {
      if (!tracking) return;
      const y = e.touches[0].clientY;

      if (!dragging) {
        const body = panel.querySelector("[data-sheet-body]");
        const atTop = !fromBody || body.scrollTop <= 0; // header/handle always drag; list only at its top
        if (y - startY > 6 && atTop) {
          dragging = true;
          startY = y; // the drag begins from zero, so there's no jump
          gsap.killTweensOf([panel, backdropRef.current]);
        } else {
          lastY = y;
          lastT = e.timeStamp;
          return;
        }
      }

      e.preventDefault(); // stop the browser from scrolling or pull-to-refreshing behind us
      const offset = Math.max(0, y - startY);
      const dt = e.timeStamp - lastT;
      if (dt > 0) velocity = (y - lastY) / dt;
      lastY = y;
      lastT = e.timeStamp;

      gsap.set(panel, { yPercent: (offset / height()) * 100 });
      gsap.set(backdropRef.current, { opacity: 1 - Math.min(1, offset / height()) * 0.9 });
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;

      const offset = (Number(gsap.getProperty(panel, "yPercent")) / 100) * height();
      if (offset > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        onCloseRef.current();
      } else {
        gsap.to(panel, { yPercent: 0, duration: 0.3, ease: "power3.out" });
        gsap.to(backdropRef.current, { opacity: 1, duration: 0.3 });
      }
    };

    panel.addEventListener("touchstart", onStart, { passive: true });
    panel.addEventListener("touchmove", onMove, { passive: false }); // must be non-passive to call preventDefault
    panel.addEventListener("touchend", onEnd);
    panel.addEventListener("touchcancel", onEnd);
    return () => {
      panel.removeEventListener("touchstart", onStart);
      panel.removeEventListener("touchmove", onMove);
      panel.removeEventListener("touchend", onEnd);
      panel.removeEventListener("touchcancel", onEnd);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={backdropRef} onClick={onClose} className="absolute inset-0 touch-none bg-black/50 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        className="pb-safe absolute inset-x-0 bottom-0 mx-auto flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-3xl border border-b-0 border-accent/30 bg-surface shadow-2xl"
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/25" />
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
            <button onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-muted hover:text-ink">
              Close
            </button>
          </div>
        </div>
        <div data-sheet-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}