import { useRules } from "../../groups/useRules";
import { parseRules } from "../../lib/rulesText";
import Card from "./Card";
import { HUES } from "./colors";

function Parts({ parts }) {
  return parts.map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>));
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
  const text = useRules(gid);
  const blocks = text ? groupBlocks(parseRules(text)) : [];

  return (
    <Card title="The rules" hue={HUES.rules} scribble="paper">
      {text === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-muted">Your organiser hasn't written any rules yet.</p>
      ) : (
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1 text-sm text-ink/90">
          {blocks.map((b, i) =>
            b.type === "list" ? (
              <ol key={i} className="list-decimal space-y-2 pl-5">
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Parts parts={item.parts} />
                  </li>
                ))}
              </ol>
            ) : (
              <p key={i}>
                <Parts parts={b.parts} />
              </p>
            )
          )}
        </div>
      )}
    </Card>
  );
}
