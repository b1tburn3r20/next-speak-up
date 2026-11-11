# UI guidelines

**Target:** every screen is fun, obvious, and fast on a phone. **Goal:** anyone can build a new page at scale from the same blocks, and it looks right without thinking about spacing.

## One job per page

Every page has one job and leads somewhere, listed in `docs/clarity-benchmark.md`. A section that doesn't serve a page's job belongs on the page whose job it is, and the first page links there. Score a page against that sheet's eight questions before calling it done: **could a 13-year-old use it without asking anyone?**

- **Home** is three things, in order: your next vote (one card, voted on right there), who represents you (`MyPeople`: every face from Congress to City Hall, with whether they match you), and `ThisWeek` (one row per government, each leading to its page). It never holds a whole schedule, chart, or list.
- **Depth goes in tabs.** When a page has more than one deep section, the first screen holds the point and the action, and the rest sit in `SectionTabs` (bills, members, cities, Upcoming's House and Senate, Home's lists). A `Disclosure` is for one thing someone might want, like the rank ladder or changing where you live.
- **A directory is rows, not cards.** Long lists of people use `MemberList`, one short row each, with the person's own first when there are any.
- **Say why.** A bill in a vote session says why it's there. A number says what it counts. A gap says what to do instead.
- **Nothing twice.** If a page shows something, no other block on it repeats it.

## The test for every component and page

Ask each of these. If an answer is no, make it better before moving on.

1. **Next step:** is it obvious what to do next, without scrolling on a phone?
2. **Thumb:** can I do the main thing with one thumb? Are tap targets at least 44px?
3. **Glance:** can I get the point in three seconds? Is the summary in my face?
4. **Plain:** would someone who doesn't follow Congress understand every word?
5. **Feedback:** does anything I do respond right away, and feel rewarding?
6. **Gaps:** what does this look like with no data, a failed request, or a brand-new user?
7. **Faces:** if a person is mentioned, is their picture there?

## Blocks

Build pages only from `components/blocks`. Don't hand-write spacing, card styles, or breakpoints on a page. If a block is missing something, improve the block.

| Block | Use it for | Built in |
| --- | --- | --- |
| `PageSpacer` | The outside of every page | Max width, side gutters, vertical rhythm |
| `PageHeader` | Title, plain description, optional action | Type scale, wraps on phones |
| `Section` | A titled group of content | Heading, optional "see all" link, spacing |
| `OuterBlock` | A raised card, the main unit of content | White, 2px border, chunky bottom edge, responsive padding |
| `InnerBlock` | Something nested in a card | Tinted, no shadow, tighter padding |
| `Stack` | Vertical list with even gaps | `gap`: `xs`, `sm`, `md`, `lg`, `xl` |
| `Flex` | A row that wraps | `gap`, `align`, `justify`; wraps by default |
| `Grid` | Responsive columns | `cols`: `stats` (2 then 4), `cards` (1, 2, 3), `people` (1, 2, 3), `halves` (1 then 2) |

**Spacing scale:** `xs` 4px, `sm` 8px, `md` 12px, `lg` 16px, `xl` 24px. Sections are 32px apart.

**Responsiveness:** phone is the default, and larger screens add to it. Choose columns through `Grid`, never by checking screen size in JavaScript, because that breaks server rendering. Nothing may scroll sideways at 360px.

## Federal and state

We cover federal and Iowa. Every screen and model must leave room for more states.

- **States are data.** A state and its cities come from `lib/civic/states.ts`, and components take one as a prop. Don't write a state's or city's name, chambers, or URL into a component. The nav has one "My State" link to `/state`, which sends people to theirs, and one "My City" link to `/city`, which does the same for their city or asks which it is. A state's city pages light up "My City", through `navPathname` in `lib/nav.ts`.
- **Depth, not length:** `/states` lists every state, a state's page leads to its cities, and a city's page leads to its meetings and officials. Each page's first phone screen holds what's yours and the ways in (`DepthTile`, `CityGlanceCard`, or Des Moines's `NextMeetingCard`). Deeper sections go behind `SectionTabs` (`CityTabs` on a city) or a `Disclosure`, rather than stacking. Lists you search, like states and cities, come with the page and narrow as you type (`PlaceFinder`).
- **Notifications** are offered where they help, never on page load: "Remind me" on a city, "Tell me how it turns out" on a bill, and Settings. iPhones need the site added to the Home Screen first, and the controls say so.
- **State pages:** `/state/{state}` is the hub. It says when the Legislature is out rather than showing empty lists, shows who's sitting rather than who just won, and names empty seats. One "Iowa" nav link appears for people located there.
- **Words:** `lib/civic/government.ts` has what differs, like Governor and President. Never write "Congress" in something a state bill can reach.

- **URLs:** a government's pages live under its prefix: `/federal/bills`, and `/state/ia/bills`. Things that belong to the person, not a government, stay at the root: `/dashboard`, `/vote`, `/reps`, `/settings`.
- **Never hand-write a government URL.** Use `lib/routes.ts`: `routes.federal.bills`, `billPath(slug)`, `memberPath(id)`, `topicPath(slug)`. Old URLs redirect from `next.config.mjs`.
- **Labels stay plain.** Don't put "Federal" in front of everything. There's only one federal government, so it keeps root nav links: "Bills", not "Federal Bills". How states appear in the nav is still to be decided, so don't build a state nav yet.
- **Models take a jurisdiction.** Queries and components shouldn't assume Congress when a bill or person can say where it's from.

## Navigation

- **Nav items live in `app/data/navbar-data.ts`.** An item can have `children`, shown indented beneath it. Core features are root links. Secondary ones, like Topics under Bills, are children.
- **Groups answer three questions.** What do I do now (Home, Vote, no heading), how am I doing (You), and which government am I looking at (Congress, Where you live). Everything else is More. Every item has a `group`, and `NAV_GROUPS` sets the order and headings.
- **Your places go by name.** "My State" and "My City" show as the person's own, like "Iowa" and "Des Moines" (`getNavPlacesSafe`). Everyone has States. A state or city page that isn't the person's lights States (`activeVisibleHref`).
- **One top bar, at every size,** like most sites: the menu button, then the logo, which goes to the front page (`/`), then search in the middle, then your progress, the bell, and the theme. Signed out, Log in takes the bell's place. Home is in the menu, so the front page is always one tap away and Home is too.
- **The bell is where news goes.** It lists what we've sent you (`notification_delivery`) and the votes your reps cast that you haven't. Its count only covers what's new since you last opened it, so it doesn't nag. No menu item carries a count: a red number on a tab doesn't say what it's counting.
- **Phones:** five tabs: Home, Vote, Congress, the person's state (or States), and More. More opens a bottom sheet with every other page as tiles, in the same groups, and lights up for a page only it holds, like My Reps.
- **The sidebar** narrows to icons with the menu button at the far left of the top bar, remembered on the device. Clicking the page never changes it.
- **One link is active.** Always use `activeNavHref` from `lib/nav.ts`, where the longest matching link wins. Never use `pathname.startsWith` on its own: it lights up both `/bills` and `/bills/upcoming`.
- **Who sees an item** is set by `permission`, never by role name.

## Dates

People relate to relative times. Show every date with `RelativeDate` from `components/app/relative-date.tsx`, not a bare formatted string.

- **Text:** `Became law 2 months ago`, `Introduced 1 year ago`, `House vote possible in 1 week, 3 days`.
- **The exact date is one gesture away:** hover on a computer, after 200ms, or tap on a phone. Both show the same content.
- **Every bill says when:** `billMoment` picks the label and date for its status, so cards and pages never disagree.
- **Be accurate.** The House schedule names a week, not a day, and a listed bill may not get a vote. Upcoming items say "possible" and explain that in the details.

## Loading bar

`TopProgressBar` is on every page, like YouTube's. It jumps forward when a request starts, creeps while waiting, and races to the end when the last one finishes. It's for moving between pages and for saving. Loading part of a page, which is any GET to `/api/*` (`isPartialLoad`), shows a skeleton where the answer goes instead, so typing in search doesn't flash the bar. `fetch` is wrapped, so new requests follow these rules without doing anything. Prefetches and session checks don't count, because nobody's waiting on them.

## Editing in place

Editing replaces what's being edited, in the same spot. Don't send someone to another page or a settings form. Values become controls where they sit, Save and Cancel appear where the Edit button was, and a failed save stays in edit mode and says why. The profile and the forum composer are the examples. `/settings` is only for how the app works, not for details about the person.

## Loading states

Every page and API route has one, listed in `docs/loading-states.md`. A request that fills part of the screen gets a skeleton from `components/app/skeletons.tsx`, shaped like what it loads. A request that saves keeps the content in place and shows progress on the control.

## Floor board

Upcoming votes (`/federal/upcoming`) is the schedule's one home, and Home only counts it. It leads with each chamber's next meeting, then a House tab and a Senate tab, each with this week and next week. An empty week stays on the board and says why it's empty. Show a bill's plain title, and keep the Senate's legal text behind a disclosure. A bill's status stays hidden until the person has voted.

Signed in, the House tab is a game: a bar for how many of the bills Congress hasn't voted on yet you've beaten it to, then an accordion of three groups, each with a live count. You've voted (closed), Up soon and waiting on your vote (open), and Congress already voted (closed, at the bottom). The last group says Congress acted, but not how, until you vote. Signed out, it's the weeks in order.

## Onboarding

`/onboarding` has at most 3 steps, with a progress bar: age range, location, then suggested topics. Answer once, and it moves on. It saves as it goes, can always be skipped, and ends on the dashboard. Each step is a card in a stack: the old one lifts and fades, and the next moves forward from behind it. Don't add a step without taking one away.

## Search

`components/search/search-dialog.tsx` is one dialog, opened from any button or with Ctrl+K. Each kind of result is a provider in `lib/search/providers`, listed in `lib/search/registry.ts`.

- **To search something new:** write a provider, and add it to the list. Nothing else changes.
- **Independent:** each group has its own request, skeleton, and error, so a slow one never holds up the others.
- **Ranked by us:** use `commandScore` or `scoreFields` from `lib/search/score.ts`, so typos and initials work, and ranking stays the same everywhere.
- **Words for your own places:** "mayor", "city hall", "town hall", "council", "state senator", and the like are intents in `lib/search/intents.ts`. The Yours group comes first and answers with the person's own mayor, City Hall, or next meeting, or says how to find them.
- **Permissions:** a provider's `access` is checked on the server for every request. Someone without permission gets the same 404 as for a provider that doesn't exist.

## Admin panel

`/admin`, with a section per permission, listed once in `ADMIN_SECTIONS` so the navigation and page checks can't disagree. The rules in `lib/auth/role-rules.ts` stop anyone using the panel to gain or remove more power than they hold, or locking everyone out. Record changes with `recordAudit`. Polling pauses when the tab isn't visible, and stays out of the loading bar.

## Permissions

A role has many permissions. **Code asks about a permission, never a role's name**: `can(session, "users.manage")` in a page or component, and `requirePermission("users.manage")` in an API route. Hiding a button protects nothing, so a route must always check. The catalog is `PERMISSIONS` in `lib/auth/permissions.ts`. Rate limits are the one exception: they're tiers, set by role.

## Vote first

Someone signed in who hasn't voted on a bill sees `VoteGateCard`: what it is, what it does, and Support or Oppose, with a small link to read on without voting. The server doesn't send where it stands until they choose. Signed-out visitors and search engines see the whole page, because they can't vote.

Any card that asks for a vote keeps status inside `AfterVote`. After a vote, `BillOutlookCard` says what the status means for them. An already-passed bill still matters, because it shows whether their reps represent them. Lists for browsing, like `/federal/bills`, keep status, because people filter by it.

## Where words come from

The sparkle icon means XP, and nothing else, because people read it as "made by AI" everywhere else. Never put it next to a summary, a digest, or anything we didn't write. "In short" is the opening of the official summary, word for word, and its heading opens an explanation saying so (`InShortHeading`). If AI-written text is ever added, it gets its own plain label ("Written by AI, check the summary"), not an icon.

## Legislative words

Summaries underline the words people trip on, like "cloture" or "CBO", in the primary color with a faint primary background, and each opens its plain meaning. Only a word's first use in a block is marked, so a summary never turns into a wall of underlines. A word with several meanings, like an acronym, lists them numbered. Admins edit the list at `/admin/glossary`. Use `LegiText` for plain text and `LegiHtml` for a summary's HTML. Don't put either inside a link, because a button can't sit inside one.

## Opening more in place

**Anything that explains, qualifies, or adds detail goes in a `DialogPopover`, not on the page.** That's where a source goes ("where this comes from"), what a word or number means, the list behind a count, and the fine print behind a label. The page keeps the fact, and a tap shows the why. A 13-year-old reads the short version, and anyone curious is one tap from the rest.

`DialogPopover` (`components/ui/dialog-popover.tsx`) takes a trigger and content. It opens the content beside the trigger on a computer with a mouse, and as a dialog on a phone, decided when it opens, so the server's HTML is the same for everyone. Its content mounts only while open, so it can load then and show a skeleton. Pass `inline` for a trigger inside a sentence or a heading.

- **The trigger shows that it opens.** An underlined word, a small info or chevron icon, or a card that lifts on hover. Never hide a tap on plain text that looks like any other.
- **Examples:** "In short" (where the words come from), a glossary word, a member's topic chart and Became law card (the bills behind each number).
- **Which to use:**

| Hidden content | Use |
| --- | --- |
| An explanation, a definition, a source, or a short list behind a number | `DialogPopover` |
| More of the same content, in place, like older summaries | `Disclosure` |
| A whole section someone chooses to read, like a bill's history or votes | `SectionTabs` |
| A whole job, like editing | Edit in place (see "Editing in place") |

## Pulse check

On a member's page, "Pulse check" sits inside "Do they represent you?" (`PulseCheckStart embedded`), because it's the fastest way to answer it. It offers 3, 5, or 10 bills: 5 as `primary_outline`, the others as `accent`. A state legislator's page has it in its own card, under the same question. It's a voting session over the earliest bills they cast a final vote on that you haven't, each saying "{Name} voted on this", never how. At the end, their votes are fetched for only the bills you voted on in the run, and the summary says how you lined up on just those, bill by bill, with your full match left to their page. The Vote page itself carries no count of what's waiting: that's the bell's job, and on the voting screen it only distracts.

## XP

The bar on every page, `Hud`, is the one place progress lives. Read it with `useProgress`, which takes the server's value for the first paint. The `XpEvent` ledger is the truth, and every action has one fixed reward in `XP_AMOUNTS`. Support and Oppose always earn the same: the app never rewards a side. Never reward voting in a real election.

## The game

`/progress` is the home for everything earned: rank, level, badges, quests, the policy chart, and where XP came from. The bar at the top of every page links to it. The dashboard stays about what to do today.

- **Ranks** are named goals at a total amount of XP, in `lib/civic/ranks.ts`. Levels tick up every 100 XP. Rank names avoid "citizen" and "voter", because not everyone here is either, and they never say anything about someone's views.
- **Quests** are worked out from what really happened, in `computeQuests`.
- **The policy chart** counts bills, not views. Say "5 supported, 2 opposed", never that someone supports a topic, because a bill can expand or restrict something.
- **The split** ("62% support") only shows after you vote, and only with at least 20 votes. It's labelled as people on this app, not a poll.
- **The leaderboard** is opt-in, by state, and shows only a username and XP. It never shows how anyone voted. Moderators with `forum.moderate` can take a name off.
- **Self-reported actions**, like contacting a rep, are labelled as what someone said they did. Only offer contacting a rep when `billOutlook` says it could still change something.
- **Never reward voting in a real election**, or how anyone voted.
- **Rewards move.** +XP bursts out of its chip and flies to the top bar, where the number counts up (`useCountUp`) and the level glows. Today's goal ring pops into a check the moment it's met, not when a page loads already met. A new rank, level, badge, or goal gets a card in its own color with a bouncing icon, a ring burst, and confetti from both sides in the theme's colors (`celebrationKind` in `lib/civic/celebration.ts`). A tap dismisses it. All of it is off for anyone who asks for less motion.

## Profiles

`/users/{id}` is public, and out of search engines. `buildProfileView` in `lib/civic/profile-logic.ts` is the only thing that decides what it shows, and it works from an allow list, so a new account field stays private until someone adds it there. Name, age range, state, district, income, and voting topics are all off until someone turns them on, and an email never shows. The owner sees exactly what others see.

## Components

Build every control from `components/ui`, and customize it there, so a change reaches everywhere at once. ESLint rejects a native `select`, `textarea`, `input`, `button`, `label`, `table`, `progress`, `details`, or `kbd` outside that folder.

| Need | Use |
| --- | --- |
| A dropdown, in a form or in client code | `OptionSelect`. Use `Select` only for custom item content |
| A choice like a lesson answer | `Button variant="choice"` with `aria-pressed` |
| Show more in place | `Disclosure`. Put other controls in `aside`, because a button can't hold a control |
| Progress through steps | `Progress`, which is chunky with a highlight. `TopProgressBar` is the page loading bar |

`OptionSelect` works in a plain GET form on a server-rendered page: give it a `name`, and the option with an empty value means "any". Its label is in the server's HTML, so nothing flashes.

The look: 2px borders with a thicker bottom edge, big corners, extra-bold text, and controls that sink when pressed. Inputs use 16px text on phones, because iPhones zoom in on anything smaller.

**The one exception:** `RelativeDate` keeps a native `button`, because it's inline text in a sentence, and `Button`'s layout would break the line.

## Themes

There's light and dark, plus following the device, chosen with `ThemeToggle` in the top bar. Use the tokens in `app/globals.css`, not raw colors or `dark:` classes, so both work without thinking about it.

Dark isn't light with the colors flipped. Action colors get brighter with dark text on them, because the same blue has to read as both a button and a link on a dark card, so use the matching `-foreground` token on a filled background, never `text-white`. Charts use `chart-support`, `chart-oppose`, and the `--policy-*` colors, not the action colors, because bars need a narrower lightness range to stay distinguishable. Check new chart colors with the dataviz skill's validator, on both surfaces.

| Token | Meaning |
| --- | --- |
| `primary` | The main action. Vivid blue |
| `support` | Yes, agrees, positive progress. Green |
| `oppose` | No, disagrees. Rose |
| `streak` | Streaks and rewards. Amber |
| `xp` | Levels and points. Violet |
| `party-d`, `party-r`, `party-i` | Party identity. Always shown with a text label |

**Depth:** cards have a 2px border and a thicker bottom edge. Pressed buttons sink. **Color** carries meaning: don't use it only as decoration, and never as the only signal.

## Type

The font is Nunito, because it's friendly and rounded. Body text is 16px minimum at normal weight, with a line height of 1.6.

| Use | Class |
| --- | --- |
| Page title | `text-2xl sm:text-3xl font-extrabold` |
| Section heading | `text-lg font-extrabold` |
| Card title | `text-base sm:text-lg font-bold` |
| Body, summaries | `text-base leading-relaxed` |
| Details | `text-sm text-muted-foreground` |

Keep lines under about 70 characters. Headings use sentence case. Buttons start with a verb.

## State and rendering

- **Global client state is Zustand.** Stores live in `stores/`. Votes, follows, progress, and saved members go in `stores/use-civic-store.ts`.
- **Don't drill props.** A deep component that needs a bill's vote takes the bill's `slug` and reads it from the store. Don't pass state and setters through layers.
- **Select narrowly.** Always use a selector for one value: `useCivicStore((s) => s.votes[slug])`. Never destructure the whole store, so voting on one bill re-renders only that bill's buttons.
- **Server components by default.** Add `"use client"` only to the small piece that needs it. Pages load data on the server, and pass a component its starting value directly, such as `initialPosition`. The store only holds what's changed since, as in `stored !== undefined ? stored : initial`. Never write to the store during server rendering, because it would be shared between users.
- **Keep client bundles small.** No animation library or chart library for what CSS and SVG can do.

## Representation alignment

- **Keep the rep's vote hidden until the user votes.** Rep positions must not be in the page's HTML before that. They come from `/api/civic/bills/reveal`, after a vote or a tap on "Show me anyway".
- **Push notifications count as asking.** A vote result names the person's own legislators' votes, because they only get it for a bill they followed, voted on, or asked about through their topics.
- **Show the reveal as an event:** the picture, how they voted, and whether you match.
- **Say what the score means in words.** Never show a bare percentage: use `alignmentVerdict`. With fewer than 3 shared votes, say how many more are needed instead of showing a shaky number.
- **Judge jobs by comparison:** "shows up more than 72% of the House" means more than "96%".

## Every page has

- A clear next step, using `NextStepCard` or the page's own main button.
- Empty, error, and loading states, each saying what to do.
- A picture for every person, with initials on a colored circle as the fallback.
- Policy areas as `PolicyChip`: color, icon, and name together.
- Jargon wrapped in `Term`, which explains it on tap, with definitions from `lib/civic/glossary.ts`.

## Charts

Follow the data visualization skill. Bars and rings are plain SVG and CSS in server components.

- Policy areas belong to one of 8 color families. A chart bar always has its name beside it, so identity is never color alone.
- Text uses text colors, never the series color.
- Every chart has a text alternative.
- If one number says it, use a number and not a chart.

## Motion

Short and rewarding: 150 to 300ms. Celebrate real wins, like a reveal, a streak, or a finished session. Respect `prefers-reduced-motion`. Content never waits on an animation.

## Words

Write like a friend who knows Congress. Short sentences. Never use developer words on a screen: "loaded", "imported", "records", "pipeline", "database", "sync". "Support" and "Oppose", not "Yea" and "Nay". Say "may come up for a vote", not "will". Never tell people what to think.
