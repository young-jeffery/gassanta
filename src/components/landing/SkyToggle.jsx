import { createPortal } from "react-dom";
import { useTheme } from "../../theme/useTheme";
import { CELESTIAL } from "./sceneArt";

// The sun/moon IS the day/night switch. The scene itself is decoration (aria-hidden, pointer-events none, under the
// page content), so the real control is this invisible 72px button laid over it: keyboard focusable, with a label
// for screen readers. Tapping it swaps the colors with a circular reveal growing out of the button.
//
// Rendered through a portal into <body>. Inside the page, <main> keeps a leftover transform from its enter animation,
// and an element with a transform becomes the reference for `position: fixed` children. On desktop <main> is only
// 80% of the screen wide, so the button landed at 84% of THAT (away from the moon, under other content). On phones
// <main> is full width, which is why it only worked there.
export default function SkyToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  const isDay = colorMode === "day";

  const onClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    toggleColorMode({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={isDay ? "Switch to night mode" : "Switch to day mode"}
      className="fixed z-20 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{ left: `calc(${CELESTIAL.x} - 36px)`, top: `calc(${CELESTIAL.y} - 36px)`, width: 72, height: 72 }}
    />,
    document.body
  );
}
