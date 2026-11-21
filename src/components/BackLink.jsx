import { Link } from "react-router-dom";

// A "back" pill with a hover effect: the ink colour fills it from left to right (the fill is the pill's OWN background,
// sliding in with `background-size`, so there are no seams or gaps), the arrow slides left and the pill lifts a little.
// Used by the register/login pages, the dashboard and the placeholder pages.
export default function BackLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex w-fit items-center gap-2 rounded-full border-2 border-accent/50 bg-surface/80 px-4 py-1.5 text-sm font-bold text-ink [background-image:linear-gradient(var(--c-ink),var(--c-ink))] [background-repeat:no-repeat] [background-size:0%_100%] transition-[background-size,transform,color,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink hover:text-canvas hover:[background-size:100%_100%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 ${className}`}
    >
      <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
        &larr;
      </span>
      {children}
    </Link>
  );
}
