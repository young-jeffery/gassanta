import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../components/landing/Scene";
import FairyLights from "../components/landing/FairyLights";
import HeroContent from "../components/landing/HeroContent";
import SkyToggle from "../components/landing/SkyToggle";
import Santa from "../components/landing/Santa";
import { useLandingTimeline } from "../components/landing/useLandingTimeline";
import { useDayNightScene } from "../components/landing/useDayNightScene";
import { useTapReactions } from "../components/landing/useTapReactions";
import { useSanta } from "../components/landing/useSanta";
import { useParallax } from "../lib/useParallax";
import { playBlizzard } from "../lib/blizzard";
import { useMusic } from "../audio/useMusic";

// Landing page = backdrop scene + fairy lights + hero text/buttons, animated by useLandingTimeline.
// The sun/moon doubles as the day/night switch (SkyToggle). Tapping the scene plays little reactions + sounds
// (useTapReactions). Santa flies by every 30-40s (useSanta). Parallax: lib/useParallax.js. Entering = blizzard transition (lib/blizzard.js). Next: Stage 3.
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

  // Runs after the children above have rendered, so the portaled scene and lights exist
  useDayNightScene(); // day mode dims the night glow (window light, bulb halos)
  useLandingTimeline();
  useTapReactions();
  useSanta();
  useParallax(); // layers slide at different speeds with the pointer/finger, and drift when idle

  // Both buttons: a snow storm builds, a whiteout sweeps over, /register loads underneath, the whiteout melts away
  // (lib/blizzard.js). "With music" starts the music the moment it's pressed, as the snow starts to blow.
  const enterWithMusic = () => {
    if (playBlizzard(() => navigate("/register"))) play();
  };
  const enterWithoutMusic = () => {
    playBlizzard(() => navigate("/register"));
  };

  return (
    <>
      <Scene />
      <Santa />
      <FairyLights />
      <SkyToggle />
      <HeroContent onEnterWithMusic={enterWithMusic} onEnterQuiet={enterWithoutMusic} />
    </>
  );
}
