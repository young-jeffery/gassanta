import { useEffect, useRef, useState } from "react";
import { getStats, getTier, setTier } from "../lib/perf";

// Performance meter. Only appears when the URL has ?fps  (example: http://192.168.1.145:5173/?fps)
//   fps  = measured frame rate        Hz   = estimated screen refresh rate
//   tier = current quality tier (ceiling in brackets if one was learned)
//   js   = average milliseconds per frame the snow + dust drawing costs (lower is better)
//   long = main-thread stalls counted so far (browsers that report them)
//   init = why the starting tier was chosen (and whether a saved ceiling capped it)
// Tap it to cycle the tier 2 -> 1 -> 0 -> 2 and compare. Hold it for a second to get a copyable report.
export default function PerfHud() {
  const [enabled] = useState(() => new URLSearchParams(window.location.search).has("fps"));
  const [stats, setStats] = useState(() => getStats());
  const holdTimer = useRef(0);
  const held = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setStats(getStats()), 500);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const report = () => {
    const s = getStats();
    const text = JSON.stringify(
      {
        ...s,
        work: Number(s.work.toFixed(2)),
        dpr: window.devicePixelRatio,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        cores: navigator.hardwareConcurrency,
        memoryGB: navigator.deviceMemory,
        ua: navigator.userAgent,
      },
      null,
      1
    );
    // Clipboard needs https; on the plain-http LAN dev server fall back to a prompt you can copy from
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(() => window.prompt("Copy this report", text));
    else window.prompt("Copy this report", text);
  };

  const onDown = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      report();
    }, 900);
  };
  const onUp = () => clearTimeout(holdTimer.current);
  const onClick = () => {
    if (held.current) return;
    setTier(getTier() === 0 ? 2 : getTier() - 1);
  };

  return (
    <button
      type="button"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onClick={onClick}
      className="fixed top-2 left-2 z-[100] rounded-md bg-black/75 px-2 py-1 text-left font-mono text-[11px] leading-tight text-white"
    >
      {stats.fps || "--"} fps · {stats.hz}Hz
      <br />
      tier {stats.tier}
      {stats.ceiling < 2 ? ` (max ${stats.ceiling})` : ""} · js {stats.work.toFixed(1)}ms · long {stats.longFrames}
      <br />
      init: {stats.initReason}
    </button>
  );
}
