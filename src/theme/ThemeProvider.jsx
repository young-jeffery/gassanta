import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { PALETTES, DEFAULT_PALETTE_ID } from "./palettes";
import { contrastRatio } from "./contrast";
import { resolvePalette } from "./variants";
import { ThemeContext } from "./themeContext";
import { prefersReducedMotion } from "../lib/motion";

const PALETTE_KEY = "ss-palette";
const MODE_KEY = "ss-mode"; // "auto" (follow the device) | "day" | "night"

function readStoredId() {
  try {
    const id = localStorage.getItem(PALETTE_KEY);
    return PALETTES.some((p) => p.id === id) ? id : DEFAULT_PALETTE_ID;
  } catch {
    return DEFAULT_PALETTE_ID; // storage can be blocked (private mode)
  }
}

function readStoredMode() {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === "day" || m === "night" ? m : "auto";
  } catch {
    return "auto";
  }
}

const deviceIsDay = () => window.matchMedia("(prefers-color-scheme: light)").matches;

// Writes the palette onto <html> as CSS variables. Tailwind utilities read these (see index.css).
function applyPalette(palette) {
  const { colors: c, mode } = palette;
  const light = mode === "light";
  const root = document.documentElement;

  const vars = {
    "--c-canvas": c.canvas,
    "--c-surface": c.surface ?? `color-mix(in srgb, var(--c-canvas) ${light ? 50 : 88}%, white)`,
    "--c-primary": c.primary,
    "--c-on-primary": c.onPrimary,
    "--c-accent": c.accent,
    "--c-ink": c.ink,
    "--c-muted": c.muted ?? "color-mix(in srgb, var(--c-ink) 68%, var(--c-canvas))",
    "--c-snow": c.snow,
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);

  root.dataset.theme = palette.id;
  root.dataset.mode = palette.colorMode; // "day" | "night": scene and animations read this
  root.style.colorScheme = mode;

  // Tint the phone's browser bar to match the page
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c.canvas);
}

export default function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState(readStoredId);
  const [modeSetting, setModeSetting] = useState(readStoredMode);
  const [systemDay, setSystemDay] = useState(deviceIsDay);

  // Follow the device's light/dark setting live (only matters while the setting is "auto")
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemDay(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const colorMode = modeSetting === "auto" ? (systemDay ? "day" : "night") : modeSetting;

  const palette = useMemo(() => {
    const base = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
    return resolvePalette(base, colorMode);
  }, [paletteId, colorMode]);

  // Every palette in the current mode (the palette sheet previews these)
  const palettes = useMemo(() => PALETTES.map((p) => resolvePalette(p, colorMode)), [colorMode]);

  // Layout effect so the colors change before the browser paints
  useLayoutEffect(() => {
    applyPalette(palette);
    try {
      localStorage.setItem(PALETTE_KEY, palette.id);
    } catch {
      /* ignore */
    }
  }, [palette]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, modeSetting);
    } catch {
      /* ignore */
    }
  }, [modeSetting]);

  // Switch day/night. With View Transitions (Chrome, Edge, Safari 18+, newer Firefox) the new colors are revealed
  // by a circle growing out of the sun/moon (or the button you pressed); the GPU does the crossfade, so it costs
  // nothing on the page. Without browser support, or with reduced motion, it swaps instantly. It is NOT tied to the
  // performance tier: the reveal is a one-off compositor animation, and skipping it on "weak" phones made the
  // switch look random.
  const setMode = useCallback((next, origin) => {
    const apply = () => flushSync(() => setModeSetting(next));
    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      apply();
      return;
    }
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        const x = origin?.x ?? window.innerWidth * 0.84;
        const y = origin?.y ?? window.innerHeight * 0.12;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 750, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {
        /* the transition was skipped; the swap already happened */
      });
  }, []);

  const toggleColorMode = useCallback((origin) => setMode(colorMode === "day" ? "night" : "day", origin), [colorMode, setMode]);

  // Dev only: warn in the console when a palette has poor contrast in either mode
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const mode of ["night", "day"]) {
      for (const p of PALETTES.map((x) => resolvePalette(x, mode))) {
        const checks = [
          ["ink on canvas", p.colors.ink, p.colors.canvas, 4.5],
          ["onPrimary on primary", p.colors.onPrimary, p.colors.primary, 4.5],
          ["accent on canvas (decoration)", p.colors.accent, p.colors.canvas, 1.8],
        ];
        for (const [label, fg, bg, min] of checks) {
          const ratio = contrastRatio(fg, bg);
          if (ratio < min) console.warn(`[palette: ${p.name}, ${mode}] ${label} contrast is ${ratio.toFixed(2)} (want ${min}+)`);
        }
      }
    }
    // index.html paints the saved canvas before React loads. If it disagrees with what we computed, regenerate it.
    const boot = window.__ssBoot;
    if (boot && boot.canvas.toLowerCase() !== palette.colors.canvas.toLowerCase() && boot.mode === colorMode && boot.id === palette.id) {
      console.warn(`[theme] index.html first-paint color ${boot.canvas} differs from ${palette.colors.canvas}: update its color table.`);
    }
  }, [palette, colorMode]);

  const value = useMemo(
    () => ({ palette, palettes, setPaletteId, colorMode, modeSetting, setMode, toggleColorMode }),
    [palette, palettes, colorMode, modeSetting, setMode, toggleColorMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
