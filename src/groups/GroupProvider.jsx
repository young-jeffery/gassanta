import { useEffect, useMemo, useState } from "react";
import { useMatch } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { GroupContext } from "./groupContext";
import { clearGroupCache, writeGroupCache } from "../lib/groupCache";

// Works out which groups the signed-in account belongs to and which one is "active", then keeps live copies of:
//   users/{uid}                    -> the list of group ids (users.groups) and the last one used (users.lastGroup)
//   groups/{gid}                   -> public group docs (name, tag, year, stage, deadlines) for each of those
//   groups/{gid}/members/{uid}     -> my own role + nickname in the active group
//
// Live listeners mean that when an admin changes the stage, every open dashboard updates by itself.
// State is stored together with the key it belongs to (uid, group id) and only used when that key still matches,
// so switching accounts or groups can never show the previous one's data, and no effect has to reset state.
export default function GroupProvider({ children }) {
  const { user, status, emailVerified } = useAuth();
  const uid = user?.uid ?? null;
  const routeSlug = useMatch("/g/:slug/*")?.params.slug ?? null;

  const [userSnap, setUserSnap] = useState(null); // { uid, data }
  const [groupSnaps, setGroupSnaps] = useState({}); // gid -> group doc, or null if missing; undefined while loading
  const [memberSnap, setMemberSnap] = useState(null); // { key: "gid/uid", data }

  // ---- 1. my account doc
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => setUserSnap({ uid, data: snap.exists() ? snap.data() : {} }),
      () => setUserSnap({ uid, data: {} }) // unreadable: treat as "no groups" instead of loading forever
    );
  }, [uid]);
  const userData = userSnap && userSnap.uid === uid ? userSnap.data : null; // null = still loading
  const lastGroup = typeof userData?.lastGroup === "string" ? userData.lastGroup : null;

  // Accounts seeded before users.groups existed only have lastGroup, so that counts as a membership too.
  const gids = useMemo(() => {
    if (!userData) return [];
    const list = Array.isArray(userData.groups) ? userData.groups.filter((g) => typeof g === "string" && g) : [];
    if (lastGroup && !list.includes(lastGroup)) list.push(lastGroup);
    return [...new Set(list)];
  }, [userData, lastGroup]);

  const gidsKey = gids.join("|");
  const activeGid = routeSlug ?? (lastGroup && gids.includes(lastGroup) ? lastGroup : (gids[0] ?? null));

  // ---- 2. public group docs: every membership, plus whatever the URL points at (it may not be one of mine)
  const watchKey = useMemo(() => [...new Set([...(gidsKey ? gidsKey.split("|") : []), ...(routeSlug ? [routeSlug] : [])])].join("|"), [gidsKey, routeSlug]);
  useEffect(() => {
    if (!watchKey) return undefined;
    const unsubs = watchKey.split("|").map((gid) =>
      onSnapshot(
        doc(db, "groups", gid),
        (snap) => setGroupSnaps((prev) => ({ ...prev, [gid]: snap.exists() ? { id: gid, ...snap.data() } : null })),
        () => setGroupSnaps((prev) => ({ ...prev, [gid]: null }))
      )
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [watchKey]);

  // ---- 3. my member doc in the active group (reading it is denied to non-members; that error means "not a member")
  // Race to know about: right after registering or joining, users/{uid} already lists the group (from the local
  // write) while the server may not have committed the member doc yet, so the first read can be DENIED and Firestore
  // ends that listener for good. When we expect to be a member (the group is in our own list) we therefore retry for
  // a few seconds before concluding "not a member". For a group that isn't in our list a denial is final at once.
  const expectMember = activeGid ? gids.includes(activeGid) : false;
  const memberKey = uid && activeGid ? `${activeGid}/${uid}` : null;
  useEffect(() => {
    if (!uid || !activeGid) return undefined;
    const key = `${activeGid}/${uid}`;
    let cancelled = false;
    let timer = 0;
    let unsubscribe = () => {};
    const listen = (attempt) => {
      unsubscribe = onSnapshot(
        doc(db, "groups", activeGid, "members", uid),
        (snap) => {
          if (!cancelled) setMemberSnap({ key, expect: expectMember, data: snap.exists() ? snap.data() : null });
        },
        () => {
          if (cancelled) return;
          if (expectMember && attempt < 6) {
            timer = window.setTimeout(() => listen(attempt + 1), 400 * (attempt + 1));
          } else {
            setMemberSnap({ key, expect: expectMember, data: null });
          }
        }
      );
    };
    listen(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [uid, activeGid, expectMember]);
  // An answer only counts if it was given under the same expectation (see the race above)
  const memberCurrent = memberKey !== null && memberSnap?.key === memberKey && memberSnap.expect === expectMember;
  const memberReady = memberKey === null || memberCurrent;
  const me = memberCurrent ? memberSnap.data : null;
  const isMember = me !== null;

  // ---- derived values
  const watched = watchKey ? watchKey.split("|") : [];
  const loading =
    status === "loading" ||
    (status === "signedIn" && (userData === null || watched.some((gid) => groupSnaps[gid] === undefined) || !memberReady));

  const groups = useMemo(() => gids.map((gid) => groupSnaps[gid]).filter(Boolean), [gids, groupSnaps]);
  const group = activeGid ? (groupSnaps[activeGid] ?? null) : null;
  const role = me?.role ?? null;

  // ---- side effects (no state is set here)
  // Remember the group I'm looking at, so next time /dashboard and the landing page start there.
  useEffect(() => {
    if (uid && routeSlug && isMember && lastGroup !== routeSlug) {
      updateDoc(doc(db, "users", uid), { lastGroup: routeSlug }).catch(() => {});
    }
  }, [uid, routeSlug, isMember, lastGroup]);

  // Once the person's email is verified, say so on their member doc (admins see a tick). The rules allow a member to
  // set only their own `verified` to true. Informational: nothing is ever blocked on it.
  useEffect(() => {
    if (uid && activeGid && emailVerified && me && me.verified === false) {
      updateDoc(doc(db, "groups", activeGid, "members", uid), { verified: true }).catch(() => {});
    }
  }, [uid, activeGid, emailVerified, me]);

  // Keep the landing-page cache in step with the active group, and drop it when signed out.
  const gId = group?.id ?? null;
  const gName = group?.name ?? "";
  const gTag = group?.tag ?? "";
  const gYear = group?.year ?? null;
  useEffect(() => {
    if (status === "signedOut") clearGroupCache();
    else if (status === "signedIn" && isMember && gId) writeGroupCache({ id: gId, name: gName, tag: gTag, year: gYear });
  }, [status, isMember, gId, gName, gTag, gYear]);

  const value = useMemo(
    () => ({
      loading,
      groups,
      activeGid,
      group,
      me,
      role,
      stage: group?.stage ?? null,
      isMember,
      isAdmin: role === "owner" || role === "admin",
      isOwner: role === "owner",
    }),
    [loading, groups, activeGid, group, me, role, isMember]
  );

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}
