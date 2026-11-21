import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGroup } from "../groups/useGroup";
import AuthShell from "../components/auth/AuthShell";
import AuthButton from "../components/auth/AuthButton";
import ClosedCard from "../components/auth/ClosedCard";
import CodeStep from "../components/auth/CodeStep";
import DoneCard from "../components/auth/DoneCard";
import GroupBadge from "../components/auth/GroupBadge";
import { groupTitle } from "../lib/groupTitle";
import JoinDetails from "../components/auth/JoinDetails";

const TITLES = {
  code: ["Join a group", "Enter the code your organiser sent you."],
  details: ["Almost there", "Your nickname is per group, so you can use a different one here."],
  closed: ["Registration is closed", null],
  already: ["You're already in", null],
  done: ["You're in!", null],
};

// /join (signed-in only): add another group to an account you already have. Same code step as /register, then just
// a real name and a nickname for that group.
export default function Join() {
  const { groups } = useGroup();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [flow, setFlow] = useState({ step: "code" });
  const [busy, setBusy] = useState(false);

  const onFound = useCallback(({ code, group }) => {
    setFlow(group.stage === "registration" ? { step: "details", code, group } : { step: "closed", group });
  }, []);

  // Joined already (checked live, but not while we ourselves are joining: our own write shows up in `groups` first)
  const alreadyIn = flow.step === "details" && !busy && groups.some((g) => g.id === flow.group.id);
  const step = alreadyIn ? "already" : flow.step;
  const [title, subtitle] = TITLES[step];
  const goTo = (gid) => navigate(`/g/${gid}/dashboard`);

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {step === "code" && <CodeStep initialCode={params.get("code") ?? ""} onFound={onFound} />}

      {step === "details" && (
        <JoinDetails
          group={flow.group}
          code={flow.code}
          onBusy={setBusy}
          onDone={(info) => setFlow({ step: "done", ...info })}
          onClosed={() => setFlow({ step: "closed", group: flow.group })}
        />
      )}

      {step === "closed" && <ClosedCard group={flow.group} showLogin={false} onBack={() => setFlow({ step: "code" })} />}

      {step === "already" && (
        <div className="flex flex-col gap-4">
          <GroupBadge group={flow.group} />
          <p className="text-sm text-ink/90">Your account is already a member of this group.</p>
          <AuthButton type="button" onClick={() => goTo(flow.group.id)}>
            Open its dashboard
          </AuthButton>
        </div>
      )}

      {step === "done" && (
        <DoneCard name={flow.nickname} actionLabel="Go to the dashboard" onAction={() => goTo(flow.group.id)}>
          <p>
            Welcome to {groupTitle(flow.group)}, {flow.nickname}.
          </p>
        </DoneCard>
      )}
    </AuthShell>
  );
}
