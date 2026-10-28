// Blizzard intensity, 0 (calm) to 1 (full storm). A plain number that lib/blizzard.js animates and SnowCanvas reads
// every frame, so changing it never triggers a React render.
let level = 0;
export const getStorm = () => level;
export const setStorm = (v) => {
  level = v < 0 ? 0 : v > 1 ? 1 : v;
};
