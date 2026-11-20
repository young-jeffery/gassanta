import { useNavigate } from "react-router-dom";
import AuthButton from "../auth/AuthButton";
import Card from "./Card";
import { TitleScribble } from "./Scribbles";
import Tag from "./Tag";

// One phase of the Secret Santa (registration / preferences / reveal): its status tag, what it is, its date, and a
// button when there is something to do. `action` = { label, to, disabled } or null. `hue` / `scribble` give it its
// own colour and doodles (colors.js, Scribbles.jsx).
export default function PhaseCard({ step, title, icon, state, description, deadline, action, hue, scribble }) {
  const navigate = useNavigate();
  const active = state.tone === "open" || state.tone === "progress";

  return (
    <Card highlight={active} hue={hue} scribble={scribble}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span style={{ color: "color-mix(in srgb, var(--card-hue) 75%, var(--c-ink))" }}>{icon}</span>
          <div>
            <p className="text-xs font-bold tracking-widest text-muted uppercase">Phase {step}</p>
            <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
            <TitleScribble />
          </div>
        </div>
        <Tag tone={state.tone}>{state.label}</Tag>
      </div>
      <p className="text-sm text-ink/90">{description}</p>
      <p className="mt-2 text-sm font-bold text-ink/70">{deadline}</p>
      {action && (
        <div className="mt-4 pt-1">
          <AuthButton type="button" disabled={action.disabled} onClick={() => navigate(action.to)}>
            {action.label}
          </AuthButton>
        </div>
      )}
    </Card>
  );
}
