// Adaptive quality: keeps the site smooth on every device.
//
// Three tiers: 2 = full, 1 = medium, 0 = light. Every heavy effect (snow, dust, blur, shadows, and the
// animations we add in 2.3+) reads the tier and scales itself.
//  - Start tier is a guess from the device (cores, memory, touch).
//  - A frame-rate monitor then measures REAL performance and steps the tier down if frames are slow.
//    It only ever steps down, so it can't flip-flop. The result is remembered for the next visit.
//  - ?perf=0|1|2 forces a tier (for testing), ?perf=reset forgets the remembered tier,
//    ?fps shows the on-screen meter (tap it to cycle tiers).

const STORAGE_KEY = "ss-perf-tier";
const WINDOW_FRAMES = 90; // ~1.5s at 60fps
const SLOW_FRAME_MS = 28; // slower than ~35fps counts as a slow frame
const SLOW_SHARE = 0.25; // if over 25% of a window is slow, drop a tier

const listeners = new Set();
let locked = false; // forced by ?perf= or the HUD: the monitor stops adjusting
let fps = 0;
let started = false;
let tier = pickInitialTier();

function pickInitialTier() {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("perf");
  if (forced === "reset") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage can be blocked; ignore */
    }
  } else if (forced === "0" || forced === "1" || forced === "2") {
    locked = true;
    return Number(forced);
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4; // Chromium only; undefined elsewhere
  const touch = window.matchMedia("(pointer: coarse)").matches;
  let t = cores <= 4 || memory <= 3 ? 1 : touch ? 1 : 2;

  try {
    const raw = localStorage.getItem(STORAGE_KEY); // null when nothing is saved (Number(null) would be 0!)
    const saved = raw === null ? NaN : Number(raw);
    if (Number.isInteger(saved) && saved >= 0 && saved < t) t = saved;
  } catch {
    /* ignore */
  }
  return t;
}

function applyToDocument() {
  document.documentElement.dataset.perf = String(tier);
}

function change(next, persist) {
  if (next === tier) return;
  tier = next;
  applyToDocument();
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, String(tier));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn(tier));
}

// "Busy" = a heavy transition is running (a sheet sliding in or out). Background effects (the snow) run at
// half rate during it so the transition gets the whole frame budget. Time-based, so it can never get stuck on.
let busyUntil = 0;
export function markBusy(ms) {
  busyUntil = Math.max(busyUntil, performance.now() + ms);
}
export const isBusy = () => performance.now() < busyUntil;

export const getTier = () => tier;
export const getFps = () => fps;

export function subscribeTier(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Manual override (the HUD uses it). Stops automatic adjustment so you can compare tiers fairly.
export function setTier(next) {
  locked = true;
  change(next, false);
}

export function startPerfMonitor() {
  if (started) return;
  started = true;
  applyToDocument();

  let last = 0;
  let count = 0;
  let slow = 0;
  let sum = 0;
  let settle = 30; // ignore the first frames: startup is always janky for a moment

  const reset = () => {
    count = 0;
    slow = 0;
    sum = 0;
  };

  const loop = (now) => {
    if (last) {
      const dt = Math.min(now - last, 250); // a stall counts as one very slow frame, not an endless one
      if (isBusy()) {
        reset(); // transition frames say nothing about the device's general speed
        settle = 20;
      } else if (settle > 0) {
        settle -= 1;
      } else {
        count += 1;
        sum += dt;
        if (dt > SLOW_FRAME_MS) slow += 1;
      }
    }
    last = now;

    if (count >= WINDOW_FRAMES) {
      fps = Math.round(1000 / (sum / count));
      if (!locked && tier > 0 && slow / count > SLOW_SHARE) {
        change(tier - 1, true);
        settle = 45; // let the new tier settle before judging it
      }
      reset();
    }
    requestAnimationFrame(loop);
  };

  // Coming back from another tab shouldn't count as a stall
  document.addEventListener("visibilitychange", () => {
    last = 0;
    reset();
  });
  requestAnimationFrame(loop);
}
