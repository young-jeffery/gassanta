import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthButton from "../components/auth/AuthButton";
import AuthShell from "../components/auth/AuthShell";
import ErrorNote from "../components/auth/ErrorNote";
import Field from "../components/auth/Field";
import { useStage } from "../components/auth/useStage";
import { authErrorMessage } from "../lib/authErrors";
import { isValidEmail } from "../lib/emailTypos";

const RESEND_SECONDS = 30;

// Needs useStage(), so it lives inside <AuthShell>.
function ForgotForm() {
  const stage = useStage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [wait, setWait] = useState(0); // seconds until "send again" works

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async (address) => {
    setBusy(true);
    setError("");
    try {
      await resetPassword(address);
      setSentTo(address.trim());
      setWait(RESEND_SECONDS);
      stage.say("forgot:sent");
    } catch (err) {
      setError(authErrorMessage(err));
      stage.say("error");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (!isValidEmail(email)) {
      setError("Enter the email address you signed up with.");
      stage.say("invalid");
      return;
    }
    send(email);
  };

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl border border-accent/30 bg-canvas/40 px-4 py-3 text-sm text-ink/90">
          If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. It can take a minute. Check your spam folder too.
        </p>
        <AuthButton type="button" variant="secondary" disabled={wait > 0 || busy} onClick={() => send(sentTo)}>
          {wait > 0 ? `Send again in ${wait}s` : "Send it again"}
        </AuthButton>
        {error && (
          <ErrorNote alert autoHideMs={8000} onHide={() => setError("")}>
            {error}
          </ErrorNote>
        )}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-1">
      <Field
        label="Email"
        stageKey="forgotEmail"
        name="email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      {error && (
        <ErrorNote alert autoHideMs={8000} onHide={() => setError("")} className="mb-2">
          {error}
        </ErrorNote>
      )}
      <AuthButton busy={busy}>{busy ? "Sending..." : "Send reset link"}</AuthButton>
    </form>
  );
}

// /forgot: same frame as register and login (snowmen on the left, form on the right)
export default function ForgotPassword() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-bold underline underline-offset-4">
          &larr; Back to log in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
