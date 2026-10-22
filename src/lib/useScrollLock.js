import { useEffect } from "react";

// Freezes the page behind a sheet/modal.
//
// This used to pin <body> with position:fixed. That forces the browser to re-layout the WHOLE page at the
// exact moment the sheet starts sliding (and again when it ends), plus it can resize the viewport on
// Android. That was the stutter on the Galaxy S20. Now it only flips one attribute; the rule in index.css
// sets `overflow: hidden` on <html>, and the scroll position is kept. A counter keeps it correct if two
// locks ever overlap. (The sheet's backdrop and header use touch-action: none, and its list uses
// overscroll-contain, so older iOS versions that ignore overflow:hidden still can't scroll the page.)
let lockCount = 0;

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const root = document.documentElement;
    lockCount += 1;
    root.setAttribute("data-scroll-locked", "");
    return () => {
      lockCount -= 1;
      if (lockCount === 0) root.removeAttribute("data-scroll-locked");
    };
  }, [locked]);
}
