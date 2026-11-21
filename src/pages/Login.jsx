import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { sfx } from "../audio/sfx";
import AuthButton from "../components/auth/AuthButton";
import AuthShell from "../components/auth/AuthShell";
import ErrorNote from "../components/auth/ErrorNote";
import Field from "../components/auth/Field";
import PasswordField from "../components/auth/PasswordField";
import { useStage } from "../components/auth/useStage";
import { authErrorMessage } from "../lib/authErrors";

// The form lives in its own component because it needs useStage(), which only works inside <AuthShell>.
// On success the route wrapper (RedirectIfAuthed) moves the person on: no navigate() here.
function LoginForm() {
  const stage = useStage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // A visible password: the snowmen look away (and the phone's peeking one ducks)
  useEffect(() => {
    stage.setRevealed(showPw);
    return () => stage.setRevealed(false);
  }, [showPw, stage]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!email.trim() || !password) {
      setError(!email.trim() ? "Enter your email address." : "Enter your password.");
      stage.say("login:empty");
      e.currentTarget.elements.namedItem(!email.trim() ? "email" : "password")?.focus();
      return;
    }
    setBusy(true);
    stage.say("login:submit");
    try {
      await signIn(email, password);
      sfx.chime(3);
    } catch (err) {
      setError(authErrorMessage(err));
      stage.say("login:error");
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-1">
      <Field
        label="Email"
        stageKey="loginEmail"
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
      <PasswordField
        label="Password"
        stageKey="loginPassword"
        name="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
        autoComplete="current-password"
        visible={showPw}
        onToggle={() => setShowPw((v) => !v)}
      />
      {error && (
        <ErrorNote alert autoHideMs={8000} onHide={() => setError("")} className="mb-2">
          {error}
        </ErrorNote>
      )}
      <AuthButton busy={busy}>{busy ? "Logging in..." : "Log in"}</AuthButton>
      <p className="mt-3 text-center text-sm">
        <Link to="/forgot" className="font-bold text-ink underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

// /login: same frame as register (snowmen on the left, form on the right)
export default function Login() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your group."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-bold underline underline-offset-4">
            Register with a join code
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
