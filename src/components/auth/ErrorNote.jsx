import { useEffect } from "react";
import { sfx } from "../../audio/sfx";

// An error that looks like one: its own red card (fixed colours, so it reads as a problem on every palette).
// Plays a soft thump when it appears. `alert` makes screen readers announce it right away (use for the form-level
// error; field errors are announced through the field's own live region). With autoHideMs + onHide it asks its
// parent to remove it after that long.
export default function ErrorNote({ children, alert = false, autoHideMs, onHide, className = "" }) {
  useEffect(() => {
    sfx.thump();
  }, []);

  useEffect(() => {
    if (!autoHideMs || !onHide) return undefined;
    const timer = setTimeout(onHide, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onHide, children]);

  return (
    <div
      role={alert ? "alert" : undefined}
      className={`rounded-xl border-l-4 border-[#d92d20] bg-[#fee4e2] px-3 py-2 text-sm leading-snug font-bold text-[#7a1810] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
