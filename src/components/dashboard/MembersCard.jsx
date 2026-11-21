import { useMembers } from "../../groups/useMembers";
import Card from "./Card";
import { CARDS } from "./colors";
import Tag from "./Tag";

// Everyone in the group, by nickname (real names are only for admins). Your own entry is marked.
export default function MembersCard({ gid, myUid }) {
  const members = useMembers(gid);

  return (
    <Card title="Who's in" tone={CARDS.members} scribble="faces" right={members ? <span className="text-sm font-bold text-muted">{members.length}</span> : null}>
      {members === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center gap-2 rounded-full border border-accent/30 bg-canvas/40 py-1 pr-3 pl-1 text-sm font-bold text-ink">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-extrabold text-on-primary uppercase">
                {String(m.nickname ?? "?").slice(0, 1)}
              </span>
              {m.nickname}
              {m.uid === myUid && <Tag tone="you">You</Tag>}
              {m.role === "owner" && <Tag tone="role">Owner</Tag>}
              {m.role === "admin" && <Tag tone="role">Admin</Tag>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
