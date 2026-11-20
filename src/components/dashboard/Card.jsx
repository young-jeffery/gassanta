import Scribbles, { TitleScribble } from "./Scribbles";

// The dashboard's card: rounded, outlined, with a title row. With a `hue` (see colors.js) it is tinted in that colour, has
// a hand-drawn underline under its title, and (with `scribble`, a kind from Scribbles.jsx) doodles in the corner.
// `right` is a slot in the title row. `highlight` draws a glowing ring in the hue (used for the current phase).
export default function Card({ title, icon, right, children, className = "", highlight = false, hue, scribble }) {
  const style = hue
    ? {
        "--card-hue": hue,
        backgroundColor: "color-mix(in srgb, var(--card-hue) 34%, var(--c-canvas))",
        borderColor: "color-mix(in srgb, var(--card-hue) 75%, transparent)",
        boxShadow: highlight ? "0 0 0 4px color-mix(in srgb, var(--card-hue) 45%, transparent), 0 20px 25px -5px rgb(0 0 0 / 0.25)" : undefined,
      }
    : undefined;

  return (
    <section
      style={style}
      className={`relative overflow-hidden rounded-3xl border-2 p-5 shadow-xl md:p-6 ${hue ? "" : "border-accent/30 bg-surface/90"} ${className}`}
    >
      {hue && scribble && <Scribbles kind={scribble} />}
      <div className="relative z-10 flex h-full flex-col">
        {(title || right) && (
          <header className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink md:text-2xl">
                {icon}
                {title}
              </h2>
              {hue && <TitleScribble />}
            </div>
            {right}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
