import { useContext } from "react";
import { ThemeContext } from "./themeContext";

// const { palette, palettes, setPaletteId } = useTheme();
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
