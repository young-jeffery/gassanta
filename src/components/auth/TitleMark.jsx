// The landing page's "Secret Santa" title, small, for the top of the register / join / login / forgot pages (AuthShell).
// Same font (Striper) and the same thin outline as the landing title: the .hero-title class in index.css. It is a plain
// paragraph, not a heading: the page's own <h1> is the card title ("Welcome back"), so screen readers don't hear two.
// Sizes: phones centred and fluid, landscape phones smaller and right-aligned, desktop left-aligned.
export default function TitleMark({ className = "" }) {
  return (
    <p
      className={`hero-title font-title text-center text-[clamp(2.1rem,10.5vw,2.9rem)] leading-none font-normal text-ink [font-synthesis:none] md:text-left md:text-6xl short:text-right short:text-3xl ${className}`}
    >
      Secret Santa
    </p>
  );
}
