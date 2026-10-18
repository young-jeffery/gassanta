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
    mode: "dark",
    colors: {
      canvas: "#7F1A1C", // Christmas Red
      surface: "#192B23", // Fresh Pine
      primary: "#FCF1DB", // Snowfall
      onPrimary: "#7F1A1C",
      accent: "#7B925E", // Merry Mint
      ink: "#FCF1DB",
      snow: "#FCF1DB",
    },
  },
  {
    id: "classic-christmas",
    name: "Classic Christmas",
    mode: "dark",
    colors: {
      canvas: "#2F5D3A", // green
      primary: "#B3122B", // red
      onPrimary: "#F6EEDC", // ivory
      accent: "#C9A24A", // gold
      ink: "#F6EEDC",
      snow: "#F6EEDC",
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
    mode: "dark",
    colors: {
      canvas: "#6B1E3A", // plum
      primary: "#F4C6D0", // blush pink
      onPrimary: "#6B1E3A",
      accent: "#D9788A", // rose
      ink: "#F5EBD6", // cream
      snow: "#F4C6D0",
    },
  },
  {
    id: "gingerbread",
    name: "Gingerbread",
    mode: "dark",
    colors: {
      canvas: "#9A4F1E", // brown
      primary: "#234A2F", // green
      onPrimary: "#F7EDD8", // cream
      accent: "#C9954A", // caramel
      ink: "#F7EDD8",
      snow: "#F7EDD8",
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
