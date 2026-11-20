// The group's rules are plain text written by the admin: paragraphs, numbered lines ("1.  Something"), and
// **bold** words. This turns that into blocks the dashboard can draw WITHOUT putting admin-written text into HTML:
//   [{ type: "p" | "li", parts: [{ text, bold }] }]
function parts(line) {
  return line
    .split("**")
    .map((text, i) => ({ text, bold: i % 2 === 1 }))
    .filter((p) => p.text !== "");
}

export function parseRules(text) {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const numbered = line.match(/^\d+\.\s+(.*)$/);
      return numbered ? { type: "li", parts: parts(numbered[1]) } : { type: "p", parts: parts(line) };
    });
}
