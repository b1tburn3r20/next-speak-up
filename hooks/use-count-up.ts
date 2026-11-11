"use client";

import { useEffect, useRef, useState } from "react";
import { countUpValue } from "@/lib/civic/celebration";

/**
 * A number that counts up to its new value instead of jumping, like XP landing in the bar. It starts
 * from what it showed before, after `delay` (so it lands when the +XP chip arrives), and jumps straight
 * there for anyone who asks for less motion. `rising` is true while it counts, so the caller can glow.
 */
export function useCountUp(value: number, duration = 650, delay = 0): { shown: number; rising: boolean } {
  const [counting, setCounting] = useState<{ to: number; shown: number } | null>(null);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (value <= start || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let began: number | null = null;
    const step = (now: number) => {
      began ??= now;
      const next = countUpValue(start, value, now - began, duration);
      if (next === value) {
        setCounting(null);
        return;
      }
      setCounting({ to: value, shown: next });
      frame = requestAnimationFrame(step);
    };
    const wait = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(wait);
      cancelAnimationFrame(frame);
    };
  }, [value, duration, delay]);

  // Only a count toward the current value counts. Anything else shows the real number.
  const live = counting !== null && counting.to === value;
  return { shown: live ? counting.shown : value, rising: live };
}
