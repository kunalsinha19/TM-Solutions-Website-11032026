FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install
RUN npm run build --workspace=@tara-maa/web

# ── Production image ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone bundle to /app — Next.js uses output:"standalone" so this
# contains a trimmed node_modules and the server entry point.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets and public folder alongside the server bundle.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# After the COPY above, Next.js monorepo standalone puts server.js at either
# /app/server.js (standalone root) or /app/apps/web/server.js (mirrored path).
# We probe both and run whichever exists so the Dockerfile CMD works regardless
# of Next.js version behaviour. If Railway's UI Start Command is set, clear it
# in Settings → Deploy → Start Command so this CMD takes effect.
USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "if [ -f apps/web/server.js ]; then exec node apps/web/server.js; elif [ -f server.js ]; then exec node server.js; else echo 'ERROR: server.js not found' && find /app -name server.js && exit 1; fi"]
