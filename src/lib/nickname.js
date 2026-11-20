// Nickname rules shared by the register form and scripts/seed-group.mjs (plain JS, no imports, so Node can load it too).
//
// A nickname is what people see and what reveals show. Every nickname also has a KEY: the nickname with accents
// removed, lowercased, and everything except a-z and 0-9 stripped. The key is the document id in
// groups/{gid}/nicknames/{key}, which is how uniqueness is enforced: "Ola-mide", "olamide" and "Ọlámidé" all
// produce the key "olamide", so only one of them can exist in a group (stops look-alike impersonation).
// firestore.rules requires the key to match [a-z0-9]{2,60}, so keep this function and that pattern in sync.

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

// Trim, collapse runs of whitespace into single spaces.
export function cleanNickname(raw) {
  return String(raw ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

export function nicknameKey(raw) {
  return cleanNickname(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Returns a short message for the form, or null when the nickname is fine.
export function nicknameProblem(raw) {
  const clean = cleanNickname(raw);
  const length = Array.from(clean).length; // counts emoji and accented letters as one character each
  if (length < NICKNAME_MIN) return `Use at least ${NICKNAME_MIN} characters.`;
  if (length > NICKNAME_MAX) return `Use at most ${NICKNAME_MAX} characters.`;
  const key = nicknameKey(clean);
  if (key.length < 2) return "Include at least 2 letters or numbers.";
  if (key.length > 60) return "That nickname is too long.";
  return null;
}
