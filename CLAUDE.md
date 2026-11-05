# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Coolbills is a civic app for browsing U.S. federal legislation and members of Congress. Users can vote on bills, compare their positions with their representatives, ask AI questions about bills, listen to bills read aloud, and post in a forum. It is a single Next.js 16 App Router app (React 19) using Prisma with MySQL. The repo is `next-speak-up`, the npm package is `next-politics`, and the brand is Coolbills.

## Rules

- **Never test or call AI or paid services unless the user specifically says to.** That covers Gemini, Lemonfox, SMTP email, and Upstash. Stub them in tests.
- **Local database only.** Never run migrations, seeds, or pipelines against Railway or any other production database.

## Commands

```bash
npm ci --legacy-peer-deps          # install (same flag as the Dockerfile)
npm run dev                        # dev server with Turbopack, http://localhost:3000
npm run build                      # production build (standalone output)
npx tsc --noEmit                   # type check; the build does not do this

npx prisma generate --schema=./prisma                 # after install and after schema changes
npx prisma migrate dev --schema=./prisma --name <x>   # create and apply a migration
npx prisma migrate deploy --schema=./prisma           # apply existing migrations
```

- **Prisma schema flag:** the schema is split across several files, so always pass `--schema=./prisma`. Without it, Prisma reads only `prisma/schema.prisma`, which contains the datasource and no models.
- **Tests:** there is no test framework and there are no tests.
- **Lint:** `npm run lint` calls `next lint`, which Next 16 removed. `.eslintrc.json` is also a legacy config format, while the lockfile has ESLint 10. Expect this script to need fixing before it works.
- **Build checks:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and `tsconfig.json` has `strict: false`. A passing build says nothing about types, so run `tsc` separately.

## Architecture

### Request flow

Pages and API routes are thin. Business logic and Prisma queries live in `lib/services/*`.

- **Server components** (`app/**/page.tsx`) call services directly, often wrapped in React `cache()`.
- **Client components** call `app/api/**/route.ts` handlers with `fetch`, and those handlers call the same services. The repo has no server actions.
- **Duplicate services:** some come in versions, such as `legislation.ts` and `legislation_two.ts`. `legislation_two` has the most importers, so check which version a feature's callers use before editing.

### Auth and permissions

- **Auth setup:** NextAuth v4 with Google only and the Prisma adapter, so sessions are stored in the database. `authOptions` is exported from `app/api/auth/[...nextauth]/route.ts` and imported from there everywhere.
- **Session contents:** the `session` callback loads the full user on every call, including `state`, `district`, `needsOnboarding`, `role`, and flattened `permissions`. The extended type is declared in that same route file.
- **No middleware:** nothing protects routes globally. Each route or service must call `getServerSession(authOptions)` and do its own checks, so new endpoints are unprotected by default.
- **Roles:** `User` → `Role` → `RolePermission` → `Permission`. Admin checks usually compare role names, `"Admin"` and `"Super Admin"`.

### Rate limiting

Use `checkRateLimit(endpoint, role, identifier)` and `getUserRole(session)` from `lib/ratelimiter.ts`. It is backed by Upstash Redis, and limits per endpoint and role are in `RATE_LIMITS`. The identifier is the user ID, or the IP address for guests. `app/utils/rateLimiter.ts` is an older copy with no importers.

`Redis.fromEnv()` runs when `lib/ratelimiter.ts` and `lib/redis.ts` are imported, so routes using them need the Upstash variables set.

### Data

- **Schema files:** `prisma/` holds `schema.prisma` (datasource), `user`, `congress`, `federal-legislation`, `forum`, and `dev` (bug reports and feature suggestions).
- **Client:** import the singleton with `import prisma from "@/prisma/client"`.
- **Bill identifiers:** bills are looked up by the `name_id` string in URLs and API bodies, as well as by numeric `id`.
- **Congress data:** this repo has no code that ingests bills or members, so the data must already be in the database. The only live call to `api.congress.gov` is for bill text in `app/api/bills/text/route.ts`.

### External services

| Feature | Service | Location |
| --- | --- | --- |
| Bill Q&A | Google Gemini | `app/api/bills/ai/route.ts`, `lib/ai/prompts.ts` |
| Text-to-speech | Lemonfox | `app/api/bills/tts/route.ts` |
| Email | SMTP via Nodemailer | `lib/emailServices.ts` |

### Frontend layout

- **Bill pages:** `/bills/[id]` is the main bill page and nearly all links point to it. `/federal/bills/[billId]` is a separate implementation with its own components, so confirm which one a change targets.
- **Colocation:** feature components live beside their route in `app/<feature>/components/`. Shared app components are in `app/1Components`, `app/GeneralComponents`, and `app/PageComponents`.
- **Shared UI:** `components/ui` is shadcn/ui, `components/magicui` is Magic UI, and `components/cb` holds the app's own layout blocks and shared widgets.
- **Client state:** Zustand stores sit next to their feature (`use*Store.ts`) or in `app/stores/`.
- **Styling:** Tailwind v4 with no `tailwind.config` file, although `components.json` still references one. Global styles are in `app/globals.css`.
- **Imports:** `@/*` resolves from the repo root.

## Environment

Local variables go in `.env` at the repo root, which is gitignored. Use `.env` rather than `.env.local` for `DATABASE_URL` so the Prisma CLI can read it.

`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_KEY`, `CONGRESS_API_KEY`, `LEMONFOX_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`

`docker-compose.yaml` also passes `GEMINI_API_KEY` and `OPENAI_API_KEY`, but the app code does not read them.

## Deployment

The app deploys to Railway from the `Dockerfile` as a standalone Next.js server (`node server.js`). `docker-compose.yaml` adds a local MySQL 8 service. These configs have mismatches to be aware of when changing deployment:

- `railway.json` runs `npm run db:migrate`, but `package.json` has no such script.
- `railway.json` health checks `/api/health`, but no such route exists.
- `docker-compose.yaml` runs `prisma migrate deploy` without `--schema=./prisma`.
