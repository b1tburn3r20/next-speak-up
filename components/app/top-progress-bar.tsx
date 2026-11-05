"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createProgressTracker,
  isInternalNavigation,
  trackFetch,
} from "@/lib/request-progress";

const tracker = createProgressTracker();
// A quick request shouldn't flash a bar.
const SHOW_DELAY_MS = 120;
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

export function TopProgressBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const original = window.fetch;
    window.fetch = trackFetch(original.bind(window), tracker);
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || event.defaultPrevented) return;
      if (!isInternalNavigation(anchor, event, window.location.href) || navigating) return;
      navigating = true;
      tracker.start();
      clearTimeout(timeout);
      timeout = setTimeout(endNavigation, NAVIGATION_TIMEOUT_MS);
    };
    document.addEventListener("click", onClick);

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = tracker.subscribe((active) => {
      clearTimeout(showTimer);
      if (active) showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      else setVisible(false);
    });

    return () => {
      window.fetch = original;
      document.removeEventListener("click", onClick);
      unsubscribe();
      clearTimeout(timeout);
      clearTimeout(showTimer);
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
        data-testid="top-progress-bar"
        data-active={visible}
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-[progress-slide_1.1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none" />
      </div>
    </>
  );
}
