import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../components/landing/Scene";
import FairyLights from "../components/landing/FairyLights";
import HeroContent from "../components/landing/HeroContent";
import SkyToggle from "../components/landing/SkyToggle";
import { useLandingTimeline } from "../components/landing/useLandingTimeline";
import { useDayNightScene } from "../components/landing/useDayNightScene";
import { useMusic } from "../audio/useMusic";

// Landing page = backdrop scene + fairy lights + hero text/buttons, animated by useLandingTimeline.
// The sun/moon doubles as the day/night switch (SkyToggle).
// Next: parallax (2.4), snow storm + wind sound + page transition + tap reactions (2.5).
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

  const enterWithMusic = () => {
    play();
    navigate("/register");
  };
  const enterWithoutMusic = () => navigate("/register");

  return (
    <>
      <Scene />
      <FairyLights />
      <SkyToggle />
      <HeroContent onEnterWithMusic={enterWithMusic} onEnterQuiet={enterWithoutMusic} />
    </>
  );
}
