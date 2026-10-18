import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { PALETTES, DEFAULT_PALETTE_ID } from "./palettes";
import { contrastRatio } from "./contrast";
import { ThemeContext } from "./themeContext";

const STORAGE_KEY = "ss-palette";

function readStoredId() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return PALETTES.some((p) => p.id === id) ? id : DEFAULT_PALETTE_ID;
  } catch {
    return DEFAULT_PALETTE_ID; // storage can be blocked (private mode)
  }
}

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
  root.style.colorScheme = mode;

  // Tint the phone's browser bar to match the page
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c.canvas);
}

export default function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState(readStoredId);

  const palette = useMemo(() => PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0], [paletteId]);

  // Layout effect so the colors change before the browser paints
  useLayoutEffect(() => {
    applyPalette(palette);
    try {
      localStorage.setItem(STORAGE_KEY, palette.id);
    } catch {
      /* ignore */
    }
  }, [palette]);

  // Dev only: warn in the console when a palette has poor text contrast
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const p of PALETTES) {
      const checks = [
        ["ink on canvas", p.colors.ink, p.colors.canvas],
        ["onPrimary on primary", p.colors.onPrimary, p.colors.primary],
      ];
      for (const [label, fg, bg] of checks) {
        const ratio = contrastRatio(fg, bg);
        if (ratio < 4.5) console.warn(`[palette: ${p.name}] ${label} contrast is ${ratio.toFixed(2)} (want 4.5+)`);
      }
    }
  }, []);

  const value = useMemo(() => ({ palette, palettes: PALETTES, setPaletteId }), [palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
