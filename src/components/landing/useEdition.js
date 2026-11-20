import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useGroup } from "../../groups/useGroup";
import { readGroupCache } from "../../lib/groupCache";

// What the landing page's "Curia VI / 2026 Edition" label should show: null when signed out (the label stays empty),
// the active group's name/tag/year when signed in. While Firebase is still finding out who you are, it shows the
// last group remembered on this device (lib/groupCache.js), so returning members don't wait for the network.
export function useEdition() {
  const { status } = useAuth();
  const { group, isMember, loading } = useGroup();
  const [cached] = useState(readGroupCache);

  if (status === "signedOut") return null;
  if (status === "signedIn" && !loading) {
    return group && isMember ? { name: group.name, tag: group.tag ?? "", year: group.year ?? null } : null;
  }
  return cached;
}
