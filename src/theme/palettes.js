// Single source of truth for every palette.
//
// Roles (each palette fills these in):
//   canvas      page background
//   surface     cards and sheets. Optional: derived from canvas if omitted.
//   primary     main buttons and strong highlights
//   onPrimary   text/icons placed ON primary
//   accent      decoration: borders, icons, glows. Often too light for body text.
//   ink         main text color
//   muted       secondary text. Optional: derived from ink + canvas if omitted.
//   snow        color of the falling snow
//
// "mode" tells the browser whether this is a light or dark theme (form controls, scrollbars).
//
// NOTE: "Default" and "Christmas At Grace" use the exact hex codes from the reference images.
// The five palettes from the "Five Holiday Color Palettes" image had no hex codes, so those
// values are eyeballed. Eyedrop the image and correct any that look off.

export const DEFAULT_PALETTE_ID = "default";

export const PALETTES = [
  {
    id: "default",
    name: "Default",
    mode: "dark",
    colors: {
      canvas: "#0D1C20", // Midnight
      surface: "#0A3D3A", // Peacock
      primary: "#6A161C", // Holly Berry
      onPrimary: "#FAECD8", // Vanilla
      accent: "#FAECD8",
      ink: "#FAECD8",
      snow: "#FAECD8",
    },
  },
  {
    id: "christmas-at-grace",
    name: "Christmas At Grace",
    mode: "light",
    colors: {
      canvas: "#FCF1DB", // Snowfall
      primary: "#7F1A1C", // Christmas Red
      onPrimary: "#FCF1DB",
      accent: "#7B925E", // Merry Mint
      ink: "#192B23", // Fresh Pine
      muted: "#563A25", // Hot Chocolate
      snow: "#7B925E",
    },
  },
  {
    id: "classic-christmas",
    name: "Classic Christmas",
    mode: "light",
    colors: {
      canvas: "#F6EEDC", // ivory
      primary: "#B3122B", // red
      onPrimary: "#F6EEDC",
      accent: "#C9A24A", // gold
      ink: "#2F5D3A", // green
      snow: "#C9A24A",
    },
  },
  {
    id: "snowy-woodland",
    name: "Snowy Woodland",
    mode: "light",
    colors: {
      canvas: "#F4EFE3", // cream
      primary: "#1F4A32", // forest green
      onPrimary: "#F4EFE3",
      accent: "#8FA87F", // sage
      ink: "#1F4A32",
      snow: "#BDB1A2", // taupe
    },
  },
  {
    id: "sugarplum",
    name: "Sugarplum",
    mode: "light",
    colors: {
      canvas: "#F5EBD6", // cream
      surface: "#F4C6D0", // blush pink
      primary: "#6B1E3A", // plum
      onPrimary: "#F5EBD6",
      accent: "#D9788A", // rose
      ink: "#6B1E3A",
      snow: "#D9788A",
    },
  },
  {
    id: "gingerbread",
    name: "Gingerbread",
    mode: "light",
    colors: {
      canvas: "#F7EDD8", // cream
      primary: "#9A4F1E", // brown
      onPrimary: "#F7EDD8",
      accent: "#C9954A", // caramel
      ink: "#234A2F", // green
      snow: "#C9954A",
    },
  },
  {
    id: "frosted-night",
    name: "Frosted Night",
    mode: "dark",
    colors: {
      canvas: "#1B2A4A", // navy
      primary: "#A9C7E0", // ice blue
      onPrimary: "#1B2A4A",
      accent: "#BDBDC0", // grey
      ink: "#F5F5F5",
      snow: "#FFFFFF",
    },
  },
];
