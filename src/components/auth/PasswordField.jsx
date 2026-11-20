import Field from "./Field";

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

// A password input with a clearly labelled Show / Hide button (icon + word). Controlled from outside
// (`visible` / `onToggle`), so one button can reveal both the password and its confirmation. The page tells the
// snowmen when it changes (useStage().setRevealed).
export default function PasswordField({ visible, onToggle, ...field }) {
  return (
    <Field
      {...field}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      right={
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="flex h-9 items-center gap-1.5 rounded-full border border-accent/50 bg-surface px-3 text-xs font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
        >
          <EyeIcon off={visible} />
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
