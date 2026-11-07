"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createProgressTracker,
  isInternalNavigation,
  nextTrickle,
  trackFetch,
} from "@/lib/request-progress";

const tracker = createProgressTracker();
const START_PERCENT = 12;
const TRICKLE_EVERY_MS = 150;
const FADE_AFTER_MS = 220;
// A navigation that never completes, such as one cancelled by the browser, mustn't leave the
// bar stuck on screen.
const NAVIGATION_TIMEOUT_MS = 15000;

function RouteWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  useEffect(onChange, [pathname, query, onChange]);
  return null;
}

let navigating = false;
function endNavigation() {
  if (navigating) {
    navigating = false;
    tracker.finish();
  }
}

/**
 * The bar across the top of every page, like YouTube's. It jumps forward when a request starts,
 * creeps while waiting, and races to the end when the last one finishes, so a fast page shows a
 * quick sweep and a slow one shows it's still working.
 */
export function TopProgressBar() {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const fade = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trickle = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const original = window.fetch;
    window.fetch = trackFetch(original.bind(window), tracker);
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const beginNavigation = () => {
      if (navigating) return;
      navigating = true;
      tracker.start();
      clearTimeout(timeout);
      timeout = setTimeout(endNavigation, NAVIGATION_TIMEOUT_MS);
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || event.defaultPrevented) return;
      if (isInternalNavigation(anchor, event, window.location.href)) beginNavigation();
    };
    document.addEventListener("click", onClick);
    // A search form's plain submit, or a full reload, leaves through here.
    window.addEventListener("beforeunload", beginNavigation);

    const unsubscribe = tracker.subscribe((active) => {
      clearTimeout(fade.current);
      clearInterval(trickle.current);
      if (active) {
        setVisible(true);
        setPercent((current) => Math.max(current, START_PERCENT));
        trickle.current = setInterval(() => setPercent(nextTrickle), TRICKLE_EVERY_MS);
      } else {
        setPercent(100);
        fade.current = setTimeout(() => {
          setVisible(false);
          setPercent(0);
        }, FADE_AFTER_MS);
      }
    });

    // The first page of a visit may still be arriving when this runs.
    if (document.readyState !== "complete") {
      tracker.start();
      window.addEventListener("load", () => tracker.finish(), { once: true });
    }

    return () => {
      window.fetch = original;
      document.removeEventListener("click", onClick);
      window.removeEventListener("beforeunload", beginNavigation);
      unsubscribe();
      clearTimeout(timeout);
      clearTimeout(fade.current);
      clearInterval(trickle.current);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <RouteWatcher onChange={endNavigation} />
      </Suspense>
      <div
        role="progressbar"
        aria-label="Loading"
        aria-hidden={!visible}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="top-progress-bar"
        data-active={visible}
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`h-full bg-primary shadow-[0_0_8px_var(--primary)] motion-reduce:transition-none ${
            percent === 0 ? "" : "transition-[width] duration-200 ease-out"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </>
  );
}
