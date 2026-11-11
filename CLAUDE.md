# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Coolbills is a civic app for browsing U.S. federal legislation and members of Congress. Users can see what's coming up for a House vote, vote on bills themselves, compare their positions with their representatives, ask AI questions about bills, and listen to summaries read aloud. A forum exists but is shelved for now. It covers federal government and Iowa, the first state, with Des Moines as its first city. It is a single Next.js 16 App Router app (React 19) using Prisma with MySQL. The repo is `next-speak-up`, the npm package is `next-politics`, and the brand is Coolbills.

## Reference sheets

Read these before starting a task, and check your work against them:

- `docs/mission.md`: what this is for, and who it's for
- `docs/ui-guidelines.md`: how to build screens, including the layout blocks and Zustand rules
- `docs/data-guidelines.md`: schemas, queries, pipelines, and handling gaps
- `docs/acceptance-criteria.md`: what done means
- `docs/loading-states.md`: what every page and API route shows while it waits
- `docs/build-log.md`: what's been decided, and what's next

## Rules

- **Never test or call AI or paid services unless the user specifically says to.** That covers Gemini, Lemonfox, SMTP email, and Upstash. Stub them in tests.
- **Local database only.** Never run migrations, seeds, or pipelines against Railway or any other production database.
- **Kebab-case file names.** Name all TypeScript files in kebab-case, such as `bill-text-tab.tsx`.
- **Build for federal and state.** Government pages live under `/federal`, and later `/state/{state}`. Build their URLs with `lib/routes.ts`. Pages about the person, like `/dashboard`, stay at the root.
- **Check permissions, not role names.** Use `can` or `requirePermission` from `lib/auth`. Every API route that isn't public needs a check.

## Commands

Use Node 22, which matches the Dockerfile. The machine default may be newer, so run `fnm use 22` first.

```bash
npm ci --legacy-peer-deps          # install (same flag as the Dockerfile)
npm run dev                        # dev server with Turbopack, http://localhost:3000
npm run build                      # production build (standalone output)
npx tsc --noEmit                   # type check; the build does not do this
npm run lint                       # ESLint

npm test                           # unit tests (Vitest)
npx vitest run tests/unit/civic-logic.test.ts   # one unit test file
npm run test:e2e                   # browser tests at four screen widths (Playwright)
npx playwright test tests/e2e/auth.spec.ts --project=desktop   # one file at one width

npm run db:up                      # start MySQL (the container is defined in ../civic-pipeline)
npm run db:deploy                  # apply migrations (db:migrate is the same, for Railway)
npm run db:seed                    # roles, test accounts, generated activity; local only
npm run db:rbac                    # just the permission catalog and role defaults; safe to re-run
npx prisma generate --schema=./prisma                 # after install and after schema changes
```

- **Prisma schema flag:** the schema is split across several files, so always pass `--schema=./prisma`. Without it, Prisma reads only `prisma/schema.prisma`, which contains the datasource and no models.
- **Creating migrations:** `prisma migrate dev` needs an interactive terminal. Otherwise, write the output of `prisma migrate diff --from-schema-datasource ./prisma --to-schema-datamodel ./prisma --script` to a new folder in `prisma/migrations/`, then run `npm run db:deploy`.
- **Lint:** ESLint stays on version 9, because `eslint-plugin-react` crashes on 10. Three rules are warnings in `eslint.config.mjs`, because older code trips them. New code shouldn't add to those.
- **Browser tests:** they need MySQL running, migrations applied, the pipeline's data loaded, and `npm run db:seed`. `pages.spec.ts` and `features.spec.ts` expect specific imported records, such as `us-119-hr-2388` and `us-119-s-4465`. `location.spec.ts` calls the live Census geocoder, which is free. Unit tests mock the database and need none of this.
- **Paid services in tests:** new browser tests should call `blockPaidServices` from `tests/e2e/helpers.ts`. Playwright starts its own dev server on port 3100 with paid keys blanked, in `.next-test`, so it runs beside `npm run dev` on 3000.
- **After a schema change:** a running `npm run dev` holds the old Prisma client, and on Windows it locks the engine file, so stop it before `prisma generate`.
- **Build checks:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and `tsconfig.json` has `strict: false`. A passing build says nothing about types, so run `tsc` separately. It should report no errors.
- **Test accounts:** `npm run db:seed` creates `test_superadmin`, `test_admin`, `test_supporter`, `test_member`, and `test_newuser`. Their password is `SEED_USER_PASSWORD` in `.env`.

## Architecture

### Data flow

Government data arrives through a separate Python project, `../civic-pipeline`, and the app reads the result:

1. Pipelines fetch from Congress.gov, the House Clerk, docs.house.gov, GovInfo, Voteview, legis.iowa.gov, and Des Moines's agenda archive, and store raw responses in the `civic_raw` database. See `../civic-pipeline/README.md`.
2. Transforms load those into the app's tables, and accuracy checks record problems in `data_quality_issue`.
3. Prisma owns the app's schema and migrations. The pipeline reflects the tables rather than defining them, so a column it writes must exist in `prisma/civic.prisma`.

Never change bill, member, or vote data from the app. Fix the transform and re-run it, because the pipeline will overwrite anything else.

### Schema v2

`prisma/civic.prisma` models any level of government (`Jurisdiction`, `LegislativeChamber`, `LegislativeSession`, `District`, `Person`, `OfficeTerm`, `Bill`, `RollCall`), so state data can be added later.

The older federal-only tables in `congress.prisma` and `federal-legislation.prisma` still exist alongside them, and they're empty on this branch. Nothing reads them anymore. They stay until production's data has been moved, so don't build on them. A few names differ to avoid clashes during the overlap: `BillActionEvent` and `BillSummaryVersion`.

This schema v2 work exists only on `overhaul/v2`. `main` still has the old app.

### Request flow

Pages are server components that call `lib/civic/*` directly, so content is in the first response. Client components call `app/api/civic/*` for writes.

- `lib/civic/alignment.ts`, `location.ts`, `labels.ts`, `floor-logic.ts`, `bill-text-logic.ts`, `member-record.ts`, `verdict.ts`, `digest.ts`, `progress.ts`, `next-steps.ts`, `policy-areas.ts`, and `glossary.ts` are pure logic, with no database access. Put new calculations there and test them.
- `lib/civic/bills.ts`, `people.ts`, `users.ts`, `floor.ts`, and `engage.ts` hold the queries.
- Services in `lib/services/` back the forum, permissions, settings, and password login.
- **Stored alignment:** `UserRepAlignment` holds each user's agreement with their reps. `getUserMetrics` recalculates it when new votes have arrived since.

### Federal and state in one set of tables

Iowa's bills, people, districts, and votes sit in the same tables as Congress's, so a query with no jurisdiction filter mixes them. `listBills` and `listCurrentMembers` default to federal, and `repsForLocation` is federal only. Each state we cover, and its cities, is an entry in `lib/civic/states.ts`: its chambers, seats, time zone, session dates, sources, and cities. Pages under `app/state/[state]` and components in `components/state` take that entry, and never name a state or city themselves. Adding a state is its pipelines plus an entry there. `[state]/layout.tsx` and `city/[city]/layout.tsx` 404 anything not listed, before a `loading.tsx` can answer 200. Client components get `toClientState`, because the full entry holds a RegExp. Queries are in `lib/civic/state.ts` and `lib/civic/city.ts`, and `lib/civic/government.ts` holds the words that differ. A city is a LOCAL jurisdiction with one council chamber, wards as districts, and an at-large district `AL`. Every incorporated city in a state also has a `city_profile` row, filled by the pipeline's `cities_{state}_*` pipelines from the Census and each city's own site, which a `StateCities` entry in `../civic-pipeline/civic_pipeline/sources/cities/states.py` sets up. `lib/civic/city-registry.ts` gives a `CityContext` for any city, whose `config` is set only for the cities in `states.ts`. Those get the fuller page, and every other city gets `GenericCityPage`. What a city's minutes say passed is stored as event items in the `ADOPTED_SECTION`, which `groupTopics` leaves out. The pipeline's `transforms/local.py` loads any city, and each city's source module only parses. When someone can speak, and when the agenda posts, come from `lib/civic/city-logic.ts` and the city's config. `memberKeyOf` gives what `memberPath` takes, for either government. Bill and roll call pages are shared, in `components/bills`, and each route is a thin wrapper.

### Accuracy rules that were learned the hard way

- **Same-day actions:** a bill's actions are ordered by `position`, which comes from the API. Don't sort them by time, because only House actions have one.
- **Floor listings:** a bill on the schedule "may be considered". Don't describe that as a vote that will happen. `floorOutcome` only counts House action since the bill was scheduled.
- **Senate floor:** the Senate has no weekly list. `SCHEDULED` rows come from orders that name a date, and `PENDING` rows have none. Each new Calendar repeats its `PENDING` rows, so `buildChamberBoard` keeps only the newest set.
- **Bill text versions:** `pickLatestTextVersion` holds the order. An Enrolled Bill has no date from the API. The text itself isn't stored: `bill_text_version` holds only its URLs, and `getBillText` fetches the latest one on request. Anything over 2 MB skips Next's cache and is fetched each time.
- **Iowa's votes:** journals are PDFs with surnames only. `check_vote` in the pipeline only accepts a vote when the names, the journal's totals, and the history's totals all agree, and refuses a surname two people share. A vote that doesn't check out is left out, and the bill page says so.
- **Iowa's sessions:** a bill's status stops meaning anything once its session ends. `diedWithSession` turns it into "Session ended", and the queue doesn't treat it as open.
- **Final votes:** alignment only compares a user's vote with a member's latest final vote on a bill, using `isFinalVote`. Amendments and procedural votes don't count.
- **Missed votes:** a member who didn't vote isn't counted as disagreeing with a user.
- **District maps:** after an election, the Census's "current" maps move to the next Congress, weeks before its members take office. `censusVintage` picks the map for the sitting Congress. Add an entry to `VINTAGE_BY_CONGRESS` when needed, and that vintage's layer numbers to `LAYERS_BY_VINTAGE` (from its TIGERweb MapServer), because asking for every layer takes the Census many seconds. On Railway, the image's `NODE_OPTIONS` prefers IPv4 and gives each address 5 seconds, because Railway has no outgoing IPv6.
- **At-large seats:** sources use null, 0, `00`, and `98`. They all normalize to `AL`, using `normalizeDistrict`.
- **User state:** `User.state` holds full names, like "Texas", because older forms expect them. `UserLocation.regionCode` holds codes, like "TX". Use `saveUserLocation`, or call `syncLocationFromProfile` after older code changes a profile.

### Auth and permissions

- **Auth setup:** NextAuth v4 with the Prisma adapter and database sessions. `authOptions` is exported from `app/api/auth/[...nextauth]/route.ts`.
- **Password login:** NextAuth's Credentials provider always writes a JWT cookie, which doesn't work with database sessions. So `app/api/account/login` and `signup` use `lib/services/password-auth.ts` to create a real `session` row and set NextAuth's cookie. `getServerSession` and `signOut` then work unchanged. Hashes live in `UserPassword`, so ordinary user queries can't return them.
- **Before public launch:** password login still needs email verification and password reset. Without verification, someone could sign up with another person's email and block that person's Google sign-in.
- **No middleware:** nothing protects routes globally. Each route must call `getServerSession(authOptions)` and do its own checks, so new endpoints are unprotected by default.
- **Roles:** `User` → `Role` → `RolePermission` → `Permission`, so a role has many permissions. `PERMISSIONS` in `lib/auth/permissions.ts` is the catalog, and `session.user.permissions` holds what someone has. Role lookups are cached for 60 seconds in `lib/auth/role-cache.ts`. `User.roleId` defaults to 2, which the seed creates as Member. Signup fails if that row is missing.

### Rate limiting

Use `checkRateLimit(endpoint, role, identifier)` and `getUserRole(session)` from `lib/ratelimiter.ts`. Limits per endpoint and role are in `RATE_LIMITS`.

`RATE_LIMITING_DISABLED=true` in local `.env` turns limits off. The user will say when to turn them back on. If the flag is unset, limits stay on, so don't set it in any deployment.

### External services

| Feature | Service | Location | Status |
| --- | --- | --- | --- |
| Bill Q&A | Google Gemini (paid) | `app/api/civic/bills/ask/route.ts`, `lib/ai/bill-chat.ts` | On the bill page; never called for real yet |
| Read-aloud | Lemonfox (paid) | `app/api/civic/bills/listen/route.ts`, `lib/ai/bill-chat.ts` | On the bill page; never called for real yet |
| Email | SMTP via Nodemailer | `lib/email-services.ts`, used by the landing page's contact form | Not tested |
| District lookup | Census geocoder (free) | `lib/civic/location.ts`, `components/onboarding/census-lookup.ts` | Live. Railway's servers can't reach the Census (it drops their connections), so the location picker asks it from the visitor's browser, as JSONP inside a sandboxed iframe, and sends the server only the district. The server's own lookup is the fallback, and works locally |
| Bill text | Congress.gov (free), fetched when someone opens it, never stored | `lib/civic/bill-text.ts` | Live, cached 30 days in Next's data cache; only congress.gov and govinfo.gov URLs (`isFetchableTextUrl`) |

Both paid routes need a signed-in user, and use text from the database, never text from the browser. Tests stub them. `GEMINI_MODEL` sets the Gemini model, and the default is an older preview that may need replacing the first time it's used.

### Frontend layout

- **Navigation:** `app/navbar/varients/client-navbar.tsx` uses one layout with CSS breakpoints, on every page but onboarding, the front page included. One top bar (`navbar-top.tsx`) at every size: the menu button (`nav-toggle`, which narrows the sidebar) and the logo, which goes to `/`, then search in the middle, then progress and the bell (`NotificationBell`, which lists `lib/notifications/inbox.ts` and the votes waiting on you). Nothing in the menu carries a count. Don't branch on screen size in JavaScript to choose page content, because that blocks server rendering. Links are in `app/data/navbar-data.ts`, each in a `group`, and `activeVisibleHref` picks the one active link among those shown. Phones get five tabs (`phoneTabs` in `bottom-nav.tsx`), the last opening a More sheet.
- **Vote first:** a signed-in user who hasn't voted on a bill gets `VoteGateCard`, and the server doesn't send the bill's status until they vote or skip. Cards that ask for a vote keep status inside `AfterVote`.
- **Pulse check:** every member page has `PulseCheckStart` (3, 5, or 10 bills), which opens `{member}/pulse-check`, shared by federal and state in `components/people/pulse-check-page.tsx`. It runs `VoteSession` over `getPulseCheckItems` (the earliest bills they cast a final vote on that you haven't), then `PulseCheckFinish` asks `/api/civic/people/pulse-check` for their votes on only the bills you just voted on. `lib/civic/pulse-check.ts` sums it up.
- **XP:** `lib/civic/xp.ts` writes the `XpEvent` ledger, and its unique key stops an action earning twice. `useProgress` is the one copy on the client. Server pages must not add votes to their own numbers.
- **The game:** `/progress` is its home. See "The game" in `docs/ui-guidelines.md` for the rules, including never rewarding a real vote.
- **Admin panel:** `/admin`. Check `lib/auth/role-rules.ts` before changing who can do what, and call `recordAudit` for every admin action.
- **Pipelines panel:** `/admin/pipelines` calls the Docker server in `../civic-pipeline`, through an explicit list in `lib/pipeline/routes.ts`. The token stays on the server.
- **Glossary:** admins edit `glossary_term` (keyword, definition; one row per meaning) at `/admin/glossary`, with `glossary.manage`. `lib/glossary/glossary.ts` caches every row for 7 days with `unstable_cache`, and each edit expires the `glossary` tag at once. The root layout passes the rows to `GlossaryProvider`, which builds a per-tree Zustand store (`stores/use-glossary-store.ts`) so the server renders underlines too. `LegiText` (plain text) and `LegiHtml` (sanitized summary HTML, rendered as elements) underline each word's first use through `lib/glossary/match.ts`, which indexes phrases by first word and reads text in one pass. Each word opens in `DialogPopover` (`components/ui/dialog-popover.tsx`): a popover on a computer with a mouse, a dialog otherwise. `Term` is still the hand-placed explainer for UI copy.
- **Member bill lists:** `member_sponsored_bill` holds every bill a member has sponsored, from the same Congress.gov pages `member_stats` counts, so the topic chart and the Became law card open lists that match their numbers (`getMemberSponsoredList`, `/api/civic/people/sponsored`). Bills before this Congress link to Congress.gov.
- **Dates:** show them with `RelativeDate`. `billMoment` and `floorMoment` choose what to say about a bill.
- **Search:** `lib/search/registry.ts` lists the providers, and `/api/search/[provider]` runs one at a time. Words like "mayor", "city hall", or "town hall" match an intent in `lib/search/intents.ts`, and `providers/shortcuts.ts` turns it into the person's own mayor, City Hall, or next meeting. See `docs/ui-guidelines.md`.
- **Onboarding:** `/onboarding`. `OnboardingGate` sends new accounts there.
- **Cities:** "My City" in the nav goes to `/city`, which sends someone to their city or asks which it is. Their city is `UserLocation.placeGeoid`, set by a location lookup, or by `PATCH /api/civic/location/home-city` from "I live here" on a city's page or `FindHomeCity` on the dashboard. `/state/{state}/cities` lists them all, `/state/{state}/city/{city}/meetings/{id}` is a meeting, and cities are in search through `lib/search/providers/cities.ts`. `navPathname` in `lib/nav.ts` lights up "My City" for any state's city pages. A city's page says what's missing, such as a hosted agenda system we can't read, or meetings that stopped months ago. Every city page shows City Hall (`CityHallCard`) and the city's state legislators (`CityLegislators`, from `city_district`). `npm run audit:cities` checks every city and fails below 95% on the mayor, legislators, or City Hall. Cities whose sites block AI are in the owner's lane: the user runs `cities_{state}_owner` in `../civic-pipeline`, and Claude reads only its report. `/states` lists every state, and state and city pages put the main things on the first phone screen, with `PlaceFinder` searching in the browser and `CityTabs` holding the deeper sections.
- **Notifications:** Web Push with VAPID keys (`web-push`), no Firebase. `lib/notifications/plan.ts` decides what's due and what it says, and `dispatch.ts` sends it, claiming each one in `notification_delivery` first so nothing goes twice. It covers home-city council meetings (7, 2, 1 days before and the day of), Monday's bills in someone's topics, final vote results with their own legislators' votes, and followed bills becoming law. Each kind has its own switch in Settings' manager (`NOTIFY_PREFS`), and topics can be muted one at a time. `instrumentation.ts` runs it every 10 minutes only when `NOTIFY_DISPATCH=1`, `POST /api/cron/notify` takes `CRON_SECRET`, and `npm run notify:dispatch` does one local pass. Playwright blanks the private key, so tests can't reach a device. `public/sw.js` only shows and opens notifications, and caches nothing.
- **Blocks:** build pages from `components/blocks`. See `docs/ui-guidelines.md`.
- **Clarity:** every page has one job and leads somewhere. `docs/clarity-benchmark.md` lists each page's job and the eight questions it's scored on, and records each round. Home is your next vote, `MyPeople`, and `ThisWeek`. Deeper sections go in `SectionTabs`, and long lists of people in `MemberList`. Explanations, sources, and the list behind a number go in `DialogPopover`, so the page keeps only the fact. `tests/e2e/clarity.spec.ts` checks the paths.
- **State:** `stores/use-civic-store.ts` is global client state, read with narrow selectors. Components take the server's value as `initial...`, and the store only holds what's changed since.
- **Reveal:** a rep's vote must stay out of a page's HTML until the user votes or asks. Only `getBillReveal` selects it for a bill page.
- **Controls:** use `components/ui`, customized there. ESLint rejects native controls elsewhere. See `docs/ui-guidelines.md`.
- **Shared pieces:** `components/app` has the progress bar and page states. `components/civic` has the core loop, charts, and next steps. `components/bills`, `components/people`, and `components/onboarding` hold feature components.
- **UI kits:** `components/ui` is shadcn/ui, restyled by hand for this app, and `components/magicui` is Magic UI.
- **Progress bar:** `TopProgressBar` wraps `window.fetch`, and shows for moving between pages and for saving. A GET to `/api/*` (`isPartialLoad`), like search or the bell, fills in part of a page, so it shows a skeleton there instead. Prefetches are ignored.
- **Themes:** light and dark, with tokens in `app/globals.css`. Use tokens and their `-foreground` pairs, not raw colors or `text-white`. See `docs/ui-guidelines.md`.
- **Profiles:** `/users/{id}`. `buildProfileView` is the only thing that decides what's shown, from an allow list. `getProfilePage` sends `form`, with the private values, only to the owner.
- **Shelved features:** `lib/features.ts` switches parts of the app off without deleting them. The forum is shelved (`FORUM_OPEN = false`): `app/forum/layout.tsx` 404s every forum page, each `/api/forum/*` route answers 404 through `forumClosed()`, and nothing links to it (a bill's "Talk about it", Home's saved posts, the profile's posts). Its code and posts are kept. Flip the switch to bring it back, and its tests run again.
- **Editing:** editing replaces the thing being edited, in the same spot, rather than opening another page. `ProfileBody` and `ForumComposerArea` are the examples.
- **Floor board:** Upcoming votes always shows this week and next for both chambers, from `getFloorBoard`, in a House tab and a Senate tab. Signed in, the House tab is `FloorProgress` (how many bills you've beaten Congress to) over three groups from `splitFloorItems`: voted, waiting on you, and already voted on by Congress, whose result stays hidden until you vote. Home only counts it. `floor_schedule_item` also holds Senate rows and each chamber's next meeting, so House lists must use `HOUSE_LIST`.
- **Loading skeletons:** every page and API route has a loading state, listed in `docs/loading-states.md`, and a unit test fails if a new one doesn't. `loading.tsx` also applies to child routes, and it makes a missing page return 200 instead of 404. So list pages sit in route groups, and detail pages check `lib/civic/exists.ts` and then use `<Suspense>`. Don't add a `loading.tsx` above a detail page.
- **Styling:** Tailwind v4 with no `tailwind.config` file, although `components.json` still references one.
- **Imports:** `@/*` resolves from the repo root.

## Environment

Local variables go in `.env` at the repo root, which is gitignored. Use `.env` rather than `.env.local` for `DATABASE_URL` so the Prisma CLI can read it. Use `127.0.0.1` as its host, not `localhost`: on Windows, `localhost` tries IPv6 first, and each new connection waits about 2 seconds.

Needed locally: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONGRESS_API_KEY`, `RATE_LIMITING_DISABLED`, `SEED_USER_PASSWORD`.

For the pipelines panel, locally: `PIPELINE_SERVER_URL` and `PIPELINE_SERVER_TOKEN`, with the same token as `../civic-pipeline/.env`.

For push notifications, which are free: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (the same public key), and `CRON_SECRET`. Make keys with `npx web-push generate-vapid-keys`, and use different ones in production. `NOTIFY_DISPATCH=1` turns on the 10-minute sender, so set it only where notifications should go out.

Paid services, only for when they're being used: `GOOGLE_API_KEY`, `GEMINI_MODEL`, `LEMONFOX_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`.

`docker-compose.yaml` also passes `GEMINI_API_KEY` and `OPENAI_API_KEY`, but the app code does not read them.

## Deployment

The app runs on Railway from a Docker Hub image, `ajbermudez605/next-speak-up`, built from the `Dockerfile` as a standalone Next.js server. Build it for `linux/amd64`, and push a dated tag (like `2026-11-11`) before moving `latest`. The container starts with `docker/start.sh`: it applies migrations with the Prisma CLI copied into the image, then runs the permission setup (`prisma/rbac.ts`, bundled to `scripts/rbac.js`, which also creates the base roles a fresh database needs), then `node server.js`. Both steps are safe to repeat on every start; `MIGRATE_ON_START=false` skips them. So whatever `DATABASE_URL` points at gets migrated on start: point it at the right database before switching tags. Health check: `/api/health`. `railway.json` is only used when Railway builds from the repo.

Until rate limiting has Upstash, production sets `RATE_LIMITING_DISABLED=true`, by the owner's choice. Otherwise every rate-limited route fails.

Local development uses `mysql:latest` from `../civic-pipeline/docker-compose.yaml`, through `npm run db:up`. This repo's `docker-compose.yaml` has its own `mysql:8.0` service on the same port, so don't run both.

Before public launch: add email verification and password reset, turn rate limiting back on with Upstash, write the script that moves production's data to schema v2, and run `npm run db:rbac`, because no one can use admin features until it has run.
