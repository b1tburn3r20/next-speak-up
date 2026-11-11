FROM node:22-alpine AS base
# Prisma's engines need OpenSSL on Alpine.
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# The Prisma CLI on its own, at the same version the app was built with, so the running image can
# apply migrations without carrying every dev dependency.
FROM base AS migrate-tools
WORKDIR /tools
ARG PRISMA_VERSION=6.19.3
RUN npm init -y >/dev/null && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}"

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=./prisma
RUN npm run build
# The permission setup, as one plain script, so the running image doesn't need tsx.
RUN npx esbuild prisma/rbac-run.ts --bundle --platform=node --target=node22 --external:@prisma/client --outfile=dist/rbac.js

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Railway has no outgoing IPv6, and Node gives each address only 250ms before trying the next. A
# server like the Census geocoder that takes longer to answer over IPv4 then fails with ETIMEDOUT
# and ENETUNREACH. Prefer IPv4, and give each address 5 seconds.
ENV NODE_OPTIONS="--dns-result-order=ipv4first --network-family-autoselection-attempt-timeout=5000"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# What starting up needs: the schema and migrations, the Prisma CLI, and the permission setup.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=migrate-tools --chown=nextjs:nodejs /tools/node_modules ./migrate/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist/rbac.js ./scripts/rbac.js
COPY --chown=nextjs:nodejs docker/start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Applies any new migrations and the permission catalog, then starts the server. Set
# MIGRATE_ON_START=false to start without touching the database.
CMD ["./start.sh"]
