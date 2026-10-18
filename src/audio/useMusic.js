import { useContext } from "react";
import { MusicContext } from "./musicContext";

// const { current, playing, toggle, next, prev, select, tracks, index, error } = useMusic();
export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
}
