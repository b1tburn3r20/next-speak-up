# Acceptance criteria

Work isn't done until each line is proven by a test or by looking at it. `[ ]` means not yet proven. Update this as things are proven. Tests are in `tests/e2e/mission.spec.ts`, `tests/unit/mission-logic.test.ts`, `tests/unit/store-rendering.test.tsx`, and the pipeline's `tests/test_member_data.py`.

## Foundations

- [x] Reference sheets exist and `CLAUDE.md` points to them
- [x] One theme only: no picker, no `dark:` classes, no leftover theme CSS
- [x] Blocks exist (`PageSpacer`, `PageHeader`, `Section`, `OuterBlock`, `InnerBlock`, `Stack`, `Flex`, `Grid`), and every main page uses them
- [x] Older `components/cb` blocks use the same styling, without slow entrance animations
- [x] Zustand holds votes, follows, progress, and saved members
- [x] Voting on one bill doesn't re-render another bill's buttons (test)

## Representation alignment

- [x] A rep's vote is not in the HTML of a bill, pulse, or session before the user votes (test)
- [x] After voting, the reveal shows the rep's picture, position, and whether they match (test)
- [x] "Show me anyway" works without voting (test)
- [x] The dashboard has pulse checks: "your rep just voted, you vote too" (test)
- [x] Each rep has an alignment verdict in words, and asks for more votes under 3 (test)
- [x] Each rep shows job measures compared with their chamber (test)
- [x] Alignment by policy area is shown, including where you differ most

## Dashboard

- [x] Tailored: reps with pictures, recaps of what they've done, pulse, progress, next step
- [x] Signed out: explains the idea and offers a clear first action
- [x] No location: the first step is to find your reps
- [x] No recent votes in Congress: says so, instead of showing zeros

## Always something to do

- [x] A one-at-a-time voting session at `/vote`, with progress and a finish screen
- [x] Next steps change with what the user has done (test)
- [x] Every main page has a next step (test)
- [x] Streak, level, daily goal, and badges come from real activity (test)

## Demystifying

- [x] Upcoming bills show policy area, sponsor picture, cosponsor count, and a digest
- [x] Bill page: the digest is at the top, large, without CRS boilerplate
- [x] Every sponsor and cosponsor is listed, with pictures
- [x] Policy areas are color coded, with explanations, on their own pages (`/topics`)
- [x] Jargon explains itself on tap, and there's a glossary (`/learn`)
- [x] Timeline actions have plain explanations

## Charts

- [x] Member pages chart sponsored bills by policy area, using the full record
- [x] Member pages chart voting by policy area
- [x] Senators and representatives both get them
- [x] Charts have text alternatives, and validated colors

## Data

- [x] `voted_bills` loads every bill that has a roll call
- [x] `member_legislation` loads complete sponsorship records
- [x] `member_stat` and `member_policy_stat` are filled by the pipeline, and pages read them
- [x] `roll_call.isFinalVote` is stored and indexed, and Python and TypeScript agree (test)
- [x] `senate_gap` check runs daily
- [x] Every gap in the data guidelines is handled (test or look)
- [x] Speed targets met on a production build (measured)

## Quality

- [x] `tsc`, ESLint, unit tests, pipeline tests, and browser tests all pass
- [x] Production build passes
- [x] No sideways scrolling at 360, 390, 768, or 1280px on any main page (test)
- [x] No browser console errors on main pages (test)
- [x] Each main page reviewed by screenshot on phone and desktop, against the UI test questions
- [x] Paid services are never called in tests

## Federal and state

- [x] Federal pages live under `/federal`, and old URLs redirect (test)
- [x] Every government URL comes from `lib/routes.ts`
- [x] Docs say we cover federal and state, and how to build for both
- [x] Bill URLs and search don't assume one government where a bill can say which it's in

## Navigation

- [x] Only one link is ever active (test)
- [x] Topics is a child of Bills, not a root link (test)
- [x] Links read "Bills" and "Legislators", not "Federal Bills"

## Dates

- [x] `RelativeDate` shows words, with the exact date on hover after 200ms, or in a dialog on tap (test)
- [x] Every bill card says when, using the date its status changed (test)
- [x] Upcoming bills count down in words, say "possible", and explain that only a week is known (test)

## Onboarding

- [x] At most 3 steps with a progress bar: age, location, topics (test)
- [x] Location finds them automatically if the browser allows it, and a state alone works (test)
- [x] Topics are suggested from their age and state (test)
- [x] Cards stack, and fade between steps
- [x] It ends on the dashboard, and can be skipped for good (test)

## Dashboard

- [x] Shows their House rep and senators (test)
- [x] Next bill card: policy area, name, two-line summary, and a way to vote (test)
- [x] It never reveals how a rep voted (test)
- [x] Each rep's policy areas sponsored, and success rate (test)
- [x] Success rate only counts bills that can become law (test)

## Loading bar

- [x] It shows on every page change, moves, and finishes (test)
- [x] Prefetches don't trigger it (test)

## Search and permissions

- [x] One dialog finds bills, representatives, senators, topics, words, and pages (test)
- [x] Each group loads and fails on its own, with a skeleton (test)
- [x] Typos and initials match, using our own scoring (test)
- [x] Adding a provider takes one file and one line
- [x] Accounts only appear for people with `users.search` (test)
- [x] Roles have many permissions, and code checks permissions rather than role names (test)
- [x] A member can't use any admin route, or promote themselves (test)
- [x] Nobody can hand out permissions they don't have (test)

## Plain words

- [x] No developer words on main pages: loaded, imported, pipeline, database (test)

## Controls

- [x] Every dropdown, input, button, table, and progress bar comes from `components/ui`, with one exception that's documented
- [x] ESLint rejects a native control outside the kit
- [x] Filter forms still work as plain forms on server-rendered pages, and show their values in the server's HTML
- [x] Dropdown options are at least 44px tall and stay on screen at all four widths
- [x] Opening a dropdown doesn't shift the page sideways

## The game loop

- [x] A signed-in user who hasn't voted on a bill sees what it does and is asked for a vote, and its status isn't in the server's HTML until they vote or skip
- [x] Signed-out visitors and search engines see the whole bill page
- [x] Cards that ask for a vote don't show a bill's status until after the vote
- [x] After voting, the status is worded around what it means for the person
- [x] A voting session includes both scheduled bills and bills a rep has voted on
- [x] XP, level, streak, and daily goal show on every signed-in page, and move right away
- [x] Returning to a page after voting doesn't count those votes twice
- [x] Repeating an action can't earn XP twice
- [x] If progress can't load, the page still works
- [x] `/progress` shows rank, the XP goal for the next rank, the whole ladder, badges, quests, and where XP came from
- [x] The leaderboard is off until someone joins, and never shows how anyone voted

## Floor board

- [x] The dashboard shows this week and next for both chambers, signed in or out (test)
- [x] An empty week says so instead of disappearing (test)
- [x] House lists never include Senate rows or meeting notices (test)
- [x] A Senate item with no date appears once, and its legal text is behind a disclosure (test)
- [x] A bill's status stays hidden on the board until the person votes (test)

## Editing in place

- [x] Profile details are edited on the profile, at the same URL (test)
- [x] Cancel restores everything, and a failed save stays in edit mode and says why (test)
- [x] Only the owner is sent the edit form and its private values (test)
- [x] The forum composer opens on the forum, and the old URL still works (test)

## Loading states

- [x] Every page has a `loading.tsx` or `<Suspense>`, or is listed as having nothing to wait for (unit test)
- [x] No `loading.tsx` sits above a detail page (unit test)
- [x] Every API route is listed in `docs/loading-states.md` (unit test)

## Iowa

What "built out" means for the first state. Unchecked items say what's in the way.

**Federal and state stay apart**

- [x] Federal lists, rep lookups, district lookups, and the vote queue only use federal data unless asked (test)
- [x] A federal URL won't open an Iowa bill, or the reverse, and a state we don't cover is a 404 (test)
- [x] Scores stay separate for each person, and never blend Washington and Iowa (test)
- [x] Words follow the government: Governor, the Iowa Legislature, Acts Chapter (test)

**Data**

- [x] Every sitting legislator, with phone and page, and vacancies named rather than hidden (test)
- [ ] Bills have a real status, worked out from their whole history. Parser tested, but only 469 of about 3,160 are loaded so far
- [x] Bills replaced by a renumbered copy or a companion are left out, so nobody votes on a dead copy (test)
- [ ] A passage vote only loads if the names, the journal's totals, and the history's totals all agree. Unit tested, and tried on two real bills' votes by hand, but `ia_votes` hasn't loaded any yet
- [x] Topics come from the bill's committee, and the page says so. A committee too broad to say gets none (test)
- [ ] Each bill's summary is its own explanation, labeled as written at introduction, with its PDF linked. Parser tested, but `ia_bill_text` hasn't loaded any yet
- [ ] Debate calendars. They're PDFs, and there's nothing to debate until January, so there's nothing to check a parser against

**Honest about the calendar**

- [x] The app says the Legislature is out, and until when, instead of showing an empty list (test)
- [x] A bill that never finished says the session ended, and never says your voice can still count (test)
- [x] Sitting members are shown, not people who just won (test)

**The hub and pages**

- [ ] `/state/ia` shows your legislators, a bill to vote on, where to show up, and recent laws. The bill to vote on needs votes loaded
- [x] Bills: search by number and title, filter by status and topic, each with the vote gate (test)
- [x] Legislators: filter by chamber, party, and district, each with contact details and votes (test)
- [x] Meetings: upcoming and past, searchable by committee or bill, each saying how to take part (test)
- [x] Des Moines has its own page, and says what's missing (test)

**Across the app**

- [ ] Geocoding finds both Iowa districts and the city, and saves only the numbers. Parsing is tested on the Census's real answer, but the whole lookup hasn't been run in a browser
- [x] People who chose Iowa by hand can choose their districts (test)
- [x] Dashboard and report cards group Washington and the Statehouse (test)
- [ ] Iowans get Iowa bills in their vote queue, and in the reveal after voting. Written, but it can't be checked until votes are loaded
- [ ] Onboarding names their state legislators after a lookup. Written, not yet seen working in a browser
- [x] Search finds Iowa legislators and bills (test)
- [x] One Iowa link in the nav, only for people located in Iowa (test)
- [x] Moving away from Iowa removes its legislators (test)

**Taking part**

- [ ] "I went" earns XP once per meeting, labeled self-reported. Refusing old meetings and signed-out people is tested, but no meeting is recent enough to test earning it
- [x] Add a meeting to your calendar (test)
- [ ] Badges and a quest for Iowans. None of them reward voting in an election, or a side. Written, not yet tested
- [ ] Vote before a scheduled debate. It needs debate calendars

**Not built, because there's no source we can read and check**

- [ ] Des Moines council votes. The roll call PDFs exist, but aren't read yet
- [ ] Election dates. sos.iowa.gov refuses automated requests, so the page links to it instead

## Cities

Built from `CityConfig` in `lib/civic/states.ts`, so a new city is its pipeline plus an entry there.

- [x] The mayor, at-large members, and each ward's member, with phone, email, photo, and term (test)
- [x] The next regular meeting, from the city's published schedule, with where and when (test)
- [x] When you can ask to speak, worked out from the city's own rule, across daylight saving (unit test)
- [x] When the agenda goes up, from the city's own rule (unit test)
- [x] Recent topics in the agenda's own words, grouped by section, leaving out routine consent items (test)
- [x] Past meetings with agenda, minutes, and recording links (test)
- [x] A resident picks their ward and sees their own council member (test)
- [x] City Hall on the dashboard and state page for residents (test)
- [x] A city we don't cover is a 404, and a ward the city doesn't have is refused
- [x] Nothing reads dsmcity.primegov.com, whose robots.txt disallows everything. The page links people to the city instead

