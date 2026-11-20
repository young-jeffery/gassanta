import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Live rules text of a group (admins edit it from the admin page; members just read). null while loading.
export function useRules(gid) {
  const [snap, setSnap] = useState(null); // { gid, text }

  useEffect(() => {
    if (!gid) return undefined;
    return onSnapshot(
      doc(db, "groups", gid, "content", "rules"),
      (s) => setSnap({ gid, text: s.exists() ? (s.data().text ?? "") : "" }),
      () => setSnap({ gid, text: "" })
    );
  }, [gid]);

  return snap && snap.gid === gid ? snap.text : null;
}
