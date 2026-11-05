# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Coolbills is a civic app for browsing U.S. federal legislation and members of Congress. Users can vote on bills, compare their positions with their representatives, ask AI questions about bills, listen to bills read aloud, and post in a forum. It is a single Next.js 16 App Router app (React 19) using Prisma with MySQL. The repo is `next-speak-up`, the npm package is `next-politics`, and the brand is Coolbills.

## Rules

- **Never test or call AI or paid services unless the user specifically says to.** That covers Gemini, Lemonfox, SMTP email, and Upstash. Stub them in tests.
- **Local database only.** Never run migrations, seeds, or pipelines against Railway or any other production database.
- **Kebab-case file names.** Name all TypeScript files in kebab-case, such as `bill-text-tab.tsx`. Some older files don't follow this yet; rename them when you rework them.

## Commands

Use Node 22, which matches the Dockerfile. The machine default may be newer, so run `fnm use 22` first.

```bash
npm ci --legacy-peer-deps          # install (same flag as the Dockerfile)
npm run dev                        # dev server with Turbopack, http://localhost:3000
npm run build                      # production build (standalone output)
npx tsc --noEmit                   # type check; the build does not do this

npm test                           # unit tests (Vitest)
npx vitest run tests/unit/civic-logic.test.ts   # one unit test file
npm run test:e2e                   # browser tests at four screen widths (Playwright)
npx playwright test tests/e2e/auth.spec.ts --project=desktop   # one file at one width

npm run db:up                      # start MySQL (the container is defined in ../civic-pipeline)
npm run db:deploy                  # apply migrations
npm run db:seed                    # roles, test accounts, generated activity; local only
npx prisma generate --schema=./prisma                 # after install and after schema changes
```

- **Prisma schema flag:** the schema is split across several files, so always pass `--schema=./prisma`. Without it, Prisma reads only `prisma/schema.prisma`, which contains the datasource and no models.
- **Creating migrations:** `prisma migrate dev` needs an interactive terminal. Otherwise, write the output of `prisma migrate diff --from-schema-datasource ./prisma --to-schema-datamodel ./prisma --script` to a new folder in `prisma/migrations/`, then run `npm run db:deploy`.
- **Lint:** `npm run lint` calls `next lint`, which Next 16 removed. It needs fixing before it works.
- **Build checks:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and `tsconfig.json` has `strict: false`. A passing build says nothing about types, so run `tsc` separately. Older code still has type errors; new code shouldn't add any.
- **Test accounts:** `npm run db:seed` creates `test_superadmin`, `test_admin`, `test_supporter`, `test_member`, and `test_newuser`. Their password is `SEED_USER_PASSWORD` in `.env`.

## Architecture

### Data flow

Government data arrives through a separate Python project, `../civic-pipeline`, and the app reads the result:

1. Pipelines fetch from Congress.gov, the House Clerk, and Voteview, and store raw responses in the `civic_raw` database.
2. Transforms load those into the app's tables, and accuracy checks record problems in `data_quality_issue`.
3. Prisma owns the app's schema and migrations. The pipeline reflects the tables rather than defining them, so a column it writes must exist in `prisma/civic.prisma`.

Never change bill, member, or vote data from the app. Fix the transform and re-run it, because the pipeline will overwrite anything else.

### Schema v2

`prisma/civic.prisma` models any level of government (`Jurisdiction`, `LegislativeChamber`, `LegislativeSession`, `District`, `Person`, `OfficeTerm`, `Bill`, `RollCall`), so state data can be added later.

The older federal-only tables in `congress.prisma` and `federal-legislation.prisma` still exist alongside them, and the tables are empty on this branch. Don't build on them. A few names differ to avoid clashes during the overlap: `BillActionEvent` and `BillSummaryVersion`.

### Request flow

Pages are server components that call `lib/civic/*` directly, so content is in the first response. Client components call `app/api/civic/*` for writes.

- `lib/civic/alignment.ts`, `location.ts`, and `labels.ts` are pure logic, with no database access. Put new calculations there and test them.
- `lib/civic/bills.ts`, `people.ts`, and `users.ts` hold the queries.
- Older services in `lib/services/` still back the forum, permissions, and settings. Other old services and their API routes are only used by the disconnected AI code below.

### Accuracy rules that were learned the hard way

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
- **Roles:** `User` → `Role` → `RolePermission` → `Permission`. Admin checks usually compare role names, `"Admin"` and `"Super Admin"`. `User.roleId` defaults to 2, which the seed creates as Member. Signup fails if that row is missing.

### Rate limiting

Use `checkRateLimit(endpoint, role, identifier)` and `getUserRole(session)` from `lib/ratelimiter.ts`. Limits per endpoint and role are in `RATE_LIMITS`.

`RATE_LIMITING_DISABLED=true` in local `.env` turns limits off. The user will say when to turn them back on. If the flag is unset, limits stay on, so don't set it in any deployment.

### External services

| Feature | Service | Location | Status |
| --- | --- | --- | --- |
| Bill Q&A | Google Gemini (paid) | `app/api/bills/ai/route.ts`, `lib/ai/prompts.ts` | Not on the new bill page |
| Text-to-speech | Lemonfox (paid) | `app/api/bills/tts/route.ts` | Not on the new bill page |
| Email | SMTP via Nodemailer | `lib/email-services.ts` | Not tested |
| District lookup | Census geocoder (free) | `lib/civic/location.ts` | Live |

The chat and read-aloud UI, in `app/federal/bills/[billId]/` and `app/bills/[id]/components/`, was kept but no page uses it. It expects the old tables, so it needs porting to schema v2 before it can be reconnected.

### Frontend layout

- **Navigation:** `app/navbar/varients/client-navbar.tsx` uses one layout with CSS breakpoints. Don't branch on screen size in JavaScript to choose page content, because that blocks server rendering.
- **Shared pieces:** `components/app` has the progress bar, theme picker, and page states. `components/bills`, `components/people`, and `components/onboarding` hold feature components.
- **UI kits:** `components/ui` is shadcn/ui and `components/magicui` is Magic UI.
- **Progress bar:** `TopProgressBar` wraps `window.fetch`, so any request shows in it automatically.
- **Themes:** `components/app/theme-values.ts` lists them. A new theme needs a CSS block in `app/globals.css`, and dark ones also go in the `dark` variant at the top of that file.
- **Loading skeletons:** `loading.tsx` also applies to child routes, and it makes a missing page return 200 instead of 404. That's why the list pages sit in `(list)` route groups. Don't add a `loading.tsx` above a detail page.
- **Styling:** Tailwind v4 with no `tailwind.config` file, although `components.json` still references one.
- **Imports:** `@/*` resolves from the repo root.

## Environment

Local variables go in `.env` at the repo root, which is gitignored. Use `.env` rather than `.env.local` for `DATABASE_URL` so the Prisma CLI can read it.

Needed locally: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONGRESS_API_KEY`, `RATE_LIMITING_DISABLED`, `SEED_USER_PASSWORD`.

Paid services, only for when they're being used: `GOOGLE_API_KEY`, `LEMONFOX_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`.

`docker-compose.yaml` also passes `GEMINI_API_KEY` and `OPENAI_API_KEY`, but the app code does not read them.

## Deployment

The app deploys to Railway from the `Dockerfile` as a standalone Next.js server (`node server.js`). `docker-compose.yaml` adds a local MySQL 8 service. These configs have mismatches to be aware of when changing deployment:

- `railway.json` runs `npm run db:migrate`, but `package.json` has no such script.
- `railway.json` health checks `/api/health`, but no such route exists.
- `docker-compose.yaml` runs `prisma migrate deploy` without `--schema=./prisma`.
