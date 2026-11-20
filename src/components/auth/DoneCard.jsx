import { useEffect } from "react";
import { sfx } from "../../audio/sfx";
import AuthButton from "./AuthButton";
import { useStage } from "./useStage";

// The "you're in" screen: the snowmen cheer and congratulate. `name` is the person's nickname.
export default function DoneCard({ name, children, actionLabel, onAction }) {
  const stage = useStage();

  useEffect(() => {
    stage.cheer();
    sfx.wish();
    stage.say("success", { name });
  }, [stage, name]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-sm text-ink/90">{children}</div>
      <AuthButton type="button" onClick={onAction}>
        {actionLabel}
      </AuthButton>
    </div>
  );
}
