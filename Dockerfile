FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy manifests first so npm install layer is cached independently of source
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY admin/package.json ./admin/ 2>/dev/null || true

RUN npm install

# Copy full source after dependencies are installed
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Run Next.js build directly via workspace — does not depend on root script name
RUN npm run build --workspace=@tara-maa/web

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

# Use sh -c so HOSTNAME is set in the process environment even if the
# container runtime overwrites the Docker ENV with the container hostname.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node apps/web/server.js"]
