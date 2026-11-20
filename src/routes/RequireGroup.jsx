import { Link, Outlet } from "react-router-dom";
import { useGroup } from "../groups/useGroup";
import { groupTitle } from "../lib/groupTitle";
import RouteLoading from "./RouteLoading";

const linkClass =
  "rounded-full border border-accent/50 bg-surface/90 px-6 py-3 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

function Notice({ title, children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center md:items-start md:text-left">
      <h1 className="font-display text-3xl font-extrabold text-ink md:text-5xl">{title}</h1>
      <p className="max-w-xs text-muted md:max-w-xl md:text-lg">{children}</p>
      <div className="flex flex-wrap justify-center gap-3 md:justify-start">
        <Link to="/dashboard" className={linkClass}>
          My groups
        </Link>
        <Link to="/join" className={linkClass}>
          Join with a code
        </Link>
      </div>
    </div>
  );
}

// Wrap every /g/:slug/... route. Only members of that group get through (the security rules enforce this too).
export default function RequireGroup() {
  const { loading, group, isMember } = useGroup();

  if (loading) return <RouteLoading />;
  if (!group) return <Notice title="Group not found">There's no group at this address. Check the link you were given.</Notice>;
  if (!isMember) {
    return (
      <Notice title="You're not in this group">
        Your account isn't a member of {groupTitle(group)}. If you have a join code for it, use "Join with a code".
      </Notice>
    );
  }
  return <Outlet />;
}
