"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs`. Returns null on the server
 * and the first client render so the clock never causes a hydration mismatch.
 */
export function useNow(intervalMs: number): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
