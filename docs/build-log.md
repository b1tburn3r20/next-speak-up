# Build log

Newest first. Re-read the [mission](mission.md) and the relevant sheet before each task.

## Status, Nov 5, 2026

All [acceptance criteria](acceptance-criteria.md) are met on the data loaded so far.

**What's still growing:** `overnight.sh` style batches load the rest of the 119th Congress's bills. As of this entry, about 1,400 of 20,000 are loaded. Every bill with a recorded final vote and everything on the floor schedule is already in. Each member's sponsorship record is complete regardless.

**Not proven, because of the no-paid-services rule:** Gemini answers and Lemonfox read-aloud have only been tested with stubs.

**Ideas for next time**

- Votes by your reps that you disagreed with most, as a shareable recap.
- Notifications outside the app. They'd need email, which is a paid service.
- A Senate schedule, if an open source appears.

## Decisions

- **Senate votes stay on Voteview.** senate.gov returns 403 to automated requests, including its official XML feed. Faking a browser would get around that, so we don't. The `senate_gap` check compares Senate votes named in bill actions with stored votes. On Nov 5, 2026, there was no gap, and the newest stored vote was number 256. If a gap appears, bill pages say the positions aren't in yet.
- **Light theme only,** as asked.
- **Digests are extracted, not generated.** No AI is called, and CRS's wording stays intact.
- **A rep's vote is fetched separately,** from `/api/civic/bills/reveal`, so it can't leak into a page.
- **The store only holds changes.** The server's first paint comes from the database, and is passed as `initial...` props, because a module-level store is shared between users on the server.
- **Job measures compare within a chamber,** and never judge a party. Only the user's votes decide whether someone represents them.
- **Net worth and "promise kept" stayed out.** On `main` they were placeholders with no real data behind them.
