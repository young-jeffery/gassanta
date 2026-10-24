// Tiny bridge so any component (hover cursor, tap reactions, Santa...) can spawn dust/sparkle particles
// without owning a canvas. DustTrail registers itself as the emitter.
//   emitDust(x, y, { count = 1, burst = false })
let emitter = null;

export function setDustEmitter(fn) {
  emitter = fn;
}

export function emitDust(x, y, opts) {
  if (emitter) emitter(x, y, opts);
}
