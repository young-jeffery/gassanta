// A group's name as people read it: "Curia VI". A group is stored as { name: "Curia", tag: "VI" } so the landing page and
// badges can set the tag in a bolder font, but in sentences and buttons they belong together.
export const groupTitle = (group) => [group?.name, group?.tag].filter(Boolean).join(" ");
