import { useRef } from "react";
import { useRules } from "../../groups/useRules";
import { parseRules } from "../../lib/rulesText";
import { BUBBLE_INK } from "./colors";
import { useCardFx } from "./useCardFx";
import Wave from "./Wave";

// The rules card has its own Christmas design: a candy-cane frame around a cream parchment, holly in the top corners, a
// red ribbon for the title, rules numbered with coloured baubles, and a snowdrift along the bottom. (Its colours are fixed on
// purpose, so it looks like a card of rules on every palette.) Hover/tap reaction: useCardFx.js.
const PAPER = "#fff6e0";
const TEXT = "#3b2a1a";
const RED = "#d92d20";
const GREEN = "#1f7a47";
const GOLD = "#e8a317";
const BAUBLES = [RED, GREEN, GOLD];
const CANDY = `repeating-linear-gradient(45deg, ${RED} 0 14px, #fffaf0 14px 28px)`;

function Holly({ className }) {
  return (
    <svg viewBox="0 0 80 56" aria-hidden="true" className={className}>
      <path d="M40 32 C34 14 14 8 4 20 C12 22 16 28 24 28 C28 38 36 38 40 32 Z" fill={GREEN} stroke={BUBBLE_INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 32 C46 14 66 8 76 20 C68 22 64 28 56 28 C52 38 44 38 40 32 Z" fill={GREEN} stroke={BUBBLE_INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="34" cy="39" r="6" fill={RED} stroke={BUBBLE_INK} strokeWidth="2.5" />
      <circle cx="46" cy="39" r="6" fill={RED} stroke={BUBBLE_INK} strokeWidth="2.5" />
      <circle cx="40" cy="47" r="6" fill={RED} stroke={BUBBLE_INK} strokeWidth="2.5" />
      <circle cx="32" cy="37" r="1.6" fill="#fff" />
      <circle cx="44" cy="37" r="1.6" fill="#fff" />
      <circle cx="38" cy="45" r="1.6" fill="#fff" />
    </svg>
  );
}

function Parts({ parts }) {
  return parts.map((p, i) => (p.bold ? <strong key={i} className="font-extrabold text-[#a3201a]">{p.text}</strong> : <span key={i}>{p.text}</span>));
}

// Paragraphs stay paragraphs; consecutive numbered lines become one list. Order is exactly as the admin wrote it.
function groupBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "li" && last?.type === "list") last.items.push(b);
    else if (b.type === "li") out.push({ type: "list", items: [b] });
    else out.push(b);
  }
  return out;
}

// The group's rules, live (an admin edit shows up without reloading).
export default function RulesCard({ gid }) {
  const ref = useRef(null);
  useCardFx(ref, "paper");
  const text = useRules(gid);
  const blocks = text ? groupBlocks(parseRules(text)) : [];

  return (
    <section
      ref={ref}
      className="relative rounded-[28px]"
      style={{ padding: 10, background: CANDY, border: `3px solid ${BUBBLE_INK}`, boxShadow: `4px 5px 0 ${BUBBLE_INK}` }}
    >
      <div className="relative overflow-hidden rounded-[18px]" style={{ background: PAPER, color: TEXT, border: `3px solid ${BUBBLE_INK}` }}>
        <Holly className="absolute -top-1 -left-3 z-10 h-14 w-20 -rotate-12" />
        <Holly className="absolute -top-1 -right-3 z-10 h-14 w-20 scale-x-[-1] -rotate-12" />
        <div data-fx aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />

        <div className="relative z-10 px-5 pt-5 pb-11 md:px-6">
          {/* the ribbon */}
          <div className="mx-auto mb-4 w-fit" style={{ filter: `drop-shadow(2px 3px 0 ${BUBBLE_INK})` }}>
            <h2
              className="px-10 py-1.5 font-display text-xl font-extrabold tracking-wide text-white"
              style={{ background: RED, clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)", textShadow: "0 2px 0 rgba(0,0,0,0.25)" }}
            >
              The Rules
            </h2>
          </div>

          {text === null ? (
            <p className="text-center text-sm opacity-70">Loading...</p>
          ) : blocks.length === 0 ? (
            <p className="text-center text-sm opacity-70">Your organiser hasn't written any rules yet.</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1 text-sm leading-relaxed">
              {blocks.map((b, i) =>
                b.type === "list" ? (
                  <ol key={i} className="list-none space-y-3">
                    {b.items.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="relative mt-0.5 shrink-0">
                          <span
                            className="grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-extrabold text-white"
                            style={{ background: BAUBLES[j % BAUBLES.length], borderColor: BUBBLE_INK, boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.22)" }}
                          >
                            {j + 1}
                          </span>
                          <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-2 w-3 -translate-x-1/2 rounded-sm" style={{ background: GOLD, border: `1.5px solid ${BUBBLE_INK}` }} />
                        </span>
                        <span>
                          <Parts parts={item.parts} />
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p key={i} className="font-display italic">
                    <Parts parts={b.parts} />
                  </p>
                )
              )}
            </div>
          )}
        </div>
        <Wave color="#d9efff" />
      </div>
    </section>
  );
}
