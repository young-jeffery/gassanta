// "Curia VI" + "2026 Edition", styled like the landing page title (bold roman-numeral tag attached to the name).
export default function GroupBadge({ group }) {
  return (
    <div className="mb-4 rounded-2xl border border-accent/30 bg-canvas/40 px-4 py-3">
      <p className="font-display text-xl font-extrabold text-ink">
        {group.name}
        {group.tag && <span className="ml-1 font-roman text-[1.25em] font-black leading-none">{group.tag}</span>}
      </p>
      {group.year && <p className="text-xs font-bold uppercase tracking-widest text-muted">{group.year} Edition</p>}
    </div>
  );
}
