// Landing page text and buttons. Layout rules:
//  - phones (portrait): centered column, buttons at the bottom above the cottage
//  - desktop (md+): left-aligned inside the Layout's 80% width, buttons under the tagline
//  - phones in landscape (`short:`): title left, buttons right, cottage in the middle
// data-* attributes are hooks for useLandingTimeline.js (entrance + idle) and the tap reactions (2.5).

// Each letter is its own inline-block span so letters can be animated one by one.
// The h1 carries an aria-label, so screen readers read the words once instead of letter by letter.
function Word({ text }) {
  return (
    <span className="block" aria-hidden="true">
      {[...text].map((ch, i) => (
        <span key={i} data-letter className="inline-block">
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function HeroContent({ onEnterWithMusic, onEnterQuiet }) {
  return (
    <div
      data-hero
      className="flex flex-1 flex-col items-center justify-between pt-[8svh] pb-[25svh] text-center md:items-start md:justify-start md:gap-12 md:pt-[max(11svh,5.5rem)] md:pb-0 md:text-left short:flex-row short:items-center short:justify-between short:gap-4 short:pt-[3.25rem] short:pb-3 short:text-left"
    >
      <header className="flex flex-col items-center gap-5 md:items-start short:items-start short:gap-1">
        <div data-hero-eyebrow className="flex flex-col items-center gap-1 md:items-start short:items-start">
          {/* "Curia" in Fraunces, "VI" in Cinzel Black: heavier, larger, tucked right against it */}
          <p className="font-display text-3xl font-semibold leading-none text-ink md:text-4xl">
            Curia
            <span className="ml-1 font-roman text-[1.5em] font-black leading-none">VI</span>
          </p>
          <p className="font-display text-base font-semibold text-ink/85 md:text-xl">2026 Edition</p>
        </div>

        {/* Striper has one weight: font-normal + font-synthesis none stop the browser faking a bold */}
        <h1
          data-hero-title
          aria-label="Secret Santa"
          className="hero-title font-title text-[clamp(3.5rem,19vw,7.5rem)] font-normal leading-[0.92] tracking-normal text-ink [font-synthesis:none] md:text-[clamp(6rem,11.5vw,11rem)] short:text-6xl"
        >
          <Word text="Secret" />
          <Word text="Santa" />
        </h1>

        <p data-hero-tagline className="max-w-xs text-lg text-ink/90 md:max-w-2xl md:text-2xl short:hidden">
          Wish a little. Get a little more.
        </p>
      </header>

      {/* Each button sits in a wrapper div: GSAP animates the wrapper, the button keeps its own CSS transition */}
      <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4 short:flex-col short:items-end short:gap-2">
        <div data-hero-cta>
          <button
            type="button"
            onClick={onEnterWithMusic}
            className="rounded-full border border-accent/70 bg-primary px-8 py-4 font-display text-lg font-extrabold text-on-primary shadow-xl transition-[scale] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:px-10 md:text-xl short:px-6 short:py-3 short:text-base"
          >
            Enter with music ♪
          </button>
        </div>
        <div data-hero-cta>
          <button
            type="button"
            onClick={onEnterQuiet}
            className="rounded-full border border-accent/50 bg-surface/90 px-6 py-2.5 text-sm font-bold text-ink transition-[scale] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:px-8 md:py-3.5 md:text-base"
          >
            Enter without music
          </button>
        </div>
      </div>
    </div>
  );
}
