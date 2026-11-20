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
import { useEdition } from "../components/landing/useEdition";
import { useAuth } from "../auth/useAuth";
import { useParallax } from "../lib/useParallax";
import { playBlizzard } from "../lib/blizzard";
import { useLite } from "../lib/useLite";
import { useMusic } from "../audio/useMusic";

// Single-screen page: hide the scrollbar while we're here so it can never shift the layout.
// Layout effect = applied before the first paint. Cleanup restores it for other pages.
function useSingleScreen() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-no-scrollbar", "");
    window.scrollTo(0, 0);
    return () => root.removeAttribute("data-no-scrollbar");
  }, []);
}

// Full landing page = backdrop scene + fairy lights + hero text/buttons, animated by useLandingTimeline.
// The sun/moon doubles as the day/night switch (SkyToggle). Tapping the scene plays little reactions + sounds
// (useTapReactions). Santa flies by every 30-40s (useSanta). Parallax: lib/useParallax.js. Entering = blizzard transition (lib/blizzard.js).
function LandingFull() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const { play } = useMusic();
  const { setLite } = useLite();
  const edition = useEdition();
  useSingleScreen();

  // Runs after the children above have rendered, so the portaled scene and lights exist
  useDayNightScene(); // day mode dims the night glow (window light, bulb halos)
  useLandingTimeline();
  useTapReactions();
  useSanta();
  useParallax(); // layers slide at different speeds with the pointer/finger, and drift when idle

  // Both buttons: a snow storm builds, a whiteout sweeps over, /register loads underneath, the whiteout melts away
  // (lib/blizzard.js). "With music" starts the music the moment it's pressed, as the snow starts to blow.
  // Where Enter goes: your dashboard if you're signed in (from there you can switch or join groups), else registration
  const target = status === "signedIn" ? "/dashboard" : "/register";
  const enterWithMusic = () => {
    if (playBlizzard(() => navigate(target))) play();
  };
  const enterWithoutMusic = () => {
    playBlizzard(() => navigate(target));
  };

  return (
    <>
      <Scene />
      <Santa />
      <FairyLights />
      <SkyToggle />
      <HeroContent edition={edition} onEnterWithMusic={enterWithMusic} onEnterQuiet={enterWithoutMusic} onToggleLite={() => setLite(true)} />
    </>
  );
}

// Lite landing page: the same scene, fairy lights and text, drawn once and left still. No timeline, Santa, parallax,
// tap reactions or blizzard; the buttons just go to the next page. The sun/moon still switches day and night (instantly),
// and day mode still dims the night glow (useDayNightScene sets that without animating). lite.css also stops the
// scene's own CSS animations.
function LandingLite() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const { play } = useMusic();
  const { setLite } = useLite();
  const edition = useEdition();
  useSingleScreen();
  useDayNightScene();

  const target = status === "signedIn" ? "/dashboard" : "/register";

  return (
    <>
      <Scene />
      <FairyLights />
      <SkyToggle />
      <HeroContent
        lite
        edition={edition}
        onEnterWithMusic={() => {
          play();
          navigate(target);
        }}
        onEnterQuiet={() => navigate(target)}
        onToggleLite={() => setLite(false)}
      />
    </>
  );
}

export default function Landing() {
  const { lite } = useLite();
  return lite ? <LandingLite /> : <LandingFull />;
}
