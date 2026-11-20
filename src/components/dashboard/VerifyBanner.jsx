import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase";
import { authErrorMessage } from "../../lib/authErrors";
import { maskEmail } from "../../lib/emailTypos";

// Shown until the person has opened the link in their verification email. Never blocks anything.
export default function VerifyBanner({ email }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [problem, setProblem] = useState("");

  const resend = async () => {
    if (!auth.currentUser) return;
    setState("sending");
    try {
      try {
        await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/dashboard` });
      } catch {
        await sendEmailVerification(auth.currentUser); // the site's domain may not be authorised for custom links yet
      }
      setState("sent");
    } catch (err) {
      setProblem(authErrorMessage(err));
      setState("error");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-3xl border-l-8 border-[#d97706] bg-[#fff1c9] px-5 py-4 text-[#4a2c00] md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-bold">
        Please verify your email. We sent a link to {maskEmail(email)}. You can keep using the site meanwhile.
        {state === "sent" && " A new link is on its way."}
        {state === "error" && ` ${problem}`}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending" || state === "sent"}
        className="shrink-0 self-start rounded-full border-2 border-[#4a2c00] px-4 py-1.5 text-sm font-extrabold disabled:opacity-50 md:self-auto"
      >
        {state === "sending" ? "Sending..." : "Send it again"}
      </button>
    </div>
  );
}
