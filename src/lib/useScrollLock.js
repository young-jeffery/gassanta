import { useEffect } from "react";

// Freezes the page behind a sheet/modal. Plain `overflow: hidden` on <body> is ignored by older
// iOS Safari, so we pin the body in place with position: fixed instead, then restore the exact
// scroll position afterwards. A counter keeps it correct if two locks ever overlap.
let lockCount = 0;
let restore = null;

function lock() {
  if (lockCount++ > 0) return;
  const { body, documentElement: html } = document;
  const scrollY = window.scrollY;
  const scrollbar = window.innerWidth - html.clientWidth; // desktop scrollbar width (0 on phones)
  const prev = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`; // stops a layout jump on desktop

  restore = () => {
    Object.assign(body.style, prev);
    window.scrollTo(0, scrollY);
  };
}

function unlock() {
  if (--lockCount > 0) return;
  restore?.();
  restore = null;
}

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    lock();
    return unlock;
  }, [locked]);
}