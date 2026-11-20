import { useSyncExternalStore } from "react";
import { getLite, setLite, subscribeLite } from "./lite";

// const { lite, setLite } = useLite();   // React view of lite mode (the switch itself lives in lite.js)
export function useLite() {
  const lite = useSyncExternalStore(subscribeLite, getLite, () => false);
  return { lite, setLite };
}
