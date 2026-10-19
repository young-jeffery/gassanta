import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../components/landing/Scene";
import { useMusic } from "../audio/useMusic";

// Stage 2.1: static layout. Scene + plain content so we can check composition.
// Phones in portrait: centered column. Desktop (md+): left-aligned, using the Layout's 80% width.
// Phones in landscape (`short:`, defined in index.css): title left, buttons right, cottage in the middle.
// Later sub-stages: fairy lights + HeroContent (2.2), entrance timeline (2.3), parallax (2.4),
// snow storm + wind sound + page transition (2.5).
export default function Landing() {
  const navigate = useNavigate();
  const { play } = useMusic();

  // Single-screen page: hide the scrollbar while we're here so it can never shift the layout.
  // Layout effect = applied before the first paint. Cleanup restores it for other pages.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-no-scrollbar", "");
    window.scrollTo(0, 0);
    return () => root.removeAttribute("data-no-scrollbar");
  }, []);

  const enterWithMusic = () => {
    play();
    navigate("/register");
  };
  const enterWithoutMusic = () => navigate("/register");

  return (
    <>
      <Scene />

      <div className="flex flex-1 flex-col items-center justify-between pt-[8svh] pb-[25svh] text-center md:items-start md:justify-start md:gap-12 md:pt-[11svh] md:pb-0 md:text-left short:flex-row short:items-center short:justify-between short:gap-4 short:pt-3 short:pb-3 short:text-left">
        <header className="flex flex-col items-center gap-5 md:items-start short:items-start short:gap-1">
          <div className="flex flex-col items-center gap-1 md:items-start short:items-start">
            {/* "Curia" in Fraunces, "VI" in Cinzel Black: heavier, larger, tucked right against it */}
            <p className="font-display text-3xl font-semibold leading-none text-ink md:text-4xl">
              Curia
              <span className="ml-1 font-roman text-[1.5em] font-black leading-none">VI</span>
            </p>
            <p className="font-display text-base font-semibold text-ink/85 md:text-xl">2026 Edition</p>
          </div>

          <h1
            className="font-display text-[clamp(3.25rem,15vw,6.5rem)] font-extrabold leading-[0.92] tracking-tight text-ink md:text-[clamp(5.5rem,10.5vw,10.5rem)] short:text-5xl"
            style={{ textShadow: "0 2px 24px color-mix(in srgb, var(--c-canvas) 70%, transparent)" }}
          >
            <span className="block">Secret</span>
            <span className="block">Santa</span>
          </h1>

          <p className="max-w-xs text-lg text-ink/90 md:max-w-2xl md:text-2xl short:hidden">Wish a little. Get a little more.</p>
        </header>

        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4 short:flex-col short:items-end short:gap-2">
          <button
            type="button"
            onClick={enterWithMusic}
            className="rounded-full border border-accent/70 bg-primary px-8 py-4 font-display text-lg font-extrabold text-on-primary shadow-xl transition-[scale] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:px-10 md:text-xl short:px-6 short:py-3 short:text-base"
          >
            Enter with music ♪
          </button>
          <button
            type="button"
            onClick={enterWithoutMusic}
            className="rounded-full border border-accent/50 bg-surface/80 px-6 py-2.5 text-sm font-bold text-ink backdrop-blur transition-[scale] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:px-8 md:py-3.5 md:text-base"
          >
            Enter without music
          </button>
        </div>
      </div>
    </>
  );
}
