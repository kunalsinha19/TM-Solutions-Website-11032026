FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy everything at once — avoids BuildKit cache-key computation failures
# that occur when Railway's build daemon holds a stale context snapshot and
# individual COPY <file> instructions reference paths the snapshot doesn't know.
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

# next.config output:"standalone" produces a self-contained bundle
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets (standalone does not include these automatically)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Public folder (images, favicon, robots.txt, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node apps/web/server.js"]
