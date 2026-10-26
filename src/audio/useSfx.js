import { useSyncExternalStore } from "react";
import { getMuted, setMuted, subscribe } from "./sfx";

// React view of the sound-effects mute switch (the engine itself lives in sfx.js, outside React)
export function useSfx() {
  const muted = useSyncExternalStore(subscribe, getMuted, () => false);
  return { muted, setMuted };
}
