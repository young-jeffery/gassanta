// Interaction sounds, synthesized with the Web Audio API (no audio files). Separate from the Howler music in
// MusicProvider: its own AudioContext, its own mute switch (saved as ss-sfx; on by default), quieter than the music,
// and it keeps playing with "Enter without music" (that choice means no music, not no sound).
//
// Browsers only allow audio after a tap, so initSfx() hooks the first tap/click/key and creates the context then.
// A sound requested before the context is running is simply skipped. On iPhones the very first tap can be silent.
// Every sound is rate-limited per type and the number of overlapping voices is capped.

const KEY = "ss-sfx";
const VOLUME = 0.22; // master level; the music sits at 0.6
const MAX_VOICES = 12;
// C major pentatonic from C5: any mix of notes sounds pleasant together
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

let ctx = null;
let master = null;
let noiseBuf = null;
let voices = 0;
let installed = false;
let muted = readMuted();
const listeners = new Set();
const lastPlayed = {};

function readMuted() {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

export const getMuted = () => muted;

export function setMuted(next) {
  muted = !!next;
  try {
    localStorage.setItem(KEY, muted ? "off" : "on");
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function ensure() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor(); // stops stacked sounds from clipping
  master = ctx.createGain();
  master.gain.value = VOLUME;
  master.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

// Call once (safe to call again). Creates/resumes the audio context on the first user gesture.
export function initSfx() {
  if (installed) return;
  installed = true;
  const unlock = () => {
    ensure();
  };
  for (const ev of ["pointerdown", "touchend", "click", "keydown"]) {
    window.addEventListener(ev, unlock, { passive: true, capture: true });
  }
}

function ready(name, gap = 0) {
  if (muted) return false;
  const c = ensure();
  if (!c || c.state !== "running") return false;
  const now = performance.now();
  if (now - (lastPlayed[name] || 0) < gap) return false;
  if (voices >= MAX_VOICES) return false;
  lastPlayed[name] = now;
  return true;
}

function claim(seconds) {
  voices += 1;
  setTimeout(() => {
    voices -= 1;
  }, seconds * 1000);
}

// One oscillator with an attack/decay envelope
function tone(freq, { type = "sine", gain = 0.5, attack = 0.005, decay = 0.8, delay = 0, slideTo = null } = {}) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + attack + decay);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

// Filtered noise burst
function noise({ dur = 0.2, type = "bandpass", from = 800, to = null, q = 1, gain = 0.4, attack = 0.01, delay = 0 } = {}) {
  const t = ctx.currentTime + delay;
  if (!noiseBuf) {
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

// A bell = the note plus two quick-fading inharmonic partials
function bell(freq, gain = 0.5, delay = 0) {
  tone(freq, { gain, decay: 1.1, delay });
  tone(freq * 2.76, { gain: gain * 0.22, decay: 0.45, delay });
  tone(freq * 5.4, { gain: gain * 0.08, decay: 0.25, delay });
}

const note = (i) => PENTA[((Math.round(i) % PENTA.length) + PENTA.length) % PENTA.length];

// Shared noise buffer (also used by noise() above)
function getNoise() {
  if (!noiseBuf) {
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// Blizzard wind: looping noise through three paths (a moving band for the body, a low rumble, a faint whistle),
// with slow oscillators making it gust. Level 0..1 is set with windLevel().
let wind = null;
function loopNoise() {
  const src = ctx.createBufferSource();
  src.buffer = getNoise();
  src.loop = true;
  return src;
}

export const sfx = {
  windStart() {
    if (muted || wind) return;
    const c = ensure();
    if (!c || c.state !== "running") return;
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(master);

    const body = loopNoise();
    const bodyF = c.createBiquadFilter();
    bodyF.type = "bandpass";
    bodyF.frequency.value = 400;
    bodyF.Q.value = 0.7;
    const gust = c.createGain();
    gust.gain.value = 0.65;
    body.connect(bodyF);
    bodyF.connect(gust);
    gust.connect(out);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.23;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 0.35;
    lfo.connect(lfoDepth);
    lfoDepth.connect(gust.gain);

    const rumble = loopNoise();
    const rumbleF = c.createBiquadFilter();
    rumbleF.type = "lowpass";
    rumbleF.frequency.value = 180;
    const rumbleG = c.createGain();
    rumbleG.gain.value = 0.5;
    rumble.connect(rumbleF);
    rumbleF.connect(rumbleG);
    rumbleG.connect(out);

    const whistle = loopNoise();
    const whistleF = c.createBiquadFilter();
    whistleF.type = "bandpass";
    whistleF.frequency.value = 1100;
    whistleF.Q.value = 14;
    const whistleG = c.createGain();
    whistleG.gain.value = 0.05;
    whistle.connect(whistleF);
    whistleF.connect(whistleG);
    whistleG.connect(out);
    const lfo2 = c.createOscillator();
    lfo2.frequency.value = 0.17;
    const lfo2Depth = c.createGain();
    lfo2Depth.gain.value = 350;
    lfo2.connect(lfo2Depth);
    lfo2Depth.connect(whistleF.frequency);

    const nodes = [body, rumble, whistle, lfo, lfo2];
    body.start(t, Math.random() * 0.5);
    rumble.start(t, Math.random() * 0.5);
    whistle.start(t, Math.random() * 0.5);
    lfo.start(t);
    lfo2.start(t);
    wind = { out, bodyF, nodes };
  },
  windLevel(v, seconds = 0.5) {
    if (!wind || !ctx) return;
    const t = ctx.currentTime;
    wind.out.gain.setTargetAtTime(v * 0.9, t, seconds / 3);
    wind.bodyF.frequency.setTargetAtTime(350 + v * 750, t, seconds / 3);
  },
  windStop(seconds = 1) {
    if (!wind || !ctx) return;
    const w = wind;
    wind = null;
    w.out.gain.setTargetAtTime(0, ctx.currentTime, seconds / 3);
    setTimeout(() => {
      w.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      w.out.disconnect();
    }, (seconds + 0.6) * 1000);
  },
  chime(i = 0) {
    if (!ready("chime", 50)) return;
    bell(note(i), 0.5);
    claim(1.3);
  },
  tick() {
    if (!ready("tick", 40)) return;
    noise({ dur: 0.04, type: "highpass", from: 3000, gain: 0.3, attack: 0.002 });
    tone(1800, { type: "triangle", gain: 0.12, decay: 0.05 });
    claim(0.1);
  },
  pop() {
    if (!ready("pop", 60)) return;
    tone(520, { slideTo: 180, decay: 0.14, gain: 0.5 });
    noise({ dur: 0.05, from: 1200, gain: 0.12 });
    claim(0.25);
  },
  hop(i = 0) {
    if (!ready("hop", 30)) return;
    tone(note(i) * 0.5, { type: "triangle", gain: 0.45, decay: 0.35 });
    tone(note(i) * 2, { type: "sine", gain: 0.12, decay: 0.1 });
    claim(0.5);
  },
  wish() {
    if (!ready("wish", 200)) return;
    [2, 3, 4, 5].forEach((n, k) => bell(note(n), 0.28, k * 0.07));
    claim(1.5);
  },
  thump() {
    if (!ready("thump", 150)) return;
    tone(110, { slideTo: 50, decay: 0.25, gain: 0.7 });
    noise({ dur: 0.22, type: "lowpass", from: 900, to: 200, gain: 0.4 });
    claim(0.4);
  },
  door() {
    if (!ready("door", 300)) return;
    tone(220, { type: "triangle", gain: 0.2, attack: 0.25, decay: 0.7 });
    tone(330, { type: "triangle", gain: 0.14, attack: 0.25, decay: 0.7, delay: 0.05 });
    tone(440, { type: "sine", gain: 0.08, attack: 0.3, decay: 0.6, delay: 0.1 });
    claim(1.1);
  },
  press() {
    if (!ready("press", 80)) return;
    bell(note(5), 0.35);
    tone(400, { slideTo: 200, decay: 0.08, gain: 0.25 });
    claim(1.2);
  },
  whoosh() {
    if (!ready("whoosh", 200)) return;
    noise({ dur: 0.6, type: "bandpass", from: 400, to: 1800, q: 0.8, gain: 0.35, attack: 0.15 });
    claim(0.7);
  },
  hoho() {
    if (!ready("hoho", 600)) return;
    // three low "ho"s, each dipping in pitch, then a quick sleigh-bell jingle
    for (let k = 0; k < 3; k++) {
      tone(150 - k * 8, { type: "triangle", slideTo: 105 - k * 6, gain: 0.55, attack: 0.02, decay: 0.16, delay: k * 0.24 });
      tone(300 - k * 16, { type: "sine", gain: 0.12, attack: 0.02, decay: 0.12, delay: k * 0.24 });
    }
    for (let k = 0; k < 5; k++) bell(note(5 + (k % 3)) * 1.5, 0.14, 0.78 + k * 0.05);
    claim(1.8);
  },
  preview() {
    this.tick();
    setTimeout(() => this.chime(3), 90);
  },
};
