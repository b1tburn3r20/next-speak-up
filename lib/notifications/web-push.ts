// Sending one push to one browser. Web Push is an open standard: each browser's own push service (Google's
// for Chrome, Mozilla's, Apple's) carries it, it's free, and it needs no account with any of them. Our VAPID
// keys sign each send, so the services know it's us. Tests replace `pushTransport`.
import webpush from "web-push";
import type { Message } from "./plan";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushResult = { ok: true } | { ok: false; gone: boolean; status: number | null };
export type PushTransport = (target: PushTarget, payload: string) => Promise<PushResult>;

let configured = false;

/** Whether this server has keys to send with. Without them, nothing is sent and the app says so. */
export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

const realTransport: PushTransport = async (target, payload) => {
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@coolbills.app", process.env.VAPID_PUBLIC_KEY ?? "", process.env.VAPID_PRIVATE_KEY ?? "");
    configured = true;
  }
  try {
    await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, payload, { TTL: 60 * 60 * 24 });
    return { ok: true };
  } catch (error) {
    const status = typeof (error as { statusCode?: unknown }).statusCode === "number" ? (error as { statusCode: number }).statusCode : null;
    // 404 and 410 mean the browser unsubscribed or the subscription expired, so it's never coming back.
    return { ok: false, gone: status === 404 || status === 410, status };
  }
};

let transport: PushTransport = realTransport;

export function setPushTransport(next: PushTransport | null): void {
  transport = next ?? realTransport;
}

export function pushTransport(): PushTransport {
  return transport;
}

/** What the service worker reads. Kept small: push services cap a payload at about 4 KB. */
export function pushPayload(message: Message, tag: string): string {
  return JSON.stringify({ title: message.title, body: message.body, url: message.url, tag });
}
