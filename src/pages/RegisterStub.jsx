import { Link } from "react-router-dom";

// Temporary page so the landing page has somewhere to go. Stage 3 replaces it with real registration.
export default function RegisterStub() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center md:items-start md:text-left">
      <h1 className="font-display text-4xl font-extrabold text-ink md:text-6xl">Registration</h1>
      <p className="max-w-xs text-muted md:max-w-xl md:text-lg">Placeholder page. Real registration arrives in Stage 3.</p>
      <Link
        to="/"
        className="rounded-full border border-accent/50 bg-surface/90 px-6 py-3 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Back to start
      </Link>
    </div>
  );
}
