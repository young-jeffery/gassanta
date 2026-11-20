import { useCallback, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthShell from "../components/auth/AuthShell";
import ClosedCard from "../components/auth/ClosedCard";
import CodeStep from "../components/auth/CodeStep";
import DoneCard from "../components/auth/DoneCard";
import RegisterDetails from "../components/auth/RegisterDetails";
import { maskEmail } from "../lib/emailTypos";
import { groupTitle } from "../lib/groupTitle";

const TITLES = {
  code: ["Join a Secret Santa", "Enter the code your organiser sent you."],
  details: ["Create your account", "A minute, and you're in."],
  closed: ["Registration is closed", null],
  done: ["You're in!", null],
};

function verificationText(info) {
  const to = maskEmail(info.email);
  if (info.verification === true) return `We sent a verification email to ${to}. You don't need to open it to carry on.`;
  if (info.verification === false) return "We couldn't send the verification email right now, but you can carry on.";
  return `We're sending a verification email to ${to}. You don't need to wait for it.`;
}

// /register: step 1 join code (prefilled from an invite link like /register?code=ABCD2345), step 2 the details form.
// Already signed in? You can't register twice, so you're sent to /join (same code). Not while an account is being
// created though: creating it signs the person in half-way through, and this page must finish writing their profile.
export default function Register() {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [flow, setFlow] = useState({ step: "code" });
  const [busy, setBusy] = useState(false);

  const onFound = useCallback(({ code, group }) => {
    setFlow(group.stage === "registration" ? { step: "details", code, group } : { step: "closed", group });
  }, []);

  if (status === "signedIn" && !busy && flow.step !== "done") {
    return <Navigate to={params.get("code") ? `/join${location.search}` : "/dashboard"} replace />;
  }

  const [title, subtitle] = TITLES[flow.step];

  return (
    <AuthShell
      side="right"
      title={title}
      subtitle={subtitle}
      footer={
        flow.step === "done" ? null : (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-bold underline underline-offset-4">
              Log in
            </Link>
          </>
        )
      }
    >
      {flow.step === "code" && <CodeStep initialCode={params.get("code") ?? ""} onFound={onFound} />}

      {flow.step === "details" && (
        <RegisterDetails
          group={flow.group}
          code={flow.code}
          onBusy={setBusy}
          onDone={(info) => setFlow({ step: "done", ...info })}
          onClosed={() => setFlow({ step: "closed", group: flow.group })}
        />
      )}

      {flow.step === "closed" && <ClosedCard group={flow.group} onBack={() => setFlow({ step: "code" })} />}

      {flow.step === "done" && (
        <DoneCard name={flow.nickname} actionLabel="Go to my dashboard" onAction={() => navigate(`/g/${flow.group.id}/dashboard`)}>
          <p>
            Welcome to {groupTitle(flow.group)}, {flow.nickname}.
          </p>
          <p>{verificationText(flow)}</p>
        </DoneCard>
      )}
    </AuthShell>
  );
}
