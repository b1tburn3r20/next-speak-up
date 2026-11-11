# Build log

Newest first. Re-read the [mission](mission.md) and the relevant sheet before each task.

## Queued celebrations, and the forum shelved (2026-11-10, late)

**Asked for:** show every celebration a vote earns, one after another, and close off the forum for now.

**Now:** `celebrate` returns everything a vote earned, biggest first (a new rank replaces the level it implies), and `RewardToast` shows each card in turn with its own confetti and dots for how many. A tap moves to the next. The forum is behind `FORUM_OPEN` in `lib/features.ts`, now false. Its pages 404, its API routes answer 404, its links are gone, and profiles don't ask for posts. Its code and posts are untouched, and its tests skip until it's back.

## Bill text fetched on request, not stored (2026-11-10, late)

**Asked for:** stop saving bill text, which is too much data when Congress.gov serves it on request; empty the table; have the UI fetch it when asked and cache it.

**Now:** the `bill_text` pipeline is gone. `bill_text_content` (5,089 rows, 117 MB with indexes) is dropped by a migration, and its 5,089 raw copies (about 82 MB) are deleted from `civic_raw`. Both were backed up first. The text page and Ask a question get the latest version from Congress.gov through `fetchBillText`, cached for 30 days, and only from congress.gov or govinfo.gov. Congress.gov's robots.txt allows these pages for every agent. A bill shows "Read the full text" when it has a published version, instead of when we had a copy. Iowa's `ia_bill_text` is unchanged: it keeps only each bill's short explanation, as its summary.

## Bills behind the numbers, and legislative words explained (2026-11-10, night)

**Asked for:** tap a topic in a member's "What they work on" chart, or their Became law card, to see the bills, in a reusable dialog-or-popover; equal-looking pulse check choices; a week progress bar where it's seen; one link for the top bar's progress; and a glossary that underlines legislative words everywhere, edited by admins, cached for a week, held in a Zustand store.

**Now:**

- **`DialogPopover`:** a popover on a computer, a dialog on a phone, decided when it opens.
- **Member bill lists:** the counts were a member's whole career from Congress.gov (361 for Joni Ernst), but only this Congress's 55 bills were stored, so a list would have disagreed. `member_stats` now writes every sponsored bill to `member_sponsored_bill` from the same pages, and every count matches its list for all 539 members. A bill Congress.gov listed twice had been counted twice; it counts once now.
- **Pulse check:** three equal tiles, Quick (3), Standard (5), and Deep (10), each its own color.
- **Home:** Congress's "This week" row has a bar for how many of the week's bills you've voted on.
- **Top bar:** streak, today's goal, and level are one link to Progress.
- **Glossary:** `glossary_term`, seeded with 55 meanings for 54 words, edited at `/admin/glossary`. Bill summaries, digests, and vote cards underline each word's first use.

## Pulse checks, and a quieter Vote page (2026-11-10, evening)

**Asked for:** take "Your reps have voted on 410 bills you haven't" off the Vote page, which was distracting there; and a "pulse check" on members' pages that rapid-fires 3, 5, or 10 of their bills, earliest first, with a summary of how you aligned.

**Now:** the Vote page is only the session. Every member page, in Congress and Iowa, has a Pulse check card. It runs the earliest bills that member cast a final vote on and you haven't, in the order they voted, and ends with a ring, one plain sentence ("You and Joni agreed on 2 of 3"), and each bill with your vote beside theirs. Their votes are only fetched after yours, and only for those bills.

## A front page, a bell, and a game for the week (2026-11-10, later)

**Asked for:** search centered in the top bar, a less confusing logo and panel button, a bell instead of the unexplained "9+", a way back to the front page and a better one, no loading bar for searches, keyword search ("mayor", "city hall", "town hall"), placeholders on inputs, a "This week" that's only this week, photos for state legislators, and a progress bar and three-way accordion on Upcoming votes. The profile showed "Coolbills member" for someone with no username.

**Now:**

- **Top bar:** one bar at every size. Menu button and logo on the left (the logo goes to `/`), search in the middle, then progress, the bell, and the theme. The rank name and XP bar left the top bar for Progress.
- **The bell** lists notifications we've sent and the votes waiting on you, and counts only what's new since it was last opened. The Vote tab has no badge anymore.
- **Front page** is inside the app now, with the same bar and menu: one question, how it works in three steps, what it covers from Congress to City Hall with real numbers, our promises, questions, and one way in. The old landing navbar, contact form, and a sample of Texas's senators are gone.
- **Loading bar** is for moving between pages and saving. Searches, the bell, and other partial loads show skeletons.
- **Search** answers "mayor", "town hall", "city hall", "council", "state senator", and more with the person's own (`lib/search/intents.ts`).
- **This week** only lists the statehouse when something's happening there this week. Between sessions, its faces on Home say when it's back.
- **Photos:** the `ia_people` pipeline reads each legislator's official photo (legis.iowa.gov allows it), so all 148 have one. Only 7 of 164 city officials have a photo: most small cities' sites don't publish them.
- **Upcoming votes:** signed in, a "Beat Congress to the vote" bar and three groups (voted, waiting, already voted by Congress), counted live.
- **Profile:** someone without a username is told why they show as "Coolbills member" and offered one. It opens on Badges when there are no posts.
- **Placeholders** on login, sign-up, and profile inputs.

**Next:** city officials' photos where cities publish them; interim committee meetings will show in "This week" when the Legislature posts them.

## A navbar that says where you are (2026-11-10)

**Asked for:** a more intuitive navbar.

**Was:** 13 links in one flat list, Congress pages mixed with personal ones, no way to the states for anyone outside Iowa, a phone menu that repeated the tabs, a loud blue collapse button, and a click anywhere on the page collapsed the sidebar.

**Now:** grouped (top, You, Congress, Where you live, More), with the person's state and city by name, States for everyone, five phone tabs ending in a More sheet of grouped tiles, a quiet collapse button, and search moved to the left of the top bar. The Next dev badge moved to the top left, off the More tab. See "Navigation" in `docs/ui-guidelines.md`.

## States, cities, and push notifications (2026-11-09, evening)

**Asked for:** the city data on the site with UX first (phone first, little scrolling, depth through drill-down), and push notifications: city council meetings 7 days, 2 days, 1 day before and the day of; bills in someone's topics that may come up this week; how a vote turned out with their rep's vote; and a "Tell me how it turns out" button that also reports when a bill becomes law.

**Built:**
- **`/states`.** Every state and DC, covered ones first, searched as you type in the browser (`PlaceFinder`, `matchPlaces` in `lib/civic/place-search.ts`). `/state` still sends people to their own state, and everyone else here.
- **The state page.** The first phone screen is the session note, your legislators (compact), and four `DepthTile`s: bills, legislators, cities, meetings. Then your city, the next bill to vote on, and an instant search across all 940 cities (`getCityIndex`, about 30 KB, cached ten minutes). Between sessions, meetings and laws sit in a `Disclosure`.
- **The cities list** searches as you type, with chips for mayor, City Hall, and meetings, and icons on each city for what its page has. No more paging.
- **The city page.** One `CityGlanceCard` is the first screen: the next meeting (posted or by schedule), one main button from `primaryCityAction` (sign up to speak, then remind me, then call City Hall, then agendas), the mayor, and City Hall. Legislators follow, with faces. Topics, passed measures, past meetings, and the council are tabs (`CityTabs`), all in the HTML.
- **Push.** Web Push with VAPID keys through `web-push`: free, no Firebase account. Chrome's pushes go through Google's FCM by themselves. `push_subscription` and `notification_delivery` tables (migration `20261109200000_push_notifications`, rehearsed on a restored copy first). The app is an installable PWA (`app/manifest.ts`, `public/sw.js`, icons in `public/icons/`), which iPhones need for notifications.
- **What's sent,** from `lib/notifications/plan.ts` (pure, tested) and `dispatch.ts`:
  - Meetings in your home city: 9 AM a week, two days, and a day before, and 8 AM the day of (earlier for an early meeting, never before 6). A missed slot is caught up the same day only. Cities with no posted agendas use their regular schedule, worded "usually meets".
  - Monday 9 AM in your state's time zone: this week's House list and Senate orders in your topics, "may come up for a vote".
  - A final vote in the last 3 days on a bill you follow, voted on, or that was on the schedule in your topics: the result, and your own legislators' votes compared with yours.
  - A followed bill that became law.
- **Runs:** `instrumentation.ts` every 10 minutes when `NOTIFY_DISPATCH=1` (off locally and in tests), `POST /api/cron/notify` with `CRON_SECRET`, and `npm run notify:dispatch` for one local pass. Each notification is claimed by a unique row before it's sent, so passes can overlap without double sends.
- **Buttons:** "Remind me" on every city page and on each upcoming council meeting's page, and "Tell me how it turns out" on a bill that's still in play.
- **The manager in Settings** shows exactly what someone gets, each on its own switch: their city's meetings (naming the city), votes on bills they follow (listed, each with a stop button), a followed bill becoming law, votes on bills they voted on, Monday's bills in their topics (each topic mutable without untracking it, stored as one `notify.topicOff:{topic}` preference each, since a preference value is only 191 characters), and votes on bills in their topics. Below that, the devices that get them (removable) and the last five sent. All default on, and the sender checks the switch for each reason a result would go to someone (`wantsVoteResult`).

**Decided:** a push that names a legislator's vote counts as the person asking, because they followed, voted, or turned on topic alerts. Rep votes still stay out of page HTML.

**Not done yet:**
- Iowa bills get vote results, but no Monday note: there's no Iowa floor schedule until the 2027 session (`ia_calendar`).
- On Railway: set `VAPID_*`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `CRON_SECRET`, and `NOTIFY_DISPATCH=1`, with new keys, not the local ones. Keep one replica, or keep `NOTIFY_DISPATCH` on one only (overlap is safe, but wasteful).
- A real push hasn't been sent from this machine yet. The user should turn it on in Settings and press "Send me a test".
- An in-app inbox could read `notification_delivery`.

## Every Iowa city, the basics (2026-11-09)

**Goal, set by the user:** at least 95% of Iowa's cities have the mayor, their state legislators, and City Hall, checked city by city. Meetings, topics, and how to speak cover as many cities as we can. Sites that block AI are still covered: Claude writes the reader, and the user runs it.

**Built:**
- **Legislators for every city.** `cities_ia_districts` overlays the Census's 2024 House and Senate maps on every city's boundary, from TIGERweb. Tried against the live maps: all 939 mapped cities got both chambers. Ankeny gets 4 House and 3 Senate districts, and Des Moines 9 and 5. The one city without a boundary is placed by its point. The `city_district` table stores them with each district's share of the city, and city pages show them with `CityLegislators`.
- **City Hall.** New `city_profile` columns: `phone`, `address`, `clerkName`, `governmentType`, `meetingSchedule`, `speakInfo`, `directorySource`, and `directoryAsOf`. `site.find_contacts` reads the footer during discovery, and `cities_ia_contacts` backfills from stored homepages without fetching. `CityHallCard` is on every city page.
- **Lanes.** `city_profile.lane` is set from robots.txt. The owner runs `cities_ia_owner` for AI-blocked sites, with the same readers, and Claude reads only `reports/cities-ia-owner.json`.
- **Next meeting by schedule.** For a city whose agendas aren't online, `nextScheduledMeeting` turns a stated schedule like "1st/3rd Wed" into a date, and the page says it can move.
- **The audit.** `npm run audit:cities` checks every city and fails below 95% on mayor, legislators, or City Hall (`coverageGate`). It writes `reports/cities-ia-audit.json`. `CITY_AUDIT=1 npx playwright test tests/e2e/city-coverage.spec.ts --project=desktop` then opens every city's page and checks it shows what the audit says.

**Not run yet:** MySQL wasn't running, so the migration `20261109010000_city_hall_and_districts` was written by hand and hasn't been applied. None of the new pipelines have run against the database.

**Next, in order:**
1. **Apply the migration and run the free pipelines.** Run `npm run db:deploy`, then `cities_ia_districts` and `cities_ia_contacts`, then `npm run audit:cities`.
2. **The user asks the Iowa League of Cities for its city directory** (515-244-7282). It has the mayor, council, clerk, City Hall, form of government, and meeting days for every city, which clerks update after each election. The League's usage statement says it sells bulk access, so it's requested, not scraped. When the file arrives, write `cities_ia_directory` to load it. That's the route to 95% on mayors.
3. **If the League says no,** write `cities_ia_canvass`, which reads the November 2025 city election results from each county auditor's PDF. Most counties use one template.
4. **The user runs `cities_ia_owner`.** Then read its report.
5. The meeting readers still owed from the 2026-11-08 list below, plus `find_council` and a looser `find_mayor`.

## Every Iowa city (2026-11-08)

**Built:** all 940 incorporated Iowa cities, from the Census, with a page each, a searchable list at `/state/ia/cities`, "My City" in the nav, and a page for every meeting. The user flow: onboarding's location step shows your city and mayor, the dashboard and state page ask Iowans whose city we don't know, any city page offers "I live here", and the cities list puts yours first. Des Moines keeps its own pipeline and fuller page. Every other city works from what the `cities_ia_*` pipelines in `../civic-pipeline` read from its own site.

**Data, as of tonight:** 412 sites found at first, minus 80 that turned out to be same-named towns in other states and 43 more that block Claude in robots.txt. 117 mayors are named. Meetings are loaded for 51 cities from their own sites, and for 9 more from CivicClerk, which the user runs (Claude doesn't: its robots.txt disallows Claude's agents). What passed is read from minutes for about 15 cities.

**Fixed along the way:**
- A site check that took "City of Corning" as proof, which let other states' sites through.
- CivicClerk times, which are local times marked as UTC.
- A status rule in `transforms/bill_status.py` that ended in a backspace character, so Senate reports without an action code never counted. Bills need `load_app_tables` re-run to pick that up.

**Not committed yet.** Both repos have this work uncommitted on `overhaul/v2` and in `civic-pipeline`. Unit tests (540+), `tsc`, and lint pass in the app, and all pipeline tests pass. `tests/e2e/city.spec.ts` has new browser tests that haven't been run. They need the city data loaded, and they assume Pella has meetings, which it does. The user also needs to restart `npm run dev` after the `city_profile` migration.

**Next, in order:**

1. **Check the re-discovery** of the 80 cities matched to other states. It was started with `cities_ia_discover --no-deps --limit 84` after clearing their `checkedAt`. Then run `cities_ia_verify`, `cities_ia_officials`, and `cities_ia_meetings`, and ask the user to run `cities_ia_civicclerk` again.
2. **161 cities have an agenda page we may read but no meetings yet.** From their stored pages:
   - **Agenda Center sites** like Johnston, Grimes, Indianola, Grinnell, and Windsor Heights parse, but only old meetings come back. Find out why the newest aren't on the page we read. Oskaloosa's council section isn't an `h2`.
   - **Links that don't say "council"**, like Norwalk's and Huxley's "November 5, 2026 Agenda.pdf", on pages that mix boards. Use the heading each link sits under.
   - **Dates in capitals**, like Toledo's "JANUARY 8, 2024 AGENDA". `find_date` should ignore case.
   - **Dated documents on council pages** that never say "agenda" or "minutes", like Moravia's "1-14-2025 Regular Meeting", Lawton, McCausland, and Everly.
   - **WordPress sites with The Events Calendar**, like Story City, Robins, Alta, Missouri Valley, Stuart, and New Hampton. Check robots.txt for Claude's agents, then try its REST API.
   - **Laserfiche** (Vinton), and pages that scripts build (Wix, Squarespace).
3. **Fairfield's agenda link goes to Jefferson County's site.** Keep agenda pages on the city's own host or a known agenda platform, and re-run discovery for any that fail.
4. **Muscatine** has no upcoming meetings on CivicClerk. Check whether it moved elsewhere, as Davenport did in May.
5. Council members for cities without their own pipeline. Only the mayor is read so far.
6. Still paused from before, waiting on the user: the Iowa bill, explanation, and vote load, which was stopped for low memory.

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

