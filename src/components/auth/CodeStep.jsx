import { useEffect, useState } from "react";
import { CODE_LENGTH, cleanCode, lookupGroupByCode } from "../../lib/registration";
import AuthButton from "./AuthButton";
import Field from "./Field";
import { useStage } from "./useStage";

const REASONS = {
  format: `A join code has ${CODE_LENGTH} letters and numbers. Check what you typed.`,
  unknown: "No group has that code. Check for typos, or ask your organiser.",
  inactive: "That code isn't active any more. Ask your organiser for a new one.",
  network: "Can't reach the server. Check your connection and try again.",
};

// Step 1 of register and join: enter the invite code. A code from an invite link (/register?code=...) is looked up
// automatically. When a group is found, onFound({ code, group }) runs; the page decides what comes next.
export default function CodeStep({ initialCode = "", onFound }) {
  const stage = useStage();
  const [code, setCode] = useState(cleanCode(initialCode));
  const [busy, setBusy] = useState(Boolean(cleanCode(initialCode)));
  const [error, setError] = useState("");
  const [failures, setFailures] = useState(0);

  const run = async (raw) => {
    setBusy(true);
    setError("");
    const res = await lookupGroupByCode(raw);
    if (res.ok) {
      onFound(res);
      return;
    }
    setError(REASONS[res.reason]);
    setFailures((n) => n + 1);
    stage.say("code:bad");
    setBusy(false);
  };

  // Invite link: look the code up straight away
  useEffect(() => {
    const first = cleanCode(initialCode);
    if (!first) return undefined;
    let cancelled = false;
    lookupGroupByCode(first).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        onFound(res);
      } else {
        setError(REASONS[res.reason]);
        setBusy(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialCode, onFound]);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        run(code);
      }}
      className="flex flex-col gap-2"
    >
      <Field
        label="Join code"
        stageKey="code"
        hint={`The ${CODE_LENGTH}-character code from your organiser`}
        error={error}
        errorKey={failures}
        value={code}
        onChange={(e) => {
          setCode(cleanCode(e.target.value));
          setError(""); // that message was about the LAST code tried, not this one
        }}
        name="code"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        maxLength={CODE_LENGTH + 4}
        placeholder="ABCD2345"
      />
      <AuthButton busy={busy} disabled={code.length === 0}>
        {busy ? "Checking..." : "Continue"}
      </AuthButton>
    </form>
  );
}
