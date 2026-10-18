import { useTheme } from "../theme/useTheme";
import { CheckIcon } from "./Icons";

// Grid of palette cards. Tap one to switch the whole site's colors.
export default function PalettePanel() {
  const { palette, palettes, setPaletteId } = useTheme();

  return (
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
  );
}
