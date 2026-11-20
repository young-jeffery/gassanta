// Creates one Secret Santa group plus its owner, join code and default rules text.
// Stage 3 only: Stage 4 replaces this with an in-app "Create group" flow.
//
// Runs on YOUR computer with a Firebase service-account key (full admin access: keep it OUTSIDE the repo, never commit it).
// Run `node scripts/seed-group.mjs --help` for usage.

import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { cleanNickname, nicknameKey, nicknameProblem } from "../src/lib/nickname.js";

const USAGE = `
Usage:
  node scripts/seed-group.mjs --key <service-account.json> --email <owner email> --id <group-id>
       --name <group name> [--tag <tag>] --year <year> --real-name <owner real name> --nickname <owner nickname>

  --key        path to the service-account JSON downloaded from Firebase (keep it outside the repo)
  --email      email of an account that ALREADY exists in Firebase Authentication (Console > Authentication > Users > Add user)
  --id         group id = URL slug: lowercase letters, numbers and single hyphens, 3-40 characters (e.g. curia-vi)
  --name       group name shown on the landing page (e.g. Curia)
  --tag        optional bold suffix (e.g. VI)
  --year       edition year (e.g. 2026)
  --real-name  the owner's actual name (only the owner and admins can see it)
  --nickname   the owner's display/reveal name (2-20 characters)

Example:
  node scripts/seed-group.mjs --key "C:\\Users\\you\\secrets\\sa.json" --email you@example.com --id curia-vi --name Curia --tag VI --year 2026 --real-name "Your Full Name" --nickname JoJo
`;

// Same text the old site used, kept as-is for now. Admins can edit it from the admin page once Stage 4 ships.
const DEFAULT_RULES = `Welcome to the first ever Secret Santa hosted by the **God Abeg** team (team name STC)! **Read the rules carefully abeg** The rules are simple. FOLLOW THE RULES!!!. 

1.  **Price Limit:** To avoid unncessary complaints, we have decided that the budget for your gift(s) should be within the ranges of **₦5,000 - ₦10,000**.
2.  **Etiquette:** Seems obvious but **DO NOT** tell anyone who your giftee is. Also, you can't swap giftees.
3.  **The Gift:** Try to buy something thoughtful based on what you know about the person. Let the person be happy.
4.  **Preparation:** Please as soon as you know your match, get their gift ready and wrapped/packaged (A gift bag is okay if wrapping is not easy).
5.  **Game:** There would be a guessing game on the day the gifts are given. After everyone has their gift, they would have to guess who their 'Santa' is.
5.  **Deadline:** We will all converge at Olamide's residence for the party and gift giving. Date for this is **TBD**. 

**Aren't you excited!! Have fun, spend money and spread joy. Merry Christmas!! Ho-Ho-Ho!**`;

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

const { values: v } = parseArgs({
  options: {
    key: { type: "string" },
    email: { type: "string" },
    id: { type: "string" },
    name: { type: "string" },
    tag: { type: "string", default: "" },
    year: { type: "string" },
    "real-name": { type: "string" },
    nickname: { type: "string" },
    help: { type: "boolean", default: false },
  },
});

if (v.help) {
  console.log(USAGE);
  process.exit(0);
}

// ---- validate input before touching Firebase
for (const required of ["key", "email", "id", "name", "year", "real-name", "nickname"]) {
  if (!v[required]) fail(`Missing --${required}.\n${USAGE}`);
}
const id = v.id.trim();
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || id.length < 3 || id.length > 40) {
  fail("--id must be lowercase letters/numbers with single hyphens, 3-40 characters (e.g. curia-vi).");
}
const year = Number(v.year);
if (!Number.isInteger(year) || year < 2000 || year > 2100) fail("--year must be a 4-digit year.");
const name = v.name.trim();
if (name.length < 1 || name.length > 40) fail("--name must be 1-40 characters.");
const tag = v.tag.trim();
if (tag.length > 8) fail("--tag must be at most 8 characters.");
const realName = v["real-name"].trim();
if (realName.length < 2 || realName.length > 120) fail("--real-name must be 2-120 characters.");
const nickname = cleanNickname(v.nickname);
const nicknameIssue = nicknameProblem(nickname);
if (nicknameIssue) fail(`--nickname: ${nicknameIssue}`);
const key = nicknameKey(nickname);
const email = v.email.trim().toLowerCase();

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(v.key, "utf8"));
} catch (err) {
  fail(`Could not read the service-account file at "${v.key}": ${err.message}`);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

// ---- look things up
let user;
try {
  user = await auth.getUserByEmail(email);
} catch (err) {
  if (err.code === "auth/user-not-found") {
    fail(`No Firebase Authentication user has the email ${email}. Create it first: Console > Authentication > Users > Add user.`);
  }
  throw err;
}

const groupRef = db.doc(`groups/${id}`);
if ((await groupRef.get()).exists) fail(`A group with id "${id}" already exists. Pick another --id (nothing was changed).`);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups when typed from a message
let code = null;
for (let attempt = 0; attempt < 20 && !code; attempt++) {
  let candidate = "";
  for (let i = 0; i < 8; i++) candidate += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  if (!(await db.doc(`joinCodes/${candidate}`).get()).exists) code = candidate;
}
if (!code) fail("Could not generate a free join code. Run the command again.");

// ---- confirm
console.log(`
About to create:
  Group id:    ${id}
  Title:       ${name}${tag ? " " + tag : ""} (${year})
  Owner:       ${email} (uid ${user.uid})
  Owner shows: ${nickname}   (real name: ${realName})
  Join code:   ${code}
  Starting stage: registration
`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('Type "yes" to create it: ')).trim().toLowerCase();
rl.close();
if (answer !== "yes") fail("Cancelled. Nothing was changed.");

// ---- write everything in one atomic batch (Admin SDK bypasses the security rules)
const now = FieldValue.serverTimestamp();
const batch = db.batch();

batch.set(groupRef, {
  name,
  tag,
  year,
  stage: "registration",
  deadlines: { registration: null, preferences: null, gifting: null },
  createdBy: user.uid,
  createdAt: now,
});
batch.set(db.doc(`joinCodes/${code}`), { gid: id, active: true, createdAt: now });
batch.set(groupRef.collection("content").doc("rules"), { text: DEFAULT_RULES, updatedAt: now, updatedBy: user.uid });
batch.set(groupRef.collection("members").doc(user.uid), {
  nickname,
  nicknameKey: key,
  role: "owner",
  joinedAt: now,
  verified: user.emailVerified,
  joinCode: code,
});
batch.set(groupRef.collection("memberPrivate").doc(user.uid), { realName });
batch.set(groupRef.collection("nicknames").doc(key), { uid: user.uid });

const userRef = db.doc(`users/${user.uid}`);
if ((await userRef.get()).exists) batch.update(userRef, { lastGroup: id, groups: FieldValue.arrayUnion(id) });
else batch.set(userRef, { email, createdAt: now, lastGroup: id, groups: [id] });

await batch.commit();

console.log(`
Done. Group "${id}" is live in Firestore.

  Join code: ${code}
  Invite link (after Stage 3.3): https://<your-site>.netlify.app/register?code=${code}

Check it in the Console: Firestore Database > Data > groups > ${id}.
`);
process.exit(0);
