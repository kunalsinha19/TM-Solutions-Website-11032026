FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .
RUN npm install
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone bundle — includes trimmed node_modules for production
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static JS/CSS chunks (not included in standalone automatically)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Public assets (favicon, robots.txt, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# In a workspace monorepo the standalone server.js sits under the app path
CMD ["node", "apps/web/server.js"]
