// Tracks in-flight requests and page navigations, for the progress bar at the top of the page.

type Listener = (active: boolean) => void;

export function createProgressTracker() {
  let inFlight = 0;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((listener) => listener(inFlight > 0));

  return {
    start() {
      inFlight += 1;
      if (inFlight === 1) notify();
    },
    finish() {
      if (inFlight === 0) return;
      inFlight -= 1;
      if (inFlight === 0) notify();
    },
    reset() {
      if (inFlight === 0) return;
      inFlight = 0;
      notify();
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get active() {
      return inFlight > 0;
    },
  };
}

export type ProgressTracker = ReturnType<typeof createProgressTracker>;

// NextAuth polls this in the background, and nobody's waiting on it.
const BACKGROUND_REQUESTS = /\/api\/auth\/(session|_log|csrf)/;

export function isBackgroundRequest(url: string): boolean {
  return BACKGROUND_REQUESTS.test(url);
}

/** Wraps fetch so every request a page makes shows in the bar, without changing any caller. */
export function trackFetch(original: typeof fetch, tracker: ProgressTracker): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (isBackgroundRequest(url)) return original(input, init);
    tracker.start();
    try {
      return await original(input, init);
    } finally {
      tracker.finish();
    }
  };
}

/** Whether clicking a link will navigate within the app, as opposed to a new tab or another site. */
export function isInternalNavigation(
  anchor: { href: string; target: string; hasAttribute(name: string): boolean },
  event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean },
  currentUrl: string,
): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
    return false;
  }
  const target = new URL(anchor.href, currentUrl);
  const current = new URL(currentUrl);
  if (target.origin !== current.origin) return false;
  // A link to the same page, or to an anchor on it, never finishes "navigating".
  return target.pathname !== current.pathname || target.search !== current.search;
}
