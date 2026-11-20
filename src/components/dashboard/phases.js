// What each phase card shows for the group's current stage. Stages, in order:
//   registration -> preferences -> awaiting_draw -> drawn
// (Admins move a group between them, forwards or back; see firestore.rules.)
// Tones pick the tag's colour (Tag.jsx): open | closed | locked | progress | drawn
export function phaseStates(stage) {
  return {
    registration: stage === "registration" ? { tone: "open", label: "Open" } : { tone: "closed", label: "Closed" },
    preferences:
      stage === "registration"
        ? { tone: "locked", label: "Locked" }
        : stage === "preferences"
          ? { tone: "open", label: "Open" }
          : { tone: "closed", label: "Closed" },
    reveal:
      stage === "drawn"
        ? { tone: "drawn", label: "Drawn" }
        : stage === "awaiting_draw"
          ? { tone: "progress", label: "Draw in progress" }
          : { tone: "closed", label: "Closed" },
  };
}

// The date line on a phase card. `over` = this phase is already finished (its tag says Closed).
//   "Closes Fri 20 Nov, 6:00 PM"        (open or locked, date still ahead)
//   "Deadline passed Fri 20 Nov"        (still open, but the date went by: the admin hasn't closed it yet)
//   "Closed"                            (phase over)
//   "Gifting day: Sat 19 Dec, 2:00 PM"  (kind "gifting")
//   "No deadline set yet"
// `ts` is a Firestore Timestamp (or null); `now` is a millisecond clock reading.
export function deadlineText(kind, ts, now, over = false) {
  const date = ts && typeof ts.toDate === "function" ? ts.toDate() : null;
  if (kind === "gifting") {
    if (!date) return "Gifting day: not set yet";
    return `Gifting day: ${new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date)}`;
  }
  if (over) return "Closed";
  if (!date) return "No deadline set yet";
  if (date.getTime() > now) {
    return `Closes ${new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date)}`;
  }
  return `Deadline passed ${new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(date)}`;
}
