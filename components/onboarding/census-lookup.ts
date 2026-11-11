"use client";

// Asks the Census geocoder from the visitor's own browser. Railway's servers can't reach the Census
// (it drops their connections), but a visitor's network can.
//
// The Census sends no CORS headers, so a page can't fetch() its answer. It does answer as JSONP: a
// script that calls a function with the result. A script from another site would normally run with
// this page's full access, so it runs inside a sandboxed iframe instead. Without "allow-same-origin",
// the frame has an opaque origin: it can't read this page, its cookies, or its storage, and it can only
// hand back a plain copy of the answer through postMessage. That copy is then parsed as untrusted data.

import { censusLookupUrl, parseCensusResult, type CensusQuery, type ResolvedDistrict } from "@/lib/civic/location";

const TIMEOUT_MS = 15_000;
const CALLBACK = "censusAnswer";

/** Thrown when the browser couldn't get an answer at all, so the caller can let the server try. */
export class CensusUnreachable extends Error {
  constructor(reason: string) {
    super(`The Census couldn't be reached from this browser: ${reason}`);
    this.name = "CensusUnreachable";
  }
}

const attribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The district for a point or an address, or null when the Census found none there. */
export function lookUpInBrowser(query: CensusQuery): Promise<ResolvedDistrict | null> {
  return new Promise((resolve, reject) => {
    const id = `census-${Math.random().toString(36).slice(2)}`;
    const tag = JSON.stringify(id);
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.display = "none";
    frame.srcdoc =
      `<!doctype html><script>function ${CALLBACK}(data){parent.postMessage({id:${tag},data:data},"*")}</script>` +
      `<script src="${attribute(censusLookupUrl(query, "jsonp", CALLBACK))}" onerror='parent.postMessage({id:${tag},failed:true},"*")'></script>`;

    const finish = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      frame.remove();
    };
    const onMessage = (event: MessageEvent) => {
      // Only this frame's own answer to this question counts.
      if (event.source !== frame.contentWindow || (event.data as { id?: unknown } | null)?.id !== id) return;
      finish();
      const message = event.data as { data?: unknown; failed?: boolean };
      if (message.failed) reject(new CensusUnreachable("the request failed"));
      else resolve(parseCensusResult(query, message.data));
    };
    const timer = setTimeout(() => {
      finish();
      reject(new CensusUnreachable("no answer in time"));
    }, TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
  });
}
