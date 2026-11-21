import { useRef } from "react";
import { BUBBLE_INK } from "./colors";
import Scribbles from "./Scribbles";
import { useCardFx } from "./useCardFx";
import Wave from "./Wave";

// The dashboard's card, styled like a chat bubble: a solid colour, a thick charcoal outline, a hard offset shadow and a little
// tail at the bottom-left, plus a wavy strip in a contrasting colour along the bottom edge and (with `scribble`, a kind from
// Scribbles.jsx) doodles in the corner. `tone` = one of CARDS in colors.js. Inside it, the palette colours are swapped for
// the card's own (text, inputs, buttons), so everything on a card stays readable whatever palette is active.
// Without a `tone` it is a plain translucent card (used for the dev tools). It reacts to hover/tap: see useCardFx.js.
// `right` is a slot in the title row. `highlight` rings the card (used for the current phase).
export default function Card({ title, icon, right, children, className = "", highlight = false, tone, scribble }) {
  const ref = useRef(null);
  useCardFx(ref, scribble);

  if (!tone) {
    return (
      <section className={`rounded-3xl border-2 border-accent/30 bg-surface/90 p-5 shadow-xl md:p-6 ${className}`}>
        {title && <h2 className="mb-3 font-display text-xl font-extrabold text-ink md:text-2xl">{title}</h2>}
        {children}
      </section>
    );
  }

  const style = {
    backgroundColor: tone.bg,
    color: tone.text,
    border: `3px solid ${BUBBLE_INK}`,
    boxShadow: highlight ? `0 0 0 4px ${tone.wave}, 4px 5px 0 4px ${BUBBLE_INK}` : `4px 5px 0 ${BUBBLE_INK}`,
    // the palette's colours, replaced by this card's, for everything drawn on it
    "--c-ink": tone.text,
    "--c-muted": `color-mix(in srgb, ${tone.text} 78%, ${tone.bg})`,
    "--c-accent": tone.text,
    "--c-canvas": tone.field,
    "--c-surface": tone.field,
    "--c-primary": BUBBLE_INK,
    "--c-on-primary": "#fffaf0",
  };

  return (
    <section ref={ref} style={style} className={`relative flex flex-col rounded-3xl ${className}`}>
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[21px]">
        {scribble && <Scribbles kind={scribble} />}
        <div data-fx aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />
        <div className="relative z-10 flex flex-1 flex-col p-5 pb-10 md:p-6 md:pb-11">
          {(title || right) && (
            <header className="mb-3 flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold md:text-2xl">
                {icon}
                {title}
              </h2>
              {right}
            </header>
          )}
          {children}
        </div>
        <Wave color={tone.wave} />
      </div>
      {/* the bubble's tail */}
      <span
        aria-hidden="true"
        className="absolute -bottom-[11px] left-10 h-5 w-5 rotate-45"
        style={{ background: tone.wave, borderRight: `3px solid ${BUBBLE_INK}`, borderBottom: `3px solid ${BUBBLE_INK}` }}
      />
    </section>
  );
}
