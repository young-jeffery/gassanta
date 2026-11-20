// Remembers the last group's display name in localStorage so the landing page can show "Curia VI" the instant it
// loads, before Firebase has finished checking who is signed in. It is only a cache: GroupProvider refreshes it from
// Firestore, and clears it when nobody is signed in. localStorage can be blocked (private mode) or corrupt, so every
// access is wrapped and failures are ignored.
const KEY = "ss-last-group";

export function readGroupCache() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v.id !== "string" || typeof v.name !== "string") return null;
    return { id: v.id, name: v.name, tag: typeof v.tag === "string" ? v.tag : "", year: Number(v.year) || null };
  } catch {
    return null;
  }
}

export function writeGroupCache({ id, name, tag, year }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, name, tag: tag ?? "", year: year ?? null }));
  } catch {
    /* storage unavailable: fine, it's only a cache */
  }
}

export function clearGroupCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
