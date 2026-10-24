// Adaptive quality: keeps the site smooth on every device WITHOUT removing any animation.
//
// Tiers (2 = full, 1 = medium, 0 = light) only scale DENSITY: snow/dust particle counts and canvas
// resolution (and, at tier 0 only, the canvases draw at 30fps). Every effect still exists on every tier.
//
//  - Start tier is a guess from the device; a frame-rate monitor then measures REAL performance.
//  - It is refresh-rate aware: a 30Hz-locked phone (battery saver) is not penalised for being slow, and a
//    120Hz phone is judged against a sensible floor (about 42fps), not against 120.
//  - It steps DOWN when over 25% of a 1.5s window is slow, and steps back UP after ~15s of smooth frames.
//    If a tier gets downgraded twice, it becomes the ceiling and is remembered for next visit.
//  - ?perf=0|1|2 forces a tier, ?perf=reset forgets the remembered ceiling, ?fps shows the meter.

const STORAGE_KEY = "ss-perf-ceiling";
const MAX_TIER = 2;
const WINDOW_MS = 1500;
const SLOW_SHARE = 0.25; // slow frames above this share of a window -> step down
const GOOD_SHARE = 0.06; // below this share -> a "good" window
const GOOD_WINDOWS_TO_STEP_UP = 10; // ~15s of smooth frames
const SLOW_FLOOR_MS = 24; // never call a frame slow if it's faster than this (~42fps)

const listeners = new Set();
const strikes = [0, 0, 0]; // downgrades seen from each tier
let locked = false; // forced by ?perf= or the HUD: monitor stops adjusting
let started = false;
let ceiling = MAX_TIER;
let fps = 0;
let hz = 60;
let work = 0; // EMA of per-frame JS drawing cost (ms), reported by the canvases
let longFrames = 0;
let busyUntil = 0;
let initReason = "";
let tier = pickInitialTier();

function pickInitialTier() {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("perf");
  if (forced === "reset") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage can be blocked */
    }
  } else if (forced === "0" || forced === "1" || forced === "2") {
    locked = true;
    return Number(forced);
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4; // Chromium only, and capped at 8
  const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let guess;
  if (desktop) {
    guess = 2;
    initReason = "desktop pointer";
  } else if (cores >= 8 && memory >= 6) {
    guess = 2;
    initReason = "strong phone";
  } else if (cores <= 2 || memory <= 2) {
    guess = 0;
    initReason = "low-end phone";
  } else {
    guess = 1;
    initReason = "phone (climbs to 2 if smooth)";
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY); // null when unset (Number(null) would be 0!)
    const saved = raw === null ? NaN : Number(raw);
    if (Number.isInteger(saved) && saved >= 0 && saved <= MAX_TIER) ceiling = saved;
  } catch {
    /* ignore */
  }
  if (ceiling < guess) initReason += `, capped by saved ceiling ${ceiling}`;
  return Math.min(guess, ceiling);
}

function applyToDocument() {
  document.documentElement.dataset.perf = String(tier);
}

function change(next) {
  if (next === tier) return;
  tier = next;
  applyToDocument();
  listeners.forEach((fn) => fn(tier));
}

export const getTier = () => tier;
export const getFps = () => fps;
export const getHz = () => hz;
export const getWork = () => work;
export const getStats = () => ({ fps, hz, tier, ceiling, work, longFrames, locked, initReason });

// Canvases skip ticks so they draw at most ~60fps on 100Hz+ screens (the S20 runs at 120Hz)
export const getDivisor = () => (hz >= 100 ? 2 : 1);

export function recordWork(ms) {
  work += (ms - work) * 0.1;
}

export function subscribeTier(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Manual override (the meter uses it). Stops automatic adjustment so tiers can be compared fairly.
export function setTier(next) {
  locked = true;
  change(next);
}

// "Busy" = a heavy transition is running (a sheet sliding). Background canvases halve their rate during it.
// Time-based, so it can never get stuck on.
export function markBusy(ms) {
  busyUntil = Math.max(busyUntil, performance.now() + ms);
}
export const isBusy = () => performance.now() < busyUntil;

export function startPerfMonitor() {
  if (started) return;
  started = true;
  applyToDocument();

  // Count long main-thread stalls (shown in the meter). Not available everywhere; failure is fine.
  for (const type of ["long-animation-frame", "longtask"]) {
    try {
      new PerformanceObserver((list) => {
        longFrames += list.getEntries().length;
      }).observe({ type, buffered: false });
      break;
    } catch {
      /* try the next type */
    }
  }

  const deltas = new Float32Array(600);
  let count = 0;
  let elapsed = 0;
  let last = 0;
  let settle = 20; // ignore the first frames: startup always hitches
  let goodWindows = 0;

  const resetWindow = () => {
    count = 0;
    elapsed = 0;
  };

  const evaluate = () => {
    const slice = deltas.slice(0, count).sort();
    const median = slice[Math.floor(count / 2)];
    const mean = elapsed / count;
    fps = Math.round(1000 / mean);
    hz = Math.min(240, Math.max(24, Math.round(1000 / median)));
    // A frame is slow if it's clearly worse than the screen's normal rhythm. Capping the baseline at 36ms means a
    // battery-saver phone locked to 30Hz (33ms frames) is NOT penalised, but a device that is merely struggling at
    // ~22fps (45ms frames) still counts as slow.
    const slowMs = Math.max(SLOW_FLOOR_MS, Math.min(median, 36) * 1.2);
    let slow = 0;
    for (let i = 0; i < count; i++) if (deltas[i] > slowMs) slow += 1;
    const share = slow / count;

    if (!locked) {
      if (share > SLOW_SHARE && tier > 0) {
        strikes[tier] += 1;
        if (strikes[tier] >= 2) {
          ceiling = Math.min(ceiling, tier - 1); // repeated trouble at this tier: remember it
          try {
            localStorage.setItem(STORAGE_KEY, String(ceiling));
          } catch {
            /* ignore */
          }
        }
        change(tier - 1);
        goodWindows = 0;
        settle = 45;
      } else if (share < GOOD_SHARE) {
        goodWindows += 1;
        if (goodWindows >= GOOD_WINDOWS_TO_STEP_UP && tier < ceiling) {
          change(tier + 1);
          goodWindows = 0;
          settle = 45;
        }
      } else {
        goodWindows = Math.max(0, goodWindows - 1); // a mediocre window sets progress back a little, not to zero
      }
    }
    resetWindow();
  };

  const loop = (now) => {
    if (last) {
      const dt = Math.min(now - last, 250); // a stall counts as one very slow frame, not an endless one
      if (isBusy()) {
        resetWindow(); // transitions say nothing about the device's general speed
        settle = 20;
      } else if (settle > 0) {
        settle -= 1;
      } else {
        if (count < deltas.length) deltas[count++] = dt;
        elapsed += dt;
        if (elapsed >= WINDOW_MS && count >= 20) evaluate();
      }
    }
    last = now;
    requestAnimationFrame(loop);
  };

  document.addEventListener("visibilitychange", () => {
    last = 0;
    resetWindow();
  });
  requestAnimationFrame(loop);
}
