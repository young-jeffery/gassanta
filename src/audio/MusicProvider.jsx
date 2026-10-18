import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";
import { TRACKS } from "./tracks";
import { MusicContext } from "./musicContext";

const VOLUME = 0.6;
const STORAGE_KEY = "ss-track";

function readStoredIndex() {
  try {
    const i = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(i) && i >= 0 && i < TRACKS.length ? i : 0;
  } catch {
    return 0;
  }
}

// Lives above the router, so the music keeps playing while the user moves between pages.
// Browsers block audio until the user taps something, so nothing loads until play() / toggle().
export default function MusicProvider({ children }) {
  const [index, setIndex] = useState(readStoredIndex);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const howlRef = useRef(null);
  const indexRef = useRef(index);
  const nextRef = useRef(() => {});

  // Replace the current Howl with one for track `i`
  const goTo = useCallback((i, autoplay = true) => {
    howlRef.current?.unload();

    setIndex(i);
    indexRef.current = i;
    setPlaying(false);
    setError(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(i));
    } catch {
      /* ignore */
    }

    const howl = new Howl({
      src: [TRACKS[i].src],
      html5: true, // streams the file instead of decoding it all into memory (kinder to phones)
      volume: 0,
      onplay: () => {
        setPlaying(true);
        howl.fade(0, VOLUME, 1000);
      },
      onpause: () => setPlaying(false),
      onend: () => nextRef.current(),
      onloaderror: () => {
        setError(true);
        setPlaying(false);
      },
      onplayerror: () => {
        // The browser refused (no tap yet). Retry on the first tap/click.
        setPlaying(false);
        howl.once("unlock", () => howl.play());
      },
    });
    howlRef.current = howl;
    if (autoplay) howl.play();
  }, []);

  const next = useCallback(() => goTo((indexRef.current + 1) % TRACKS.length, true), [goTo]);
  const prev = useCallback(() => goTo((indexRef.current - 1 + TRACKS.length) % TRACKS.length, true), [goTo]);

  // Keep the end-of-track handler pointed at the latest `next`
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const play = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) goTo(indexRef.current, true);
    else if (!howl.playing()) howl.play();
  }, [goTo]);

  const toggle = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) goTo(indexRef.current, true);
    else if (howl.playing()) howl.pause();
    else howl.play();
  }, [goTo]);

  useEffect(() => () => howlRef.current?.unload(), []);

  const value = useMemo(
    () => ({
      tracks: TRACKS,
      index,
      current: TRACKS[index],
      playing,
      error,
      play,
      toggle,
      next,
      prev,
      select: (i) => goTo(i, true),
    }),
    [index, playing, error, play, toggle, next, prev, goTo]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
