import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { authErrorMessage } from "../lib/authErrors";

const STAGES = ["registration", "preferences", "awaiting_draw", "drawn"];

// Developer tool: jump the group to any stage to test the dashboard. Only rendered by `npm run dev` (callers guard it
// with import.meta.env.DEV, so the production build contains none of it). Writes go through the real security
// rules, so it also proves that only admins can change a group's stage.
export default function DevStageSwitcher({ gid, stage }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setStage = async (next) => {
    setBusy(true);
    setError("");
    try {
      await updateDoc(doc(db, "groups", gid), { stage: next });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/60 bg-surface/80 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Dev only: set stage</p>
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || s === stage}
            onClick={() => setStage(s)}
            className={`rounded-full border border-accent/40 px-4 py-2 text-sm font-bold disabled:opacity-60 ${
              s === stage ? "bg-primary text-on-primary" : "bg-surface/90 text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
