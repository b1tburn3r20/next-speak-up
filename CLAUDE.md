# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Coolbills is a civic app for browsing U.S. federal legislation and members of Congress. Users can see what's coming up for a House vote, vote on bills themselves, compare their positions with their representatives, ask AI questions about bills, listen to summaries read aloud, and post in a forum. It covers federal government and Iowa, the first state, with Des Moines as its first city. It is a single Next.js 16 App Router app (React 19) using Prisma with MySQL. The repo is `next-speak-up`, the npm package is `next-politics`, and the brand is Coolbills.

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

Iowa's bills, people, districts, and votes sit in the same tables as Congress's, so a query with no jurisdiction filter mixes them. `listBills` and `listCurrentMembers` default to federal, and `repsForLocation` is federal only. Each state we cover, and its cities, is an entry in `lib/civic/states.ts`: its chambers, seats, time zone, session dates, sources, and cities. Pages under `app/state/[state]` and components in `components/state` take that entry, and never name a state or city themselves. Adding a state is its pipelines plus an entry there. `[state]/layout.tsx` and `city/[city]/layout.tsx` 404 anything not listed, before a `loading.tsx` can answer 200. Client components get `toClientState`, because the full entry holds a RegExp. Queries are in `lib/civic/state.ts`, and `lib/civic/government.ts` holds the words that differ. `memberKeyOf` gives what `memberPath` takes, for either government. Bill and roll call pages are shared, in `components/bills`, and each route is a thin wrapper.

### Accuracy rules that were learned the hard way

- **Same-day actions:** a bill's actions are ordered by `position`, which comes from the API. Don't sort them by time, because only House actions have one.
- **Floor listings:** a bill on the schedule "may be considered". Don't describe that as a vote that will happen. `floorOutcome` only counts House action since the bill was scheduled.
- **Senate floor:** the Senate has no weekly list. `SCHEDULED` rows come from orders that name a date, and `PENDING` rows have none. Each new Calendar repeats its `PENDING` rows, so `buildChamberBoard` keeps only the newest set.
- **Bill text versions:** `pickLatestTextVersion` holds the order. An Enrolled Bill has no date from the API.
- **Iowa's votes:** journals are PDFs with surnames only. `check_vote` in the pipeline only accepts a vote when the names, the journal's totals, and the history's totals all agree, and refuses a surname two people share. A vote that doesn't check out is left out, and the bill page says so.
- **Iowa's sessions:** a bill's status stops meaning anything once its session ends. `diedWithSession` turns it into "Session ended", and the queue doesn't treat it as open.
- **Final votes:** alignment only compares a user's vote with a member's latest final vote on a bill, using `isFinalVote`. Amendments and procedural votes don't count.
- **Missed votes:** a member who didn't vote isn't counted as disagreeing with a user.
- **District maps:** after an election, the Census's "current" maps move to the next Congress, weeks before its members take office. `censusVintage` picks the map for the sitting Congress. Add an entry to `VINTAGE_BY_CONGRESS` when needed.
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
| District lookup | Census geocoder (free) | `lib/civic/location.ts` | Live |

Both paid routes need a signed-in user, and use text from the database, never text from the browser. Tests stub them. `GEMINI_MODEL` sets the Gemini model, and the default is an older preview that may need replacing the first time it's used.

### Frontend layout

- **Navigation:** `app/navbar/varients/client-navbar.tsx` uses one layout with CSS breakpoints. Don't branch on screen size in JavaScript to choose page content, because that blocks server rendering. Links are in `app/data/navbar-data.ts`, and `activeNavHref` picks the one active link.
- **Vote first:** a signed-in user who hasn't voted on a bill gets `VoteGateCard`, and the server doesn't send the bill's status until they vote or skip. Cards that ask for a vote keep status inside `AfterVote`.
- **XP:** `lib/civic/xp.ts` writes the `XpEvent` ledger, and its unique key stops an action earning twice. `useProgress` is the one copy on the client. Server pages must not add votes to their own numbers.
- **The game:** `/progress` is its home. See "The game" in `docs/ui-guidelines.md` for the rules, including never rewarding a real vote.
- **Admin panel:** `/admin`. Check `lib/auth/role-rules.ts` before changing who can do what, and call `recordAudit` for every admin action.
- **Pipelines panel:** `/admin/pipelines` calls the Docker server in `../civic-pipeline`, through an explicit list in `lib/pipeline/routes.ts`. The token stays on the server.
- **Dates:** show them with `RelativeDate`. `billMoment` and `floorMoment` choose what to say about a bill.
- **Search:** `lib/search/registry.ts` lists the providers, and `/api/search/[provider]` runs one at a time. See `docs/ui-guidelines.md`.
- **Onboarding:** `/onboarding`. `OnboardingGate` sends new accounts there.
- **Blocks:** build pages from `components/blocks`. See `docs/ui-guidelines.md`.
- **State:** `stores/use-civic-store.ts` is global client state, read with narrow selectors. Components take the server's value as `initial...`, and the store only holds what's changed since.
- **Reveal:** a rep's vote must stay out of a page's HTML until the user votes or asks. Only `getBillReveal` selects it for a bill page.
- **Controls:** use `components/ui`, customized there. ESLint rejects native controls elsewhere. See `docs/ui-guidelines.md`.
- **Shared pieces:** `components/app` has the progress bar and page states. `components/civic` has the core loop, charts, and next steps. `components/bills`, `components/people`, and `components/onboarding` hold feature components.
- **UI kits:** `components/ui` is shadcn/ui, restyled by hand for this app, and `components/magicui` is Magic UI.
- **Progress bar:** `TopProgressBar` wraps `window.fetch`, so any request shows in it automatically. Prefetches are ignored.
- **Themes:** light and dark, with tokens in `app/globals.css`. Use tokens and their `-foreground` pairs, not raw colors or `text-white`. See `docs/ui-guidelines.md`.
- **Profiles:** `/users/{id}`. `buildProfileView` is the only thing that decides what's shown, from an allow list. `getProfilePage` sends `form`, with the private values, only to the owner.
- **Editing:** editing replaces the thing being edited, in the same spot, rather than opening another page. `ProfileBody` and `ForumComposerArea` are the examples.
- **Floor board:** the dashboard always shows this week and next for both chambers, from `getFloorBoard`. `floor_schedule_item` also holds Senate rows and each chamber's next meeting, so House lists must use `HOUSE_LIST`.
- **Loading skeletons:** every page and API route has a loading state, listed in `docs/loading-states.md`, and a unit test fails if a new one doesn't. `loading.tsx` also applies to child routes, and it makes a missing page return 200 instead of 404. So list pages sit in route groups, and detail pages check `lib/civic/exists.ts` and then use `<Suspense>`. Don't add a `loading.tsx` above a detail page.
- **Styling:** Tailwind v4 with no `tailwind.config` file, although `components.json` still references one.
- **Imports:** `@/*` resolves from the repo root.

## Environment

Local variables go in `.env` at the repo root, which is gitignored. Use `.env` rather than `.env.local` for `DATABASE_URL` so the Prisma CLI can read it. Use `127.0.0.1` as its host, not `localhost`: on Windows, `localhost` tries IPv6 first, and each new connection waits about 2 seconds.

Needed locally: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONGRESS_API_KEY`, `RATE_LIMITING_DISABLED`, `SEED_USER_PASSWORD`.

For the pipelines panel, locally: `PIPELINE_SERVER_URL` and `PIPELINE_SERVER_TOKEN`, with the same token as `../civic-pipeline/.env`.

Paid services, only for when they're being used: `GOOGLE_API_KEY`, `GEMINI_MODEL`, `LEMONFOX_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`.

`docker-compose.yaml` also passes `GEMINI_API_KEY` and `OPENAI_API_KEY`, but the app code does not read them.

## Deployment

The app deploys to Railway from the `Dockerfile` as a standalone Next.js server (`node server.js`). `railway.json` runs `npm run db:migrate` and health checks `/api/health`.

Local development uses `mysql:latest` from `../civic-pipeline/docker-compose.yaml`, through `npm run db:up`. This repo's `docker-compose.yaml` has its own `mysql:8.0` service on the same port, so don't run both.

Before public launch: add email verification and password reset, turn rate limiting back on with Upstash, write the script that moves production's data to schema v2, and run `npm run db:rbac`, because no one can use admin features until it has run.
