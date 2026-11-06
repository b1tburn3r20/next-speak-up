# UI guidelines

**Target:** every screen is fun, obvious, and fast on a phone. **Goal:** anyone can build a new page at scale from the same blocks, and it looks right without thinking about spacing.

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
| `PageShell` | The outside of every page | Max width, side gutters, vertical rhythm |
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

We cover both, starting with federal. Every screen and model must leave room for states.

- **URLs:** a government's pages live under its prefix: `/federal/bills`, and later `/state/tx/bills`. Things that belong to the person, not a government, stay at the root: `/dashboard`, `/vote`, `/reps`, `/settings`.
- **Never hand-write a government URL.** Use `lib/routes.ts`: `routes.federal.bills`, `billPath(slug)`, `memberPath(id)`, `topicPath(slug)`. Old URLs redirect from `next.config.mjs`.
- **Labels stay plain.** Don't put "Federal" in front of everything. There's only one federal government, so it keeps root nav links: "Bills", not "Federal Bills". How states appear in the nav is still to be decided, so don't build a state nav yet.
- **Models take a jurisdiction.** Queries and components shouldn't assume Congress when a bill or person can say where it's from.

## Navigation

- **Nav items live in `app/data/navbar-data.ts`.** An item can have `children`, shown indented beneath it. Core features are root links. Secondary ones, like Topics under Bills, are children.
- **One link is active.** Always use `activeNavHref` from `lib/nav.ts`, where the longest matching link wins. Never use `pathname.startsWith` on its own: it lights up both `/bills` and `/bills/upcoming`.
- **Who sees an item** is set by `permission`, never by role name.

## Dates

People relate to relative times. Show every date with `RelativeDate` from `components/app/relative-date.tsx`, not a bare formatted string.

- **Text:** `Became law 2 months ago`, `Introduced 1 year ago`, `House vote possible in 1 week, 3 days`.
- **The exact date is one gesture away:** hover on a computer, after 200ms, or tap on a phone. Both show the same content.
- **Every bill says when:** `billMoment` picks the label and date for its status, so cards and pages never disagree.
- **Be accurate.** The House schedule names a week, not a day, and a listed bill may not get a vote. Upcoming items say "possible" and explain that in the details.

## Loading bar

`TopProgressBar` is on every page, like YouTube's. It jumps forward when a request starts, creeps while waiting, and races to the end when the last one finishes. `fetch` is wrapped, so new requests show up without doing anything. Prefetches and session checks don't count, because nobody's waiting on them.

## Onboarding

`/onboarding` has at most 3 steps, with a progress bar: age range, location, then suggested topics. Answer once, and it moves on. It saves as it goes, can always be skipped, and ends on the dashboard. Each step is a card in a stack: the old one lifts and fades, and the next moves forward from behind it. Don't add a step without taking one away.

## Search

`components/search/search-dialog.tsx` is one dialog, opened from any button or with Ctrl+K. Each kind of result is a provider in `lib/search/providers`, listed in `lib/search/registry.ts`.

- **To search something new:** write a provider, and add it to the list. Nothing else changes.
- **Independent:** each group has its own request, skeleton, and error, so a slow one never holds up the others.
- **Ranked by us:** use `commandScore` or `scoreFields` from `lib/search/score.ts`, so typos and initials work, and ranking stays the same everywhere.
- **Permissions:** a provider's `access` is checked on the server for every request. Someone without permission gets the same 404 as for a provider that doesn't exist.

## Permissions

A role has many permissions. **Code asks about a permission, never a role's name**: `can(session, "users.manage")` in a page or component, and `requirePermission("users.manage")` in an API route. Hiding a button protects nothing, so a route must always check. The catalog is `PERMISSIONS` in `lib/auth/permissions.ts`. Rate limits are the one exception: they're tiers, set by role.

## One theme

There's one theme, and it's light. Don't add `dark:` classes, theme pickers, or hard-coded colors. Use the tokens in `app/globals.css`. Themes may come back later, and tokens keep that possible.

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
