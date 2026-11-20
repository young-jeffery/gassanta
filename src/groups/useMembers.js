import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

// Live list of everyone in a group, oldest member first: [{ uid, nickname, role, verified, joinedAt }].
// Members can read this collection (real names live elsewhere and are NOT in it). Returns null while loading.
export function useMembers(gid) {
  const [snap, setSnap] = useState(null); // { gid, list }

  useEffect(() => {
    if (!gid) return undefined;
    return onSnapshot(
      query(collection(db, "groups", gid, "members"), orderBy("joinedAt")),
      (s) => setSnap({ gid, list: s.docs.map((d) => ({ uid: d.id, ...d.data() })) }),
      () => setSnap({ gid, list: [] })
    );
  }, [gid]);

  return snap && snap.gid === gid ? snap.list : null;
}
