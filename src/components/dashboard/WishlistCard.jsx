import { useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { sfx } from "../../audio/sfx";
import { authErrorMessage } from "../../lib/authErrors";
import { MAX_HINTS, MAX_ITEM_LEN, MAX_ITEMS, sameWishlist, sanitizeWishlist } from "../../lib/wishlist";
import AuthButton from "../auth/AuthButton";
import ErrorNote from "../auth/ErrorNote";
import Card from "./Card";
import { BUBBLE_INK, CARDS } from "./colors";
import { useCardFx } from "./useCardFx";
import Wave from "./Wave";

const inputClass =
  "w-full rounded-2xl border-2 border-accent/40 bg-canvas/40 px-4 py-2.5 text-base text-ink placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Editor({ gid, uid, initial }) {
  const startItems = initial.items.length > 0 ? initial.items : [""];
  const [items, setItems] = useState(startItems);
  const [hints, setHints] = useState(initial.hints);
  const [baseline, setBaseline] = useState({ items: initial.items, hints: initial.hints }); // what is saved right now
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = !sameWishlist({ items, hints }, baseline);

  const setItem = (index, value) => {
    setSaved(false);
    setError("");
    setItems((list) => list.map((v, i) => (i === index ? value : v)));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    const clean = sanitizeWishlist({ items, hints });
    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, "groups", gid, "wishlists", uid), { items: clean.items, hints: clean.hints, updatedAt: serverTimestamp() });
      setBaseline(clean);
      setItems(clean.items.length > 0 ? clean.items : [""]);
      setHints(clean.hints);
      setSaved(true);
      sfx.chime(2);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="flex flex-col gap-3">
      <p className="text-sm text-ink/90">
        Add up to {MAX_ITEMS} things you'd love, plus any hints. <strong>Only your gifter</strong> sees this, and only after the draw. You can edit it until then.
      </p>

      <div className="flex flex-col gap-2">
        {items.map((value, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label={`Wishlist item ${i + 1}`}
              className={inputClass}
              value={value}
              maxLength={MAX_ITEM_LEN}
              placeholder={i === 0 ? "e.g. a cozy scarf" : "Another idea"}
              onChange={(e) => setItem(i, e.target.value)}
            />
            {items.length > 1 && (
              <button
                type="button"
                aria-label={`Remove item ${i + 1}`}
                onClick={() => {
                  setSaved(false);
                  setItems((list) => list.filter((_, j) => j !== i));
                }}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent/40 bg-surface text-xl text-ink active:scale-95"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {items.length < MAX_ITEMS && (
          <button
            type="button"
            onClick={() => setItems((list) => [...list, ""])}
            className="self-start rounded-full border border-dashed border-accent/60 px-4 py-2 text-sm font-bold text-ink active:scale-95"
          >
            + Add another
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        Hints for your gifter
        <textarea
          className={`${inputClass} min-h-24 resize-y font-normal`}
          value={hints}
          maxLength={MAX_HINTS}
          placeholder="Sizes, favourite colours, things to avoid..."
          onChange={(e) => {
            setSaved(false);
            setError("");
            setHints(e.target.value);
          }}
        />
        <span className="text-right text-xs font-normal text-muted">
          {hints.length}/{MAX_HINTS}
        </span>
      </label>

      {error && (
        <ErrorNote alert autoHideMs={8000} onHide={() => setError("")}>
          {error}
        </ErrorNote>
      )}

      <div className="flex items-center gap-3">
        <div className="min-w-40 flex-1 md:flex-none">
          <AuthButton busy={saving} disabled={!dirty}>
            {saving ? "Saving..." : "Save wishlist"}
          </AuthButton>
        </div>
        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcf5e4] px-3 py-1 text-xs font-extrabold text-[#14532d]">Saved</span>
        )}
        {dirty && <span className="text-xs font-bold text-muted">Unsaved changes</span>}
      </div>
    </form>
  );
}

const RED = "#d92d20";

// After the draw the wishlist can't be edited any more, so the card turns into a wrapped present: green paper, a red
// ribbon cross, a bow, and the wishlist written on a gift tag. Hover/tap reaction: useCardFx.js.
function WrappedWishlist({ initial }) {
  const ref = useRef(null);
  useCardFx(ref, "gifts");
  const empty = initial.items.length === 0 && !initial.hints;

  return (
    <section ref={ref} className="relative mt-5 rounded-3xl" style={{ border: `3px solid ${BUBBLE_INK}`, boxShadow: `4px 5px 0 ${BUBBLE_INK}`, background: "#1f7a47" }}>
      <div
        className="relative overflow-hidden rounded-[21px] px-5 pt-10 pb-12 md:px-6"
        style={{ background: "repeating-linear-gradient(135deg, #1f7a47 0 20px, #196a3d 20px 40px)" }}
      >
        {/* the ribbon cross */}
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2" style={{ background: RED, borderLeft: `3px solid ${BUBBLE_INK}`, borderRight: `3px solid ${BUBBLE_INK}` }} />
        <div aria-hidden="true" className="absolute inset-x-0 top-[56%] h-9 -translate-y-1/2" style={{ background: RED, borderTop: `3px solid ${BUBBLE_INK}`, borderBottom: `3px solid ${BUBBLE_INK}` }} />
        <div data-fx aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />

        {/* the gift tag */}
        <div className="relative z-10 mx-auto max-w-sm -rotate-1 rounded-2xl bg-[#fffaf0] p-4 text-[#3b2a1a]" style={{ border: `3px solid ${BUBBLE_INK}`, boxShadow: `3px 4px 0 ${BUBBLE_INK}` }}>
          <span aria-hidden="true" className="absolute -top-3 left-5 h-4 w-4 rounded-full bg-[#1f7a47]" style={{ border: `3px solid ${BUBBLE_INK}` }} />
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Wrapped and sealed
          </h2>
          <p className="mt-1 text-sm">The draw is done, so your wishlist is locked. Your gifter can see it now.</p>
          {empty ? (
            <p className="mt-3 text-sm font-bold opacity-70">You didn't add anything.</p>
          ) : (
            <div className="mt-3 border-t-2 border-dashed border-[#3b2a1a]/40 pt-3 text-sm">
              <ul className="list-disc space-y-0.5 pl-5">
                {initial.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {initial.hints && <p className="mt-2 whitespace-pre-wrap font-display italic">{initial.hints}</p>}
            </div>
          )}
        </div>
        <Wave color="#fffaf0" />
      </div>

      {/* the bow */}
      <svg viewBox="0 0 90 56" aria-hidden="true" className="pointer-events-none absolute -top-7 left-1/2 z-10 h-14 w-24 -translate-x-1/2">
        <path d="M45 38 C20 4 0 24 12 40 C24 46 38 42 45 38 Z" fill={RED} stroke={BUBBLE_INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M45 38 C70 4 90 24 78 40 C66 46 52 42 45 38 Z" fill={RED} stroke={BUBBLE_INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 26 C26 22 34 26 38 34 M70 26 C64 22 56 26 52 34" fill="none" stroke="#ff8a7e" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="37" y="30" width="16" height="16" rx="4" fill={RED} stroke={BUBBLE_INK} strokeWidth="3" />
      </svg>
    </section>
  );
}

// The person's own wishlist. Loaded once (not live, so nothing overwrites what they are typing), then edited and saved
// through the security rules: only their own, only until the draw. After the draw it shows as a wrapped present.
export default function WishlistCard({ gid, uid, drawn }) {
  const key = `${gid}/${uid}`;
  const [loaded, setLoaded] = useState(null); // { key, items, hints }

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "groups", gid, "wishlists", uid))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        setLoaded({ key, items: Array.isArray(data.items) ? data.items : [], hints: typeof data.hints === "string" ? data.hints : "" });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, items: [], hints: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [gid, uid, key]);

  const ready = loaded && loaded.key === key;
  if (ready && drawn) return <WrappedWishlist initial={loaded} />;

  return (
    <Card title="Your wishlist" tone={CARDS.wishlist} scribble="list">
      {ready ? <Editor key={key} gid={gid} uid={uid} initial={loaded} /> : <p className="text-sm text-muted">Loading...</p>}
    </Card>
  );
}
