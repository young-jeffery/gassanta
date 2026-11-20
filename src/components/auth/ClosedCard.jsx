import { useEffect } from "react";
import { Link } from "react-router-dom";
import { groupTitle } from "../../lib/groupTitle";
import AuthButton from "./AuthButton";
import GroupBadge from "./GroupBadge";
import { useStage } from "./useStage";

// Shown when a valid code belongs to a group whose registration is closed.
export default function ClosedCard({ group, onBack, showLogin = true }) {
  const stage = useStage();

  const title = groupTitle(group);
  useEffect(() => {
    stage.say("code:closed", { group: title });
  }, [stage, title]);

  return (
    <div className="flex flex-col gap-4">
      <GroupBadge group={group} />
      <p className="text-sm text-ink/90">
        The organiser has closed sign-ups for this group. If that's a mistake, ask them to reopen registration, then try again.
      </p>
      <AuthButton type="button" variant="secondary" onClick={onBack}>
        Try another code
      </AuthButton>
      {showLogin && (
        <p className="text-center text-sm text-ink/90">
          Already have an account?{" "}
          <Link to="/login" className="font-bold underline underline-offset-4">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
