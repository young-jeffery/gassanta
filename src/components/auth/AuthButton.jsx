import { useRef } from "react";
import { useButtonFx } from "../../lib/useButtonFx";

// The landing page's button (magnet, squash, sparkle burst, chime, colour drop on hover) for forms.
//   variant "primary": filled; "secondary": stitched outline.
export default function AuthButton({ children, variant = "primary", busy = false, disabled = false, type = "submit", onClick }) {
  const fxRef = useRef(null);
  useButtonFx(fxRef);
  const primary = variant === "primary";

  return (
    <div ref={fxRef} className="w-full">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={`cta ${primary ? "cta-primary text-on-primary shadow-xl" : "cta-secondary bg-surface/80 text-ink"} w-full rounded-full px-6 py-3.5 font-display text-lg font-extrabold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {primary ? <span className="cta-drop" aria-hidden="true" /> : <span className="cta-fill" aria-hidden="true" />}
        <span className="cta-sheen" aria-hidden="true" />
        {children}
      </button>
    </div>
  );
}
