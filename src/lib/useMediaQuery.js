import { useSyncExternalStore } from "react";

// const phone = useMediaQuery("(max-width: 767px)");  // true/false, updates live when the window or phone is rotated
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
