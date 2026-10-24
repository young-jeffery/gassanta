import { useTheme } from "../theme/useTheme";
import { CheckIcon } from "./Icons";

const MODES = [
  { value: "auto", label: "Device" },
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];

function ModeSwitch() {
  const { modeSetting, colorMode, setMode } = useTheme();

  const pick = (e, value) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMode(value, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); // the reveal grows from this button
  };

  return (
    <div className="mb-4">
      <div role="group" aria-label="Light or dark" className="flex gap-1 rounded-2xl bg-ink/10 p-1">
        {MODES.map((m) => {
          const active = modeSetting === m.value;
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={active}
              onClick={(e) => pick(e, m.value)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                active ? "bg-primary text-on-primary" : "text-ink hover:bg-ink/10"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {modeSetting === "auto" ? `Following your device: it's ${colorMode} here.` : "Tip: you can also tap the sun or moon on the home page."}
      </p>
    </div>
  );
}

// Mode switch + grid of palette cards. Tap a card to switch the whole site's colors.
// Cards preview each palette in the CURRENT mode (day or night).
export default function PalettePanel() {
  const { palette, palettes, setPaletteId } = useTheme();

  return (
    <div>
      <ModeSwitch />
      <div className="grid grid-cols-2 gap-3">
        {palettes.map((p) => {
          const active = p.id === palette.id;
          const { canvas, primary, accent, ink } = p.colors;
          return (
            <button
              key={p.id}
              onClick={() => setPaletteId(p.id)}
              aria-pressed={active}
              className={`relative rounded-2xl border-2 p-3 text-left transition active:scale-95 ${
                active ? "border-accent bg-ink/10" : "border-transparent bg-ink/5 hover:bg-ink/10"
              }`}
            >
              <div className="mb-2 flex overflow-hidden rounded-lg ring-1 ring-ink/20">
                {[canvas, primary, accent, ink].map((c, i) => (
                  <span key={i} className="h-8 flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="block text-sm font-bold leading-tight text-ink">{p.name}</span>
              {active && (
                <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-on-primary">
                  <CheckIcon width={12} height={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
