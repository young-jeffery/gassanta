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
import { useMusic } from "../audio/useMusic";

// Landing page = backdrop scene + fairy lights + hero text/buttons, animated by useLandingTimeline.
// The sun/moon doubles as the day/night switch (SkyToggle). Tapping the scene plays little reactions + sounds
// (useTapReactions). Santa flies by every 30-40s (useSanta). Next: parallax (2.4), snow storm + wind sound + page transition (2.5).
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

  const enterWithMusic = () => {
    play();
    navigate("/register");
  };
  const enterWithoutMusic = () => navigate("/register");

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
