// "Lite mode": a static, no-animation version of the site for weak phones. One switch, saved on this device.
// It sets <html data-lite> (lite.css and a few components look at it) and lets React components subscribe (useLite.js).
//   ?lite=1 in the URL turns it on (and remembers it), ?lite=0 turns it off: handy for sending a friend a link.
// What lite switches off: snow, the landing scene's animations, fairy lights, Santa, parallax, the dust trail, the
// custom cursor, the blizzard transition, page fades, the snowmen's idle life and eye-tracking. Buttons keep their
// effects, and basic CSS transitions stay.
const KEY = "ss-lite";
const listeners = new Set();

function read() {
  try {
    const param = new URLSearchParams(window.location.search).get("lite");
    if (param === "1" || param === "0") {
      localStorage.setItem(KEY, param);
      return param === "1";
    }
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked: default to the full experience
  }
}

let lite = read();

function apply() {
  document.documentElement.toggleAttribute("data-lite", lite);
}
apply(); // before React renders, so the very first paint is already correct

export const getLite = () => lite;
export const isLite = getLite;

export function setLite(next) {
  lite = Boolean(next);
  try {
    localStorage.setItem(KEY, lite ? "1" : "0");
  } catch {
    /* ignore */
  }
  apply();
  listeners.forEach((fn) => fn());
}

export function subscribeLite(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
