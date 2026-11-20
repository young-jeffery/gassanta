// A tiny store (outside React, so moving the mouse never re-renders anything) that says where the snowmen look.
//   pointer(x, y)  the mouse moved (or a tap happened). Ignored while they are watching a form field, until the mouse
//                  has moved a real distance away from where it was when the field got focus.
//   field(x, y)    a form field was focused or typed in: look at it
//   clearField()   the field lost focus: go back to the mouse
//   away(on, dir)  a password is visible: look away (dir -1 = to the left, 1 = to the right)
// Subscribers get the state at most once per animation frame.
export function createGazeStore() {
  const listeners = new Set();
  const state = { target: null, away: false, awayDir: -1 };
  let mode = "pointer";
  let lastPointer = null;
  let anchor = null;
  let queued = false;

  const emit = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      listeners.forEach((fn) => fn(state));
    });
  };

  return {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    pointer(x, y, force = false) {
      lastPointer = { x, y };
      if (mode === "field" && !force && anchor && Math.hypot(x - anchor.x, y - anchor.y) < 70) return;
      mode = "pointer";
      state.target = { x, y };
      emit();
    },
    field(x, y) {
      mode = "field";
      anchor = lastPointer ?? { x, y };
      state.target = { x, y };
      emit();
    },
    clearField() {
      if (mode !== "field") return;
      mode = "pointer";
      state.target = lastPointer;
      emit();
    },
    away(on, dir = -1) {
      state.away = on;
      state.awayDir = dir;
      emit();
    },
  };
}
