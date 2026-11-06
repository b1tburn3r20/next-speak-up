# Build log

Newest first. Re-read the [mission](mission.md) and the relevant sheet before each task.

## Plan

1. **Data:** `voted_bills`, `member_legislation`, rollups, `isFinalVote`, `senate_gap`, then keep backfilling in the background.
2. **Foundations:** one theme, tokens, font, blocks, buttons, Zustand store.
3. **Logic:** verdicts, digests, progress, next steps, glossary, policy areas, with tests first.
4. **Core loop:** reveal API, pulse, `/vote` session.
5. **Pages:** dashboard, upcoming, bill page, members, topics, learn, landing, navigation.
6. **Prove it:** tests, screenshots, speed, then improve whatever falls short.

## Decisions

- **Senate votes stay on Voteview.** senate.gov returns 403 to automated requests, including its XML feed. Faking a browser would get around that, so we don't. On Nov 5, 2026, all 54 Senate votes mentioned in bill actions were stored, so there was no real lag then. The `senate_gap` check keeps measuring.
- **Light theme only,** as asked.
- **Digests are extracted, not generated,** so no AI is called and CRS's wording stays intact.
