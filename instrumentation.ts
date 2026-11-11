// Runs once when the server starts. With NOTIFY_DISPATCH=1, it sends notifications every ten minutes:
// meeting reminders, Monday's bills, and vote results. It's off unless set, so a dev server or a test
// server never sends anything on its own. A pass is safe to overlap with another, because each
// notification is claimed in the database before it's sent.
const EVERY_MS = 10 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NOTIFY_DISPATCH !== "1") return;
  const { runDispatch } = await import("@/lib/notifications/dispatch");
  const { pushConfigured } = await import("@/lib/notifications/web-push");
  if (!pushConfigured()) {
    console.warn("[notify] NOTIFY_DISPATCH is on, but VAPID keys aren't set, so nothing will be sent.");
    return;
  }
  let running = false;
  const pass = async () => {
    if (running) return;
    running = true;
    try {
      const counts = await runDispatch();
      const sent = counts.cityMeetings + counts.floorWeek + counts.voteResults + counts.becameLaw;
      if (sent > 0 || counts.unreached > 0) console.info("[notify]", JSON.stringify(counts));
    } catch (error) {
      console.error("[notify] pass failed", error);
    } finally {
      running = false;
    }
  };
  // The first pass waits a minute, so it doesn't compete with the server warming up.
  setTimeout(() => {
    void pass();
    setInterval(() => void pass(), EVERY_MS).unref();
  }, 60 * 1000).unref();
}
