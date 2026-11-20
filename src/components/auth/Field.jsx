import { useEffect, useId, useState } from "react";
import ErrorNote from "./ErrorNote";
import { useStage } from "./useStage";

const ERROR_MS = 6000; // a field error disappears by itself after this long

const inputClass =
  "w-full rounded-2xl border-2 bg-canvas/40 px-4 py-3 text-base text-ink placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// One labelled form field. `stageKey` is the name the snowmen know the field by (their tips are in snowmen/lines.js:
// "focus:<stageKey>"). Below the input shows ONE of: `error` (red card), `status` (a string, or { text, tone } with
// tone "ok" for a green tick), or `hint`. `right` is a slot inside the input's right edge (the show/hide button).
//
// How long an error stays (the page computes `error` from the current value; this decides whether to SHOW it):
//   - it disappears when the person empties the field, and after 6 seconds
//   - it comes back when the value changes again, or when `errorKey` changes (the page bumps it on every submit
//     attempt, so pressing the button always shows what is wrong, even for an empty field)
//   - persistError: it stays until the page stops reporting it (used for "the two passwords don't match":
//     it only goes once they match)
// Everything else goes straight to the <input>.
export default function Field({ label, stageKey, hint, error, errorKey, persistError = false, status, right, onFocus, onBlur, onChange, ...input }) {
  const stage = useStage();
  const id = useId();
  const noteId = `${id}-note`;
  const state = typeof status === "string" ? { text: status, tone: "info" } : status;

  const [dismissed, setDismissed] = useState(null); // { error, key }: the error we stopped showing
  const hidden = !persistError && dismissed !== null && dismissed.error === error && dismissed.key === errorKey;
  const visibleError = error && !hidden ? error : "";

  useEffect(() => {
    if (!error || persistError || hidden) return undefined;
    const timer = setTimeout(() => setDismissed({ error, key: errorKey }), ERROR_MS);
    return () => clearTimeout(timer);
  }, [error, errorKey, persistError, hidden]);

  let note = null;
  if (visibleError) {
    note = <ErrorNote key={visibleError}>{visibleError}</ErrorNote>;
  } else if (state?.text) {
    note =
      state.tone === "ok" ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#dcf5e4] px-2.5 py-0.5 text-xs font-bold text-[#14532d]">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          {state.text}
        </span>
      ) : (
        <p className="text-xs text-muted">{state.text}</p>
      );
  } else if (hint) {
    note = <p className="text-xs text-muted">{hint}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={visibleError ? "true" : undefined}
          aria-describedby={note ? noteId : undefined}
          className={`${inputClass} ${visibleError ? "border-[#e5484d]" : "border-accent/40"} ${right ? "pr-24" : ""}`}
          onFocus={(e) => {
            stage.focusField(stageKey, e.currentTarget);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            stage.blurField();
            onBlur?.(e);
          }}
          onChange={(e) => {
            onChange?.(e);
            stage.typeField(stageKey, e.currentTarget);
            // emptied: hide the error. Typing again: it may show again (and gets a fresh 6 seconds)
            if (!persistError) setDismissed(e.currentTarget.value === "" ? { error, key: errorKey } : null);
          }}
          {...input}
        />
        {right && <div className="absolute inset-y-0 right-1.5 flex items-center">{right}</div>}
      </div>
      <div id={noteId} aria-live="polite" className="mb-1 min-h-4">
        {note}
      </div>
    </div>
  );
}
