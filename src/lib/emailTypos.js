// Catches the typos people actually make in email addresses ("gmial.com", "gmail.con") so the register form can ask
// "Did you mean ...?". It never blocks anything: unknown domains are fine, and plus-addresses and dots are untouched.

const DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com", "hotmail.com", "hotmail.co.uk",
  "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "mail.com", "email.com", "gmx.com", "zoho.com", "yandex.com",
];

const TLD_FIXES = { con: "com", cmo: "com", ocm: "com", vom: "com", comm: "com", coom: "com", cpm: "com" };

// Edit distance where swapping two neighbouring letters ("gmial" vs "gmail") counts as ONE mistake
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

// Returns a corrected address, or null when nothing looks wrong
export function suggestEmail(raw) {
  const value = String(raw ?? "").trim();
  const at = value.lastIndexOf("@");
  if (at < 1) return null;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  if (!domain.includes(".") || DOMAINS.includes(domain)) return null;

  // 1. fix an obvious ending typo (".con"), so "gmial.con" gets compared as "gmial.com"
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  if (TLD_FIXES[tld]) parts[parts.length - 1] = TLD_FIXES[tld];
  const fixed = parts.join(".");
  if (DOMAINS.includes(fixed)) return `${local}@${fixed}`;

  // 2. close to a well-known provider?
  let best = null;
  let bestDistance = Infinity;
  for (const known of DOMAINS) {
    const dist = distance(fixed, known);
    const allowed = known.length <= 10 ? 1 : 2;
    if (dist <= allowed && dist < bestDistance) {
      best = known;
      bestDistance = dist;
    }
  }
  if (best) return `${local}@${best}`;

  // 3. unknown domain: only offer the ending fix, if there was one
  return fixed !== domain ? `${local}@${fixed}` : null;
}

// "jojo@gmail.com" -> "j***@gmail.com" (for "we emailed you at ..." messages)
export function maskEmail(raw) {
  const value = String(raw ?? "").trim();
  const at = value.lastIndexOf("@");
  if (at < 1) return value;
  return `${value[0]}***${value.slice(at)}`;
}
