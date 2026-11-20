import { arrayUnion, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { cleanNickname, nicknameKey } from "./nickname";

// Everything that writes a new person into Firestore. The register and join pages only call these functions.
// The security rules (firestore.rules) re-check all of it on the server, so these checks are for good messages,
// not for security.

export const CODE_LENGTH = 8;

// "abcd-2345" -> "ABCD2345"
export function cleanCode(raw) {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

const fail = (code) => Object.assign(new Error(code), { code });

// Join code -> group. Returns { ok: true, code, group } or { ok: false, reason: "format" | "unknown" | "inactive" | "network" }.
export async function lookupGroupByCode(raw) {
  const code = cleanCode(raw);
  if (code.length !== CODE_LENGTH) return { ok: false, reason: "format" };
  try {
    const codeSnap = await getDoc(doc(db, "joinCodes", code));
    if (!codeSnap.exists()) return { ok: false, reason: "unknown" };
    const { gid, active } = codeSnap.data();
    if (!active) return { ok: false, reason: "inactive" };
    const groupSnap = await getDoc(doc(db, "groups", gid));
    if (!groupSnap.exists()) return { ok: false, reason: "unknown" };
    return { ok: true, code, group: { id: gid, ...groupSnap.data() } };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// true = free, false = taken. Anyone may read a single nickname reservation (the rules forbid listing them).
export async function isNicknameFree(gid, nickname) {
  const key = nicknameKey(nickname);
  const snap = await getDoc(doc(db, "groups", gid, "nicknames", key));
  return !snap.exists();
}

// The three documents every member has in a group
function addMemberWrites(batch, { gid, code, uid, nickname, realName }) {
  const key = nicknameKey(nickname);
  batch.set(doc(db, "groups", gid, "members", uid), {
    nickname: cleanNickname(nickname),
    nicknameKey: key,
    role: "member",
    joinedAt: serverTimestamp(),
    verified: false,
    joinCode: code,
  });
  batch.set(doc(db, "groups", gid, "memberPrivate", uid), { realName: realName.trim().replace(/\s+/g, " ") });
  batch.set(doc(db, "groups", gid, "nicknames", key), { uid });
}

// A denied write is almost always "the nickname was just taken" or "registration just closed". Find out which.
async function explainFailure(err, gid, nickname) {
  if (err?.code !== "permission-denied") return err;
  try {
    const nick = await getDoc(doc(db, "groups", gid, "nicknames", nicknameKey(nickname)));
    if (nick.exists()) return fail("ss/nickname-taken");
    const group = await getDoc(doc(db, "groups", gid));
    if (group.exists() && group.data().stage !== "registration") return fail("ss/registration-closed");
  } catch {
    /* fall through to the original error */
  }
  return err;
}

// Verification email. Never blocks anything: resolves true (sent), false (failed) or null (took too long to say).
async function sendVerification(user) {
  const attempt = async () => {
    try {
      await sendEmailVerification(user, { url: `${window.location.origin}/dashboard` });
    } catch {
      await sendEmailVerification(user); // e.g. the site's domain isn't in Firebase's authorized domains yet
    }
    return true;
  };
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
  try {
    return await Promise.race([attempt(), timeout]);
  } catch {
    return false;
  }
}

// New person: create the account, then write their profile in ONE atomic batch. If the batch fails the account is
// deleted again, so nobody is left with a login that belongs to no group.
export async function registerAndJoin({ group, code, email, password, realName, nickname }) {
  const gid = group.id;
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      lastGroup: gid,
      groups: [gid],
    });
    addMemberWrites(batch, { gid, code, uid: user.uid, nickname, realName });
    await batch.commit();
  } catch (err) {
    let rolledBack = true;
    try {
      await deleteUser(user);
    } catch {
      rolledBack = false;
    }
    if (!rolledBack) {
      await signOut(auth).catch(() => {});
      throw fail("ss/partial");
    }
    throw await explainFailure(err, gid, nickname);
  }

  return { uid: user.uid, verification: await sendVerification(user) };
}

// Existing account joining another group (same code + nickname + real name, per group)
export async function joinExistingAccount({ user, group, code, realName, nickname }) {
  const gid = group.id;
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  const batch = writeBatch(db);
  if (existing.exists()) batch.update(userRef, { lastGroup: gid, groups: arrayUnion(gid) });
  else batch.set(userRef, { email: user.email, createdAt: serverTimestamp(), lastGroup: gid, groups: [gid] });
  addMemberWrites(batch, { gid, code, uid: user.uid, nickname, realName });

  try {
    await batch.commit();
  } catch (err) {
    throw await explainFailure(err, gid, nickname);
  }
}
