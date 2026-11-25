"use client";

import { useSyncExternalStore } from "react";

/** Live result of a CSS media query; the server assumes `false` (desktop layout). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True below 768px wide: phone layout with a slide-in sidebar. */
export function useIsPhone(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/** True below 1024px wide: tablets, where the sidebar starts collapsed to icons. */
export function useIsNarrow(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
