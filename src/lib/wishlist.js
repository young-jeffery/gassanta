// Wishlist rules shared by the card and its tests. The security rules also cap the list at 10 items and the hints at
// 500 characters; the per-item length is only checked here.
export const MAX_ITEMS = 10;
export const MAX_ITEM_LEN = 120;
export const MAX_HINTS = 500;

// Tidy what the person typed: trim, collapse spaces, drop empty rows, cap lengths and counts
export function sanitizeWishlist({ items, hints }) {
  const clean = (items ?? [])
    .map((s) => String(s).trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
    .map((s) => s.slice(0, MAX_ITEM_LEN));
  return { items: clean, hints: String(hints ?? "").trim().slice(0, MAX_HINTS) };
}

export const sameWishlist = (a, b) => JSON.stringify(sanitizeWishlist(a)) === JSON.stringify(sanitizeWishlist(b));
