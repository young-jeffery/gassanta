import { useContext } from "react";
import { GroupContext } from "./groupContext";

// const { loading, groups, activeGid, group, me, role, isMember, isAdmin, isOwner, stage } = useGroup();
//   groups:    public docs of every group this account belongs to: [{ id, name, tag, year, stage, deadlines }]
//   activeGid: the group in the URL (/g/:slug/...), else the last one used, else the first one
//   group:     the active group's public doc (null if it doesn't exist)
//   me:        my member doc in the active group { nickname, role, verified, ... } (null if I'm not a member)
export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used inside <GroupProvider>");
  return ctx;
}
