import { useEffect } from "react";
import { initSfx, sfx } from "./sfx";

// Sounds for ordinary interface use on EVERY page (the landing page has its own richer ones):
//   click on a button / link / switch  -> a soft tick (buttons with the `.cta` look play their own press chime)
//   focusing a text field              -> a note that goes up the scale from field to field in a form
// Other sounds are played where things happen: errors (ErrorNote), success (DoneCard), page changes (Layout),
// snowmen pokes. All of them obey the same mute switch (Dock > Music > Sound effects).
const CLICKABLE = 'button, a[href], [role="switch"], [role="button"], summary';
const FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea';

export function useGlobalSfx() {
  useEffect(() => {
    initSfx();

    const onClick = (e) => {
      const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      if (!el || el.disabled || el.closest(".cta, [data-no-sfx]")) return;
      sfx.tick();
    };

    const onFocus = (e) => {
      const el = e.target;
      if (!(el instanceof Element) || !el.matches(FIELD)) return;
      const form = el.closest("form");
      const fields = form ? Array.from(form.querySelectorAll(FIELD)) : [el];
      sfx.hop(fields.indexOf(el) + 1);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
}
