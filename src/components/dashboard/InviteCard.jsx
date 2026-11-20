import { useState } from "react";
import AuthButton from "../auth/AuthButton";
import Card from "./Card";
import { HUES } from "./colors";

// For admins while registration is open: the join code, a link that pre-fills it, and a WhatsApp share button.
export default function InviteCard({ code, groupName }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/register?code=${code}`;
  const message = `Join our Secret Santa, ${groupName}! Sign up here: ${link} (join code: ${code})`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this invite link:", link); // clipboard blocked: let them copy by hand
    }
  };

  return (
    <Card title="Invite friends" hue={HUES.invite} scribble="envelope">
      <p className="text-sm text-ink/90">Registration is open. Share this code or link with the people you want in.</p>
      <p className="my-3 rounded-2xl border border-dashed border-accent/60 bg-canvas/40 px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.3em] text-ink">
        {code}
      </p>
      <div className="flex flex-col gap-2 md:flex-row">
        <AuthButton type="button" onClick={copy}>
          {copied ? "Link copied" : "Copy invite link"}
        </AuthButton>
        <AuthButton type="button" variant="secondary" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener")}>
          Share on WhatsApp
        </AuthButton>
      </div>
    </Card>
  );
}
