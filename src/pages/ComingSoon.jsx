import { Link } from "react-router-dom";

// TEMPORARY placeholder for pages built in a later step (/forgot). `backTo` / `backLabel` give it a way out.
export default function ComingSoon({ title, backTo = "/", backLabel = "Back to start" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center md:items-start md:text-left">
      <h1 className="font-display text-4xl font-extrabold text-ink md:text-6xl">{title}</h1>
      <p className="max-w-xs text-muted md:max-w-xl md:text-lg">This page is built in the next step.</p>
      <Link
        to={backTo}
        className="rounded-full border border-accent/50 bg-surface/90 px-6 py-3 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        &larr; {backLabel}
      </Link>
    </div>
  );
}
