FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Dependency layer (cached unless manifests change) ──────────────────────────
# Copy only package manifests first. .dockerignore excludes backend/ and
# unnecessary admin/frontend source so this context stays small and uploads fast.
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
# admin/package.json is required so npm can resolve the workspace graph.
# admin/src is excluded via .dockerignore — only the manifest is sent.
COPY admin/package.json admin/package-lock.json* ./admin/
# frontend workspace manifest (same pattern)
COPY frontend/package.json frontend/package-lock.json* ./frontend/

RUN npm install --legacy-peer-deps

# ── Source layer (invalidated on any source change) ────────────────────────────
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

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
