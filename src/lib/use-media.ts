"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook. The server snapshot is always false, so the
 * desktop layout is what gets rendered on the server and React swaps in the
 * real answer on hydration without a flash of the wrong tree.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones and small tablets — the hall renders leaner here. */
export function useIsCompact(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Coarse pointer = touch, so hover affordances are pointless. */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
