"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Polled<T> = {
  data: T | null;
  error: string | null;
  /** Why it failed, from the server: NOT_CONFIGURED or UNREACHABLE. */
  reason: string | null;
  refresh: () => void;
};

/**
 * Fetches on a timer, but only while this tab is visible, so a page left open in the background
 * makes no requests at all. `intervalMs` can change, so it can go faster while something's running.
 */
export function usePolling<T>(url: string, intervalMs: number): Polled<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const latest = useRef(url);

  const load = useCallback(async () => {
    const target = url;
    latest.current = target;
    try {
      const response = await fetch(target);
      const body = await response.json().catch(() => null);
      if (latest.current !== target) return;
      if (!response.ok) {
        setError(body?.error ?? "That didn't load.");
        setReason(body?.reason ?? null);
        return;
      }
      setData(body as T);
      setError(null);
      setReason(null);
    } catch {
      if (latest.current === target) setError("That didn't load.");
    }
  }, [url]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, intervalMs]);

  return { data, error, reason, refresh: load };
}
