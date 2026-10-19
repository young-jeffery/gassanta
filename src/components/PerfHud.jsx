import { useEffect, useState } from "react";
import { getFps, getTier, setTier } from "../lib/perf";

// Tiny frame-rate meter. Only appears when the URL has ?fps  (example: http://192.168.1.145:5173/?fps)
// Tap it to cycle the quality tier 2 -> 1 -> 0 -> 2 and compare how each one feels.
export default function PerfHud() {
  const [enabled] = useState(() => new URLSearchParams(window.location.search).has("fps"));
  const [stats, setStats] = useState({ fps: 0, tier: getTier() });

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setStats({ fps: getFps(), tier: getTier() }), 500);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const cycle = () => setTier(getTier() === 0 ? 2 : getTier() - 1);

  return (
    <button
      type="button"
      onClick={cycle}
      className="fixed top-2 left-2 z-[100] rounded-md bg-black/75 px-2 py-1 font-mono text-xs text-white"
    >
      {stats.fps || "--"} fps · tier {stats.tier}
    </button>
  );
}
