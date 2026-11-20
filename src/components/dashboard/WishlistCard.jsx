import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { sfx } from "../../audio/sfx";
import { authErrorMessage } from "../../lib/authErrors";
import { MAX_HINTS, MAX_ITEM_LEN, MAX_ITEMS, sameWishlist, sanitizeWishlist } from "../../lib/wishlist";
import AuthButton from "../auth/AuthButton";
import ErrorNote from "../auth/ErrorNote";
import Card from "./Card";
import { HUES } from "./colors";

const inputClass =
  "w-full rounded-2xl border-2 border-accent/40 bg-canvas/40 px-4 py-2.5 text-base text-ink placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Editor({ gid, uid, initial, drawn }) {
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
    if (saving || drawn) return;
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

  if (drawn) {
    return (
      <div className="flex flex-col gap-3 text-sm text-ink/90">
        <p>The draw is done, so your wishlist is locked. Your gifter can see it now.</p>
        {initial.items.length === 0 && !initial.hints ? (
          <p className="font-bold text-muted">You didn't add anything.</p>
        ) : (
          <>
            <ul className="list-disc pl-5">
              {initial.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {initial.hints && <p className="whitespace-pre-wrap">{initial.hints}</p>}
          </>
        )}
      </div>
    );
  }

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

// The person's own wishlist. Loaded once (not live, so nothing overwrites what they are typing), then edited and saved
// through the security rules: only their own, only until the draw.
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

  return (
    <Card title="Your wishlist" hue={HUES.wishlist} scribble="list">
      {loaded && loaded.key === key ? (
        <Editor key={key} gid={gid} uid={uid} initial={loaded} drawn={drawn} />
      ) : (
        <p className="text-sm text-muted">Loading...</p>
      )}
    </Card>
  );
}
