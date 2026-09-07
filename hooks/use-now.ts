"use client";

import { useEffect, useState } from "react";

/**
 * The wall clock, as React state.
 *
 * Anything that renders an age is derived from "now", and reading `Date.now()`
 * during render makes that derivation unstable: two rows can disagree about the
 * present, and a re-render that had nothing to do with time can silently change
 * what the screen says. Holding it as state and advancing it on a timer means
 * ages move forward deliberately instead of incidentally.
 *
 * The default minute is chosen against what it drives — ages are rendered in
 * whole hours and days, so anything finer would re-render for nothing.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
