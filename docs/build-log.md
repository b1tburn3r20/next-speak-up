# Build log

Newest first. Re-read the [mission](mission.md) and the relevant sheet before each task.

## Status, Nov 5, 2026

All [acceptance criteria](acceptance-criteria.md) are met on the data loaded so far.

**What's still growing:** `overnight.sh` style batches load the rest of the 119th Congress's bills. As of this entry, about 1,400 of 20,000 are loaded. Every bill with a recorded final vote and everything on the floor schedule is already in. Each member's sponsorship record is complete regardless.

**Not proven, because of the no-paid-services rule:** Gemini answers and Lemonfox read-aloud have only been tested with stubs.

**Ideas for next time**

- Votes by your reps that you disagreed with most, as a shareable recap.
- Notifications outside the app. They'd need email, which is a paid service.

## Nov 6, 2026

**Security fix:** 10 of the 12 admin routes only checked for a login, so any signed-in account could make itself a Super Admin, and `/admin/permissions/[id]` had no check at all. Every admin route now requires a permission, and a role can't be given by someone without all of its permissions.

**Speed:** the "2 seconds on first request" problem was on this PC only. `localhost` tries IPv6 first on Windows, and MySQL only listens on IPv4. Use `127.0.0.1` in `DATABASE_URL`.

## Decisions

- **Only a week is known for House votes.** The House schedule names a week, not a day. A coming week counts down to its Monday, and says "possible". The week itself says "this week".
- **Personal pages stay at the root.** `/dashboard`, `/vote`, and `/reps` belong to the person, and will mix governments once states arrive. `/learn` stays there too, until states need their own words.
- **Success rate only counts bills that can become law.** Simple and concurrent resolutions never go to the President, so including them would make every member look worse. The whole career is used, because a single Congress is too few bills.
- **A role's permissions are cached for 60 seconds** in the session, because every request reads them. A change made on this server applies at once. With several servers, a removed permission can last up to a minute.

- **Senate votes stay on Voteview.** senate.gov returns 403 to automated requests, including its official XML feed. Faking a browser would get around that, so we don't. The `senate_gap` check compares Senate votes named in bill actions with stored votes. On Nov 5, 2026, there was no gap, and the newest stored vote was number 256. If a gap appears, bill pages say the positions aren't in yet.
- **Light theme only,** as asked.
- **Digests are extracted, not generated.** No AI is called, and CRS's wording stays intact.
- **A rep's vote is fetched separately,** from `/api/civic/bills/reveal`, so it can't leak into a page.
- **The store only holds changes.** The server's first paint comes from the database, and is passed as `initial...` props, because a module-level store is shared between users on the server.
- **Job measures compare within a chamber,** and never judge a party. Only the user's votes decide whether someone represents them.
- **Net worth and "promise kept" stayed out.** On `main` they were placeholders with no real data behind them.

## Controls moved to the kit (2026-11-06)

Native selects, inputs, buttons, details, and tables moved to `components/ui`, which is now restyled to match the app. Added `OptionSelect`, `Disclosure`, `Progress`, `Kbd`, and a `choice` button. ESLint now rejects native controls outside the kit. The roll call page's state filter became a dropdown, so it can't take an invalid state.

## Vote first and the XP ledger (2026-11-07)

Bill pages ask for a vote before showing status, with a skip link. The queue now leads with bills still in play. XP moved to a ledger, with a bar on every page. Returning to the dashboard after voting used to count those votes twice, because it added them to server numbers that already included them. Browser tests now run their own server on port 3100.

## Quests, ranks, and the progress page (2026-11-07)

Added `/progress`, named ranks with XP goals, daily quests, a policy area chart, an anonymous split, a statewide leaderboard, contacting a rep from the reveal, and your match with a rep visibly moving. Sessions now take turns between scheduled bills and bills your reps voted on, because there can be enough scheduled bills to fill a session and never show a rep's vote. The top bar no longer takes a page down if progress fails to load, after a stale database client broke every signed-in page.

## Dark mode and public profiles (2026-11-07)

Added light, dark, and system themes, with chart colors validated separately for dark. Added public profiles at `/users/{id}` with a switch for each personal detail, all off by default. The old `/community/users/{id}` page now redirects there, because it ignored privacy choices. Added a Moderator role. `ensureRbac` now gives brand-new permissions to existing roles, which it used to skip. Settings claimed to save a district but never did, which is fixed.

## Admin panel and pipeline server (2026-11-07)

Added `/admin` with users, a roles and permissions grid, pipelines, data checks, feedback, moderation, and an audit log. The pipelines panel talks to a new FastAPI server in `../civic-pipeline`, in a Docker container that starts with Docker and only listens on this machine, on port 18787. Its nightly run is off until someone turns it on. Closed two escalation paths: someone with `roles.manage` could grant themselves anything, and someone with `users.manage` could demote a Super Admin.

## Floor board, in-place editing, and loading states (2026-11-06)

The dashboard now leads with both chambers' next meetings, and this week and next on the House and Senate floors, using a new `senate_floor` pipeline that reads GovInfo. Added `PageSpacer` around every page. Profile details are edited on the profile, and forum posts are written on the forum, with `/settings` cut down to the theme and two links. Every page and API route now has a listed loading state, with a unit test to keep it that way. Eleven API routes turned out to have no callers, and are listed in `docs/loading-states.md`.

## Iowa (2026-11-07)

Built the first state, against the criteria in `docs/acceptance-criteria.md`. The plan expected to need Open States for votes, but each bill's history links to the exact journal page of its passage, so votes are read from there with no key, and checked three ways before loading. Bill histories gave real statuses. Every federal query had to be scoped first, because Iowa's rows would otherwise show up as an Iowan's U.S. senators. Des Moines only has agendas so far, because there's no source for its members or votes that we can read.

