import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { cleanNickname } from "../../lib/nickname";
import { authErrorMessage } from "../../lib/authErrors";
import { groupTitle } from "../../lib/groupTitle";
import { joinExistingAccount } from "../../lib/registration";
import AuthButton from "./AuthButton";
import ErrorNote from "./ErrorNote";
import Field from "./Field";
import GroupBadge from "./GroupBadge";
import { useNicknameCheck } from "./useNicknameCheck";
import { useStage } from "./useStage";

// Step 2 of "Join a group" for someone who already has an account: just a real name and a nickname for THIS group.
export default function JoinDetails({ group, code, onBusy, onDone, onClosed }) {
  const { user } = useAuth();
  const stage = useStage();
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [formError, setFormError] = useState("");
  const [working, setWorking] = useState(false);
  const nick = useNicknameCheck(group.id, nickname);

  const trimmedName = realName.trim().replace(/\s+/g, " ");
  const errors = {};
  if (trimmedName.length < 2) errors.realName = "Enter your real name (at least 2 characters).";
  if (nick.problem) errors.nickname = nick.problem;
  else if (nick.state === "taken") errors.nickname = "That nickname is taken in this group. Try another.";
  const shown = (name) => (touched[name] || submitted ? errors[name] : "");
  const nicknameStatus =
    nick.state === "checking"
      ? "Checking..."
      : nick.state === "free"
        ? { text: "Available", tone: "ok" }
        : nick.state === "error"
          ? "Couldn't check right now"
          : "";

  const onSubmit = async (e) => {
    e.preventDefault();
    if (working) return;
    setSubmitted(true);
    setFormError("");
    const firstBad = ["realName", "nickname"].find((name) => errors[name]);
    if (firstBad) {
      setAttempts((a) => a + 1);
      stage.say("invalid");
      e.currentTarget.elements.namedItem(firstBad)?.focus();
      return;
    }
    setWorking(true);
    onBusy(true);
    stage.say("submit");
    try {
      await joinExistingAccount({ user, group, code, realName, nickname });
      onDone({ group, nickname: cleanNickname(nickname) });
    } catch (err) {
      if (err.code === "ss/nickname-taken") nick.markTaken();
      if (err.code === "ss/registration-closed") onClosed();
      setFormError(authErrorMessage(err));
      stage.say("error");
    } finally {
      setWorking(false);
      onBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-1">
      <GroupBadge group={group} />
      <Field
        label="Your real name"
        stageKey="realName"
        name="realName"
        hint="Only you and this group's admins can see this."
        error={shown("realName")}
        errorKey={attempts}
        value={realName}
        onChange={(e) => {
          setRealName(e.target.value);
          setFormError("");
        }}
        onBlur={() => setTouched((t) => ({ ...t, realName: true }))}
        autoComplete="name"
        autoCapitalize="words"
      />
      <Field
        label="Nickname for this group"
        stageKey="nickname"
        name="nickname"
        hint="Shown to everyone in the group and used in the reveal."
        status={nicknameStatus}
        error={nick.state === "taken" ? errors.nickname : shown("nickname")}
        errorKey={attempts}
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          setFormError("");
        }}
        onBlur={() => setTouched((t) => ({ ...t, nickname: true }))}
        autoComplete="off"
        autoCorrect="off"
        maxLength={30}
      />
      {formError && (
        <ErrorNote alert autoHideMs={8000} onHide={() => setFormError("")} className="mb-2">
          {formError}
        </ErrorNote>
      )}
      <AuthButton busy={working}>{working ? "Joining..." : `Join ${groupTitle(group)}`}</AuthButton>
    </form>
  );
}
