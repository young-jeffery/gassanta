import { useEffect, useRef, useState } from "react";
import { cleanNickname } from "../../lib/nickname";
import { authErrorMessage } from "../../lib/authErrors";
import { isValidEmail, suggestEmail } from "../../lib/emailTypos";
import { groupTitle } from "../../lib/groupTitle";
import { registerAndJoin } from "../../lib/registration";
import { useMediaQuery } from "../../lib/useMediaQuery";
import AuthButton from "./AuthButton";
import ErrorNote from "./ErrorNote";
import Field from "./Field";
import GroupBadge from "./GroupBadge";
import PasswordField from "./PasswordField";
import { useNicknameCheck } from "./useNicknameCheck";
import { useStage } from "./useStage";

// On phones the form comes in three short steps, so the card stays small and the snowman peeking over it stays on
// screen. From md up (snowmen beside the form) everything shows at once.
const STEPS = [
  { title: "Who are you?", fields: ["realName", "nickname"] },
  { title: "Your email", fields: ["email", "confirmEmail"] },
  { title: "Lock it up", fields: ["password", "confirmPassword"] },
];
const ORDER = STEPS.flatMap((s) => s.fields);
const stepOf = (name) => STEPS.findIndex((s) => s.fields.includes(name));
const EMPTY = { realName: "", nickname: "", email: "", confirmEmail: "", password: "", confirmPassword: "" };
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwertyuiop", "qwerty123",
  "iloveyou", "11111111", "00000000", "admin123", "christmas", "santa123", "letmein1",
]);

function validate(v, nicknameState, nicknameProblem) {
  const e = {};
  const realName = v.realName.trim().replace(/\s+/g, " ");
  if (realName.length < 2) e.realName = "Enter your real name (at least 2 characters).";
  else if (realName.length > 120) e.realName = "That name is too long.";
  if (nicknameProblem) e.nickname = nicknameProblem;
  else if (nicknameState === "taken") e.nickname = "That nickname is taken in this group. Try another.";
  if (!isValidEmail(v.email)) e.email = "Enter a valid email address.";
  if (v.confirmEmail.trim().toLowerCase() !== v.email.trim().toLowerCase()) e.confirmEmail = "The two emails don't match.";
  if (v.password.length < 8) e.password = "Use at least 8 characters.";
  if (v.confirmPassword !== v.password) e.confirmPassword = "The two passwords don't match.";
  return e;
}

// The details form. Creates the account and joins the group (lib/registration.js).
// Props: onBusy(bool) lets the page know an account is being created (so it doesn't redirect mid-way),
// onDone(info) on success, onClosed() if registration closed while the form was open.
export default function RegisterDetails({ group, code, onBusy, onDone, onClosed }) {
  const stage = useStage();
  const wizard = useMediaQuery("(max-width: 767px)");
  const formRef = useRef(null);
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0); // bumped on every press of Continue/Join that finds a problem (shows errors again)
  const [step, setStep] = useState(0);
  const [focusName, setFocusName] = useState(null); // field to focus when it appears (a new step)
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [working, setWorking] = useState(false);
  const nick = useNicknameCheck(group.id, values.nickname);

  const visible = (i) => !wizard || step === i;

  // A visible password: the snowmen look away (and the phone's peeking one ducks)
  const revealed = showPw && visible(2);
  useEffect(() => {
    stage.setRevealed(revealed);
    return () => stage.setRevealed(false);
  }, [revealed, stage]);

  const errors = validate(values, nick.state, nick.problem);
  const shown = (name) => (touched[name] || submitted ? errors[name] : "");
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setFormError(""); // the red banner is about the LAST attempt; editing starts a fresh one
  };
  const touch = (name) => setTouched((t) => ({ ...t, [name]: true }));

  const suggestion = isValidEmail(values.email) ? suggestEmail(values.email) : null;
  const nicknameStatus =
    nick.state === "checking"
      ? "Checking..."
      : nick.state === "free"
        ? { text: "Available", tone: "ok" }
        : nick.state === "error"
          ? "Couldn't check right now"
          : "";

  // Focus a field, moving to its step first when on a phone
  const goTo = (name) => {
    const target = stepOf(name);
    if (wizard && target !== step) {
      setStep(target);
      setFocusName(name);
    } else {
      formRef.current?.elements.namedItem(name)?.focus();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (working) return;
    setFormError("");
    const found = validate(values, nick.state, nick.problem);

    // Phone, not the last step yet: check this step's fields, then move on
    if (wizard && step < STEPS.length - 1) {
      const fields = STEPS[step].fields;
      setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));
      const bad = fields.find((f) => found[f]);
      if (bad) {
        setAttempts((a) => a + 1);
        stage.say("invalid");
        goTo(bad);
        return;
      }
      setStep(step + 1);
      setFocusName(STEPS[step + 1].fields[0]);
      stage.say(`step:${step + 2}`);
      return;
    }

    setSubmitted(true);
    const firstBad = ORDER.find((name) => found[name]);
    if (firstBad) {
      setAttempts((a) => a + 1);
      stage.say("invalid");
      goTo(firstBad);
      return;
    }
    setWorking(true);
    onBusy(true);
    stage.say("submit");
    try {
      const res = await registerAndJoin({
        group,
        code,
        email: values.email,
        password: values.password,
        realName: values.realName,
        nickname: values.nickname,
      });
      onDone({ group, nickname: cleanNickname(values.nickname), email: values.email.trim(), verification: res.verification });
    } catch (err) {
      if (err.code === "ss/nickname-taken") {
        nick.markTaken();
        goTo("nickname");
      }
      if (err.code === "ss/registration-closed") onClosed();
      setFormError(authErrorMessage(err));
      stage.say("error");
    } finally {
      setWorking(false);
      onBusy(false);
    }
  };

  const lastStep = !wizard || step === STEPS.length - 1;

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-1">
      {(!wizard || step === 0) && <GroupBadge group={group} />}

      {wizard && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-widest text-muted uppercase">
            Step {step + 1} of {STEPS.length} &middot; {STEPS[step].title}
          </p>
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.title} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-accent" : "bg-accent/25"}`} />
            ))}
          </div>
        </div>
      )}

      {visible(0) && (
        <>
          <Field
            label="Your real name"
            stageKey="realName"
            name="realName"
            hint="Only you and the group admins can see this."
            error={shown("realName")}
            errorKey={attempts}
            value={values.realName}
            onChange={set("realName")}
            onBlur={() => touch("realName")}
            autoComplete="name"
            autoCapitalize="words"
            autoFocus={focusName === "realName"}
          />
          <Field
            label="Nickname"
            stageKey="nickname"
            name="nickname"
            hint="Shown to everyone in the group and used in the reveal."
            status={nicknameStatus}
            error={nick.state === "taken" ? errors.nickname : shown("nickname")}
            errorKey={attempts}
            value={values.nickname}
            onChange={set("nickname")}
            onBlur={() => touch("nickname")}
            autoComplete="nickname"
            autoCorrect="off"
            maxLength={30}
            autoFocus={focusName === "nickname"}
          />
        </>
      )}

      {visible(1) && (
        <>
          <div>
            <Field
              label="Email"
              stageKey="email"
              name="email"
              type="email"
              hint="Dots and plus-signs are fine. We email you when each phase opens."
              error={shown("email")}
              errorKey={attempts}
              value={values.email}
              onChange={set("email")}
              onBlur={() => {
                touch("email");
                if (suggestion) stage.say("email:typo", { suggestion });
              }}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={focusName === "email"}
            />
            {suggestion && touched.email && (
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, email: suggestion }))}
                className="mb-1 text-left text-sm font-bold text-ink underline underline-offset-4"
              >
                Did you mean {suggestion}? Use it
              </button>
            )}
          </div>
          <Field
            label="Confirm email"
            stageKey="confirmEmail"
            name="confirmEmail"
            type="email"
            error={shown("confirmEmail")}
            errorKey={attempts}
            value={values.confirmEmail}
            onChange={set("confirmEmail")}
            onBlur={() => {
              touch("confirmEmail");
              if (values.confirmEmail) stage.say(errors.confirmEmail ? "email:mismatch" : "email:match");
            }}
            autoComplete="off"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </>
      )}

      {visible(2) && (
        <>
          <PasswordField
            label="Password"
            stageKey="password"
            name="password"
            hint="At least 8 characters."
            error={shown("password")}
            errorKey={attempts}
            value={values.password}
            onChange={set("password")}
            onBlur={() => {
              touch("password");
              if (!values.password) return;
              if (COMMON_PASSWORDS.has(values.password.toLowerCase())) stage.say("password:common");
              else stage.say(errors.password ? "password:weak" : "password:ok");
            }}
            autoComplete="new-password"
            visible={showPw}
            onToggle={() => setShowPw((v) => !v)}
            autoFocus={focusName === "password"}
          />
          <PasswordField
            label="Confirm password"
            stageKey="confirmPassword"
            name="confirmPassword"
            error={shown("confirmPassword")}
            errorKey={attempts}
            persistError
            value={values.confirmPassword}
            onChange={set("confirmPassword")}
            onBlur={() => {
              touch("confirmPassword");
              if (values.confirmPassword) stage.say(errors.confirmPassword ? "password:mismatch" : "password:match");
            }}
            autoComplete="new-password"
            visible={showPw}
            onToggle={() => setShowPw((v) => !v)}
          />
        </>
      )}

      {formError && (
        <ErrorNote alert autoHideMs={8000} onHide={() => setFormError("")} className="mb-2">
          {formError}
        </ErrorNote>
      )}

      <AuthButton busy={working}>{lastStep ? (working ? "Creating your account..." : `Join ${groupTitle(group)}`) : "Continue"}</AuthButton>
      {wizard && step > 0 && (
        <div className="mt-2">
          <AuthButton
            type="button"
            variant="secondary"
            onClick={() => {
              setStep(step - 1);
              setFocusName(null);
            }}
          >
            Back
          </AuthButton>
        </div>
      )}
    </form>
  );
}
