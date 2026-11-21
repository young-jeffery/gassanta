import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useGroup } from "../groups/useGroup";
import BackLink from "../components/BackLink";
import DevStageSwitcher from "../components/DevStageSwitcher";
import Card from "../components/dashboard/Card";
import InviteCard from "../components/dashboard/InviteCard";
import MembersCard from "../components/dashboard/MembersCard";
import PhaseCard from "../components/dashboard/PhaseCard";
import RulesCard from "../components/dashboard/RulesCard";
import Tag from "../components/dashboard/Tag";
import VerifyBanner from "../components/dashboard/VerifyBanner";
import WishlistCard from "../components/dashboard/WishlistCard";
import { GiftIcon, HeartListIcon, TreeIcon } from "../components/dashboard/icons";
import { CARDS } from "../components/dashboard/colors";
import { deadlineText, phaseStates } from "../components/dashboard/phases";
import { groupTitle } from "../lib/groupTitle";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

// Log out is red on purpose: it is the one button here that ends your session
const logoutClass = `rounded-full border-2 border-[#7a1810] bg-[#d92d20] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#b42318] hover:shadow-lg active:translate-y-0 active:scale-95 ${focusRing}`;

// /g/:slug/dashboard. Everything a member needs for their group: where the Secret Santa is up to (three phase cards
// with live status tags and dates), their wishlist, the rules, who is in, and (for admins) the invite code.
// The cards update live when an admin changes the group's stage.
export default function Dashboard() {
  const { user, emailVerified, logOut } = useAuth();
  const { group, groups, activeGid, me, role, stage, isAdmin } = useGroup();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now()); // one clock reading, for "closes" vs "closed"

  const states = phaseStates(stage);
  const deadlines = group.deadlines ?? {};
  const drawn = stage === "drawn";

  const onLogOut = async () => {
    navigate("/", { replace: true }); // leave first, so the route guard doesn't bounce us to /login
    await logOut();
  };

  return (
    <div className="flex flex-1 flex-col gap-5 py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <BackLink to="/">Back to home</BackLink>
          <p className="mt-2 text-sm font-bold tracking-widest text-muted uppercase">
            {group.name}
            {group.tag && <span className="ml-1 font-roman text-[1.15em] font-black">{group.tag}</span>}
            {group.year ? ` · ${group.year} Edition` : ""}
          </p>
          <h1 className="font-display text-4xl font-extrabold text-ink md:text-6xl">Hi, {me?.nickname}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink/90">
            You're in {groupTitle(group)}
            {role === "owner" && <Tag tone="role">Owner</Tag>}
            {role === "admin" && <Tag tone="role">Admin</Tag>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {groups.length > 1 && (
            <label className="sr-only" htmlFor="group-switch">
              Switch group
            </label>
          )}
          {groups.length > 1 && (
            <select
              id="group-switch"
              value={activeGid ?? ""}
              onChange={(e) => navigate(`/g/${e.target.value}/dashboard`)}
              className="rounded-full border border-accent/50 bg-surface px-4 py-2.5 text-sm font-bold text-ink"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {groupTitle(g)}
                </option>
              ))}
            </select>
          )}
          {/* Join another group. Hover: the pill lifts, a green fill slides in from the left (the pill's own background, so
              no seams), the + turns and the arrow lights up. Both end circles are the same size and the same distance from the
              edge, so the button is symmetrical. */}
          <Link
            to="/join"
            className={`group inline-flex h-11 items-center gap-2.5 rounded-full border-2 border-accent/60 bg-surface/90 px-1.5 text-sm font-bold text-ink shadow-md [background-image:linear-gradient(#2f9e5b,#2f9e5b)] [background-repeat:no-repeat] [background-size:0%_100%] transition-[background-size,transform,box-shadow,border-color,color] duration-300 ease-out hover:-translate-y-0.5 hover:border-[#2f9e5b] hover:text-white hover:shadow-xl hover:[background-size:100%_100%] active:translate-y-0 active:scale-95 ${focusRing}`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-canvas transition-transform duration-300 group-hover:rotate-180">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="leading-none">Join another group</span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-accent/60 transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[#2f9e5b]">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
          <button type="button" onClick={onLogOut} className={logoutClass}>
            Log out
          </button>
        </div>
      </div>

      {!emailVerified && user?.email && <VerifyBanner email={user.email} />}

      {isAdmin && (
        <p className="rounded-2xl border border-dashed border-accent/50 bg-surface/70 px-4 py-3 text-sm text-ink/90">
          You're an admin of this group. The admin page (stages, deadlines, rules, members) arrives in the next update. Until then the stage is changed in the database.
        </p>
      )}

      <section aria-label="Phases" className="grid gap-4 md:grid-cols-3">
        <PhaseCard
          step={1}
          title="Registration"
          icon={<TreeIcon />}
          tone={CARDS.registration}
          scribble="trees"
          state={states.registration}
          description={stage === "registration" ? "You're registered. Sign-ups are open, so tell your friends." : "You're registered. Sign-ups are closed."}
          deadline={deadlineText("closes", deadlines.registration, now, states.registration.tone === "closed")}
        />
        <PhaseCard
          step={2}
          title="Preferences"
          icon={<HeartListIcon />}
          tone={CARDS.preferences}
          scribble="hearts"
          state={states.preferences}
          description={
            stage === "registration"
              ? "Opens once registration ends. You'll choose who you hope to gift, and who you hope gifts you."
              : stage === "preferences"
                ? "Choose who you hope to gift, and who you hope gifts you. Mutual picks raise your odds."
                : "Preferences are closed. Your picks are locked in."
          }
          deadline={deadlineText("closes", deadlines.preferences, now, states.preferences.tone === "closed")}
          action={stage === "preferences" ? { label: "Choose preferences", to: `/g/${activeGid}/preferences` } : null}
        />
        <PhaseCard
          step={3}
          title="Reveal"
          icon={<GiftIcon />}
          tone={CARDS.reveal}
          scribble="gifts"
          state={states.reveal}
          description={
            drawn
              ? "The draw is done! Watch your reveal to find out who you're gifting."
              : stage === "awaiting_draw"
                ? "Preferences are in. The organiser will run the draw soon."
                : "After the draw you'll watch a little reveal that tells you who you're gifting."
          }
          deadline={deadlineText("gifting", deadlines.gifting, now)}
          action={drawn ? { label: "Watch my reveal", to: `/g/${activeGid}/reveal` } : null}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <WishlistCard gid={activeGid} uid={user.uid} drawn={drawn} />
        <div className="flex flex-col gap-4">
          {isAdmin && stage === "registration" && me?.joinCode && <InviteCard code={me.joinCode} groupName={groupTitle(group)} />}
          <RulesCard gid={activeGid} />
          <MembersCard gid={activeGid} myUid={user.uid} />
        </div>
      </div>

      {import.meta.env.DEV && isAdmin && (
        <Card title="Dev tools">
          <DevStageSwitcher gid={activeGid} stage={stage} />
        </Card>
      )}
    </div>
  );
}
